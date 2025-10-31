import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { fetchGoogleCalendarEvents, refreshAccessToken } from '@/lib/google-calendar'

/**
 * GET /api/integrations/google-calendar/events
 * Fetch events from user's Google Calendar
 * Query params:
 * - startDate: ISO date string (default: today)
 * - endDate: ISO date string (default: 7 days from now)
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

    // Get ChorePulse user ID using admin client
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

    // Get calendar integration
    const { data: integration, error: integrationError } = await adminClient
      .from('calendar_integrations')
      .select('*')
      .eq('user_id', userData.id)
      .eq('provider', 'google')
      .single()

    if (integrationError || !integration) {
      return NextResponse.json(
        { error: 'Calendar integration not found' },
        { status: 404 }
      )
    }

    if (!integration.sync_enabled || !integration.sync_calendar_to_tasks) {
      return NextResponse.json(
        { events: [] },
        { status: 200 }
      )
    }

    // Parse date range from query params
    const searchParams = request.nextUrl.searchParams
    const startDateParam = searchParams.get('startDate')
    const endDateParam = searchParams.get('endDate')

    const startDate = startDateParam ? new Date(startDateParam) : new Date()
    const endDate = endDateParam ? new Date(endDateParam) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

    // Check if token needs refresh
    let accessToken = integration.access_token
    const tokenExpiry = new Date(integration.token_expiry)
    const now = new Date()

    if (tokenExpiry <= now) {
      console.log('Access token expired, refreshing...')
      const refreshResult = await refreshAccessToken(integration)

      if (!refreshResult) {
        return NextResponse.json(
          { error: 'Failed to refresh access token. Please reconnect your calendar.' },
          { status: 401 }
        )
      }

      // Update token in database
      await adminClient
        .from('calendar_integrations')
        .update({
          access_token: refreshResult.accessToken,
          token_expiry: refreshResult.expiresAt.toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', integration.id)

      accessToken = refreshResult.accessToken
      integration.access_token = accessToken
    }

    // Fetch events from Google Calendar
    const events = await fetchGoogleCalendarEvents(integration, startDate, endDate)

    // Transform events to a simpler format
    const transformedEvents = events.map((event: any) => ({
      id: event.id,
      summary: event.summary || 'Untitled Event',
      description: event.description || '',
      start: event.start?.dateTime || event.start?.date,
      end: event.end?.dateTime || event.end?.date,
      isAllDay: !event.start?.dateTime,
      location: event.location || '',
      htmlLink: event.htmlLink,
      colorId: event.colorId
    }))

    return NextResponse.json({
      events: transformedEvents,
      count: transformedEvents.length
    })
  } catch (error) {
    console.error('Unexpected error in GET /api/integrations/google-calendar/events:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
