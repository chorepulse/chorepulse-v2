-- Achievements System Migration
-- Creates tables for achievement tracking and user progress

-- Clean up any existing tables
DROP TABLE IF EXISTS user_achievements CASCADE;
DROP TABLE IF EXISTS achievement_definitions CASCADE;
DROP TABLE IF EXISTS user_milestones CASCADE;

-- Achievement Definitions Table
-- Stores all available achievements and their requirements
CREATE TABLE achievement_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR(100) UNIQUE NOT NULL, -- Unique identifier like 'first_task', 'streak_7'
  name VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  icon VARCHAR(10) DEFAULT '🏆',
  category VARCHAR(50) NOT NULL CHECK (category IN ('task', 'streak', 'points', 'team', 'special')),
  tier VARCHAR(50) NOT NULL CHECK (tier IN ('bronze', 'silver', 'gold', 'platinum')),
  max_progress INTEGER NOT NULL, -- Target number to complete (e.g., 50 tasks, 7 days streak)
  points_reward INTEGER NOT NULL DEFAULT 0, -- Points awarded when unlocked
  is_active BOOLEAN DEFAULT TRUE, -- Can be disabled without deleting
  sort_order INTEGER DEFAULT 0, -- For display ordering
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Achievements Table
-- Tracks individual user progress and unlocks
CREATE TABLE user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES achievement_definitions(id) ON DELETE CASCADE,
  progress INTEGER DEFAULT 0, -- Current progress toward goal
  is_unlocked BOOLEAN DEFAULT FALSE,
  unlocked_at TIMESTAMPTZ,
  notified BOOLEAN DEFAULT FALSE, -- Whether user has been notified of unlock
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Unique constraint: one progress record per user per achievement
  UNIQUE(user_id, achievement_id)
);

-- User Milestones Table
-- Tracks significant events and celebrations (achievements, streaks, goals)
CREATE TABLE user_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  icon VARCHAR(10) DEFAULT '🎯',
  milestone_type VARCHAR(50) NOT NULL CHECK (milestone_type IN ('achievement', 'streak', 'goal', 'special')),
  reference_id UUID, -- Optional: link to achievement_id or other entity
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_user_achievements_user ON user_achievements(user_id);
CREATE INDEX idx_user_achievements_unlocked ON user_achievements(user_id, is_unlocked);
CREATE INDEX idx_user_milestones_user ON user_milestones(user_id);
CREATE INDEX idx_user_milestones_created ON user_milestones(created_at DESC);
CREATE INDEX idx_achievement_definitions_active ON achievement_definitions(is_active);
CREATE INDEX idx_achievement_definitions_category ON achievement_definitions(category);

-- RLS Policies for user_achievements
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

-- Users can view their own achievements
CREATE POLICY user_achievements_select_own ON user_achievements
  FOR SELECT
  USING (
    user_id IN (
      SELECT id FROM users WHERE auth_user_id = auth.uid()
    )
  );

-- System can insert/update achievements (handled by functions/triggers)
CREATE POLICY user_achievements_insert_system ON user_achievements
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY user_achievements_update_system ON user_achievements
  FOR UPDATE
  USING (true);

-- RLS Policies for user_milestones
ALTER TABLE user_milestones ENABLE ROW LEVEL SECURITY;

-- Users can view their own milestones
CREATE POLICY user_milestones_select_own ON user_milestones
  FOR SELECT
  USING (
    user_id IN (
      SELECT id FROM users WHERE auth_user_id = auth.uid()
    )
  );

-- System can insert milestones
CREATE POLICY user_milestones_insert_system ON user_milestones
  FOR INSERT
  WITH CHECK (true);

-- RLS Policies for achievement_definitions (public read)
ALTER TABLE achievement_definitions ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read achievement definitions
CREATE POLICY achievement_definitions_select_all ON achievement_definitions
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Function to check and unlock achievements for a user
CREATE OR REPLACE FUNCTION check_and_unlock_achievement(
  p_user_id UUID,
  p_achievement_key VARCHAR(100)
) RETURNS BOOLEAN AS $$
DECLARE
  v_achievement_id UUID;
  v_user_achievement_id UUID;
  v_is_unlocked BOOLEAN;
  v_points_reward INTEGER;
  v_achievement_name VARCHAR(255);
