-- ============================================================================
-- ChorePulse v2 - Complete Database Schema (FIXED)
-- ============================================================================
-- Last Updated: 2025-10-22
-- Description: Comprehensive database schema with all MVP + Phase 2 features
--
-- FIX: Moved RLS policies that reference users table to AFTER users table
--      is created to avoid "relation does not exist" errors
--
-- Design Principles:
-- 1. Every table has organization_id for multi-tenant isolation
-- 2. Every table has RLS enabled with appropriate policies
-- 3. Cascading deletes for data cleanup
-- 4. Created/updated timestamps on all tables
-- 5. Proper indexes for performance
-- 6. Future-proof architecture for meal planning, AI, photos
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto"; -- For bcrypt password hashing

-- ============================================================================
-- CORE TABLES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Organizations (Multi-Tenant Root)
-- ----------------------------------------------------------------------------
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,

  -- Subscription & Billing
  subscription_tier TEXT NOT NULL DEFAULT 'pulse_starter'
    CHECK (subscription_tier IN ('pulse_starter', 'pulse_premium', 'unlimited_pulse')),
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  subscription_status TEXT CHECK (subscription_status IN ('active', 'canceled', 'past_due', 'trialing', 'incomplete', 'incomplete_expired', 'unpaid')),
  trial_starts_at TIMESTAMPTZ,
  trial_ends_at TIMESTAMPTZ,
  subscription_current_period_end TIMESTAMPTZ,

  -- Family Code System (for kid login linking)
  current_family_code TEXT UNIQUE,
  family_code_generated_at TIMESTAMPTZ,
  family_code_version INTEGER DEFAULT 1,

  -- Settings
  timezone TEXT NOT NULL DEFAULT 'America/New_York',
  week_starts_on INTEGER NOT NULL DEFAULT 0 CHECK (week_starts_on >= 0 AND week_starts_on <= 6),
  points_enabled BOOLEAN NOT NULL DEFAULT true,
  currency TEXT NOT NULL DEFAULT 'USD',

  -- Task Management Preferences
  auto_approve_tasks_under_points INTEGER DEFAULT 15, -- Tasks under this value auto-approve
  task_rotation_enabled BOOLEAN DEFAULT false,

  -- AI Usage Tracking (per organization quota)
  ai_prompts_used_this_month INTEGER DEFAULT 0,
  ai_prompts_reset_date DATE DEFAULT CURRENT_DATE,

  -- Feature Usage Tracking (for tier limits enforcement)
  features_used JSONB NOT NULL DEFAULT '{
    "active_tasks_count": 0,
    "active_rewards_count": 0,
    "users_count": 0,
    "storage_used_mb": 0
  }'::jsonb,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  setup_completed BOOLEAN NOT NULL DEFAULT false,
  email_verified BOOLEAN NOT NULL DEFAULT false,
  email_verified_at TIMESTAMPTZ
);

-- RLS enabled but policies will be added AFTER users table is created
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX idx_organizations_stripe_customer ON organizations(stripe_customer_id);
CREATE INDEX idx_organizations_subscription_status ON organizations(subscription_status);
CREATE INDEX idx_organizations_family_code ON organizations(current_family_code);
CREATE INDEX idx_organizations_subscription_tier ON organizations(subscription_tier);

-- Updated timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER organizations_updated_at
BEFORE UPDATE ON organizations
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ----------------------------------------------------------------------------
-- Users
-- ----------------------------------------------------------------------------
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  auth_user_id UUID UNIQUE, -- Links to auth.users (null for kids without email accounts)

  -- Profile
  name TEXT NOT NULL,
  email TEXT,
  username TEXT UNIQUE NOT NULL,
  avatar TEXT NOT NULL DEFAULT 'smile', -- Emoji or icon name
  color TEXT NOT NULL DEFAULT '#3B82F6', -- Hex color for calendar/UI

  -- Authorization
  role TEXT NOT NULL CHECK (role IN ('manager', 'adult', 'teen', 'kid')),
  is_account_owner BOOLEAN NOT NULL DEFAULT false, -- Only ONE per org, can transfer
  is_family_manager BOOLEAN NOT NULL DEFAULT false, -- Multiple allowed, toggled by account owner
  is_platform_admin BOOLEAN NOT NULL DEFAULT false, -- ChorePulse team only

  -- Authentication
  pin_hash TEXT, -- Bcrypt hash for PIN (4 digits)
  pin_required BOOLEAN NOT NULL DEFAULT false,
  first_login_completed BOOLEAN NOT NULL DEFAULT false,
  device_preferences JSONB DEFAULT '{}'::jsonb, -- Remembered devices, settings

  -- Gamification
  points_balance INTEGER NOT NULL DEFAULT 0 CHECK (points_balance >= 0),
  points_lifetime_earned INTEGER NOT NULL DEFAULT 0,
  points_lifetime_spent INTEGER NOT NULL DEFAULT 0,
  streak_count INTEGER NOT NULL DEFAULT 0,
  streak_last_completed_at DATE,
  streak_grace_used BOOLEAN NOT NULL DEFAULT false, -- For 1-day grace period

  -- Profile Details (Privacy-focused)
  age INTEGER,
  birth_month INTEGER CHECK (birth_month >= 1 AND birth_month <= 12), -- For age updates, NOT full birthdate

  -- Email Preferences
  email_preferences JSONB DEFAULT '{
    "tips_and_best_practices": true,
    "feature_announcements": true,
    "billing_and_account": true
  }'::jsonb,

  -- Notification Preferences
  notification_preferences JSONB DEFAULT '{
    "push_task_reminders": true,
    "push_achievements": true,
    "push_messages": true,
    "email_daily_summary": false,
    "email_weekly_report": false
  }'::jsonb,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login_at TIMESTAMPTZ,
  last_activity_at TIMESTAMPTZ
);

-- RLS Policies for users
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view users in their organization"
ON users FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id FROM users
    WHERE auth_user_id = auth.uid()
  )
);

CREATE POLICY "Account owners and family managers can insert users"
ON users FOR INSERT
WITH CHECK (
  organization_id IN (
    SELECT organization_id FROM users
    WHERE auth_user_id = auth.uid()
    AND (is_account_owner = true OR is_family_manager = true)
  )
);

CREATE POLICY "Account owners and family managers can update users"
ON users FOR UPDATE
USING (
  organization_id IN (
    SELECT organization_id FROM users
    WHERE auth_user_id = auth.uid()
    AND (is_account_owner = true OR is_family_manager = true)
  )
);

CREATE POLICY "Only account owners can delete users"
ON users FOR DELETE
USING (
  organization_id IN (
    SELECT organization_id FROM users
    WHERE auth_user_id = auth.uid()
    AND is_account_owner = true
  )
);

-- Indexes
CREATE INDEX idx_users_organization_id ON users(organization_id);
CREATE INDEX idx_users_auth_user_id ON users(auth_user_id);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_is_account_owner ON users(is_account_owner);
CREATE INDEX idx_users_is_family_manager ON users(is_family_manager);

