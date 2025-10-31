-- Create rewards table
CREATE TABLE IF NOT EXISTS rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  points INTEGER NOT NULL CHECK (points >= 0),
  category VARCHAR(100) NOT NULL,
  icon VARCHAR(10) DEFAULT '🎁',
  stock_quantity INTEGER, -- NULL means unlimited
  max_per_month INTEGER, -- NULL means unlimited
  age_restriction TEXT[], -- Array of age groups: 'kid', 'teen', 'adult'
  requires_approval BOOLEAN DEFAULT TRUE,
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create reward_redemptions table
CREATE TABLE IF NOT EXISTS reward_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reward_id UUID NOT NULL REFERENCES rewards(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  points_spent INTEGER NOT NULL,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied', 'fulfilled')),
  notes TEXT, -- User notes when requesting
  admin_notes TEXT, -- Admin notes when approving/denying
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  fulfilled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create reward_templates table (pre-populated reward ideas)
CREATE TABLE IF NOT EXISTS reward_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100) NOT NULL,
  suggested_points INTEGER NOT NULL,
  icon VARCHAR(10) DEFAULT '🎁',
  age_appropriate TEXT[], -- Array of age groups
  popularity INTEGER DEFAULT 0, -- 0-100 score
  tags TEXT[], -- Searchable tags
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_rewards_organization ON rewards(organization_id);
CREATE INDEX IF NOT EXISTS idx_rewards_status ON rewards(status);
CREATE INDEX IF NOT EXISTS idx_rewards_category ON rewards(category);

CREATE INDEX IF NOT EXISTS idx_reward_redemptions_user ON reward_redemptions(user_id);
CREATE INDEX IF NOT EXISTS idx_reward_redemptions_reward ON reward_redemptions(reward_id);
CREATE INDEX IF NOT EXISTS idx_reward_redemptions_status ON reward_redemptions(status);

CREATE INDEX IF NOT EXISTS idx_reward_templates_category ON reward_templates(category);
CREATE INDEX IF NOT EXISTS idx_reward_templates_popularity ON reward_templates(popularity DESC);

-- Add RLS policies
ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE reward_redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reward_templates ENABLE ROW LEVEL SECURITY;

-- Rewards policies
CREATE POLICY "Users can view rewards in their organization"
  ON rewards FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Managers can create rewards"
  ON rewards FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM users
      WHERE auth_user_id = auth.uid()
      AND (is_account_owner = TRUE OR is_family_manager = TRUE)
    )
  );

CREATE POLICY "Managers can update rewards"
  ON rewards FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM users
      WHERE auth_user_id = auth.uid()
      AND (is_account_owner = TRUE OR is_family_manager = TRUE)
    )
  );

CREATE POLICY "Managers can delete rewards"
  ON rewards FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id FROM users
      WHERE auth_user_id = auth.uid()
      AND (is_account_owner = TRUE OR is_family_manager = TRUE)
    )
  );