BEGIN
  -- Get achievement definition
  SELECT id, points_reward, name
  INTO v_achievement_id, v_points_reward, v_achievement_name
  FROM achievement_definitions
  WHERE key = p_achievement_key AND is_active = TRUE;

  IF v_achievement_id IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Get or create user achievement record
  INSERT INTO user_achievements (user_id, achievement_id, progress)
  VALUES (p_user_id, v_achievement_id, 0)
  ON CONFLICT (user_id, achievement_id) DO NOTHING
  RETURNING id, is_unlocked INTO v_user_achievement_id, v_is_unlocked;

  -- If already unlocked, return
  IF v_is_unlocked THEN
    RETURN TRUE;
  END IF;

  -- Get the record if it already existed
  IF v_user_achievement_id IS NULL THEN
    SELECT id, is_unlocked
    INTO v_user_achievement_id, v_is_unlocked
    FROM user_achievements
    WHERE user_id = p_user_id AND achievement_id = v_achievement_id;
  END IF;

  RETURN v_is_unlocked;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update achievement progress
CREATE OR REPLACE FUNCTION update_achievement_progress(
  p_user_id UUID,
  p_achievement_key VARCHAR(100),
  p_new_progress INTEGER
) RETURNS BOOLEAN AS $$
DECLARE
  v_achievement RECORD;
  v_user_achievement RECORD;
  v_unlocked BOOLEAN := FALSE;
BEGIN
  -- Get achievement definition
  SELECT id, max_progress, points_reward, name, icon
  INTO v_achievement
  FROM achievement_definitions
  WHERE key = p_achievement_key AND is_active = TRUE;

  IF v_achievement.id IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Insert or update user achievement
  INSERT INTO user_achievements (user_id, achievement_id, progress, updated_at)
  VALUES (p_user_id, v_achievement.id, p_new_progress, NOW())
  ON CONFLICT (user_id, achievement_id)
  DO UPDATE SET
    progress = GREATEST(user_achievements.progress, p_new_progress),
    updated_at = NOW()
  RETURNING * INTO v_user_achievement;

  -- Check if should be unlocked
  IF NOT v_user_achievement.is_unlocked AND v_user_achievement.progress >= v_achievement.max_progress THEN
    -- Unlock the achievement
    UPDATE user_achievements
    SET
      is_unlocked = TRUE,
      unlocked_at = NOW(),
      progress = v_achievement.max_progress,
      notified = FALSE
    WHERE id = v_user_achievement.id;

    -- Award points
    UPDATE users
    SET points = points + v_achievement.points_reward
    WHERE id = p_user_id;

    -- Create milestone
    INSERT INTO user_milestones (user_id, title, description, icon, milestone_type, reference_id)
    VALUES (
      p_user_id,
      v_achievement.name || ' Unlocked',
      'Achievement unlocked!',
      v_achievement.icon,
      'achievement',
      v_achievement.id
    );

    v_unlocked := TRUE;
  END IF;

  RETURN v_unlocked;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert Achievement Definitions
