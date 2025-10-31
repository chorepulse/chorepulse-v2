import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/hub/settings
 * Fetch hub display settings for the organization
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
      .select('organization_id, is_account_owner, is_family_manager')
      .eq('auth_user_id', user.id)
      .single()

    if (userError || !userData) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Check permissions
    if (!userData.is_account_owner && !userData.is_family_manager) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    // Get organization settings
    const { data: orgData, error: orgError } = await supabase
      .from('organizations')
      .select('hub_settings')
      .eq('id', userData.organization_id)
      .single()

    if (orgError) {
      console.error('Error fetching organization:', orgError)
      return NextResponse.json(
        { error: 'Failed to fetch settings' },
        { status: 500 }
      )
    }

    // Return settings or defaults
    const defaultSettings = {
      showTodayTasks: true,
      showTomorrowTasks: true,
      showWeeklyTasks: false,
      showLeaderboard: true,
      showFamilyStats: true,
      showUpcomingEvents: false,
      showMotivationalQuote: true,
      showWeather: false,
      autoRefreshInterval: 60,
      theme: 'light'
    }

    return NextResponse.json({
      settings: orgData?.hub_settings || defaultSettings
    })
  } catch (error) {
    console.error('Unexpected error in GET /api/hub/settings:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/hub/settings
 * Update hub display settings for the organization
 */
export async function POST(request: NextRequest) {
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
      .select('organization_id, is_account_owner, is_family_manager')
      .eq('auth_user_id', user.id)
      .single()

    if (userError || !userData) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Check permissions
    if (!userData.is_account_owner && !userData.is_family_manager) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    // Parse request body
    const settings = await request.json()

    // Update organization settings
    const { error: updateError } = await supabase
      .from('organizations')
      .update({
        hub_settings: settings,
        updated_at: new Date().toISOString()
      })
      .eq('id', userData.organization_id)

    if (updateError) {
      console.error('Error updating hub settings:', updateError)
      return NextResponse.json(
        { error: 'Failed to update settings' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      settings
    })
  } catch (error) {
    console.error('Unexpected error in POST /api/hub/settings:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
