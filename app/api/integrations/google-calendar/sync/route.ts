import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { syncUserCalendar } from '@/lib/calendar-sync-service'

/**
 * POST /api/integrations/google-calendar/sync
 * Manually trigger a sync between ChorePulse tasks and Google Calendar
 */
export async function POST(request: NextRequest) {
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

    // Use the internal sync service
    const syncResult = await syncUserCalendar(userData.id)

    if (!syncResult.success) {
      return NextResponse.json(
        { error: syncResult.error || 'Sync failed' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      syncedCount: syncResult.syncedCount,
      message: `Successfully synced ${syncResult.syncedCount} tasks to Google Calendar`
    })
  } catch (error) {
    console.error('Unexpected error in POST /api/integrations/google-calendar/sync:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
