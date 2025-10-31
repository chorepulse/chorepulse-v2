-- Add points column to users table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'points'
  ) THEN
    ALTER TABLE users ADD COLUMN points INTEGER NOT NULL DEFAULT 0 CHECK (points >= 0);
    CREATE INDEX idx_users_points ON users(points DESC);
  END IF;
END $$;

-- Function to increment user points
CREATE OR REPLACE FUNCTION increment_user_points(
  user_id_param UUID,
  points_param INTEGER
)
RETURNS void
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE users
  SET points = points + points_param
  WHERE id = user_id_param;
END;
$$;

GRANT EXECUTE ON FUNCTION increment_user_points(UUID, INTEGER) TO authenticated;

COMMENT ON FUNCTION increment_user_points IS 'Increments a user''s points by the specified amount. Used when tasks are completed and approved.';
