import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * PATCH /api/organizations/household
 * Update household and pet information for the organization
 *
 * Only account owners and family managers can update this data
 */
export async function PATCH(request: NextRequest) {
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

    // Get user's info and check permissions
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('organization_id, is_account_owner, is_family_manager')
      .eq('auth_user_id', user.id)
      .single()

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Only account owners and family managers can update household data
    if (!userData.is_account_owner && !userData.is_family_manager) {
      return NextResponse.json(
        { error: 'Only account owners and family managers can update household information' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const {
      homeFeatures,
      specialConsiderations,
      hasPets,
      petTypes,
      ageGroups,
      numberOfCars,
      numberOfBikes
    } = body

    // Build update object with only provided fields
    const updateData: any = {}
    if (homeFeatures !== undefined) updateData.home_features = homeFeatures
    if (specialConsiderations !== undefined) updateData.special_considerations = specialConsiderations
    if (hasPets !== undefined) updateData.has_pets = hasPets
    if (petTypes !== undefined) updateData.pet_types = petTypes
    if (ageGroups !== undefined) updateData.age_groups = ageGroups
    if (numberOfCars !== undefined) updateData.number_of_cars = numberOfCars
    if (numberOfBikes !== undefined) updateData.number_of_bikes = numberOfBikes

    // Update organization
    const { data: updatedOrg, error: updateError } = await supabase
      .from('organizations')
      .update(updateData)
      .eq('id', userData.organization_id)
      .select()
      .single()

    if (updateError) {
      console.error('Failed to update household data:', updateError)
      return NextResponse.json(
        { error: 'Failed to update household information' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Household information updated successfully',
      organization: {
        homeFeatures: updatedOrg.home_features,
        specialConsiderations: updatedOrg.special_considerations,
        hasPets: updatedOrg.has_pets,
        petTypes: updatedOrg.pet_types,
        ageGroups: updatedOrg.age_groups,
        numberOfCars: updatedOrg.number_of_cars,
        numberOfBikes: updatedOrg.number_of_bikes
      }
    })
  } catch (error) {
    console.error('Unexpected error in PATCH /api/organizations/household:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