INSERT INTO achievement_definitions (key, name, description, icon, category, tier, max_progress, points_reward, sort_order) VALUES
  -- Task Achievements (1-10)
  ('first_task', 'First Steps', 'Complete your first task', '🎯', 'task', 'bronze', 1, 10, 1),
  ('tasks_10', 'Getting Started', 'Complete 10 tasks', '⭐', 'task', 'bronze', 10, 25, 2),
  ('tasks_25', 'Task Enthusiast', 'Complete 25 tasks', '🌟', 'task', 'silver', 25, 50, 3),
  ('tasks_50', 'Task Master', 'Complete 50 tasks', '💫', 'task', 'silver', 50, 75, 4),
  ('tasks_100', 'Task Legend', 'Complete 100 tasks', '🏆', 'task', 'gold', 100, 150, 5),
  ('tasks_250', 'Task Elite', 'Complete 250 tasks', '🎖️', 'task', 'gold', 250, 250, 6),
  ('tasks_500', 'Task Champion', 'Complete 500 tasks', '👑', 'task', 'platinum', 500, 500, 7),

  -- Streak Achievements (11-20)
  ('streak_3', 'Consistency', 'Maintain a 3-day streak', '🔥', 'streak', 'bronze', 3, 15, 11),
  ('streak_7', 'Dedicated', 'Maintain a 7-day streak', '💪', 'streak', 'silver', 7, 50, 12),
  ('streak_14', 'Committed', 'Maintain a 14-day streak', '✨', 'streak', 'silver', 14, 100, 13),
  ('streak_30', 'Unstoppable', 'Maintain a 30-day streak', '🚀', 'streak', 'gold', 30, 200, 14),
  ('streak_60', 'Relentless', 'Maintain a 60-day streak', '⚡', 'streak', 'gold', 60, 350, 15),
  ('streak_100', 'Iron Will', 'Maintain a 100-day streak', '💎', 'streak', 'platinum', 100, 750, 16),

  -- Points Achievements (21-30)
  ('points_100', 'Point Collector', 'Earn 100 total points', '💰', 'points', 'bronze', 100, 20, 21),
  ('points_250', 'Point Enthusiast', 'Earn 250 total points', '💵', 'points', 'bronze', 250, 40, 22),
  ('points_500', 'Point Hoarder', 'Earn 500 total points', '💸', 'points', 'silver', 500, 75, 23),
  ('points_1000', 'Point Tycoon', 'Earn 1,000 total points', '🤑', 'points', 'gold', 1000, 200, 24),
  ('points_2500', 'Point Mogul', 'Earn 2,500 total points', '💎', 'points', 'gold', 2500, 400, 25),
  ('points_5000', 'Point Legend', 'Earn 5,000 total points', '👑', 'points', 'platinum', 5000, 1000, 26),

  -- Team Achievements (31-40)
  ('team_10', 'Team Player', 'Complete 10 family tasks', '🤝', 'team', 'bronze', 10, 25, 31),
  ('team_25', 'Family Helper', 'Complete 25 family tasks', '👨‍👩‍👧', 'team', 'silver', 25, 60, 32),
  ('team_50', 'Family Champion', 'Complete 50 family tasks', '👨‍👩‍👧‍👦', 'team', 'silver', 50, 125, 33),
  ('team_100', 'Family Hero', 'Complete 100 family tasks', '🦸', 'team', 'gold', 100, 250, 34),
  ('unity_7', 'Unity Master', 'Entire family completes all tasks for 7 days straight', '🌟', 'team', 'gold', 7, 300, 35),

  -- Special Achievements (41-50)
  ('early_bird_10', 'Early Bird', 'Complete 10 tasks before 8 AM', '🌅', 'special', 'silver', 10, 50, 41),
  ('night_owl_10', 'Night Owl', 'Complete 10 tasks after 8 PM', '🦉', 'special', 'silver', 10, 50, 42),
  ('perfect_week', 'Perfect Week', 'Complete all assigned tasks for a full week', '💯', 'special', 'gold', 1, 150, 43),
  ('helping_hand', 'Helping Hand', 'Help a family member with their task 5 times', '🙏', 'special', 'bronze', 5, 30, 44),
  ('speed_demon', 'Speed Demon', 'Complete 10 tasks within 5 minutes of assignment', '⚡', 'special', 'silver', 10, 75, 45),
  ('weekend_warrior', 'Weekend Warrior', 'Complete 25 tasks on weekends', '🏖️', 'special', 'silver', 25, 60, 46),
  ('month_champion', 'Month Champion', 'Complete all tasks for an entire month', '📅', 'special', 'platinum', 1, 500, 47);
