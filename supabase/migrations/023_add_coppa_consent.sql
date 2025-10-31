-- ============================================================================
-- COPPA Compliance - Parental Consent Tracking
-- ============================================================================
-- Add fields to track parental consent for children under 13
-- Required by COPPA (Children's Online Privacy Protection Act)
-- Created: 2025-10-29
-- ============================================================================

-- Add consent tracking fields to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS coppa_consent_given BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS coppa_consent_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS coppa_consent_ip VARCHAR(45),
ADD COLUMN IF NOT EXISTS coppa_consent_parent_email VARCHAR(255);

-- Add index for consent queries
CREATE INDEX IF NOT EXISTS idx_users_coppa_consent ON users(coppa_consent_given, coppa_consent_date);

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON COLUMN users.coppa_consent_given IS 'Whether parental consent was given for user under 13';
COMMENT ON COLUMN users.coppa_consent_date IS 'Timestamp when parental consent was recorded';
COMMENT ON COLUMN users.coppa_consent_ip IS 'IP address from which consent was given';
COMMENT ON COLUMN users.coppa_consent_parent_email IS 'Email address of parent who gave consent';
