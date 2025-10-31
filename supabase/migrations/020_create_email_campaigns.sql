-- Email Campaigns System Migration
-- This migration creates tables for managing email campaigns, preferences, and tracking

-- ==============================================
-- EMAIL PREFERENCES TABLE
-- ==============================================
-- Stores user email preferences and opt-in/opt-out settings
CREATE TABLE IF NOT EXISTS email_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,

  -- Opt-in preferences
  welcome_emails BOOLEAN DEFAULT true,
  weekly_reports BOOLEAN DEFAULT true,
  tips_and_encouragement BOOLEAN DEFAULT true,
  achievements_notifications BOOLEAN DEFAULT true,
  streak_reminders BOOLEAN DEFAULT true,
  referral_emails BOOLEAN DEFAULT true,

  -- Marketing preferences
  product_updates BOOLEAN DEFAULT false,
  surveys BOOLEAN DEFAULT false,

  -- Unsubscribe tracking
  unsubscribed_all BOOLEAN DEFAULT false,
  unsubscribe_token VARCHAR(255) UNIQUE NOT NULL,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_user_email_pref UNIQUE(user_id)
);

-- Index for fast lookups
CREATE INDEX idx_email_preferences_user_id ON email_preferences(user_id);
CREATE INDEX idx_email_preferences_email ON email_preferences(email);
CREATE INDEX idx_email_preferences_unsubscribe_token ON email_preferences(unsubscribe_token);

-- ==============================================
-- EMAIL CAMPAIGNS TABLE
-- ==============================================
-- Defines email campaign types and templates
CREATE TABLE IF NOT EXISTS email_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Campaign details
  name VARCHAR(255) NOT NULL,
  campaign_type VARCHAR(50) NOT NULL, -- 'welcome_sequence', 'weekly_report', 'tips', 'referral', etc.
  subject_template TEXT NOT NULL,

  -- Scheduling
  trigger_type VARCHAR(50) NOT NULL, -- 'immediate', 'scheduled', 'event_based', 'recurring'
  trigger_event VARCHAR(100), -- 'user_signup', 'task_completed', 'streak_milestone', etc.
  schedule_cron VARCHAR(100), -- For recurring emails (e.g., '0 9 * * MON' for Monday 9am)
  days_after_trigger INT DEFAULT 0, -- For welcome sequences (e.g., send 3 days after signup)

  -- Content
  html_template TEXT NOT NULL,
  text_template TEXT,

  -- Targeting
  target_roles TEXT[], -- ['parent', 'teen'] etc., null = all roles
  requires_subscription_tier VARCHAR(50), -- 'free', 'pro', 'premium', null = all tiers

  -- Status
  is_active BOOLEAN DEFAULT true,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT valid_campaign_type CHECK (campaign_type IN (
    'welcome_sequence',
    'weekly_report',
    'tips_and_encouragement',
    'achievement_celebration',
    'streak_reminder',
    'referral_prompt',
    'product_update',
    'survey'
  )),

  CONSTRAINT valid_trigger_type CHECK (trigger_type IN (
    'immediate',
    'scheduled',
    'event_based',
    'recurring'
  ))
);

-- Index for fast campaign lookups
CREATE INDEX idx_email_campaigns_type ON email_campaigns(campaign_type);
CREATE INDEX idx_email_campaigns_trigger_type ON email_campaigns(trigger_type);
CREATE INDEX idx_email_campaigns_active ON email_campaigns(is_active);

-- ==============================================
-- EMAIL SEND HISTORY TABLE
-- ==============================================
-- Tracks all sent emails for analytics and preventing duplicates
CREATE TABLE IF NOT EXISTS email_send_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Who and what
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES email_campaigns(id) ON DELETE SET NULL,
  email VARCHAR(255) NOT NULL,

  -- Email details
  subject TEXT NOT NULL,
  campaign_type VARCHAR(50) NOT NULL,

  -- Delivery status
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'sent', 'failed', 'bounced'
  sent_at TIMESTAMPTZ,
  error_message TEXT,

  -- Engagement tracking (if available from email provider)
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  unsubscribed_at TIMESTAMPTZ,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT valid_send_status CHECK (status IN (
    'pending',
    'sent',
    'failed',
    'bounced'
  ))
);

-- Indexes for analytics and lookups
CREATE INDEX idx_email_send_history_user_id ON email_send_history(user_id);
CREATE INDEX idx_email_send_history_campaign_id ON email_send_history(campaign_id);
CREATE INDEX idx_email_send_history_campaign_type ON email_send_history(campaign_type);
CREATE INDEX idx_email_send_history_status ON email_send_history(status);
CREATE INDEX idx_email_send_history_sent_at ON email_send_history(sent_at);

