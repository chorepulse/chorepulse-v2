import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * GET /api/organization/family-code
 * Get the current family code for the organization
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

    // Get user's organization
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

    // Fetch organization with family code
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('current_family_code, family_code_generated_at, family_code_version')
      .eq('id', userData.organization_id)
      .single()

    if (orgError || !organization) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      familyCode: organization.current_family_code,
      generatedAt: organization.family_code_generated_at,
      version: organization.family_code_version
    })
  } catch (error) {
    console.error('Unexpected error in GET /api/organization/family-code:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/organization/family-code/regenerate
 * Generate a new family code for the organization
 * Only account owners and family managers can regenerate
 */
export async function POST() {
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
      .select('organization_id, is_account_owner, is_family_manager')
      .eq('auth_user_id', user.id)
      .single()

    if (currentUserError || !currentUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Check permissions
    if (!currentUser.is_account_owner && !currentUser.is_family_manager) {
      return NextResponse.json(
        { error: 'Only account owners and family managers can regenerate the family code' },
        { status: 403 }
      )
    }

    // Generate new family code using the database function
    const { data: newCode, error: generateError } = await supabase
      .rpc('generate_family_code')

    if (generateError) {
      console.error('Error generating family code:', generateError)
      return NextResponse.json(
        { error: 'Failed to generate family code' },
        { status: 500 }
      )
    }

    // Get current version
    const { data: currentOrg } = await supabase
      .from('organizations')
      .select('family_code_version')
      .eq('id', currentUser.organization_id)
      .single()

    const newVersion = (currentOrg?.family_code_version || 0) + 1

    // Update organization with new family code
    const { data: updatedOrg, error: updateError } = await supabase
      .from('organizations')
      .update({
        current_family_code: newCode,
        family_code_generated_at: new Date().toISOString(),
        family_code_version: newVersion
      })
      .eq('id', currentUser.organization_id)
      .select('current_family_code, family_code_generated_at, family_code_version')
      .single()

    if (updateError) {
      console.error('Error updating organization with new family code:', updateError)
      return NextResponse.json(
        { error: 'Failed to update family code' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      familyCode: updatedOrg.current_family_code,
      generatedAt: updatedOrg.family_code_generated_at,
      version: updatedOrg.family_code_version,
      message: 'Family code regenerated successfully'
    })
  } catch (error) {
    console.error('Unexpected error in POST /api/organization/family-code:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
