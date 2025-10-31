-- Update verify_pin_login function to return the PIN hash instead of verifying it
-- This allows bcrypt verification to happen in the application layer

DROP FUNCTION IF EXISTS public.verify_pin_login(UUID, TEXT);

CREATE OR REPLACE FUNCTION public.verify_pin_login(
  user_id_param UUID
)
RETURNS TABLE (
  auth_user_id UUID,
  pin_hash TEXT
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    u.auth_user_id,
    u.pin_hash
  FROM users u
  WHERE u.id = user_id_param;
END;
$$;

GRANT EXECUTE ON FUNCTION public.verify_pin_login(UUID) TO anon;
GRANT EXECUTE ON FUNCTION public.verify_pin_login(UUID) TO authenticated;

COMMENT ON FUNCTION public.verify_pin_login IS 'Returns auth_user_id and pin_hash for a given user ID. PIN verification happens in application layer using bcrypt.';
