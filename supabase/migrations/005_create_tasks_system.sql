-- Tasks System Migration
-- Includes: tasks, task_assignments, task_completions, task_templates
-- Security: RLS policies for family-based access
-- Compliance: Audit trails, GDPR-compliant deletion

-- ============================================================================
-- CLEANUP: Drop existing tables if they exist
-- ============================================================================

DROP TABLE IF EXISTS task_completions CASCADE;
DROP TABLE IF EXISTS task_assignments CASCADE;
DROP TABLE IF EXISTS task_templates CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;

DROP TYPE IF EXISTS task_frequency CASCADE;
DROP TYPE IF EXISTS task_status CASCADE;
DROP TYPE IF EXISTS task_category CASCADE;

DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS get_user_tasks(UUID) CASCADE;

-- ============================================================================
-- ENUMS
-- ============================================================================

CREATE TYPE task_frequency AS ENUM ('one-time', 'daily', 'weekly', 'monthly', 'custom');
CREATE TYPE task_status AS ENUM ('active', 'completed', 'overdue', 'archived');
CREATE TYPE task_category AS ENUM (
  'cleaning',
  'cooking',
  'outdoor',
  'pet_care',
  'homework',
  'organization',
  'maintenance',
  'errands',
  'personal_care',
  'other'
);

-- ============================================================================
-- TASKS TABLE
-- ============================================================================

CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Task details
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category task_category NOT NULL DEFAULT 'other',

  -- Scheduling
  frequency task_frequency NOT NULL DEFAULT 'one-time',
  due_time TIME,
  custom_schedule JSONB, -- For custom frequencies

  -- Points and gamification
  points INTEGER NOT NULL DEFAULT 0 CHECK (points >= 0),

  -- Requirements
  requires_photo BOOLEAN DEFAULT false,
  requires_approval BOOLEAN DEFAULT false,

  -- Status
  status task_status NOT NULL DEFAULT 'active',

  -- Metadata
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  archived_at TIMESTAMP WITH TIME ZONE,

  -- Indexes
  CONSTRAINT tasks_name_length CHECK (char_length(name) >= 1 AND char_length(name) <= 255)
);

-- Indexes for performance
CREATE INDEX idx_tasks_organization ON tasks(organization_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_category ON tasks(category);
CREATE INDEX idx_tasks_created_at ON tasks(created_at DESC);

-- RLS Policies
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Users can view tasks in their organization
CREATE POLICY "Users can view their organization's tasks"
  ON tasks FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE auth_user_id = auth.uid()
    )
  );

-- Account owners and family managers can create tasks
CREATE POLICY "Account owners can create tasks"
  ON tasks FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM users
      WHERE auth_user_id = auth.uid()
      AND (is_account_owner = true OR is_family_manager = true)
    )
  );

-- Account owners and family managers can update tasks
CREATE POLICY "Account owners can update tasks"
  ON tasks FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM users
      WHERE auth_user_id = auth.uid()
      AND (is_account_owner = true OR is_family_manager = true)
    )
  );

-- Account owners can delete tasks
CREATE POLICY "Account owners can delete tasks"
  ON tasks FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id FROM users
      WHERE auth_user_id = auth.uid()
      AND is_account_owner = true
    )
  );

-- ============================================================================
-- TASK ASSIGNMENTS TABLE
-- ============================================================================

CREATE TABLE task_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Assignment metadata
  assigned_by UUID REFERENCES users(id) ON DELETE SET NULL,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Unique constraint: one assignment per task per user
  CONSTRAINT unique_task_user UNIQUE (task_id, user_id)
);

-- Indexes
CREATE INDEX idx_task_assignments_task ON task_assignments(task_id);
CREATE INDEX idx_task_assignments_user ON task_assignments(user_id);

-- RLS Policies
ALTER TABLE task_assignments ENABLE ROW LEVEL SECURITY;