-- Triggers
CREATE TRIGGER users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-generate username function
CREATE OR REPLACE FUNCTION generate_username()
RETURNS TEXT AS $$
DECLARE
  new_username TEXT;
  counter INTEGER := 0;
BEGIN
  LOOP
    new_username := 'user_' || substring(md5(random()::text) from 1 for 8);
    EXIT WHEN NOT EXISTS (SELECT 1 FROM users WHERE username = new_username);
    counter := counter + 1;
    IF counter > 100 THEN
      RAISE EXCEPTION 'Could not generate unique username';
    END IF;
  END LOOP;
  RETURN new_username;
END;
$$ LANGUAGE plpgsql;

-- Auto-generate username on insert if not provided
CREATE OR REPLACE FUNCTION set_username()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.username IS NULL OR NEW.username = '' THEN
    NEW.username := generate_username();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_set_username
BEFORE INSERT ON users
FOR EACH ROW EXECUTE FUNCTION set_username();

-- *** NOW ADD ORGANIZATIONS RLS POLICIES (after users table exists) ***
CREATE POLICY "Users can view their organization"
ON organizations FOR SELECT
USING (
  id IN (
    SELECT organization_id FROM users
    WHERE auth_user_id = auth.uid()
  )
);

CREATE POLICY "Account owners and managers can update their organization"
ON organizations FOR UPDATE
USING (
  id IN (
    SELECT organization_id FROM users
    WHERE auth_user_id = auth.uid()
    AND (is_account_owner = true OR is_family_manager = true)
  )
);

-- ----------------------------------------------------------------------------
-- Tasks (Templates)
-- ----------------------------------------------------------------------------
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,

  -- Task Details
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN (
    'cleaning', 'cooking', 'outdoor', 'pet_care', 'homework',
    'organization', 'maintenance', 'errands', 'personal_care', 'general'
  )),

  -- Points & Difficulty
  points INTEGER NOT NULL DEFAULT 10 CHECK (points > 0),
  difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')),

  -- Recurrence (supports complex scheduling)
  frequency TEXT NOT NULL CHECK (frequency IN ('once', 'daily', 'weekly', 'monthly', 'custom')),
  recurrence_pattern JSONB, -- Complex patterns: { days: [0,1,2], time: '09:00', interval: 2, nth_weekday: 1 }

  -- Assignment
  assignment_type TEXT NOT NULL DEFAULT 'individual' CHECK (assignment_type IN ('individual', 'multiple', 'rotation', 'extra_credit')),
  assigned_to_user_ids UUID[] DEFAULT ARRAY[]::UUID[], -- Can be multiple users
  rotation_pool_user_ids UUID[] DEFAULT ARRAY[]::UUID[], -- For rotation tasks
  rotation_frequency TEXT CHECK (rotation_frequency IN ('daily', 'weekly', 'biweekly', 'monthly')),
  rotation_last_changed_at TIMESTAMPTZ,

  -- Scheduling
  starts_at DATE,
  ends_at DATE,
  time_of_day TIME,

  -- Approval & Verification
  requires_approval BOOLEAN NOT NULL DEFAULT false, -- Parent approval before points awarded
  requires_photo_proof BOOLEAN NOT NULL DEFAULT false, -- Must upload photo to complete

  -- Status
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_template BOOLEAN NOT NULL DEFAULT false, -- For saving as reusable template
  is_archived BOOLEAN NOT NULL DEFAULT false,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS Policies for tasks
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view tasks in their organization"
ON tasks FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id FROM users
    WHERE auth_user_id = auth.uid()
  )
);

CREATE POLICY "Managers, adults, and family managers can create tasks"
ON tasks FOR INSERT
WITH CHECK (
  organization_id IN (
    SELECT organization_id FROM users
    WHERE auth_user_id = auth.uid()
    AND (role IN ('manager', 'adult') OR is_family_manager = true OR is_account_owner = true)
  )
);

CREATE POLICY "Managers, adults, and family managers can update tasks"
ON tasks FOR UPDATE
USING (
  organization_id IN (
    SELECT organization_id FROM users
    WHERE auth_user_id = auth.uid()
    AND (role IN ('manager', 'adult') OR is_family_manager = true OR is_account_owner = true)
  )
);

CREATE POLICY "Managers, adults, and family managers can delete tasks"
ON tasks FOR DELETE
USING (
  organization_id IN (
    SELECT organization_id FROM users
    WHERE auth_user_id = auth.uid()
    AND (role IN ('manager', 'adult') OR is_family_manager = true OR is_account_owner = true)
  )
);

-- Indexes
CREATE INDEX idx_tasks_organization_id ON tasks(organization_id);
CREATE INDEX idx_tasks_category ON tasks(category);
CREATE INDEX idx_tasks_frequency ON tasks(frequency);
CREATE INDEX idx_tasks_is_active ON tasks(is_active);
CREATE INDEX idx_tasks_is_archived ON tasks(is_archived);
CREATE INDEX idx_tasks_assignment_type ON tasks(assignment_type);

-- Triggers
CREATE TRIGGER tasks_updated_at
BEFORE UPDATE ON tasks
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ----------------------------------------------------------------------------
-- Task Instances (Scheduled Occurrences)
-- ----------------------------------------------------------------------------
CREATE TABLE task_instances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  assigned_to_user_id UUID REFERENCES users(id) ON DELETE SET NULL,

  -- Instance Details (snapshot from task template)
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  points INTEGER NOT NULL DEFAULT 10,

  -- Scheduling
  scheduled_for DATE NOT NULL,
  due_at TIMESTAMPTZ,

  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'claimed', 'in_progress', 'pending_approval', 'completed', 'missed', 'expired')),
  claimed_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  completed_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,

  -- Approval (if task requires approval)
  requires_approval BOOLEAN NOT NULL DEFAULT false,
  approved_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  approval_notes TEXT,

  -- Photo Proof
  requires_photo_proof BOOLEAN NOT NULL DEFAULT false,
  photo_proof_url TEXT, -- Temporary signed URL, auto-deleted after approval
  photo_uploaded_at TIMESTAMPTZ,
  photo_deleted_at TIMESTAMPTZ,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS Policies for task_instances
ALTER TABLE task_instances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view task instances in their organization"
ON task_instances FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id FROM users
    WHERE auth_user_id = auth.uid()
  )
);

CREATE POLICY "Users can update task instances in their organization"
ON task_instances FOR UPDATE
USING (
  organization_id IN (
    SELECT organization_id FROM users
    WHERE auth_user_id = auth.uid()
  )
);

CREATE POLICY "System can create task instances"
ON task_instances FOR INSERT
WITH CHECK (
  organization_id IN (
    SELECT organization_id FROM users
    WHERE auth_user_id = auth.uid()
  )
);

