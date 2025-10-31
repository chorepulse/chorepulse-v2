-- Create calendar_integrations table to store Google Calendar tokens and settings
CREATE TABLE IF NOT EXISTS calendar_integrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider VARCHAR(50) NOT NULL DEFAULT 'google', -- 'google', 'apple', etc.

  -- OAuth tokens (encrypted)
  access_token TEXT,
  refresh_token TEXT,
  token_expiry TIMESTAMP WITH TIME ZONE,

  -- User info
  email VARCHAR(255),
  calendar_id VARCHAR(255), -- Google Calendar ID for the created/synced calendar

  -- Sync settings
  sync_enabled BOOLEAN DEFAULT true,
  sync_tasks_to_calendar BOOLEAN DEFAULT true,
  sync_calendar_to_tasks BOOLEAN DEFAULT false,
  calendar_name VARCHAR(255) DEFAULT 'ChorePulse Tasks',

  -- Sync status
  last_sync_at TIMESTAMP WITH TIME ZONE,
  last_sync_status VARCHAR(50), -- 'success', 'error', 'pending'
  last_sync_error TEXT,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Ensure one integration per user per provider
  UNIQUE(user_id, provider)
);

-- Add RLS policies
ALTER TABLE calendar_integrations ENABLE ROW LEVEL SECURITY;

-- Users can only see their own calendar integrations
CREATE POLICY "Users can view own calendar integrations"
  ON calendar_integrations
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own calendar integrations
CREATE POLICY "Users can create own calendar integrations"
  ON calendar_integrations
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own calendar integrations
CREATE POLICY "Users can update own calendar integrations"
  ON calendar_integrations
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own calendar integrations
CREATE POLICY "Users can delete own calendar integrations"
  ON calendar_integrations
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX idx_calendar_integrations_user_provider ON calendar_integrations(user_id, provider);
CREATE INDEX idx_calendar_integrations_org ON calendar_integrations(organization_id);

-- Add updated_at trigger
CREATE TRIGGER update_calendar_integrations_updated_at
  BEFORE UPDATE ON calendar_integrations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add comments
COMMENT ON TABLE calendar_integrations IS 'Stores calendar integration tokens and sync settings for users';
COMMENT ON COLUMN calendar_integrations.access_token IS 'OAuth access token (should be encrypted in production)';
COMMENT ON COLUMN calendar_integrations.refresh_token IS 'OAuth refresh token (should be encrypted in production)';
COMMENT ON COLUMN calendar_integrations.sync_tasks_to_calendar IS 'Whether to sync ChorePulse tasks to external calendar';
COMMENT ON COLUMN calendar_integrations.sync_calendar_to_tasks IS 'Whether to import calendar events as tasks';
