-- Fix the lookup function to handle case-insensitive family code matching
-- The original trigger generated codes with mixed case, but we want to match regardless of case

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
  WHERE UPPER(o.current_family_code) = UPPER(family_code)  -- Case-insensitive match
  ORDER BY u.name;
END;
$$;
