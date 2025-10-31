import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/organizations/sync-features
 *
 * Syncs home_features array based on existing property data (hasPool, hasFireplace, etc.)
 * This is useful for retroactively updating existing organizations that have property data
 * but haven't had their home_features array populated yet.
 */
export async function POST() {
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

    // Get user's organization_id
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('organization_id')
      .eq('auth_user_id', user.id)
      .single()

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get current organization data
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('has_pool, has_fireplace, home_features')
      .eq('id', userData.organization_id)
      .single()

    if (orgError || !org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    // Build home_features array based on property data
    const homeFeatures: string[] = [...(org.home_features || [])]

    // Add fireplace if property data confirms it exists
    if (org.has_fireplace === true && !homeFeatures.includes('fireplace')) {
      homeFeatures.push('fireplace')
    }
    // Remove fireplace if property data says it doesn't exist
    if (org.has_fireplace === false) {
      const index = homeFeatures.indexOf('fireplace')
      if (index > -1) homeFeatures.splice(index, 1)
    }

    // Add pool if property data confirms it exists
    if (org.has_pool === true && !homeFeatures.includes('pool')) {
      homeFeatures.push('pool')
    }
    // Remove pool if property data says it doesn't exist
    if (org.has_pool === false) {
      const index = homeFeatures.indexOf('pool')
      if (index > -1) homeFeatures.splice(index, 1)
    }

    // Update organization with synced features
    const { error: updateError } = await supabase
      .from('organizations')
      .update({ home_features: homeFeatures })
      .eq('id', userData.organization_id)

    if (updateError) {
      console.error('Failed to sync home features:', updateError)
      return NextResponse.json(
        { error: 'Failed to sync features' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      homeFeatures,
      message: 'Features synced successfully'
    })
  } catch (error) {
    console.error('Unexpected error in POST /api/organizations/sync-features:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