-- Reward redemptions policies
CREATE POLICY "Users can view their own redemptions"
  ON reward_redemptions FOR SELECT
  USING (
    user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "Managers can view all redemptions in their organization"
  ON reward_redemptions FOR SELECT
  USING (
    user_id IN (
      SELECT u.id FROM users u
      JOIN users curr_user ON curr_user.auth_user_id = auth.uid()
      WHERE u.organization_id = curr_user.organization_id
      AND (curr_user.is_account_owner = TRUE OR curr_user.is_family_manager = TRUE)
    )
  );

CREATE POLICY "Users can create redemption requests"
  ON reward_redemptions FOR INSERT
  WITH CHECK (
    user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "Managers can update redemption status"
  ON reward_redemptions FOR UPDATE
  USING (
    user_id IN (
      SELECT u.id FROM users u
      JOIN users curr_user ON curr_user.auth_user_id = auth.uid()
      WHERE u.organization_id = curr_user.organization_id
      AND (curr_user.is_account_owner = TRUE OR curr_user.is_family_manager = TRUE)
    )
  );

-- Reward templates policies (public read-only)
CREATE POLICY "Anyone can view reward templates"
  ON reward_templates FOR SELECT
  USING (TRUE);

-- Insert popular reward templates
INSERT INTO reward_templates (name, description, category, suggested_points, icon, age_appropriate, popularity, tags) VALUES
  ('Screen Time Bonus', 'Extra 30 minutes of TV, tablet, or gaming', 'Screen Time', 50, '📱', ARRAY['kid', 'teen'], 95, ARRAY['screen time', 'tv', 'gaming', 'digital']),
  ('Special Treat', 'Favorite snack or dessert', 'Food & Treats', 40, '🍪', ARRAY['kid', 'teen'], 92, ARRAY['food', 'snack', 'dessert', 'treat']),
  ('Allowance Bonus', 'Extra pocket money ($5-10)', 'Money', 100, '💵', ARRAY['teen'], 88, ARRAY['money', 'allowance', 'cash']),
  ('Late Bedtime', 'Stay up 1 hour past bedtime', 'Privileges', 100, '🌙', ARRAY['kid', 'teen'], 90, ARRAY['bedtime', 'sleep', 'privilege']),
  ('Choose Dinner', 'Pick what family eats for dinner', 'Privileges', 60, '🍽️', ARRAY['kid', 'teen'], 85, ARRAY['food', 'dinner', 'choice']),
  ('Park Trip', 'Special trip to the park or playground', 'Outings', 150, '🎡', ARRAY['kid'], 80, ARRAY['outing', 'park', 'outdoor', 'play']),
  ('Book Purchase', 'Buy a new book of your choice', 'Items', 120, '📚', ARRAY['kid', 'teen'], 75, ARRAY['book', 'reading', 'purchase']),
  ('Art Supplies', 'New art or craft supplies', 'Items', 100, '🎨', ARRAY['kid'], 70, ARRAY['art', 'craft', 'creative', 'supplies']),
  ('Ice Cream Treat', 'Trip to favorite ice cream shop', 'Food & Treats', 75, '🍦', ARRAY['kid', 'teen'], 88, ARRAY['ice cream', 'treat', 'outing']),
  ('Movie Night Choice', 'Pick the movie for family movie night', 'Privileges', 60, '🎬', ARRAY['kid', 'teen'], 82, ARRAY['movie', 'choice', 'family']),
  ('Skip One Chore', 'Skip one assigned chore (one-time use)', 'Privileges', 80, '⏭️', ARRAY['kid', 'teen'], 78, ARRAY['chore', 'skip', 'privilege']),
  ('Small Toy', 'Small toy or item up to $10', 'Items', 150, '🎁', ARRAY['kid'], 76, ARRAY['toy', 'gift', 'purchase']),
  ('Friend Sleepover', 'Have a friend sleep over', 'Social', 200, '🛏️', ARRAY['kid', 'teen'], 72, ARRAY['sleepover', 'friend', 'social']),
  ('Game Download', 'Download one new game or app', 'Digital', 120, '🎮', ARRAY['teen'], 74, ARRAY['game', 'app', 'download', 'digital']),
  ('Extra Hour Gaming', '1 hour of extra video game time', 'Screen Time', 60, '🕹️', ARRAY['kid', 'teen'], 86, ARRAY['gaming', 'video game', 'screen time']),
  ('Pizza Night', 'Order pizza for dinner', 'Food & Treats', 120, '🍕', ARRAY['kid', 'teen'], 84, ARRAY['pizza', 'food', 'dinner']),
  ('Movie Theater Trip', 'Go see a movie at the theater', 'Outings', 250, '🎥', ARRAY['kid', 'teen'], 80, ARRAY['movie', 'theater', 'outing']),
  ('Skip Homework Pass', 'Skip one homework assignment (with teacher approval)', 'Privileges', 150, '📝', ARRAY['kid', 'teen'], 65, ARRAY['homework', 'school', 'privilege']),
  ('Nail Polish/Makeup', 'New nail polish or makeup item', 'Items', 80, '💅', ARRAY['teen'], 68, ARRAY['makeup', 'beauty', 'personal care']),
  ('Sports Equipment', 'New sports gear or equipment', 'Items', 180, '⚽', ARRAY['kid', 'teen'], 70, ARRAY['sports', 'equipment', 'outdoor'])
ON CONFLICT DO NOTHING;

-- Add comments
COMMENT ON TABLE rewards IS 'Custom rewards created by families';
COMMENT ON TABLE reward_redemptions IS 'Reward redemption requests and history';
COMMENT ON TABLE reward_templates IS 'Pre-populated reward ideas and templates';

COMMENT ON COLUMN rewards.stock_quantity IS 'Available quantity. NULL means unlimited';
COMMENT ON COLUMN rewards.max_per_month IS 'Maximum redemptions per user per month. NULL means unlimited';
COMMENT ON COLUMN rewards.age_restriction IS 'Array of allowed age groups: kid, teen, adult';