-- Indexes
CREATE INDEX idx_task_instances_organization_id ON task_instances(organization_id);
CREATE INDEX idx_task_instances_task_id ON task_instances(task_id);
CREATE INDEX idx_task_instances_assigned_to ON task_instances(assigned_to_user_id);
CREATE INDEX idx_task_instances_scheduled_for ON task_instances(scheduled_for);
CREATE INDEX idx_task_instances_status ON task_instances(status);
CREATE INDEX idx_task_instances_completed_by ON task_instances(completed_by_user_id);
CREATE INDEX idx_task_instances_completed_at ON task_instances(completed_at);

-- Triggers
CREATE TRIGGER task_instances_updated_at
BEFORE UPDATE ON task_instances
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ----------------------------------------------------------------------------
-- Rewards
-- ----------------------------------------------------------------------------
CREATE TABLE rewards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,

  -- Reward Details
  title TEXT NOT NULL,
  description TEXT,
  icon TEXT, -- Emoji or icon name

  -- Cost
  points_cost INTEGER NOT NULL CHECK (points_cost > 0),

  -- Availability
  is_active BOOLEAN NOT NULL DEFAULT true,
  stock_quantity INTEGER, -- NULL = unlimited
  max_per_user_per_month INTEGER, -- NULL = unlimited

  -- Approval Settings
  requires_approval BOOLEAN NOT NULL DEFAULT true, -- Parent must approve redemption
  auto_approve_for_roles TEXT[] DEFAULT ARRAY[]::TEXT[], -- Roles that get auto-approval

  -- Restrictions
  allowed_roles TEXT[] DEFAULT ARRAY['manager', 'adult', 'teen', 'kid']::TEXT[],
  min_age INTEGER,
  max_age INTEGER,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_archived BOOLEAN NOT NULL DEFAULT false
);

-- RLS Policies for rewards
ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view rewards in their organization"
ON rewards FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id FROM users
    WHERE auth_user_id = auth.uid()
  )
);

CREATE POLICY "Account owners and family managers can create rewards"
ON rewards FOR INSERT
WITH CHECK (
  organization_id IN (
    SELECT organization_id FROM users
    WHERE auth_user_id = auth.uid()
    AND (is_account_owner = true OR is_family_manager = true)
  )
);

CREATE POLICY "Account owners and family managers can update rewards"
ON rewards FOR UPDATE
USING (
  organization_id IN (
    SELECT organization_id FROM users
    WHERE auth_user_id = auth.uid()
    AND (is_account_owner = true OR is_family_manager = true)
  )
);

CREATE POLICY "Account owners and family managers can delete rewards"
ON rewards FOR DELETE
USING (
  organization_id IN (
    SELECT organization_id FROM users
    WHERE auth_user_id = auth.uid()
    AND (is_account_owner = true OR is_family_manager = true)
  )
);

-- Indexes
CREATE INDEX idx_rewards_organization_id ON rewards(organization_id);
CREATE INDEX idx_rewards_is_active ON rewards(is_active);
CREATE INDEX idx_rewards_points_cost ON rewards(points_cost);
CREATE INDEX idx_rewards_is_archived ON rewards(is_archived);

-- Triggers
CREATE TRIGGER rewards_updated_at
BEFORE UPDATE ON rewards
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ----------------------------------------------------------------------------
-- Reward Redemptions
-- ----------------------------------------------------------------------------
CREATE TABLE reward_redemptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  reward_id UUID NOT NULL REFERENCES rewards(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Redemption Details
  reward_title TEXT NOT NULL, -- Snapshot
  reward_description TEXT,
  points_spent INTEGER NOT NULL,

  -- Status Flow: pending → approved/denied → fulfilled (if approved)
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied', 'fulfilled')),

  -- Approval
  approved_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  denial_reason TEXT,

  -- Fulfillment
  fulfilled_at TIMESTAMPTZ,
  fulfilled_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  fulfillment_notes TEXT,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS Policies for reward_redemptions
ALTER TABLE reward_redemptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view redemptions in their organization"
ON reward_redemptions FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id FROM users
    WHERE auth_user_id = auth.uid()
  )
);

CREATE POLICY "Users can create their own redemptions"
ON reward_redemptions FOR INSERT
WITH CHECK (
  organization_id IN (
    SELECT organization_id FROM users
    WHERE auth_user_id = auth.uid()
  )
);

CREATE POLICY "Managers and adults can update redemptions"
ON reward_redemptions FOR UPDATE
USING (
  organization_id IN (
    SELECT organization_id FROM users
    WHERE auth_user_id = auth.uid()
    AND role IN ('manager', 'adult')
  )
);

-- Indexes
CREATE INDEX idx_reward_redemptions_organization_id ON reward_redemptions(organization_id);
CREATE INDEX idx_reward_redemptions_reward_id ON reward_redemptions(reward_id);
CREATE INDEX idx_reward_redemptions_user_id ON reward_redemptions(user_id);
CREATE INDEX idx_reward_redemptions_status ON reward_redemptions(status);
CREATE INDEX idx_reward_redemptions_created_at ON reward_redemptions(created_at DESC);

-- Triggers
CREATE TRIGGER reward_redemptions_updated_at
BEFORE UPDATE ON reward_redemptions
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- GAMIFICATION TABLES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Achievement Definitions (System-wide templates)
-- ----------------------------------------------------------------------------
CREATE TABLE achievement_definitions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Achievement Identity
  achievement_key TEXT UNIQUE NOT NULL, -- 'first_task', 'streak_7', etc.
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL, -- Emoji or icon name

  -- Requirements
  achievement_type TEXT NOT NULL CHECK (achievement_type IN (
    'milestone', 'behavioral', 'seasonal', 'special'
  )),
  target_value INTEGER, -- For countable achievements (e.g., 10 tasks)

  -- Unlock Privileges
  unlocks_privileges JSONB DEFAULT '[]'::jsonb, -- ['custom_avatar', 'early_credit_access']

  -- Categorization
  category TEXT, -- 'tasks', 'streaks', 'points', 'teamwork'
  rarity TEXT CHECK (rarity IN ('common', 'uncommon', 'rare', 'legendary')),

  -- Availability
  is_active BOOLEAN NOT NULL DEFAULT true,
  seasonal_start_month INTEGER CHECK (seasonal_start_month >= 1 AND seasonal_start_month <= 12),
  seasonal_end_month INTEGER CHECK (seasonal_end_month >= 1 AND seasonal_end_month <= 12),

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- No RLS - platform admins manage these

-- Indexes
CREATE INDEX idx_achievement_definitions_key ON achievement_definitions(achievement_key);
CREATE INDEX idx_achievement_definitions_type ON achievement_definitions(achievement_type);
CREATE INDEX idx_achievement_definitions_is_active ON achievement_definitions(is_active);