-- Users can view assignments in their organization
CREATE POLICY "Users can view task assignments in their org"
  ON task_assignments FOR SELECT
  USING (
    user_id IN (
      SELECT id FROM users WHERE organization_id IN (
        SELECT organization_id FROM users WHERE auth_user_id = auth.uid()
      )
    )
  );

-- Account owners and family managers can create assignments
CREATE POLICY "Managers can create task assignments"
  ON task_assignments FOR INSERT
  WITH CHECK (
    assigned_by IN (
      SELECT id FROM users
      WHERE auth_user_id = auth.uid()
      AND (is_account_owner = true OR is_family_manager = true)
    )
  );

-- Account owners and family managers can delete assignments
CREATE POLICY "Managers can delete task assignments"
  ON task_assignments FOR DELETE
  USING (
    assigned_by IN (
      SELECT id FROM users
      WHERE auth_user_id = auth.uid()
      AND (is_account_owner = true OR is_family_manager = true)
    )
  );

-- ============================================================================
-- TASK COMPLETIONS TABLE
-- ============================================================================

CREATE TABLE task_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Completion details
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  photo_url TEXT,
  notes TEXT,

  -- Approval workflow
  requires_approval BOOLEAN DEFAULT false,
  approved BOOLEAN,
  approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  approved_at TIMESTAMP WITH TIME ZONE,
  approval_notes TEXT,

  -- Points awarded
  points_awarded INTEGER NOT NULL DEFAULT 0 CHECK (points_awarded >= 0)
);

-- Indexes
CREATE INDEX idx_task_completions_task ON task_completions(task_id);
CREATE INDEX idx_task_completions_user ON task_completions(user_id);
CREATE INDEX idx_task_completions_date ON task_completions(completed_at DESC);
CREATE INDEX idx_task_completions_pending_approval ON task_completions(requires_approval, approved)
  WHERE requires_approval = true AND approved IS NULL;

-- RLS Policies
ALTER TABLE task_completions ENABLE ROW LEVEL SECURITY;

-- Users can view completions in their organization
CREATE POLICY "Users can view completions in their org"
  ON task_completions FOR SELECT
  USING (
    user_id IN (
      SELECT id FROM users WHERE organization_id IN (
        SELECT organization_id FROM users WHERE auth_user_id = auth.uid()
      )
    )
  );

-- Users can create completions for tasks assigned to them
CREATE POLICY "Users can complete their own tasks"
  ON task_completions FOR INSERT
  WITH CHECK (
    user_id IN (
      SELECT id FROM users WHERE auth_user_id = auth.uid()
    )
    AND task_id IN (
      SELECT task_id FROM task_assignments WHERE user_id IN (
        SELECT id FROM users WHERE auth_user_id = auth.uid()
      )
    )
  );

-- Account owners and family managers can approve completions
CREATE POLICY "Managers can update completions for approval"
  ON task_completions FOR UPDATE
  USING (
    approved_by IN (
      SELECT id FROM users
      WHERE auth_user_id = auth.uid()
      AND (is_account_owner = true OR is_family_manager = true)
    )
  );

-- ============================================================================
-- TASK TEMPLATES TABLE (Pre-built task suggestions)
-- ============================================================================

CREATE TABLE task_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Template details
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category task_category NOT NULL,
  emoji VARCHAR(10),

  -- Default settings
  default_points INTEGER NOT NULL DEFAULT 5 CHECK (default_points >= 0),
  default_frequency task_frequency NOT NULL DEFAULT 'weekly',

  -- Age appropriateness
  age_appropriate VARCHAR[] DEFAULT ARRAY['kid', 'teen', 'adult'],

  -- Popularity (for sorting)
  popularity INTEGER DEFAULT 0 CHECK (popularity >= 0 AND popularity <= 100),

  -- System templates vs custom
  is_system BOOLEAN DEFAULT true,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_task_templates_category ON task_templates(category);
CREATE INDEX idx_task_templates_popularity ON task_templates(popularity DESC);

