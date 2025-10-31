-- Achievement Tracking System
-- Automatically updates achievement progress when tasks are completed

-- Function to track task-based achievements
CREATE OR REPLACE FUNCTION track_task_achievements()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id UUID;
  v_task_count INTEGER;
  v_hour INTEGER;
BEGIN
  -- Only process when task is marked as completed
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    v_user_id := NEW.completed_by;

    IF v_user_id IS NULL THEN
      RETURN NEW;
    END IF;

    -- Count total completed tasks for this user
    SELECT COUNT(*)
    INTO v_task_count
    FROM task_completions
    WHERE completed_by = v_user_id AND status = 'completed';

    -- Update task count achievements
    PERFORM update_achievement_progress(v_user_id, 'first_task', LEAST(v_task_count, 1));
    PERFORM update_achievement_progress(v_user_id, 'tasks_10', LEAST(v_task_count, 10));
    PERFORM update_achievement_progress(v_user_id, 'tasks_25', LEAST(v_task_count, 25));
    PERFORM update_achievement_progress(v_user_id, 'tasks_50', LEAST(v_task_count, 50));
    PERFORM update_achievement_progress(v_user_id, 'tasks_100', LEAST(v_task_count, 100));
    PERFORM update_achievement_progress(v_user_id, 'tasks_250', LEAST(v_task_count, 250));
    PERFORM update_achievement_progress(v_user_id, 'tasks_500', LEAST(v_task_count, 500));

    -- Track early bird (before 8 AM)
    v_hour := EXTRACT(HOUR FROM NEW.completed_at);
    IF v_hour < 8 THEN
      SELECT COUNT(*)
      INTO v_task_count
      FROM task_completions
      WHERE completed_by = v_user_id
        AND status = 'completed'
        AND EXTRACT(HOUR FROM completed_at) < 8;

      PERFORM update_achievement_progress(v_user_id, 'early_bird_10', LEAST(v_task_count, 10));
    END IF;

    -- Track night owl (after 8 PM / 20:00)
    IF v_hour >= 20 THEN
      SELECT COUNT(*)
      INTO v_task_count
      FROM task_completions
      WHERE completed_by = v_user_id
        AND status = 'completed'
        AND EXTRACT(HOUR FROM completed_at) >= 20;

      PERFORM update_achievement_progress(v_user_id, 'night_owl_10', LEAST(v_task_count, 10));
    END IF;

    -- Track weekend warrior (completed on Saturday or Sunday)
    IF EXTRACT(DOW FROM NEW.completed_at) IN (0, 6) THEN
      SELECT COUNT(*)
      INTO v_task_count
      FROM task_completions
      WHERE completed_by = v_user_id
        AND status = 'completed'
        AND EXTRACT(DOW FROM completed_at) IN (0, 6);

      PERFORM update_achievement_progress(v_user_id, 'weekend_warrior', LEAST(v_task_count, 25));
    END IF;

    -- Track speed demon (completed within 5 minutes of assignment)
    IF NEW.completed_at - NEW.assigned_at <= INTERVAL '5 minutes' THEN
      SELECT COUNT(*)
      INTO v_task_count
      FROM task_completions
      WHERE completed_by = v_user_id
        AND status = 'completed'
        AND (completed_at - assigned_at) <= INTERVAL '5 minutes';

      PERFORM update_achievement_progress(v_user_id, 'speed_demon', LEAST(v_task_count, 10));
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on task_completions
DROP TRIGGER IF EXISTS trigger_track_task_achievements ON task_completions;
CREATE TRIGGER trigger_track_task_achievements
  AFTER INSERT OR UPDATE ON task_completions
  FOR EACH ROW
  EXECUTE FUNCTION track_task_achievements();

-- Function to track points-based achievements
CREATE OR REPLACE FUNCTION track_points_achievements()
RETURNS TRIGGER AS $$
DECLARE
  v_total_points INTEGER;
BEGIN
  -- When user points are updated
  IF NEW.points IS NOT NULL AND (OLD.points IS NULL OR NEW.points != OLD.points) THEN
    v_total_points := NEW.points;

    -- Update points achievements
    PERFORM update_achievement_progress(NEW.id, 'points_100', LEAST(v_total_points, 100));
    PERFORM update_achievement_progress(NEW.id, 'points_250', LEAST(v_total_points, 250));
    PERFORM update_achievement_progress(NEW.id, 'points_500', LEAST(v_total_points, 500));
    PERFORM update_achievement_progress(NEW.id, 'points_1000', LEAST(v_total_points, 1000));
    PERFORM update_achievement_progress(NEW.id, 'points_2500', LEAST(v_total_points, 2500));
    PERFORM update_achievement_progress(NEW.id, 'points_5000', LEAST(v_total_points, 5000));
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on users table for points
DROP TRIGGER IF EXISTS trigger_track_points_achievements ON users;
CREATE TRIGGER trigger_track_points_achievements
  AFTER UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION track_points_achievements();

