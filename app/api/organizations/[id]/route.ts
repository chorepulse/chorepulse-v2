import { createClient } from '@/lib/supabase/server'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * PATCH /api/organizations/[id]
 * Update organization settings
 * Only account owners can update organization settings
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    // Get current user's data to check permissions
    const { data: currentUser, error: currentUserError } = await supabase
      .from('users')
      .select('id, organization_id, is_account_owner')
      .eq('auth_user_id', user.id)
      .single()

    if (currentUserError || !currentUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Only account owners can update organization settings
    if (!currentUser.is_account_owner) {
      return NextResponse.json(
        { error: 'Only account owners can update organization settings' },
        { status: 403 }
      )
    }

    // Get organization ID from params
    const { id: organizationId } = await params

    // Verify the organization belongs to the user
    if (organizationId !== currentUser.organization_id) {
      return NextResponse.json(
        { error: 'Cannot update other organizations' },
        { status: 403 }
      )
    }

    // Parse request body
    const body = await request.json()
    const {
      name,
      timezone,
      addressLine1,
      addressLine2,
      city,
      state,
      zipCode,
      country,
      latitude,
      longitude,
      googlePlaceId,
      addressFormatted
    } = body

    // Build update object (only include provided fields)
    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (timezone !== undefined) updateData.timezone = timezone

    // Address and location fields
    if (addressLine1 !== undefined) updateData.address_line1 = addressLine1
    if (addressLine2 !== undefined) updateData.address_line2 = addressLine2
    if (city !== undefined) updateData.city = city
    if (state !== undefined) updateData.state = state
    if (zipCode !== undefined) updateData.zip_code = zipCode
    if (country !== undefined) updateData.country = country
    if (latitude !== undefined) updateData.latitude = latitude
    if (longitude !== undefined) updateData.longitude = longitude
    if (googlePlaceId !== undefined) updateData.google_place_id = googlePlaceId
    if (addressFormatted !== undefined) updateData.address_formatted = addressFormatted

    // Update the organization
    const { data: updatedOrg, error: updateError } = await supabase
      .from('organizations')
      .update(updateData)
      .eq('id', organizationId)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating organization:', updateError)
      return NextResponse.json(
        { error: 'Failed to update organization' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      organization: updatedOrg,
      message: 'Organization updated successfully'
    })
  } catch (error) {
    console.error('Unexpected error in PATCH /api/organizations/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