-- Triggers
CREATE TRIGGER achievement_definitions_updated_at
BEFORE UPDATE ON achievement_definitions
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ----------------------------------------------------------------------------
-- User Achievements (Unlocked achievements per user)
-- ----------------------------------------------------------------------------
CREATE TABLE user_achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  achievement_key TEXT NOT NULL, -- References achievement_definitions.achievement_key

  -- Progress
  current_value INTEGER NOT NULL DEFAULT 0,
  target_value INTEGER, -- Copied from definition
  is_unlocked BOOLEAN NOT NULL DEFAULT false,

  -- Unlocked Details
  unlocked_at TIMESTAMPTZ,
  notified_at TIMESTAMPTZ,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(user_id, achievement_key)
);

-- RLS Policies
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view achievements in their organization"
ON user_achievements FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id FROM users
    WHERE auth_user_id = auth.uid()
  )
);

-- Indexes
CREATE INDEX idx_user_achievements_organization_id ON user_achievements(organization_id);
CREATE INDEX idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX idx_user_achievements_is_unlocked ON user_achievements(is_unlocked);
CREATE INDEX idx_user_achievements_achievement_key ON user_achievements(achievement_key);

-- ============================================================================
-- COMMUNICATION TABLES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Family Messages (Parent ↔ Kid simple messaging)
-- ----------------------------------------------------------------------------
CREATE TABLE family_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Message Details
  from_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message_type TEXT NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'reaction')),

  -- Content
  message_text TEXT CHECK (length(message_text) <= 200), -- 200 char limit
  reaction_emoji TEXT, -- For quick reactions

  -- Context (optional - what this message is about)
  context_type TEXT CHECK (context_type IN ('achievement', 'task_completion', 'general')),
  context_id UUID, -- achievement_id, task_instance_id, etc.

  -- Status
  is_read BOOLEAN NOT NULL DEFAULT false,
  read_at TIMESTAMPTZ,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE family_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages in their organization"
ON family_messages FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id FROM users
    WHERE auth_user_id = auth.uid()
  )
);

CREATE POLICY "Users can send messages in their organization"
ON family_messages FOR INSERT
WITH CHECK (
  organization_id IN (
    SELECT organization_id FROM users
    WHERE auth_user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own messages"
ON family_messages FOR UPDATE
USING (
  from_user_id IN (
    SELECT id FROM users WHERE auth_user_id = auth.uid()
  )
  OR to_user_id IN (
    SELECT id FROM users WHERE auth_user_id = auth.uid()
  )
);

-- Indexes
CREATE INDEX idx_family_messages_organization_id ON family_messages(organization_id);
CREATE INDEX idx_family_messages_from_user_id ON family_messages(from_user_id);
CREATE INDEX idx_family_messages_to_user_id ON family_messages(to_user_id);
CREATE INDEX idx_family_messages_is_read ON family_messages(is_read);
CREATE INDEX idx_family_messages_created_at ON family_messages(created_at DESC);

-- ============================================================================
-- COMPLIANCE TABLES (COPPA, GDPR)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Parental Consents
-- ----------------------------------------------------------------------------
CREATE TABLE parental_consents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  child_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  parent_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Consent Details
  consent_type TEXT NOT NULL CHECK (consent_type IN ('account_creation', 'data_processing', 'marketing')),
  consent_text TEXT NOT NULL, -- Full text of what was consented to
  consent_version TEXT NOT NULL, -- Version of ToS/Privacy Policy

  -- Verification
  ip_address INET NOT NULL,
  user_agent TEXT,

  -- Status
  granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at TIMESTAMPTZ,

  UNIQUE(child_user_id, consent_type)
);

-- RLS Policies
ALTER TABLE parental_consents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Account owners can view consents in their organization"
ON parental_consents FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id FROM users
    WHERE auth_user_id = auth.uid()
    AND is_account_owner = true
  )
);

-- Indexes
CREATE INDEX idx_parental_consents_organization_id ON parental_consents(organization_id);
CREATE INDEX idx_parental_consents_child_user_id ON parental_consents(child_user_id);
CREATE INDEX idx_parental_consents_parent_user_id ON parental_consents(parent_user_id);

-- ============================================================================
-- SMART SUGGESTIONS & AI TABLES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Family Profiles (For smart suggestions and AI personalization)
-- ----------------------------------------------------------------------------
CREATE TABLE family_profiles (
  organization_id UUID PRIMARY KEY REFERENCES organizations(id) ON DELETE CASCADE,

  -- Family Composition
  family_type TEXT CHECK (family_type IN ('single_parent', 'two_parent', 'multi_generational', 'blended')),
  household_size INTEGER,
  age_groups TEXT[], -- ['0-4', '5-7', '8-12', '13-17', '18+']

  -- Home Details
  home_type TEXT CHECK (home_type IN ('apartment', 'house', 'townhouse', 'condo', 'other')),
  has_yard BOOLEAN DEFAULT false,

  -- Pets
  has_pets BOOLEAN DEFAULT false,
  pet_types TEXT[], -- ['dog', 'cat', 'fish', 'bird', 'other']

  -- Meal Planning Preferences
  dietary_restrictions TEXT[], -- ['vegetarian', 'vegan', 'gluten_free', 'dairy_free', 'nut_free']
  food_allergies TEXT[],
  meal_preferences TEXT[], -- ['quick_meals', 'healthy', 'budget_friendly', 'kid_friendly', 'adventurous']
  meals_to_plan TEXT CHECK (meals_to_plan IN ('dinners_only', 'lunch_and_dinner', 'all_meals')),

  -- Task Management Preferences
  task_time_preferences TEXT[], -- ['morning', 'after_school', 'evening', 'weekends']
  tasks_per_child_per_day TEXT CHECK (tasks_per_child_per_day IN ('1-2', '3-4', '5+')),
  task_assignment_style TEXT CHECK (task_assignment_style IN ('assign', 'claim', 'mix')),
  rotate_tasks_weekly BOOLEAN DEFAULT false,

  -- Reward Preferences
  preferred_reward_types TEXT[], -- ['screen_time', 'activities', 'treats', 'privileges', 'toys', 'experiences']
  reward_approval_style TEXT CHECK (reward_approval_style IN ('manual', 'auto_small', 'weekly_time')),
  reward_point_preference TEXT CHECK (reward_point_preference IN ('small', 'medium', 'large', 'mix')),

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_setup BOOLEAN NOT NULL DEFAULT false
);

-- RLS Policies
ALTER TABLE family_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their family profile"
ON family_profiles FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id FROM users
    WHERE auth_user_id = auth.uid()
  )
);

CREATE POLICY "Account owners and managers can update family profile"
ON family_profiles FOR ALL
USING (
  organization_id IN (
    SELECT organization_id FROM users
    WHERE auth_user_id = auth.uid()
    AND (is_account_owner = true OR is_family_manager = true)
  )
);

