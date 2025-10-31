-- Add claim-related fields to task_assignments table
ALTER TABLE task_assignments
ADD COLUMN IF NOT EXISTS is_claimed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS claimed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS claim_expires_at TIMESTAMPTZ;

-- Add index for querying active claims
CREATE INDEX IF NOT EXISTS idx_task_assignments_active_claims
ON task_assignments(task_id, claim_expires_at)
WHERE is_claimed = TRUE AND claim_expires_at IS NOT NULL;

-- Add comment explaining the claim system
COMMENT ON COLUMN task_assignments.is_claimed IS 'True if this is a temporary claim on an Extra Credit task (expires in 24 hours)';
COMMENT ON COLUMN task_assignments.claimed_at IS 'When the task was claimed by the user';
COMMENT ON COLUMN task_assignments.claim_expires_at IS 'When the claim expires and task returns to Extra Credit pool';
