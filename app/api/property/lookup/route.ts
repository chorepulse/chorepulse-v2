import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/property/lookup
 *
 * Fetches property data from RentCast API and stores it in the organization record
 *
 * Body:
 *   - address: Full address string OR
 *   - addressLine1, city, state, zipCode: Individual components
 *
 * Returns:
 *   - Property data (bedrooms, bathrooms, sqft, etc.)
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's info
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('organization_id, is_account_owner')
      .eq('auth_user_id', user.id)
      .single()

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Only account owners can update property data
    if (!userData.is_account_owner) {
      return NextResponse.json(
        { error: 'Only account owners can fetch property data' },
        { status: 403 }
      )
    }

    // Check rate limiting - allow 2 fetches per 24 hours
    const { data: orgData, error: orgError } = await supabase
      .from('organizations')
      .select('property_fetch_count, property_fetch_window_start')
      .eq('id', userData.organization_id)
      .single()

    if (orgData) {
      const now = new Date()
      const windowStart = orgData.property_fetch_window_start
        ? new Date(orgData.property_fetch_window_start)
        : null

      // Check if we're still within the 24-hour window
      if (windowStart) {
        const hoursSinceWindowStart = (now.getTime() - windowStart.getTime()) / (1000 * 60 * 60)

        if (hoursSinceWindowStart < 24) {
          // Still within the window
          if (orgData.property_fetch_count >= 2) {
            const hoursRemaining = Math.ceil(24 - hoursSinceWindowStart)
            return NextResponse.json(
              {
                error: `Property data fetch limit reached (2 per day). Please wait ${hoursRemaining} more hour${hoursRemaining !== 1 ? 's' : ''} before trying again.`
              },
              { status: 429 }
            )
          }
        }
      }
    }

    const body = await request.json()
    const { address, addressLine1, city, state, zipCode } = body

    // Build address string for API call
    let fullAddress: string
    if (address) {
      fullAddress = address
    } else if (addressLine1 && city && state) {
      fullAddress = `${addressLine1}, ${city}, ${state} ${zipCode || ''}`
    } else {
      return NextResponse.json(
        { error: 'Address is required' },
        { status: 400 }
      )
    }

    const apiKey = process.env.RENTCAST_API_KEY
    if (!apiKey) {
      console.error('RENTCAST_API_KEY not configured')
      return NextResponse.json(
        { error: 'Property lookup service not configured' },
        { status: 500 }
      )
    }

    // Call RentCast API
    // Docs: https://developers.rentcast.io/reference/properties
    const rentcastUrl = `https://api.rentcast.io/v1/properties?address=${encodeURIComponent(fullAddress)}`

    const rentcastResponse = await fetch(rentcastUrl, {
      method: 'GET',
      headers: {
        'X-Api-Key': apiKey,
        'Accept': 'application/json'
      }
    })

    if (!rentcastResponse.ok) {
      const errorText = await rentcastResponse.text()
      console.error('RentCast API error:', rentcastResponse.status, errorText)

      if (rentcastResponse.status === 404) {
        return NextResponse.json(
          { error: 'Property not found in database. This may be a new construction or rural property.' },
          { status: 404 }
        )
      }

      return NextResponse.json(
        { error: 'Failed to fetch property data from RentCast' },
        { status: rentcastResponse.status }
      )
    }

    const propertyData = await rentcastResponse.json()

    // Extract relevant fields from RentCast response
    // RentCast returns an array of properties, we'll take the first match
    const property = Array.isArray(propertyData) ? propertyData[0] : propertyData

    if (!property) {
      return NextResponse.json(
        { error: 'No property data found for this address' },
        { status: 404 }
      )
    }

    // Map RentCast fields to our database schema
    const features = property.features || {}
    const mappedData = {
      // Basic property info
      bedrooms: property.bedrooms || null,
      bathrooms: property.bathrooms || null,
      squareFeet: property.squareFootage || property.livingArea || null,
      lotSizeSqft: property.lotSize || null,
      propertyType: property.propertyType || null,
      yearBuilt: property.yearBuilt || null,
      propertyValue: property.value || property.price || null,
      lastSalePrice: property.lastSalePrice || null,
      lastSaleDate: property.lastSaleDate || null,
      ownerOccupied: property.ownerOccupied || null,
      rentcastPropertyId: property.id || null,
      propertyDataFetchedAt: new Date().toISOString(),

      // Architecture and structure
      architectureType: features.architectureType || null,
      floorCount: features.floorCount || null,
      roomCount: features.roomCount || null,
      unitCount: features.unitCount || null,

      // Cooling
      hasCooling: features.cooling || null,
      coolingType: features.coolingType || null,

      // Heating
      hasHeating: features.heating || null,
      heatingType: features.heatingType || null,

      // Fireplace
      hasFireplace: features.fireplace || null,
      fireplaceType: features.fireplaceType || null,

      // Garage and parking
      hasGarage: features.garage || null,
      garageType: features.garageType || null,
      garageSpaces: features.garageSpaces || null,

      // Pool
      hasPool: features.pool || null,
      poolType: features.poolType || null,

      // Exterior and materials
      exteriorType: features.exteriorType || null,
      roofType: features.roofType || null,
      foundationType: features.foundationType || null,

      // View
      viewType: features.viewType || null
    }

    // Calculate new fetch count and window
    const now = new Date()
    const windowStart = orgData?.property_fetch_window_start
      ? new Date(orgData.property_fetch_window_start)
      : null
    let newFetchCount = 1
    let newWindowStart = now.toISOString()

    if (windowStart) {
      const hoursSinceWindowStart = (now.getTime() - windowStart.getTime()) / (1000 * 60 * 60)
      if (hoursSinceWindowStart < 24) {
        // Still within window, increment count
        newFetchCount = (orgData?.property_fetch_count || 0) + 1
        newWindowStart = orgData.property_fetch_window_start
      }
      // If more than 24 hours, reset to 1 and start new window
    }

    // Get existing home_features array to merge with RentCast data
    const { data: existingOrg } = await supabase
      .from('organizations')
      .select('home_features')
      .eq('id', userData.organization_id)
      .single()

    // Build home_features array based on RentCast data
    // RentCast is the source of truth - it will add/remove features based on property data
    const homeFeatures: string[] = [...(existingOrg?.home_features || [])]

    // Add fireplace if RentCast confirms it exists
    if (mappedData.hasFireplace === true && !homeFeatures.includes('fireplace')) {
      homeFeatures.push('fireplace')
    }
    // Remove fireplace if RentCast says it doesn't exist
    if (mappedData.hasFireplace === false) {
      const index = homeFeatures.indexOf('fireplace')
      if (index > -1) homeFeatures.splice(index, 1)
    }

    // Add pool if RentCast confirms it exists
    if (mappedData.hasPool === true && !homeFeatures.includes('pool')) {
      homeFeatures.push('pool')
    }
    // Remove pool if RentCast says it doesn't exist
    if (mappedData.hasPool === false) {
      const index = homeFeatures.indexOf('pool')
      if (index > -1) homeFeatures.splice(index, 1)
    }

    // Update organization with property data
    const { data: updateResult, error: updateError } = await supabase
      .from('organizations')
      .update({
        // Basic property info
        bedrooms: mappedData.bedrooms,
        bathrooms: mappedData.bathrooms,
        square_feet: mappedData.squareFeet,
        lot_size_sqft: mappedData.lotSizeSqft,
        property_type: mappedData.propertyType,
        year_built: mappedData.yearBuilt,
        property_value: mappedData.propertyValue,
        last_sale_price: mappedData.lastSalePrice,
        last_sale_date: mappedData.lastSaleDate,
        owner_occupied: mappedData.ownerOccupied,
        rentcast_property_id: mappedData.rentcastPropertyId,
        property_data_fetched_at: mappedData.propertyDataFetchedAt,

        // Rate limiting fields
        property_fetch_count: newFetchCount,
        property_fetch_window_start: newWindowStart,

        // Household features (auto-populated from RentCast data)
        home_features: homeFeatures,

        // Architecture and structure
        architecture_type: mappedData.architectureType,
        floor_count: mappedData.floorCount,
        room_count: mappedData.roomCount,
        unit_count: mappedData.unitCount,

        // Cooling
        has_cooling: mappedData.hasCooling,
        cooling_type: mappedData.coolingType,

        // Heating
        has_heating: mappedData.hasHeating,
        heating_type: mappedData.heatingType,

        // Fireplace
        has_fireplace: mappedData.hasFireplace,
        fireplace_type: mappedData.fireplaceType,

        // Garage and parking
        has_garage: mappedData.hasGarage,
        garage_type: mappedData.garageType,
        garage_spaces: mappedData.garageSpaces,

        // Pool
        has_pool: mappedData.hasPool,
        pool_type: mappedData.poolType,

        // Exterior and materials
        exterior_type: mappedData.exteriorType,
        roof_type: mappedData.roofType,
        foundation_type: mappedData.foundationType,

        // View
        view_type: mappedData.viewType
      })
      .eq('id', userData.organization_id)
      .select()
      .single()

    if (updateError) {
      console.error('Failed to update organization with property data:', updateError)
      return NextResponse.json(
        { error: 'Failed to save property data' },
        { status: 500 }
      )
    }

    // Return the mapped data
    return NextResponse.json({
      success: true,
      property: mappedData,
      message: 'Property data fetched and saved successfully'
    })
  } catch (error) {
    console.error('Unexpected error in POST /api/property/lookup:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
