-- Secure function for PIN login: lookup organization and members by family code
-- This function can be called anonymously but only returns minimal data needed for PIN login
-- and doesn't expose sensitive organization information

CREATE OR REPLACE FUNCTION public.lookup_family_by_code(family_code TEXT)
RETURNS TABLE (
  organization_id UUID,
  organization_name TEXT,
  member_id UUID,
  member_name TEXT,
  member_username TEXT,
  member_avatar TEXT
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    o.id AS organization_id,
    o.name AS organization_name,
    u.id AS member_id,
    u.name AS member_name,
    u.username AS member_username,
    u.avatar AS member_avatar
  FROM organizations o
  INNER JOIN users u ON u.organization_id = o.id
  WHERE o.current_family_code = UPPER(family_code)
  ORDER BY u.name;
END;
$$;

-- Grant execute permission to anonymous users (for PIN login)
GRANT EXECUTE ON FUNCTION public.lookup_family_by_code(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.lookup_family_by_code(TEXT) TO authenticated;

-- Create a function to verify PIN and return auth info
CREATE OR REPLACE FUNCTION public.verify_pin_login(
  user_id_param UUID,
  pin_param TEXT
)
RETURNS TABLE (
  auth_user_id UUID,
  pin_valid BOOLEAN
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    u.auth_user_id,
    (u.pin_hash = pin_param) AS pin_valid
  FROM users u
  WHERE u.id = user_id_param;
END;
$$;

-- Grant execute permission to anonymous users (for PIN login)
GRANT EXECUTE ON FUNCTION public.verify_pin_login(UUID, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.verify_pin_login(UUID, TEXT) TO authenticated;
