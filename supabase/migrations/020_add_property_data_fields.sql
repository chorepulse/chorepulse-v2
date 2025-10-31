-- Migration 020: Add Property Data Fields to Organizations Table
--
-- Purpose: Store property details from RentCast API to enable:
--   1. Personalized chore suggestions based on home size
--   2. Enhanced ad targeting with property demographics
--   3. Better user experience with automatic home profile
--
-- API Source: RentCast API (formerly RealtyMole)
-- Free tier: 50 calls/month

-- Add property data columns to organizations table
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS bedrooms INTEGER,
ADD COLUMN IF NOT EXISTS bathrooms DECIMAL(3, 1),  -- Allows 2.5, 3.5, etc.
ADD COLUMN IF NOT EXISTS square_feet INTEGER,
ADD COLUMN IF NOT EXISTS lot_size_sqft INTEGER,
ADD COLUMN IF NOT EXISTS property_type VARCHAR(50),  -- Single Family, Condo, Townhouse, etc.
ADD COLUMN IF NOT EXISTS year_built INTEGER,
ADD COLUMN IF NOT EXISTS property_value DECIMAL(12, 2),  -- Estimated market value
ADD COLUMN IF NOT EXISTS last_sale_price DECIMAL(12, 2),
ADD COLUMN IF NOT EXISTS last_sale_date DATE,
ADD COLUMN IF NOT EXISTS owner_occupied BOOLEAN,
ADD COLUMN IF NOT EXISTS property_data_fetched_at TIMESTAMP WITH TIME ZONE,  -- Track when data was last updated
ADD COLUMN IF NOT EXISTS rentcast_property_id VARCHAR(100);  -- Store RentCast's property ID for future reference

-- Add indexes for common queries
CREATE INDEX IF NOT EXISTS idx_organizations_property_type
ON organizations(property_type)
WHERE property_type IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_organizations_bedrooms
ON organizations(bedrooms)
WHERE bedrooms IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_organizations_bathrooms
ON organizations(bathrooms)
WHERE bathrooms IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN organizations.bedrooms IS 'Number of bedrooms from RentCast API';
COMMENT ON COLUMN organizations.bathrooms IS 'Number of bathrooms (including half-baths as .5)';
COMMENT ON COLUMN organizations.square_feet IS 'Living area in square feet';
COMMENT ON COLUMN organizations.lot_size_sqft IS 'Total lot size in square feet';
COMMENT ON COLUMN organizations.property_type IS 'Property classification (Single Family, Condo, etc.)';
COMMENT ON COLUMN organizations.year_built IS 'Year the property was constructed';
COMMENT ON COLUMN organizations.property_value IS 'Current estimated market value from RentCast AVM';
COMMENT ON COLUMN organizations.property_data_fetched_at IS 'Timestamp of last property data fetch (for cache refresh)';
