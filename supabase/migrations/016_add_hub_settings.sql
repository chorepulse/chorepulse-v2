-- Add hub_settings column to organizations table
-- Stores JSON configuration for hub display preferences

ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS hub_settings JSONB DEFAULT NULL;

-- Add a comment to document the column
COMMENT ON COLUMN organizations.hub_settings IS 'Hub display settings (showTodayTasks, showLeaderboard, theme, etc.)';
