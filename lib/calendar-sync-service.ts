import { createAdminClient } from '@/lib/supabase/server'
import { syncTasksToCalendar, refreshAccessToken } from '@/lib/google-calendar'

/**
 * Internal service to sync a user's tasks to their Google Calendar
 * Can be called from API routes without requiring HTTP authentication
 *
 * @param userId - The ChorePulse user ID (NOT auth_user_id)
 * @returns Success status and synced count
 */
export async function syncUserCalendar(userId: string): Promise<{
  success: boolean
  syncedCount?: number
  error?: string
}> {
  try {
    const adminClient = createAdminClient()

    // Get user data
    const { data: userData, error: userError } = await adminClient
      .from('users')
      .select('id, organization_id')
      .eq('id', userId)
      .single()

    if (userError || !userData) {
      console.error('User not found for calendar sync:', userId)
      return { success: false, error: 'User not found' }
    }

    // Get calendar integration
    const { data: integration, error: integrationError } = await adminClient
      .from('calendar_integrations')
      .select('*')
      .eq('user_id', userData.id)
      .eq('provider', 'google')
      .single()

    if (integrationError || !integration) {
      // User doesn't have calendar connected - this is OK, just skip
      return { success: true, syncedCount: 0 }
    }

    if (!integration.sync_enabled || !integration.sync_tasks_to_calendar) {
      // User has sync disabled - this is OK, just skip
      return { success: true, syncedCount: 0 }
    }

    // Check if token needs refresh
    let accessToken = integration.access_token
    const tokenExpiry = new Date(integration.token_expiry)
    const now = new Date()

    if (tokenExpiry <= now) {
      console.log(`Access token expired for user ${userId}, refreshing...`)
      const refreshResult = await refreshAccessToken(integration)

      if (!refreshResult) {
        // Update integration status
        await adminClient
          .from('calendar_integrations')
          .update({
            last_sync_status: 'error',
            last_sync_error: 'Failed to refresh access token',
            last_sync_at: new Date().toISOString()
          })
          .eq('id', integration.id)

        return { success: false, error: 'Failed to refresh access token' }
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

    // Fetch tasks for the organization with assignments
    const { data: tasks, error: tasksError } = await adminClient
      .from('tasks')
      .select(`
        id,
        name,
        description,
        due_time,
        category,
        points,
        status,
        frequency,
        recurrence_interval,
        recurrence_day_of_week,
        task_assignments (
          user_id,
          users!task_assignments_user_id_fkey (
            name
          )
        )
      `)
      .eq('organization_id', userData.organization_id)
      .eq('status', 'active')

    if (tasksError) {
      console.error('Error fetching tasks for calendar sync:', tasksError)
      return { success: false, error: 'Failed to fetch tasks' }
    }

    // Transform tasks to include assigned user names
    // Filter to only include tasks assigned to the current user
    const transformedTasks = (tasks || [])
      .filter((task: any) => {
        // Only include tasks where the current user is assigned
        return task.task_assignments &&
               task.task_assignments.some((a: any) => a.user_id === userData.id)
      })
      .map((task: any) => ({
        id: task.id,
        name: task.name,
        description: task.description,
        due_time: task.due_time,
        category: task.category,
        points: task.points,
        frequency: task.frequency,
        recurrence_interval: task.recurrence_interval,
        recurrence_day_of_week: task.recurrence_day_of_week,
        assignedToNames: task.task_assignments?.map((a: any) => a.users?.name).filter(Boolean) || []
      }))

    // Sync tasks to Google Calendar
    const syncResult = await syncTasksToCalendar(integration, transformedTasks)

    // Update integration status
    await adminClient
      .from('calendar_integrations')
      .update({
        last_sync_at: new Date().toISOString(),
        last_sync_status: syncResult.success ? 'success' : 'error',
        last_sync_error: syncResult.error || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', integration.id)

    if (!syncResult.success) {
      return { success: false, error: syncResult.error || 'Sync failed' }
    }

    return {
      success: true,
      syncedCount: syncResult.syncedCount
    }
  } catch (error) {
    console.error('Unexpected error in syncUserCalendar:', error)
    return { success: false, error: 'Internal server error' }
  }
}
