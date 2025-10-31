import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * GET /api/organizations/current
 * Get the current user's organization information
 * Returns: Organization object with all details
 */
export async function GET() {
  try {
    const supabase = await createClient()

    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user's organization_id
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('organization_id')
      .eq('auth_user_id', user.id)
      .single()

    if (userError || !userData) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Get organization details
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', userData.organization_id)
      .single()

    if (orgError || !organization) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      )
    }

    // Transform to camelCase for frontend
    return NextResponse.json({
      organization: {
        id: organization.id,
        name: organization.name,
        subscriptionTier: organization.subscription_tier,
        subscriptionStatus: organization.subscription_status,
        currentFamilyCode: organization.current_family_code,
        stripeCustomerId: organization.stripe_customer_id,
        stripeSubscriptionId: organization.stripe_subscription_id,
        trialStartsAt: organization.trial_starts_at,
        trialEndsAt: organization.trial_ends_at,
        subscriptionCurrentPeriodEnd: organization.subscription_current_period_end,
        createdAt: organization.created_at,
        // Address and location data
        addressLine1: organization.address_line1,
        addressLine2: organization.address_line2,
        city: organization.city,
        state: organization.state,
        zipCode: organization.zip_code,
        country: organization.country,
        latitude: organization.latitude,
        longitude: organization.longitude,
        googlePlaceId: organization.google_place_id,
        addressFormatted: organization.address_formatted,
        // Basic property data
        bedrooms: organization.bedrooms,
        bathrooms: organization.bathrooms,
        squareFeet: organization.square_feet,
        lotSizeSqft: organization.lot_size_sqft,
        propertyType: organization.property_type,
        yearBuilt: organization.year_built,
        propertyValue: organization.property_value,
        lastSalePrice: organization.last_sale_price,
        lastSaleDate: organization.last_sale_date,
        ownerOccupied: organization.owner_occupied,
        propertyDataFetchedAt: organization.property_data_fetched_at,

        // Property features
        architectureType: organization.architecture_type,
        floorCount: organization.floor_count,
        roomCount: organization.room_count,
        unitCount: organization.unit_count,
        hasCooling: organization.has_cooling,
        coolingType: organization.cooling_type,
        hasHeating: organization.has_heating,
        heatingType: organization.heating_type,
        hasFireplace: organization.has_fireplace,
        fireplaceType: organization.fireplace_type,
        hasGarage: organization.has_garage,
        garageType: organization.garage_type,
        garageSpaces: organization.garage_spaces,
        hasPool: organization.has_pool,
        poolType: organization.pool_type,
        exteriorType: organization.exterior_type,
        roofType: organization.roof_type,
        foundationType: organization.foundation_type,
        viewType: organization.view_type,

        // Household and pet information
        homeFeatures: organization.home_features,
        specialConsiderations: organization.special_considerations,
        hasPets: organization.has_pets,
        petTypes: organization.pet_types,
        ageGroups: organization.age_groups,
        numberOfCars: organization.number_of_cars,
        numberOfBikes: organization.number_of_bikes
      }
    })
  } catch (error) {
    console.error('Unexpected error in GET /api/organizations/current:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