-- Triggers
CREATE TRIGGER family_profiles_updated_at
BEFORE UPDATE ON family_profiles
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ----------------------------------------------------------------------------
-- Suggestion Logs (Track AI/logic suggestions for improvement)
-- ----------------------------------------------------------------------------
CREATE TABLE suggestion_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,

  -- Suggestion Details
  suggestion_type TEXT NOT NULL CHECK (suggestion_type IN ('task', 'reward', 'meal', 'schedule')),
  suggestion_source TEXT NOT NULL CHECK (suggestion_source IN ('ai', 'logic', 'pattern')),
  suggested_item JSONB NOT NULL, -- The full suggestion payload

  -- User Response
  was_accepted BOOLEAN,
  was_modified BOOLEAN, -- True if user edited before accepting
  feedback_text TEXT,

  -- Algorithm Tracking
  algorithm_version TEXT,
  segment TEXT, -- Family segment for A/B testing

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE suggestion_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Platform admin can view all suggestion logs"
ON suggestion_logs FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE auth_user_id = auth.uid()
    AND is_platform_admin = true
  )
);

-- Indexes (for analytics, no user access needed)
CREATE INDEX idx_suggestion_logs_organization_id ON suggestion_logs(organization_id);
CREATE INDEX idx_suggestion_logs_suggestion_type ON suggestion_logs(suggestion_type);
CREATE INDEX idx_suggestion_logs_suggestion_source ON suggestion_logs(suggestion_source);
CREATE INDEX idx_suggestion_logs_was_accepted ON suggestion_logs(was_accepted);
CREATE INDEX idx_suggestion_logs_created_at ON suggestion_logs(created_at DESC);

-- ----------------------------------------------------------------------------
-- Suggestion Patterns (Pre-built suggestion rules)
-- ----------------------------------------------------------------------------
CREATE TABLE suggestion_patterns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Pattern Identity
  pattern_name TEXT UNIQUE NOT NULL,
  pattern_description TEXT,

  -- Matching Criteria (JSON for flexible matching)
  family_criteria JSONB, -- { "family_type": "two_parent", "age_groups": ["8-12", "13-17"], "has_pets": true }

  -- Suggestions
  suggested_tasks JSONB, -- Array of task templates
  suggested_rewards JSONB, -- Array of reward ideas
  suggested_schedule JSONB, -- Scheduling recommendations

  -- Age Targeting
  min_age INTEGER,
  max_age INTEGER,

  -- Performance Metrics
  effectiveness_score DECIMAL(3,2), -- 0.00 to 1.00
  usage_count INTEGER NOT NULL DEFAULT 0,
  acceptance_rate DECIMAL(3,2), -- Track how often users accept these suggestions

  -- Status
  is_active BOOLEAN NOT NULL DEFAULT true,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- No RLS - platform admins only

-- Indexes
CREATE INDEX idx_suggestion_patterns_is_active ON suggestion_patterns(is_active);
CREATE INDEX idx_suggestion_patterns_effectiveness ON suggestion_patterns(effectiveness_score DESC);

-- Triggers
CREATE TRIGGER suggestion_patterns_updated_at
BEFORE UPDATE ON suggestion_patterns
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- MEAL PLANNING TABLES (Phase 2 - Ready for future use)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Recipes
-- ----------------------------------------------------------------------------
CREATE TABLE recipes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE, -- NULL = shared library recipe
  created_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,

  -- Recipe Details
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,

  -- Cooking Details
  prep_time_minutes INTEGER,
  cook_time_minutes INTEGER,
  servings INTEGER,
  difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')),

  -- Categorization
  meal_type TEXT[] DEFAULT ARRAY[]::TEXT[], -- ['breakfast', 'lunch', 'dinner', 'snack']
  cuisine TEXT,
  tags TEXT[], -- ['kid_friendly', 'quick', 'healthy', 'budget']

  -- Dietary Info
  dietary_flags TEXT[], -- ['vegetarian', 'vegan', 'gluten_free', 'dairy_free']
  allergens TEXT[], -- ['nuts', 'shellfish', 'eggs']

  -- Content
  ingredients JSONB, -- [{ "item": "flour", "amount": "2", "unit": "cups" }]
  instructions JSONB, -- [{ "step": 1, "instruction": "Preheat oven..." }]

  -- Usage Tracking
  times_cooked INTEGER DEFAULT 0,
  average_rating DECIMAL(2,1),

  -- Source
  source_url TEXT,
  is_library_recipe BOOLEAN DEFAULT false, -- Shared across all users

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- RLS Policies
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view recipes in their org or library recipes"
ON recipes FOR SELECT
USING (
  organization_id IS NULL -- Library recipe
  OR organization_id IN (
    SELECT organization_id FROM users WHERE auth_user_id = auth.uid()
  )
);

CREATE POLICY "Users can create recipes in their organization"
ON recipes FOR INSERT
WITH CHECK (
  organization_id IN (
    SELECT organization_id FROM users WHERE auth_user_id = auth.uid()
  )
);

-- Indexes
CREATE INDEX idx_recipes_organization_id ON recipes(organization_id);
CREATE INDEX idx_recipes_is_library ON recipes(is_library_recipe);
CREATE INDEX idx_recipes_tags ON recipes USING GIN(tags);
CREATE INDEX idx_recipes_dietary_flags ON recipes USING GIN(dietary_flags);

-- Triggers
CREATE TRIGGER recipes_updated_at
BEFORE UPDATE ON recipes
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ----------------------------------------------------------------------------
-- Meal Plans
-- ----------------------------------------------------------------------------
CREATE TABLE meal_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,

  -- Plan Details
  title TEXT NOT NULL, -- "Week of Jan 15", "This Week's Meals"
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,

  -- Meals (array of meal objects)
  meals JSONB, -- [{ "date": "2025-01-15", "meal_type": "dinner", "recipe_id": "uuid", "recipe_title": "Spaghetti" }]

  -- Generation Details
  generated_by_ai BOOLEAN DEFAULT false,
  ai_prompt_used TEXT,

  -- Status
  is_active BOOLEAN DEFAULT true,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE meal_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view meal plans in their organization"
ON meal_plans FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id FROM users WHERE auth_user_id = auth.uid()
  )
);

CREATE POLICY "Users can create meal plans in their organization"
ON meal_plans FOR ALL
USING (
  organization_id IN (
    SELECT organization_id FROM users WHERE auth_user_id = auth.uid()
  )
);

-- Indexes
CREATE INDEX idx_meal_plans_organization_id ON meal_plans(organization_id);
CREATE INDEX idx_meal_plans_date_range ON meal_plans(start_date, end_date);
CREATE INDEX idx_meal_plans_is_active ON meal_plans(is_active);

-- Triggers
CREATE TRIGGER meal_plans_updated_at
BEFORE UPDATE ON meal_plans
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ----------------------------------------------------------------------------
-- Shopping Lists
-- ----------------------------------------------------------------------------
CREATE TABLE shopping_lists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,

  -- List Details
  title TEXT NOT NULL DEFAULT 'Shopping List',

  -- Items
  items JSONB, -- [{ "id": "uuid", "item": "milk", "quantity": "1 gallon", "category": "dairy", "checked": false, "added_by": "meal_plan" }]

  -- Generation
  generated_from_meal_plan_id UUID REFERENCES meal_plans(id) ON DELETE SET NULL,
  auto_generated BOOLEAN DEFAULT false,

  -- Status
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,

  -- Instacart Integration (Phase 3)
  instacart_order_id TEXT,
  instacart_order_status TEXT,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE shopping_lists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view shopping lists in their organization"
