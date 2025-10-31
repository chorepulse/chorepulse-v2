-- Fix for RLS infinite recursion in users table
-- This creates a SECURITY DEFINER function to break the recursion loop

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view users in their organization" ON users;
DROP POLICY IF EXISTS "Account owners and family managers can insert users" ON users;
DROP POLICY IF EXISTS "Account owners and family managers can update users" ON users;
DROP POLICY IF EXISTS "Only account owners can delete users" ON users;

-- Create helper function with SECURITY DEFINER to bypass RLS during check
CREATE OR REPLACE FUNCTION auth_user_organization_id()
RETURNS UUID AS $$
  SELECT organization_id FROM users
  WHERE auth_user_id = auth.uid()
  LIMIT 1;
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION auth_user_is_account_owner()
RETURNS BOOLEAN AS $$
  SELECT COALESCE(
    (SELECT is_account_owner FROM users WHERE auth_user_id = auth.uid()),
    false
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION auth_user_is_manager()
RETURNS BOOLEAN AS $$
  SELECT COALESCE(
    (SELECT (is_account_owner OR is_family_manager) FROM users WHERE auth_user_id = auth.uid()),
    false
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Recreate policies using helper functions (no recursion)
CREATE POLICY "Users can view users in their organization"
ON users FOR SELECT
USING (organization_id = auth_user_organization_id());

CREATE POLICY "Account owners and family managers can insert users"
ON users FOR INSERT
WITH CHECK (
  organization_id = auth_user_organization_id()
  AND auth_user_is_manager()
);

CREATE POLICY "Account owners and family managers can update users"
ON users FOR UPDATE
USING (
  organization_id = auth_user_organization_id()
  AND auth_user_is_manager()
);

CREATE POLICY "Only account owners can delete users"
ON users FOR DELETE
USING (
  organization_id = auth_user_organization_id()
  AND auth_user_is_account_owner()
);
