-- Add household and pet information fields to organizations table
-- This captures the data from the onboarding wizard

ALTER TABLE organizations
  -- Home features (from wizard)
  ADD COLUMN IF NOT EXISTS home_features TEXT[], -- array of: fireplace, pool, hot_tub, pond, garden, indoor_plants
  ADD COLUMN IF NOT EXISTS special_considerations TEXT[], -- array of: elderly, home_office, basement_attic

  -- Pet information
  ADD COLUMN IF NOT EXISTS has_pets BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS pet_types TEXT[], -- array of: dog, cat, fish, bird, small_animal, reptile, other

  -- Age groups in household
  ADD COLUMN IF NOT EXISTS age_groups TEXT[], -- array of: toddler, kid, teen, adult

  -- Vehicle information
  ADD COLUMN IF NOT EXISTS number_of_cars INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS number_of_bikes INTEGER DEFAULT 0;

-- Add comments for documentation
COMMENT ON COLUMN organizations.home_features IS 'Array of home features: fireplace, pool, hot_tub, pond, garden, indoor_plants';
COMMENT ON COLUMN organizations.special_considerations IS 'Array of special considerations: elderly, home_office, basement_attic';
COMMENT ON COLUMN organizations.has_pets IS 'Whether the household has any pets';
COMMENT ON COLUMN organizations.pet_types IS 'Array of pet types: dog, cat, fish, bird, small_animal, reptile, other';
COMMENT ON COLUMN organizations.age_groups IS 'Array of age groups in household: toddler, kid, teen, adult';
COMMENT ON COLUMN organizations.number_of_cars IS 'Number of cars in household';
COMMENT ON COLUMN organizations.number_of_bikes IS 'Number of bikes in household';