ON shopping_lists FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id FROM users WHERE auth_user_id = auth.uid()
  )
);

CREATE POLICY "Users can manage shopping lists in their organization"
ON shopping_lists FOR ALL
USING (
  organization_id IN (
    SELECT organization_id FROM users WHERE auth_user_id = auth.uid()
  )
);

-- Indexes
CREATE INDEX idx_shopping_lists_organization_id ON shopping_lists(organization_id);
CREATE INDEX idx_shopping_lists_is_completed ON shopping_lists(is_completed);
CREATE INDEX idx_shopping_lists_meal_plan_id ON shopping_lists(generated_from_meal_plan_id);

-- Triggers
CREATE TRIGGER shopping_lists_updated_at
BEFORE UPDATE ON shopping_lists
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- INTEGRATION TABLES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- User Invitations (for adding second parent, etc.)
-- ----------------------------------------------------------------------------
CREATE TABLE user_invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE, -- Set after accepted
  invited_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,

  -- Invitation Details
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('manager', 'adult', 'teen')),
  is_family_manager BOOLEAN DEFAULT false,
  token TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'canceled')),

  -- Timing
  invited_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,

  -- Metadata
  invitation_message TEXT
);

-- RLS Policies
ALTER TABLE user_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view invitations in their organization"
ON user_invitations FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id FROM users
    WHERE auth_user_id = auth.uid()
  )
);

CREATE POLICY "Account owners and family managers can create invitations"
ON user_invitations FOR INSERT
WITH CHECK (
  organization_id IN (
    SELECT organization_id FROM users
    WHERE auth_user_id = auth.uid()
    AND (is_account_owner = true OR is_family_manager = true)
  )
);

-- Indexes
CREATE INDEX idx_user_invitations_organization_id ON user_invitations(organization_id);
CREATE INDEX idx_user_invitations_email ON user_invitations(email);
CREATE INDEX idx_user_invitations_token ON user_invitations(token);
CREATE INDEX idx_user_invitations_status ON user_invitations(status);

-- ----------------------------------------------------------------------------
-- Calendar Connections (Google Calendar, Outlook, iCal)
-- ----------------------------------------------------------------------------
CREATE TABLE calendar_connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- OAuth Tokens
  provider TEXT NOT NULL DEFAULT 'google' CHECK (provider IN ('google', 'outlook', 'apple')),
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_expires_at TIMESTAMPTZ NOT NULL,

  -- Selected Calendar
  calendar_id TEXT,
  calendar_name TEXT,

  -- Sync Settings (1-way import only for MVP)
  sync_enabled BOOLEAN NOT NULL DEFAULT true,
  sync_direction TEXT NOT NULL DEFAULT 'import' CHECK (sync_direction IN ('import', 'export', 'both')),
  last_synced_at TIMESTAMPTZ,
  sync_errors JSONB,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE calendar_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own calendar connections"
ON calendar_connections FOR ALL
USING (
  user_id IN (
    SELECT id FROM users
    WHERE auth_user_id = auth.uid()
  )
);

-- Indexes
CREATE INDEX idx_calendar_connections_organization_id ON calendar_connections(organization_id);
CREATE INDEX idx_calendar_connections_user_id ON calendar_connections(user_id);
CREATE INDEX idx_calendar_connections_provider ON calendar_connections(provider);

-- Triggers
CREATE TRIGGER calendar_connections_updated_at
BEFORE UPDATE ON calendar_connections
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ----------------------------------------------------------------------------
-- Imported Calendar Events (Cached from external calendars)
-- ----------------------------------------------------------------------------
CREATE TABLE imported_calendar_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  calendar_connection_id UUID NOT NULL REFERENCES calendar_connections(id) ON DELETE CASCADE,

  -- Event Details (from external calendar)
  external_event_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,

  -- Timing
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  is_all_day BOOLEAN DEFAULT false,
  timezone TEXT,

  -- Recurrence
  is_recurring BOOLEAN DEFAULT false,
  recurrence_rule TEXT,

  -- Categorization
  color TEXT,
  assigned_user_id UUID REFERENCES users(id) ON DELETE SET NULL, -- Which family member this event is for

  -- Sync Metadata
  last_synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(calendar_connection_id, external_event_id)
);

-- RLS Policies
ALTER TABLE imported_calendar_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view imported events in their organization"
ON imported_calendar_events FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id FROM users WHERE auth_user_id = auth.uid()
  )
);

-- Indexes
CREATE INDEX idx_imported_events_organization_id ON imported_calendar_events(organization_id);
CREATE INDEX idx_imported_events_connection_id ON imported_calendar_events(calendar_connection_id);
CREATE INDEX idx_imported_events_start_time ON imported_calendar_events(start_time);
CREATE INDEX idx_imported_events_assigned_user ON imported_calendar_events(assigned_user_id);

