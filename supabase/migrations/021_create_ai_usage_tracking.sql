-- ============================================================================
-- AI Usage Tracking
-- ============================================================================
-- Track AI API usage for cost monitoring and analytics
-- Created: 2025-10-28
-- ============================================================================

-- AI usage logs table
CREATE TABLE IF NOT EXISTS ai_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- User/organization context
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

  -- API call details
  feature VARCHAR(50) NOT NULL, -- 'task_parsing', 'task_suggestions', 'meal_planning', etc.
  model VARCHAR(50) NOT NULL,

  -- Token usage
  input_tokens INTEGER NOT NULL DEFAULT 0,
  output_tokens INTEGER NOT NULL DEFAULT 0,
  total_tokens INTEGER NOT NULL DEFAULT 0,

  -- Cost (in USD)
  estimated_cost DECIMAL(10, 6) NOT NULL DEFAULT 0,

  -- Request details
  request_data JSONB, -- Store request for debugging
  response_data JSONB, -- Store response for debugging

  -- Status
  status VARCHAR(50) DEFAULT 'success', -- 'success', 'error', 'rate_limited'
  error_message TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Indexes for common queries
  CONSTRAINT valid_feature CHECK (feature IN ('task_parsing', 'task_suggestions', 'meal_planning', 'smart_insights'))
);

-- Index for user lookups
CREATE INDEX idx_ai_usage_user_id ON ai_usage_logs(user_id);

-- Index for organization lookups
CREATE INDEX idx_ai_usage_org_id ON ai_usage_logs(organization_id);

-- Index for feature analytics
CREATE INDEX idx_ai_usage_feature ON ai_usage_logs(feature);

-- Index for time-based queries
CREATE INDEX idx_ai_usage_created_at ON ai_usage_logs(created_at DESC);

-- Composite index for cost reports
CREATE INDEX idx_ai_usage_org_date ON ai_usage_logs(organization_id, created_at DESC);

-- ============================================================================
-- Row Level Security (RLS)
-- ============================================================================

ALTER TABLE ai_usage_logs ENABLE ROW LEVEL SECURITY;

-- Users can view their own AI usage
CREATE POLICY "Users can view their own AI usage"
  ON ai_usage_logs
  FOR SELECT
  USING (
    user_id IN (
      SELECT id FROM users WHERE auth_user_id = auth.uid()
    )
  );

-- Only backend (service role) can insert AI usage logs
CREATE POLICY "Service role can insert AI usage logs"
  ON ai_usage_logs
  FOR INSERT
  WITH CHECK (true);

-- ============================================================================
-- Helper Functions
-- ============================================================================

-- Get AI usage summary for a user
CREATE OR REPLACE FUNCTION get_user_ai_usage_summary(
  p_user_id UUID,
  p_days INTEGER DEFAULT 30
)
RETURNS TABLE (
  feature VARCHAR,
  request_count BIGINT,
  total_tokens BIGINT,
  total_cost DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    feature,
    COUNT(*)::BIGINT as request_count,
    SUM(total_tokens)::BIGINT as total_tokens,
    SUM(estimated_cost) as total_cost
  FROM ai_usage_logs
  WHERE user_id = p_user_id
    AND created_at > NOW() - (p_days || ' days')::INTERVAL
    AND status = 'success'
  GROUP BY feature
  ORDER BY total_cost DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get AI usage summary for an organization
CREATE OR REPLACE FUNCTION get_organization_ai_usage_summary(
  p_org_id UUID,
  p_days INTEGER DEFAULT 30
)
RETURNS TABLE (
  feature VARCHAR,
  request_count BIGINT,
  total_tokens BIGINT,
  total_cost DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    feature,
    COUNT(*)::BIGINT as request_count,
    SUM(total_tokens)::BIGINT as total_tokens,
    SUM(estimated_cost) as total_cost
  FROM ai_usage_logs
  WHERE organization_id = p_org_id
    AND created_at > NOW() - (p_days || ' days')::INTERVAL
    AND status = 'success'
  GROUP BY feature
  ORDER BY total_cost DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON TABLE ai_usage_logs IS 'Tracks OpenAI API usage for cost monitoring and analytics';
COMMENT ON COLUMN ai_usage_logs.feature IS 'AI feature being used: task_parsing, task_suggestions, meal_planning, smart_insights';
COMMENT ON COLUMN ai_usage_logs.estimated_cost IS 'Estimated cost in USD based on token usage and model pricing';
