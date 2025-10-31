-- ============================================================================
-- Migration 019: Add Address Fields to Organizations
-- ============================================================================
-- Purpose: Store organization's physical address for:
--   1. Weather widget (auto-populate location)
--   2. Geographic ad targeting (increase CPM by 30-50%)
--   3. Personalized chore recommendations based on location
--   4. Future: Property data integration (bedrooms, bathrooms, etc.)
--
-- Business Impact:
--   - Geographic targeting can increase CPM by 30-50%
--   - Combined with age targeting: 60-100% total CPM increase
--   - Improved UX with pre-populated weather
-- ============================================================================

-- Add address fields to organizations table
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS address_line1 VARCHAR(255),
ADD COLUMN IF NOT EXISTS address_line2 VARCHAR(255),
ADD COLUMN IF NOT EXISTS city VARCHAR(100),
ADD COLUMN IF NOT EXISTS state VARCHAR(50),
ADD COLUMN IF NOT EXISTS zip_code VARCHAR(10),
ADD COLUMN IF NOT EXISTS country VARCHAR(50) DEFAULT 'United States',
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8),
ADD COLUMN IF NOT EXISTS google_place_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS address_formatted TEXT;

-- Add column comments for documentation
COMMENT ON COLUMN organizations.address_line1 IS 'Primary address line (street address)';
COMMENT ON COLUMN organizations.address_line2 IS 'Secondary address line (apt, suite, etc.)';
COMMENT ON COLUMN organizations.city IS 'City name';
COMMENT ON COLUMN organizations.state IS 'State/province name';
COMMENT ON COLUMN organizations.zip_code IS 'ZIP/postal code';
COMMENT ON COLUMN organizations.country IS 'Country name (default: United States)';
COMMENT ON COLUMN organizations.latitude IS 'Latitude coordinate for weather and location services';
COMMENT ON COLUMN organizations.longitude IS 'Longitude coordinate for weather and location services';
COMMENT ON COLUMN organizations.google_place_id IS 'Google Places API place ID for reference';
COMMENT ON COLUMN organizations.address_formatted IS 'Full formatted address from Google Places';

-- Create indexes for geographic queries
-- Note: We use simple B-tree indexes instead of PostGIS/earthdistance
-- since those extensions may not be available in all Supabase instances

-- Index for latitude/longitude lookups (for nearby searches if needed in future)
CREATE INDEX IF NOT EXISTS idx_organizations_latitude
ON organizations(latitude)
WHERE latitude IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_organizations_longitude
ON organizations(longitude)
WHERE longitude IS NOT NULL;

-- Create index for zip code lookups
CREATE INDEX IF NOT EXISTS idx_organizations_zip_code
ON organizations(zip_code)
WHERE zip_code IS NOT NULL;

-- Grant permissions (organizations table should already have RLS policies)
-- Users can view their own organization's address
-- Only account owners can update address

-- Note: We'll update the API to handle address updates with proper permission checks