-- Function to calculate and track streak achievements
CREATE OR REPLACE FUNCTION calculate_user_streak(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_streak INTEGER := 0;
  v_current_date DATE := CURRENT_DATE;
  v_check_date DATE;
  v_has_completion BOOLEAN;
BEGIN
  -- Start from yesterday and count backwards
  v_check_date := v_current_date - INTERVAL '1 day';

  LOOP
    -- Check if user has any completed tasks on this date
    SELECT EXISTS (
      SELECT 1
      FROM task_completions
      WHERE completed_by = p_user_id
        AND status = 'completed'
        AND DATE(completed_at) = v_check_date
    ) INTO v_has_completion;

    -- If no tasks completed on this day, streak ends
    EXIT WHEN NOT v_has_completion;

    -- Increment streak and check previous day
    v_streak := v_streak + 1;
    v_check_date := v_check_date - INTERVAL '1 day';

    -- Safety limit: don't check more than 365 days back
    EXIT WHEN v_streak >= 365;
  END LOOP;

  -- If user completed tasks today, add 1 to streak
  SELECT EXISTS (
    SELECT 1
    FROM task_completions
    WHERE completed_by = p_user_id
      AND status = 'completed'
      AND DATE(completed_at) = v_current_date
  ) INTO v_has_completion;

  IF v_has_completion THEN
    v_streak := v_streak + 1;
  END IF;

  RETURN v_streak;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update streak achievements (called by task completion trigger)
CREATE OR REPLACE FUNCTION update_streak_achievements(p_user_id UUID)
RETURNS VOID AS $$
DECLARE
  v_streak INTEGER;
BEGIN
  v_streak := calculate_user_streak(p_user_id);

  -- Update streak achievements
  PERFORM update_achievement_progress(p_user_id, 'streak_3', LEAST(v_streak, 3));
  PERFORM update_achievement_progress(p_user_id, 'streak_7', LEAST(v_streak, 7));
  PERFORM update_achievement_progress(p_user_id, 'streak_14', LEAST(v_streak, 14));
  PERFORM update_achievement_progress(p_user_id, 'streak_30', LEAST(v_streak, 30));
  PERFORM update_achievement_progress(p_user_id, 'streak_60', LEAST(v_streak, 60));
  PERFORM update_achievement_progress(p_user_id, 'streak_100', LEAST(v_streak, 100));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add streak tracking to task completion trigger
CREATE OR REPLACE FUNCTION track_task_achievements()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id UUID;
  v_task_count INTEGER;
  v_hour INTEGER;
BEGIN
  -- Only process when task is marked as completed
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    v_user_id := NEW.completed_by;

    IF v_user_id IS NULL THEN
      RETURN NEW;
    END IF;

    -- Count total completed tasks for this user
    SELECT COUNT(*)
    INTO v_task_count
    FROM task_completions
    WHERE completed_by = v_user_id AND status = 'completed';

    -- Update task count achievements
    PERFORM update_achievement_progress(v_user_id, 'first_task', LEAST(v_task_count, 1));
    PERFORM update_achievement_progress(v_user_id, 'tasks_10', LEAST(v_task_count, 10));
    PERFORM update_achievement_progress(v_user_id, 'tasks_25', LEAST(v_task_count, 25));
    PERFORM update_achievement_progress(v_user_id, 'tasks_50', LEAST(v_task_count, 50));
    PERFORM update_achievement_progress(v_user_id, 'tasks_100', LEAST(v_task_count, 100));
    PERFORM update_achievement_progress(v_user_id, 'tasks_250', LEAST(v_task_count, 250));
    PERFORM update_achievement_progress(v_user_id, 'tasks_500', LEAST(v_task_count, 500));

    -- Update streak achievements
    PERFORM update_streak_achievements(v_user_id);

    -- Track early bird (before 8 AM)
    v_hour := EXTRACT(HOUR FROM NEW.completed_at);
    IF v_hour < 8 THEN
      SELECT COUNT(*)
      INTO v_task_count
      FROM task_completions
      WHERE completed_by = v_user_id
        AND status = 'completed'
        AND EXTRACT(HOUR FROM completed_at) < 8;

      PERFORM update_achievement_progress(v_user_id, 'early_bird_10', LEAST(v_task_count, 10));
    END IF;

    -- Track night owl (after 8 PM / 20:00)
    IF v_hour >= 20 THEN
      SELECT COUNT(*)
      INTO v_task_count
      FROM task_completions
      WHERE completed_by = v_user_id
        AND status = 'completed'
        AND EXTRACT(HOUR FROM completed_at) >= 20;

      PERFORM update_achievement_progress(v_user_id, 'night_owl_10', LEAST(v_task_count, 10));
    END IF;

    -- Track weekend warrior (completed on Saturday or Sunday)
    IF EXTRACT(DOW FROM NEW.completed_at) IN (0, 6) THEN
      SELECT COUNT(*)
      INTO v_task_count
      FROM task_completions
      WHERE completed_by = v_user_id
        AND status = 'completed'
        AND EXTRACT(DOW FROM completed_at) IN (0, 6);

      PERFORM update_achievement_progress(v_user_id, 'weekend_warrior', LEAST(v_task_count, 25));
    END IF;

    -- Track speed demon (completed within 5 minutes of assignment)
    IF NEW.completed_at - NEW.assigned_at <= INTERVAL '5 minutes' THEN
      SELECT COUNT(*)
      INTO v_task_count
      FROM task_completions
      WHERE completed_by = v_user_id
        AND status = 'completed'
        AND (completed_at - assigned_at) <= INTERVAL '5 minutes';

      PERFORM update_achievement_progress(v_user_id, 'speed_demon', LEAST(v_task_count, 10));
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