-- ============================================================================
-- QUOTES LIBRARY (Inspirational quotes for kids, teens, adults)
-- ============================================================================
CREATE TABLE quotes_library (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Quote Content
  quote_text TEXT NOT NULL,
  author TEXT, -- NULL for original quotes

  -- Categorization
  age_group TEXT NOT NULL CHECK (age_group IN ('kid', 'teen', 'adult')),
  context TEXT[] DEFAULT ARRAY[]::TEXT[], -- ['task_completion', 'achievement', 'daily_inspiration', 'hub_display']
  category TEXT CHECK (category IN ('motivation', 'teamwork', 'growth', 'celebration', 'encouragement')),

  -- Status
  is_active BOOLEAN NOT NULL DEFAULT true,

  -- Usage Tracking
  usage_count INTEGER DEFAULT 0,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- No RLS - public library

-- Indexes
CREATE INDEX idx_quotes_age_group ON quotes_library(age_group);
CREATE INDEX idx_quotes_context ON quotes_library USING GIN(context);
CREATE INDEX idx_quotes_is_active ON quotes_library(is_active);

-- ============================================================================
-- SHARED LIBRARY TABLES (No organization_id - shared across platform)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Task Library (Pre-built task templates)
-- ----------------------------------------------------------------------------
CREATE TABLE task_library (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Task Details
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN (
    'cleaning', 'cooking', 'outdoor', 'pet_care', 'homework',
    'organization', 'maintenance', 'errands', 'personal_care', 'general'
  )),

  -- Suggested Settings
  suggested_points INTEGER NOT NULL DEFAULT 10,
  suggested_difficulty TEXT CHECK (suggested_difficulty IN ('easy', 'medium', 'hard')),
  suggested_frequency TEXT CHECK (suggested_frequency IN ('once', 'daily', 'weekly', 'monthly')),

  -- Age Appropriateness
  min_age INTEGER,
  max_age INTEGER,
  suitable_roles TEXT[] DEFAULT ARRAY['manager', 'adult', 'teen', 'kid']::TEXT[],

  -- Segmentation
  tags TEXT[] DEFAULT ARRAY[]::TEXT[], -- ['indoor', 'outdoor', 'quick', 'supervision_needed']
  seasonal BOOLEAN NOT NULL DEFAULT false,
  requires_supervision BOOLEAN NOT NULL DEFAULT false,

  -- Usage Tracking
  usage_count INTEGER NOT NULL DEFAULT 0,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- No RLS - public library, but only platform admins can modify

-- Indexes
CREATE INDEX idx_task_library_category ON task_library(category);
CREATE INDEX idx_task_library_tags ON task_library USING GIN(tags);
CREATE INDEX idx_task_library_usage_count ON task_library(usage_count DESC);
CREATE INDEX idx_task_library_is_active ON task_library(is_active);

-- Triggers
CREATE TRIGGER task_library_updated_at
BEFORE UPDATE ON task_library
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ----------------------------------------------------------------------------
-- Reward Library (Pre-built reward ideas)
-- ----------------------------------------------------------------------------
CREATE TABLE reward_library (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Reward Details
  title TEXT NOT NULL,
  description TEXT,
  icon TEXT,

  -- Suggested Settings
  suggested_points_cost INTEGER NOT NULL,

  -- Age Appropriateness
  min_age INTEGER,
  max_age INTEGER,
  suitable_roles TEXT[] DEFAULT ARRAY['manager', 'adult', 'teen', 'kid']::TEXT[],

  -- Categorization
  category TEXT CHECK (category IN ('privilege', 'treat', 'activity', 'item', 'experience')),
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],

  -- Usage Tracking
  usage_count INTEGER NOT NULL DEFAULT 0,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- No RLS - public library

-- Indexes
CREATE INDEX idx_reward_library_category ON reward_library(category);
CREATE INDEX idx_reward_library_tags ON reward_library USING GIN(tags);
CREATE INDEX idx_reward_library_usage_count ON reward_library(usage_count DESC);
CREATE INDEX idx_reward_library_is_active ON reward_library(is_active);

-- Triggers
CREATE TRIGGER reward_library_updated_at
BEFORE UPDATE ON reward_library
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- PLATFORM ADMIN TABLES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Feature Flags & Subscription Features
-- ----------------------------------------------------------------------------
CREATE TABLE features (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Feature Identity
  feature_key TEXT UNIQUE NOT NULL, -- 'meal_planning', 'calendar_sync', 'ai_suggestions'
  feature_name TEXT NOT NULL,
  category TEXT, -- 'planning', 'analytics', 'gamification', 'integrations'
  description TEXT,

  -- Status
  is_active BOOLEAN NOT NULL DEFAULT true,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- No RLS - platform admins only

-- Indexes
CREATE INDEX idx_features_key ON features(feature_key);
CREATE INDEX idx_features_is_active ON features(is_active);

-- Triggers
CREATE TRIGGER features_updated_at
BEFORE UPDATE ON features
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ----------------------------------------------------------------------------
-- Plan Features (Maps features to subscription tiers)
-- ----------------------------------------------------------------------------
CREATE TABLE plan_features (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  plan_tier TEXT NOT NULL CHECK (plan_tier IN ('pulse_starter', 'pulse_premium', 'unlimited_pulse')),
  feature_key TEXT NOT NULL REFERENCES features(feature_key) ON DELETE CASCADE,

  -- Access Level
  access_level TEXT NOT NULL CHECK (access_level IN ('none', 'preview', 'basic', 'full')),

  -- Limits (for quantifiable features)
  limit_value INTEGER, -- e.g., 30 tasks for free tier, NULL = unlimited
  limit_type TEXT, -- 'active_tasks', 'active_rewards', 'ai_prompts_per_month'

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(plan_tier, feature_key)
);

-- No RLS - platform admins only

-- Indexes
CREATE INDEX idx_plan_features_tier ON plan_features(plan_tier);
CREATE INDEX idx_plan_features_key ON plan_features(feature_key);

-- Triggers
CREATE TRIGGER plan_features_updated_at
BEFORE UPDATE ON plan_features
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ----------------------------------------------------------------------------
-- Permissions (Centralized permission management)
-- ----------------------------------------------------------------------------
CREATE TABLE permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  permission_key TEXT UNIQUE NOT NULL, -- 'tasks:create', 'users:delete'
  category TEXT, -- 'tasks', 'users', 'rewards', 'settings'
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- No RLS - platform admins only

-- Indexes
CREATE INDEX idx_permissions_key ON permissions(permission_key);
CREATE INDEX idx_permissions_category ON permissions(category);

-- ----------------------------------------------------------------------------
-- Role Permissions (Maps permissions to roles)
-- ----------------------------------------------------------------------------
CREATE TABLE role_permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  role TEXT NOT NULL CHECK (role IN ('manager', 'adult', 'teen', 'kid')),
  permission_key TEXT NOT NULL REFERENCES permissions(permission_key) ON DELETE CASCADE,

  -- Special Flags
  is_account_owner_only BOOLEAN DEFAULT false, -- Some permissions only for account owner
  is_family_manager_required BOOLEAN DEFAULT false, -- Requires family_manager flag

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(role, permission_key)
);

-- No RLS - platform admins only

-- Indexes
CREATE INDEX idx_role_permissions_role ON role_permissions(role);
CREATE INDEX idx_role_permissions_key ON role_permissions(permission_key);

-- ----------------------------------------------------------------------------
-- Activity Logs (Audit Trail)
-- ----------------------------------------------------------------------------
CREATE TABLE user_activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,

  -- Activity Details
  action TEXT NOT NULL, -- 'user.created', 'task.completed', 'reward.redeemed'
  resource_type TEXT NOT NULL, -- 'user', 'task', 'reward'
  resource_id UUID,

  -- Context
  metadata JSONB DEFAULT '{}'::jsonb,
  ip_address INET,
  user_agent TEXT,

  -- Timestamp
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE user_activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Managers can view activity logs in their organization"
ON user_activity_logs FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id FROM users
    WHERE auth_user_id = auth.uid()
    AND (is_account_owner = true OR is_family_manager = true)
  )
);

-- Indexes
CREATE INDEX idx_activity_logs_organization_id ON user_activity_logs(organization_id);
CREATE INDEX idx_activity_logs_user_id ON user_activity_logs(user_id);
CREATE INDEX idx_activity_logs_action ON user_activity_logs(action);
CREATE INDEX idx_activity_logs_created_at ON user_activity_logs(created_at DESC);
CREATE INDEX idx_activity_logs_resource ON user_activity_logs(resource_type, resource_id);

-- ----------------------------------------------------------------------------
-- API Error Logs
-- ----------------------------------------------------------------------------
CREATE TABLE api_error_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,

  -- Error Details
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,
  error_message TEXT NOT NULL,
  error_stack TEXT,

  -- Request Context
  request_body JSONB,
  query_params JSONB,

  -- Response
  status_code INTEGER,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- No RLS - platform admins only