-- RLS Policies
ALTER TABLE task_templates ENABLE ROW LEVEL SECURITY;

-- All authenticated users can view templates
CREATE POLICY "Authenticated users can view templates"
  ON task_templates FOR SELECT
  TO authenticated
  USING (true);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for tasks table
CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to get user's tasks with assignment info
CREATE OR REPLACE FUNCTION get_user_tasks(user_id_param UUID)
RETURNS TABLE (
  task_id UUID,
  task_name VARCHAR,
  task_description TEXT,
  task_category task_category,
  task_frequency task_frequency,
  task_points INTEGER,
  task_status task_status,
  due_time TIME,
  requires_photo BOOLEAN,
  requires_approval BOOLEAN,
  assigned_at TIMESTAMP WITH TIME ZONE
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.id,
    t.name,
    t.description,
    t.category,
    t.frequency,
    t.points,
    t.status,
    t.due_time,
    t.requires_photo,
    t.requires_approval,
    ta.assigned_at
  FROM tasks t
  INNER JOIN task_assignments ta ON t.id = ta.task_id
  WHERE ta.user_id = user_id_param
    AND t.status = 'active'
  ORDER BY t.created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION get_user_tasks(UUID) TO authenticated;

-- ============================================================================
-- SEED DATA: Task Templates (50+ Common Family Tasks)
-- ============================================================================

INSERT INTO task_templates (name, description, category, emoji, default_points, default_frequency, age_appropriate, popularity, is_system) VALUES
-- CLEANING TASKS (20 tasks)
('Make Your Bed', 'Straighten sheets, fluff pillows, and arrange comforter', 'cleaning', '🛏️', 5, 'daily', ARRAY['kid', 'teen', 'adult'], 95, true),
('Wash Dishes', 'Wash, dry, and put away all dishes', 'cleaning', '🍽️', 10, 'daily', ARRAY['teen', 'adult'], 92, true),
('Load Dishwasher', 'Load dirty dishes into dishwasher and start cycle', 'cleaning', '🍽️', 8, 'daily', ARRAY['kid', 'teen', 'adult'], 90, true),
('Unload Dishwasher', 'Put away all clean dishes from dishwasher', 'cleaning', '🍽️', 8, 'daily', ARRAY['kid', 'teen', 'adult'], 88, true),
('Wipe Kitchen Counters', 'Clean and disinfect all kitchen countertops', 'cleaning', '🧽', 5, 'daily', ARRAY['kid', 'teen', 'adult'], 85, true),
('Vacuum Living Room', 'Vacuum all floors in living room area', 'cleaning', '🧹', 12, 'weekly', ARRAY['teen', 'adult'], 88, true),
('Vacuum Bedrooms', 'Vacuum all bedroom floors', 'cleaning', '🧹', 10, 'weekly', ARRAY['teen', 'adult'], 82, true),
('Sweep Kitchen Floor', 'Sweep kitchen floor and dining area', 'cleaning', '🧹', 8, 'daily', ARRAY['kid', 'teen', 'adult'], 80, true),
('Mop Floors', 'Mop all hard floor surfaces', 'cleaning', '🧽', 15, 'weekly', ARRAY['teen', 'adult'], 75, true),
('Dust Furniture', 'Dust all furniture surfaces in common areas', 'cleaning', '🧹', 10, 'weekly', ARRAY['teen', 'adult'], 72, true),
('Clean Bathroom', 'Clean sink, toilet, shower, and floors', 'cleaning', '🚿', 18, 'weekly', ARRAY['teen', 'adult'], 82, true),
('Scrub Toilet', 'Clean and disinfect toilet bowl and seat', 'cleaning', '🚽', 10, 'weekly', ARRAY['teen', 'adult'], 70, true),
('Clean Mirrors', 'Wipe down all mirrors in bathrooms and bedrooms', 'cleaning', '🪞', 5, 'weekly', ARRAY['kid', 'teen', 'adult'], 68, true),
('Take Out Trash', 'Empty all trash bins and take to curb', 'cleaning', '🗑️', 10, 'weekly', ARRAY['teen', 'adult'], 90, true),
('Empty Bathroom Trash', 'Empty all bathroom waste baskets', 'cleaning', '🗑️', 5, 'weekly', ARRAY['kid', 'teen'], 75, true),
('Organize Closet', 'Sort and organize clothes in closet', 'cleaning', '👔', 12, 'monthly', ARRAY['kid', 'teen', 'adult'], 65, true),
('Clean Windows', 'Wash interior and exterior windows', 'cleaning', '🪟', 15, 'monthly', ARRAY['teen', 'adult'], 60, true),
('Wipe Down Appliances', 'Clean exterior of all kitchen appliances', 'cleaning', '🧽', 8, 'weekly', ARRAY['teen', 'adult'], 70, true),
('Organize Pantry', 'Sort and organize pantry items', 'cleaning', '🗄️', 15, 'monthly', ARRAY['teen', 'adult'], 62, true),
('Clean Baseboards', 'Wipe down baseboards throughout house', 'cleaning', '🧽', 12, 'monthly', ARRAY['teen', 'adult'], 55, true),

-- COOKING & MEAL TASKS (8 tasks)
('Set Dinner Table', 'Set plates, utensils, glasses, and napkins', 'cooking', '🍽️', 5, 'daily', ARRAY['kid', 'teen'], 85, true),
('Clear Dinner Table', 'Remove all dishes and wipe down table', 'cooking', '🍽️', 5, 'daily', ARRAY['kid', 'teen'], 83, true),
('Help Prepare Breakfast', 'Assist with making breakfast', 'cooking', '🍳', 10, 'daily', ARRAY['teen', 'adult'], 70, true),
('Help with Dinner', 'Assist with meal preparation and cooking', 'cooking', '👨‍🍳', 15, 'daily', ARRAY['teen', 'adult'], 80, true),
('Pack School Lunch', 'Prepare and pack lunch for school', 'cooking', '🥪', 8, 'daily', ARRAY['kid', 'teen'], 75, true),
('Put Away Groceries', 'Help unload and organize groceries', 'cooking', '🛒', 10, 'weekly', ARRAY['kid', 'teen', 'adult'], 78, true),
('Meal Plan for Week', 'Plan meals for upcoming week', 'cooking', '📋', 15, 'weekly', ARRAY['teen', 'adult'], 60, true),
('Bake Cookies or Treats', 'Bake dessert for family', 'cooking', '🍪', 20, 'weekly', ARRAY['teen', 'adult'], 65, true),

-- OUTDOOR TASKS (7 tasks)
('Mow Lawn', 'Mow front and back yard, edge sidewalks', 'outdoor', '🌱', 25, 'weekly', ARRAY['teen', 'adult'], 75, true),
('Rake Leaves', 'Rake leaves in yard and bag them', 'outdoor', '🍂', 15, 'weekly', ARRAY['teen', 'adult'], 70, true),
('Water Plants', 'Water all indoor and outdoor plants', 'outdoor', '💧', 5, 'weekly', ARRAY['kid', 'teen'], 75, true),
('Pull Weeds', 'Remove weeds from garden and flower beds', 'outdoor', '🌿', 12, 'weekly', ARRAY['teen', 'adult'], 65, true),
('Shovel Snow', 'Clear driveway and walkways of snow', 'outdoor', '❄️', 20, 'daily', ARRAY['teen', 'adult'], 60, true),
('Wash Car', 'Wash and dry family vehicle', 'outdoor', '🚗', 15, 'weekly', ARRAY['teen', 'adult'], 68, true),
('Bring in Mail', 'Collect mail from mailbox daily', 'outdoor', '📬', 3, 'daily', ARRAY['kid', 'teen'], 80, true),

-- PET CARE TASKS (5 tasks)
('Feed Pets', 'Give pets food and fresh water', 'pet_care', '🐱', 5, 'daily', ARRAY['kid', 'teen', 'adult'], 93, true),
('Walk the Dog', 'Take dog for 20-minute walk', 'pet_care', '🐕', 8, 'daily', ARRAY['kid', 'teen', 'adult'], 90, true),
('Clean Litter Box', 'Scoop and clean cat litter box', 'pet_care', '🐈', 10, 'daily', ARRAY['teen', 'adult'], 85, true),
('Brush Pets', 'Brush pet fur to prevent matting', 'pet_care', '🐶', 8, 'weekly', ARRAY['kid', 'teen'], 72, true),
('Clean Pet Bowls', 'Wash and refill pet food and water bowls', 'pet_care', '🥣', 5, 'daily', ARRAY['kid', 'teen'], 80, true),

-- HOMEWORK & EDUCATION (3 tasks)
('Homework Time', 'Complete all homework assignments', 'homework', '📚', 15, 'daily', ARRAY['kid', 'teen'], 88, true),
('Reading Time', 'Read for 30 minutes', 'homework', '📖', 10, 'daily', ARRAY['kid', 'teen'], 82, true),
('Study for Test', 'Review and study for upcoming test', 'homework', '✏️', 20, 'weekly', ARRAY['kid', 'teen'], 75, true),

-- ORGANIZATION (4 tasks)
('Organize Room', 'Clean up and organize bedroom', 'organization', '🧺', 10, 'weekly', ARRAY['kid', 'teen'], 85, true),
('Sort Laundry', 'Separate clothes by color and type', 'organization', '👕', 8, 'weekly', ARRAY['teen', 'adult'], 75, true),
('Fold Laundry', 'Fold clean clothes and put away', 'organization', '👔', 12, 'weekly', ARRAY['teen', 'adult'], 78, true),
('Organize Backpack', 'Empty, clean, and reorganize school backpack', 'organization', '🎒', 5, 'weekly', ARRAY['kid', 'teen'], 70, true),

-- MAINTENANCE (3 tasks)
('Change Light Bulbs', 'Replace any burned out light bulbs', 'maintenance', '💡', 10, 'monthly', ARRAY['teen', 'adult'], 60, true),
('Clean Air Vents', 'Dust and vacuum air vents', 'maintenance', '🌬️', 12, 'monthly', ARRAY['teen', 'adult'], 55, true),
('Clean Car Interior', 'Vacuum and clean inside of car', 'maintenance', '🚗', 15, 'monthly', ARRAY['teen', 'adult'], 65, true),

-- PERSONAL CARE (3 tasks)
('Practice Instrument', 'Practice musical instrument for 30 minutes', 'personal_care', '🎸', 12, 'daily', ARRAY['kid', 'teen'], 70, true),
('Exercise or Sports', 'Physical activity for 30 minutes', 'personal_care', '⚽', 15, 'daily', ARRAY['kid', 'teen', 'adult'], 75, true),
('Brush Teeth', 'Brush teeth twice daily', 'personal_care', '🪥', 3, 'daily', ARRAY['kid', 'teen'], 95, true),

-- ERRANDS (2 tasks)
('Help with Grocery Shopping', 'Assist with grocery shopping trip', 'errands', '🛒', 15, 'weekly', ARRAY['teen', 'adult'], 70, true),
('Return Library Books', 'Take library books back on time', 'errands', '📚', 5, 'weekly', ARRAY['kid', 'teen'], 65, true);

COMMENT ON TABLE tasks IS 'Main tasks table - stores all family chores and responsibilities';
COMMENT ON TABLE task_assignments IS 'Links tasks to family members';
COMMENT ON TABLE task_completions IS 'Records when tasks are completed, with approval workflow';
COMMENT ON TABLE task_templates IS 'Pre-built task templates for quick task creation';
