import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { syncUserCalendar } from '@/lib/calendar-sync-service'

/**
 * GET /api/cron/calendar-sync
 * Daily cron job to sync calendars for all users with connected Google Calendar
 * Called by Vercel Cron at midnight
 */
export async function GET(request: NextRequest) {
  try {
    // Verify this is coming from Vercel Cron
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const adminClient = createAdminClient()

    // Get all active calendar integrations
    const { data: integrations, error } = await adminClient
      .from('calendar_integrations')
      .select('user_id, sync_enabled, sync_tasks_to_calendar')
      .eq('provider', 'google')
      .eq('sync_enabled', true)
      .eq('sync_tasks_to_calendar', true)

    if (error) {
      console.error('Error fetching calendar integrations:', error)
      return NextResponse.json(
        { error: 'Failed to fetch integrations' },
        { status: 500 }
      )
    }

    // Trigger sync for each user
    const syncPromises = (integrations || []).map(async (integration) => {
      try {
        const result = await syncUserCalendar(integration.user_id)
        return {
          user_id: integration.user_id,
          success: result.success
        }
      } catch (error) {
        console.error(`Failed to sync calendar for user ${integration.user_id}:`, error)
        return {
          user_id: integration.user_id,
          success: false
        }
      }
    })

    const results = await Promise.all(syncPromises)

    const successful = results.filter(r => r.success).length
    const failed = results.filter(r => !r.success).length

    return NextResponse.json({
      success: true,
      message: `Synced calendars for ${successful} users (${failed} failed)`,
      totalUsers: integrations?.length || 0,
      successful,
      failed
    })
  } catch (error) {
    console.error('Unexpected error in GET /api/cron/calendar-sync:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