-- Indexes
CREATE INDEX idx_api_error_logs_organization_id ON api_error_logs(organization_id);
CREATE INDEX idx_api_error_logs_endpoint ON api_error_logs(endpoint);
CREATE INDEX idx_api_error_logs_status_code ON api_error_logs(status_code);
CREATE INDEX idx_api_error_logs_created_at ON api_error_logs(created_at DESC);

-- ----------------------------------------------------------------------------
-- Security Event Logs
-- ----------------------------------------------------------------------------
CREATE TABLE security_event_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,

  -- Event Details
  event_type TEXT NOT NULL CHECK (event_type IN (
    'login_success', 'login_failed', 'password_reset', 'password_changed',
    'unauthorized_access', 'permission_denied',
    'suspicious_activity', 'account_locked', 'pin_reset',
    'account_ownership_transferred', 'family_manager_granted'
  )),
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),

  -- Context
  description TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  ip_address INET,
  user_agent TEXT,

  -- Timestamp
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- No RLS - platform admins only

-- Indexes
CREATE INDEX idx_security_event_logs_organization_id ON security_event_logs(organization_id);
CREATE INDEX idx_security_event_logs_user_id ON security_event_logs(user_id);
CREATE INDEX idx_security_event_logs_event_type ON security_event_logs(event_type);
CREATE INDEX idx_security_event_logs_severity ON security_event_logs(severity);
CREATE INDEX idx_security_event_logs_created_at ON security_event_logs(created_at DESC);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Get user's organization ID
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION user_organization_id()
RETURNS UUID AS $$
  SELECT organization_id FROM users
  WHERE auth_user_id = auth.uid()
  LIMIT 1;
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- ----------------------------------------------------------------------------
-- Check if user is platform admin
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION is_platform_admin()
RETURNS BOOLEAN AS $$
  SELECT COALESCE(
    (SELECT is_platform_admin FROM users WHERE auth_user_id = auth.uid()),
    false
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- ----------------------------------------------------------------------------
-- Award points to user
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION award_points(
  p_user_id UUID,
  p_points INTEGER
)
RETURNS VOID AS $$
BEGIN
  UPDATE users
  SET
    points_balance = points_balance + p_points,
    points_lifetime_earned = points_lifetime_earned + p_points
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- ----------------------------------------------------------------------------
-- Deduct points from user
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION deduct_points(
  p_user_id UUID,
  p_points INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
  current_balance INTEGER;
BEGIN
  SELECT points_balance INTO current_balance
  FROM users
  WHERE id = p_user_id;

  IF current_balance >= p_points THEN
    UPDATE users
    SET
      points_balance = points_balance - p_points,
      points_lifetime_spent = points_lifetime_spent + p_points
    WHERE id = p_user_id;
    RETURN true;
  ELSE
    RETURN false;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ----------------------------------------------------------------------------
-- Update streak count (with 1-day grace period)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_streak(
  p_user_id UUID,
  p_completed_date DATE
)
RETURNS VOID AS $$
DECLARE
  last_completed DATE;
  current_streak INTEGER;
  grace_used BOOLEAN;
BEGIN
  SELECT streak_last_completed_at, streak_count, streak_grace_used
  INTO last_completed, current_streak, grace_used
  FROM users
  WHERE id = p_user_id;

  IF last_completed IS NULL THEN
    -- First completion
    UPDATE users
    SET streak_count = 1,
        streak_last_completed_at = p_completed_date,
        streak_grace_used = false
    WHERE id = p_user_id;
  ELSIF last_completed = p_completed_date THEN
    -- Already completed today, no change
    RETURN;
  ELSIF last_completed = p_completed_date - INTERVAL '1 day' THEN
    -- Consecutive day
    UPDATE users
    SET streak_count = streak_count + 1,
        streak_last_completed_at = p_completed_date,
        streak_grace_used = false -- Reset grace for next time
    WHERE id = p_user_id;
  ELSIF last_completed = p_completed_date - INTERVAL '2 days' AND NOT grace_used THEN
    -- Missed one day, but grace period allows continuation
    UPDATE users
    SET streak_count = streak_count + 1,
        streak_last_completed_at = p_completed_date,
        streak_grace_used = true
    WHERE id = p_user_id;
  ELSE
    -- Streak broken (missed 2+ days or grace already used)
    UPDATE users
    SET streak_count = 1,
        streak_last_completed_at = p_completed_date,
        streak_grace_used = false
    WHERE id = p_user_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ----------------------------------------------------------------------------
-- Generate alphanumeric family code (ABC-123-XYZ format)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION generate_family_code()
RETURNS TEXT AS $$
DECLARE
  new_code TEXT;
  counter INTEGER := 0;
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- Exclude similar chars (I,1,O,0)
  part1 TEXT;
  part2 TEXT;
  part3 TEXT;
BEGIN
  LOOP
    -- Generate 3 random letters
    part1 := '';
    FOR i IN 1..3 LOOP
      part1 := part1 || substr(chars, floor(random() * length(chars) + 1)::int, 1);
    END LOOP;

    -- Generate 3 random numbers
    part2 := '';
    FOR i IN 1..3 LOOP
      part2 := part2 || substr('23456789', floor(random() * 8 + 1)::int, 1);
    END LOOP;

    -- Generate 3 random letters
    part3 := '';
    FOR i IN 1..3 LOOP
      part3 := part3 || substr(chars, floor(random() * length(chars) + 1)::int, 1);
    END LOOP;

    new_code := part1 || '-' || part2 || '-' || part3;

    -- Check if code is unique
    EXIT WHEN NOT EXISTS (SELECT 1 FROM organizations WHERE current_family_code = new_code);

    counter := counter + 1;
    IF counter > 100 THEN
      RAISE EXCEPTION 'Could not generate unique family code';
    END IF;
  END LOOP;

  RETURN new_code;
END;
$$ LANGUAGE plpgsql;

-- ----------------------------------------------------------------------------
-- Update age based on birth_month (run monthly via cron)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_user_ages()
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER;
  current_month INTEGER;
BEGIN
  current_month := EXTRACT(MONTH FROM CURRENT_DATE);

  UPDATE users
  SET age = age + 1
  WHERE birth_month = current_month
    AND age IS NOT NULL
    AND age < 100; -- Sanity check

  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- INITIAL DATA
-- ============================================================================

-- Platform organization (for platform admins)
INSERT INTO organizations (id, name, subscription_tier, setup_completed, current_family_code)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  'ChorePulse Platform',
  'unlimited_pulse',
  true,
  'PLATFORM'
) ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check all tables have RLS enabled
-- Run this after migration to verify security:
/*
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename NOT IN ('spatial_ref_sys') -- Exclude PostGIS tables
ORDER BY tablename;
*/

-- Check all policies
/*
SELECT schemaname, tablename, policyname, permissive, cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
*/

-- Verify foreign key constraints
/*
SELECT
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema='public'
ORDER BY tc.table_name;
*/

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================
