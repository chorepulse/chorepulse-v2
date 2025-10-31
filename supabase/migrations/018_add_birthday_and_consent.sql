-- ============================================================================
-- Migration: Add Birthday and Parental Consent Fields
-- Purpose: Enable age-based ad targeting and COPPA compliance
-- Created: 2025-10-26
-- ============================================================================

-- Add birthday field to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS birthday DATE NULL;

-- Add parental consent timestamp for child accounts
ALTER TABLE users
ADD COLUMN IF NOT EXISTS parent_consent_given_at TIMESTAMPTZ NULL;

-- Add comment explaining the fields
COMMENT ON COLUMN users.birthday IS 'User birthday for age-based features and ad targeting (optional, COPPA-compliant)';
COMMENT ON COLUMN users.parent_consent_given_at IS 'Timestamp when parent gave consent to collect child data (for COPPA compliance)';

-- Create index for age-based queries (optional, for analytics)
CREATE INDEX IF NOT EXISTS idx_users_birthday ON users(birthday) WHERE birthday IS NOT NULL;

-- Create function to calculate age from birthday
CREATE OR REPLACE FUNCTION get_user_age(birth_date DATE)
RETURNS INTEGER
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  IF birth_date IS NULL THEN
    RETURN NULL;
  END IF;

  RETURN DATE_PART('year', AGE(birth_date));
END;
$$;

-- Create function to get age bracket for ad targeting
CREATE OR REPLACE FUNCTION get_age_bracket(birth_date DATE)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  age INTEGER;
BEGIN
  IF birth_date IS NULL THEN
    RETURN NULL;
  END IF;

  age := get_user_age(birth_date);

  -- Return age bracket for ad targeting
  IF age < 13 THEN
    RETURN 'under_13';
  ELSIF age >= 13 AND age <= 17 THEN
    RETURN '13_17';
  ELSIF age >= 18 AND age <= 24 THEN
    RETURN '18_24';
  ELSIF age >= 25 AND age <= 34 THEN
    RETURN '25_34';
  ELSIF age >= 35 AND age <= 44 THEN
    RETURN '35_44';
  ELSE
    RETURN '45_plus';
  END IF;
END;
$$;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION get_user_age(DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION get_age_bracket(DATE) TO authenticated;

-- Add helpful comments
COMMENT ON FUNCTION get_user_age IS 'Calculate user age from birthday';
COMMENT ON FUNCTION get_age_bracket IS 'Get age bracket for ad targeting (under_13, 13_17, 18_24, 25_34, 35_44, 45_plus)';
