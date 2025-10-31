-- Flexible Frequency System
-- Support for complex recurring patterns like Google Calendar
-- Examples: Every X days, 2nd Tuesday of month, weekdays only, etc.

-- Add new columns to tasks table for flexible frequency
ALTER TABLE tasks
  ADD COLUMN recurrence_pattern JSONB,
  ADD COLUMN recurrence_interval INTEGER,
  ADD COLUMN recurrence_day_of_week INTEGER,
  ADD COLUMN recurrence_week_of_month INTEGER,
  ADD COLUMN recurrence_day_of_month INTEGER,
  ADD COLUMN recurrence_end_date DATE,
  ADD COLUMN recurrence_count INTEGER;

-- Update frequency enum to include 'custom' for flexible patterns
COMMENT ON COLUMN tasks.frequency IS 'Task frequency: one-time, daily, weekly, monthly, custom';
COMMENT ON COLUMN tasks.recurrence_pattern IS 'JSON pattern for complex recurrence rules (e.g., {"type": "interval", "unit": "days", "value": 3})';
COMMENT ON COLUMN tasks.recurrence_interval IS 'Interval for recurring tasks (e.g., every 3 days)';
COMMENT ON COLUMN tasks.recurrence_day_of_week IS 'Day of week (0=Sunday, 1=Monday, etc.) for weekly tasks';
COMMENT ON COLUMN tasks.recurrence_week_of_month IS 'Week of month (1-5) for monthly tasks (e.g., 2nd Tuesday)';
COMMENT ON COLUMN tasks.recurrence_day_of_month IS 'Day of month (1-31) for monthly tasks';
COMMENT ON COLUMN tasks.recurrence_end_date IS 'Optional end date for recurring tasks';
COMMENT ON COLUMN tasks.recurrence_count IS 'Optional max number of occurrences';

-- Create helper function to generate next occurrence date
CREATE OR REPLACE FUNCTION calculate_next_occurrence(
  task_frequency task_frequency,
  last_completed_at TIMESTAMP WITH TIME ZONE,
  recurrence_interval INTEGER DEFAULT NULL,
  recurrence_day_of_week INTEGER DEFAULT NULL,
  recurrence_week_of_month INTEGER DEFAULT NULL,
  recurrence_day_of_month INTEGER DEFAULT NULL
)
RETURNS TIMESTAMP WITH TIME ZONE
LANGUAGE plpgsql
AS $$
DECLARE
  next_date TIMESTAMP WITH TIME ZONE;
BEGIN
  CASE task_frequency
    WHEN 'one-time' THEN
      RETURN NULL; -- One-time tasks don't recur

    WHEN 'daily' THEN
      -- Every N days (default 1)
      next_date := last_completed_at + INTERVAL '1 day' * COALESCE(recurrence_interval, 1);
      RETURN next_date;

    WHEN 'weekly' THEN
      -- Every N weeks on specific day(s)
      IF recurrence_day_of_week IS NOT NULL THEN
        -- Move to next occurrence of that day of week
        next_date := last_completed_at + INTERVAL '1 week' * COALESCE(recurrence_interval, 1);
        -- Adjust to correct day of week
        next_date := next_date + (recurrence_day_of_week - EXTRACT(DOW FROM next_date)::INTEGER) * INTERVAL '1 day';
      ELSE
        next_date := last_completed_at + INTERVAL '1 week' * COALESCE(recurrence_interval, 1);
      END IF;
      RETURN next_date;

    WHEN 'monthly' THEN
      -- Every N months on specific day or week
      IF recurrence_day_of_month IS NOT NULL THEN
        -- Specific day of month (e.g., 15th)
        next_date := (last_completed_at + INTERVAL '1 month' * COALESCE(recurrence_interval, 1))::DATE;
        next_date := DATE_TRUNC('month', next_date) + (recurrence_day_of_month - 1) * INTERVAL '1 day';
      ELSIF recurrence_week_of_month IS NOT NULL AND recurrence_day_of_week IS NOT NULL THEN
        -- Specific week and day (e.g., 2nd Tuesday)
        next_date := (last_completed_at + INTERVAL '1 month' * COALESCE(recurrence_interval, 1))::DATE;
        next_date := DATE_TRUNC('month', next_date);
        -- Find first occurrence of day_of_week in month
        next_date := next_date + (recurrence_day_of_week - EXTRACT(DOW FROM next_date)::INTEGER + 7) % 7 * INTERVAL '1 day';
        -- Add weeks to get to correct week of month
        next_date := next_date + (recurrence_week_of_month - 1) * INTERVAL '1 week';
      ELSE
        next_date := last_completed_at + INTERVAL '1 month' * COALESCE(recurrence_interval, 1);
      END IF;
      RETURN next_date;

    WHEN 'custom' THEN
      -- Custom patterns stored in recurrence_pattern JSONB
      -- Will be calculated in application code
      RETURN NULL;

    ELSE
      RETURN NULL;
  END CASE;
END;
$$;

COMMENT ON FUNCTION calculate_next_occurrence IS 'Calculate next occurrence date for recurring tasks based on frequency pattern';

-- Example recurrence patterns for documentation:
-- Daily patterns:
--   Every day: frequency='daily', recurrence_interval=1
--   Every 3 days: frequency='daily', recurrence_interval=3
--
-- Weekly patterns:
--   Every week on Monday: frequency='weekly', recurrence_day_of_week=1, recurrence_interval=1
--   Every 2 weeks on Friday: frequency='weekly', recurrence_day_of_week=5, recurrence_interval=2
--   Multiple days: Use separate task instances or custom pattern
--
-- Monthly patterns:
--   Every month on 15th: frequency='monthly', recurrence_day_of_month=15
--   Every 2 months on last day: frequency='monthly', recurrence_interval=2, recurrence_day_of_month=31
--   2nd Tuesday of every month: frequency='monthly', recurrence_week_of_month=2, recurrence_day_of_week=2
--   Last Friday of month: frequency='monthly', recurrence_week_of_month=5, recurrence_day_of_week=5
--
-- Custom patterns (stored in recurrence_pattern JSONB):
--   Weekdays only: {"type": "weekdays"}
--   Weekends only: {"type": "weekends"}
--   Specific days: {"type": "specific_days", "days": [1, 3, 5]} (Mon, Wed, Fri)
--   Every X days from start: {"type": "interval", "unit": "days", "value": 7, "start_date": "2025-01-01"}
