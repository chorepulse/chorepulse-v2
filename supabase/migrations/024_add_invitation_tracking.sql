-- Add invitation tracking columns to users table
-- This allows adult family members to receive email invitations and complete their account setup

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS invitation_token TEXT,
  ADD COLUMN IF NOT EXISTS invitation_token_expiry TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS invitation_status TEXT CHECK (invitation_status IN ('pending', 'accepted', 'expired'));

-- Add index for faster token lookups
CREATE INDEX IF NOT EXISTS idx_users_invitation_token ON users(invitation_token) WHERE invitation_token IS NOT NULL;

-- Add index for invitation status
CREATE INDEX IF NOT EXISTS idx_users_invitation_status ON users(invitation_status) WHERE invitation_status IS NOT NULL;

-- Comment on columns
COMMENT ON COLUMN users.invitation_token IS 'Secure token for family member invitations (expires in 7 days)';
COMMENT ON COLUMN users.invitation_token_expiry IS 'When the invitation token expires';
COMMENT ON COLUMN users.invitation_status IS 'Status of the invitation: pending, accepted, or expired';
