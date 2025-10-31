import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

/**
 * GET /api/integrations/google-calendar
 * Check if the current user has connected Google Calendar
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get ChorePulse user ID using admin client to bypass RLS
    const adminClient = createAdminClient()
    const { data: userData, error: userError } = await adminClient
      .from('users')
      .select('id')
      .eq('auth_user_id', user.id)
      .single()

    if (userError || !userData) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Check for existing Google Calendar integration
    const { data: integration, error: integrationError } = await adminClient
      .from('calendar_integrations')
      .select('*')
      .eq('user_id', userData.id)
      .eq('provider', 'google')
      .single()

    if (integrationError && integrationError.code !== 'PGRST116') { // PGRST116 = no rows
      console.error('Error fetching calendar integration:', integrationError)
      return NextResponse.json(
        { error: 'Failed to fetch integration status' },
        { status: 500 }
      )
    }

    const isConnected = !!integration
    let isTokenValid = integration && integration.token_expiry
      ? new Date(integration.token_expiry) > new Date()
      : false

    // If token is expired but we have a refresh token, try to refresh it
    if (integration && !isTokenValid && integration.refresh_token) {
      try {
        const clientId = process.env.GOOGLE_CLIENT_ID
        const clientSecret = process.env.GOOGLE_CLIENT_SECRET

        if (clientId && clientSecret) {
          const refreshResponse = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({
              client_id: clientId,
              client_secret: clientSecret,
              refresh_token: integration.refresh_token,
              grant_type: 'refresh_token'
            })
          })

          if (refreshResponse.ok) {
            const tokens = await refreshResponse.json()
            const newTokenExpiry = new Date(Date.now() + tokens.expires_in * 1000)

            // Update the access token in the database
            await adminClient
              .from('calendar_integrations')
              .update({
                access_token: tokens.access_token,
                token_expiry: newTokenExpiry.toISOString(),
                updated_at: new Date().toISOString()
              })
              .eq('user_id', userData.id)
              .eq('provider', 'google')

            isTokenValid = true
            console.log('Successfully refreshed Google Calendar token')
          } else {
            console.error('Failed to refresh token:', await refreshResponse.text())
          }
        }
      } catch (error) {
        console.error('Error refreshing Google Calendar token:', error)
      }
    }

    return NextResponse.json({
      connected: isConnected && isTokenValid,
      integration: integration ? {
        email: integration.email,
        syncTasksToCalendar: integration.sync_tasks_to_calendar,
        syncCalendarToTasks: integration.sync_calendar_to_tasks,
        calendarName: integration.calendar_name,
        lastSyncAt: integration.last_sync_at,
        lastSyncStatus: integration.last_sync_status
      } : null
    })
  } catch (error) {
    console.error('Unexpected error in GET /api/integrations/google-calendar:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/integrations/google-calendar
 * Update calendar integration settings
 */
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get ChorePulse user ID using admin client to bypass RLS
    const adminClient = createAdminClient()
    const { data: userData, error: userError } = await adminClient
      .from('users')
      .select('id')
      .eq('auth_user_id', user.id)
      .single()

    if (userError || !userData) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const {
      syncTasksToCalendar,
      syncCalendarToTasks,
      calendarName
    } = body

    // Update integration settings using admin client
    const { data: integration, error: updateError } = await adminClient
      .from('calendar_integrations')
      .update({
        sync_tasks_to_calendar: syncTasksToCalendar,
        sync_calendar_to_tasks: syncCalendarToTasks,
        calendar_name: calendarName,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userData.id)
      .eq('provider', 'google')
      .select()
      .single()

    if (updateError) {
      console.error('Error updating calendar integration:', updateError)
      return NextResponse.json(
        { error: 'Failed to update integration settings' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      integration: {
        email: integration.email,
        syncTasksToCalendar: integration.sync_tasks_to_calendar,
        syncCalendarToTasks: integration.sync_calendar_to_tasks,
        calendarName: integration.calendar_name,
        lastSyncAt: integration.last_sync_at
      }
    })
  } catch (error) {
    console.error('Unexpected error in PATCH /api/integrations/google-calendar:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/integrations/google-calendar
 * Disconnect Google Calendar integration
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get ChorePulse user ID using admin client to bypass RLS
    const adminClient = createAdminClient()
    const { data: userData, error: userError } = await adminClient
      .from('users')
      .select('id')
      .eq('auth_user_id', user.id)
      .single()

    if (userError || !userData) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Delete the integration using admin client
    const { error: deleteError } = await adminClient
      .from('calendar_integrations')
      .delete()
      .eq('user_id', userData.id)
      .eq('provider', 'google')

    if (deleteError) {
      console.error('Error deleting calendar integration:', deleteError)
      return NextResponse.json(
        { error: 'Failed to disconnect calendar' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Calendar disconnected successfully'
    })
  } catch (error) {
    console.error('Unexpected error in DELETE /api/integrations/google-calendar:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