-- ==============================================
-- EMAIL QUEUE TABLE
-- ==============================================
-- Queue for scheduling and batching email sends
CREATE TABLE IF NOT EXISTS email_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Target user
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  campaign_id UUID NOT NULL REFERENCES email_campaigns(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,

  -- Scheduling
  scheduled_for TIMESTAMPTZ DEFAULT NOW(),
  priority INT DEFAULT 5, -- 1-10, higher = more urgent

  -- Status
  status VARCHAR(50) DEFAULT 'queued', -- 'queued', 'processing', 'sent', 'failed', 'cancelled'
  attempts INT DEFAULT 0,
  max_attempts INT DEFAULT 3,

  -- Processing
  processed_at TIMESTAMPTZ,
  error_message TEXT,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT valid_queue_status CHECK (status IN (
    'queued',
    'processing',
    'sent',
    'failed',
    'cancelled'
  ))
);

-- Indexes for queue processing
CREATE INDEX idx_email_queue_status ON email_queue(status);
CREATE INDEX idx_email_queue_scheduled_for ON email_queue(scheduled_for);
CREATE INDEX idx_email_queue_priority ON email_queue(priority DESC);
CREATE INDEX idx_email_queue_user_id ON email_queue(user_id);

-- ==============================================
-- HELPER FUNCTIONS
-- ==============================================

-- Function to generate unsubscribe token
CREATE OR REPLACE FUNCTION generate_unsubscribe_token()
RETURNS VARCHAR(255) AS $$
BEGIN
  RETURN encode(gen_random_bytes(32), 'hex');
END;
$$ LANGUAGE plpgsql;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER update_email_preferences_updated_at
BEFORE UPDATE ON email_preferences
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_campaigns_updated_at
BEFORE UPDATE ON email_campaigns
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ==============================================
-- ROW LEVEL SECURITY (RLS)
-- ==============================================

-- Enable RLS
ALTER TABLE email_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_send_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_queue ENABLE ROW LEVEL SECURITY;

-- Email Preferences: Users can only view/update their own preferences
CREATE POLICY "Users can view own email preferences"
ON email_preferences FOR SELECT
TO authenticated
USING (auth.uid() IN (SELECT auth_user_id FROM users WHERE users.id = user_id));

CREATE POLICY "Users can update own email preferences"
ON email_preferences FOR UPDATE
TO authenticated
USING (auth.uid() IN (SELECT auth_user_id FROM users WHERE users.id = user_id));

-- Email Campaigns: Read-only for all authenticated users
CREATE POLICY "Authenticated users can view active campaigns"
ON email_campaigns FOR SELECT
TO authenticated
USING (is_active = true);

-- Email Send History: Users can view their own history
CREATE POLICY "Users can view own email history"
ON email_send_history FOR SELECT
TO authenticated
USING (auth.uid() IN (SELECT auth_user_id FROM users WHERE users.id = user_id));

-- Email Queue: Service role only (backend processes)
CREATE POLICY "Service role can manage email queue"
ON email_queue FOR ALL
TO service_role
USING (true);

-- ==============================================
-- DEFAULT EMAIL PREFERENCES FOR EXISTING USERS
-- ==============================================

-- Create default email preferences for all existing users who don't have them
INSERT INTO email_preferences (user_id, email, unsubscribe_token)
SELECT
  u.id,
  COALESCE(u.email, 'noemail+' || u.id::text || '@chorepulse.com'),
  generate_unsubscribe_token()
FROM users u
WHERE u.id NOT IN (SELECT user_id FROM email_preferences)
AND u.role IN ('parent', 'admin'); -- Only parents/admins get marketing emails

-- ==============================================
-- COMMENTS FOR DOCUMENTATION
-- ==============================================

COMMENT ON TABLE email_preferences IS 'Stores user email preferences and opt-in/opt-out settings';
COMMENT ON TABLE email_campaigns IS 'Defines email campaign types, templates, and scheduling rules';
COMMENT ON TABLE email_send_history IS 'Tracks all sent emails for analytics and preventing duplicates';
COMMENT ON TABLE email_queue IS 'Queue for scheduling and batching email sends';

COMMENT ON COLUMN email_preferences.unsubscribe_token IS 'Unique token for one-click unsubscribe links';
COMMENT ON COLUMN email_campaigns.schedule_cron IS 'Cron expression for recurring emails (e.g., "0 9 * * MON")';
COMMENT ON COLUMN email_campaigns.days_after_trigger IS 'For welcome sequences - days to wait after trigger event';
COMMENT ON COLUMN email_queue.priority IS 'Priority level 1-10, higher = more urgent';
