-- Add additional property feature fields to organizations table
-- These fields come from the RentCast API features object

-- First, add a column to track fetch count in the last 24 hours
ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS property_fetch_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS property_fetch_window_start TIMESTAMPTZ;

ALTER TABLE organizations
  -- Architecture and structure
  ADD COLUMN IF NOT EXISTS architecture_type TEXT,
  ADD COLUMN IF NOT EXISTS floor_count INTEGER,
  ADD COLUMN IF NOT EXISTS room_count INTEGER,
  ADD COLUMN IF NOT EXISTS unit_count INTEGER,

  -- Cooling
  ADD COLUMN IF NOT EXISTS has_cooling BOOLEAN,
  ADD COLUMN IF NOT EXISTS cooling_type TEXT,

  -- Heating
  ADD COLUMN IF NOT EXISTS has_heating BOOLEAN,
  ADD COLUMN IF NOT EXISTS heating_type TEXT,

  -- Fireplace
  ADD COLUMN IF NOT EXISTS has_fireplace BOOLEAN,
  ADD COLUMN IF NOT EXISTS fireplace_type TEXT,

  -- Garage and parking
  ADD COLUMN IF NOT EXISTS has_garage BOOLEAN,
  ADD COLUMN IF NOT EXISTS garage_type TEXT,
  ADD COLUMN IF NOT EXISTS garage_spaces INTEGER,

  -- Pool
  ADD COLUMN IF NOT EXISTS has_pool BOOLEAN,
  ADD COLUMN IF NOT EXISTS pool_type TEXT,

  -- Exterior and materials
  ADD COLUMN IF NOT EXISTS exterior_type TEXT,
  ADD COLUMN IF NOT EXISTS roof_type TEXT,
  ADD COLUMN IF NOT EXISTS foundation_type TEXT,

  -- View
  ADD COLUMN IF NOT EXISTS view_type TEXT;

-- Add comment to document the feature fields
COMMENT ON COLUMN organizations.architecture_type IS 'Building architectural style (e.g., Ranch, Colonial, Contemporary)';
COMMENT ON COLUMN organizations.floor_count IS 'Number of above-ground stories';
COMMENT ON COLUMN organizations.room_count IS 'Total interior rooms count';
COMMENT ON COLUMN organizations.unit_count IS 'Individual units in multi-dwelling properties';
COMMENT ON COLUMN organizations.has_cooling IS 'Indicates presence of cooling system';
COMMENT ON COLUMN organizations.cooling_type IS 'Type of cooling system installed';
COMMENT ON COLUMN organizations.has_heating IS 'Indicates presence of heating system';
COMMENT ON COLUMN organizations.heating_type IS 'Heating system type (Forced Air, Gas, Heat Pump, etc.)';
COMMENT ON COLUMN organizations.has_fireplace IS 'Indicates presence of fireplace';
COMMENT ON COLUMN organizations.fireplace_type IS 'Specific fireplace construction type';
COMMENT ON COLUMN organizations.has_garage IS 'Indicates presence of garage';
COMMENT ON COLUMN organizations.garage_type IS 'Garage configuration (Attached, Detached, Carport, etc.)';
COMMENT ON COLUMN organizations.garage_spaces IS 'Quantity of garage parking spaces';
COMMENT ON COLUMN organizations.has_pool IS 'Indicates presence of pool';
COMMENT ON COLUMN organizations.pool_type IS 'Pool construction type (In-Ground, Above-Ground, etc.)';
COMMENT ON COLUMN organizations.exterior_type IS 'Exterior material composition';
COMMENT ON COLUMN organizations.roof_type IS 'Roofing material';
COMMENT ON COLUMN organizations.foundation_type IS 'Foundation construction method';
COMMENT ON COLUMN organizations.view_type IS 'Surrounding view characteristics (Lake, Mountain, City, etc.)';
