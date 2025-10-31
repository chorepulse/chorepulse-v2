/**
 * Google Calendar API integration service
 * Handles syncing tasks to/from Google Calendar
 */

import { google } from 'googleapis'

export interface CalendarIntegration {
  id: string
  user_id: string
  organization_id: string
  provider: string
  access_token: string
  refresh_token: string
  token_expiry: string
  email: string
  sync_enabled: boolean
  sync_tasks_to_calendar: boolean
  sync_calendar_to_tasks: boolean
  calendar_name: string
}

export interface Task {
  id: string
  name: string
  description?: string
  due_time?: string
  assignedToNames?: string[]
  category?: string
  points?: number
  frequency?: string
  recurrence_interval?: number
  recurrence_day_of_week?: number
}

/**
 * Create authenticated Google Calendar client
 */
function createCalendarClient(accessToken: string, refreshToken: string) {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/google-calendar/callback`
  )

  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken
  })

  return google.calendar({ version: 'v3', auth: oauth2Client })
}

/**
 * Find or create the ChorePulse calendar
 */
async function getOrCreateCalendar(
  calendar: any,
  calendarName: string
): Promise<string> {
  try {
    // List all calendars
    const calendarList = await calendar.calendarList.list()

    // Find existing ChorePulse calendar
    const existingCalendar = calendarList.data.items?.find(
      (cal: any) => cal.summary === calendarName
    )

    if (existingCalendar) {
      return existingCalendar.id
    }

    // Create new calendar
    const newCalendar = await calendar.calendars.insert({
      requestBody: {
        summary: calendarName,
        description: 'Tasks and chores from ChorePulse',
        timeZone: 'America/New_York' // TODO: Use user's timezone
      }
    })

    return newCalendar.data.id!
  } catch (error) {
    console.error('Error getting/creating calendar:', error)
    throw error
  }
}

/**
 * Calculate the next occurrence date for a task based on frequency
 */
function getNextOccurrenceDate(task: Task): Date {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  switch (task.frequency) {
    case 'daily':
      // Daily tasks: show today
      return today

    case 'weekly':
      // Weekly tasks: show today if weekly, or calculate next week based on interval
      const interval = task.recurrence_interval || 1
      if (interval === 1) {
        return today // Weekly tasks show today
      } else {
        // Every N weeks - show today and repeat
        return today
      }

    case 'monthly':
      // Monthly tasks: show today
      return today

    case 'one-time':
      // One-time tasks: show today
      return today

    default:
      return today
  }
}

/**
 * Convert a ChorePulse task to a Google Calendar event
 */
function taskToEvent(task: Task, calendarId: string) {
  const now = new Date()
  const eventDate = getNextOccurrenceDate(task)
  const dateStr = eventDate.toISOString().split('T')[0]
  const dueTime = task.due_time || '09:00'

  // Parse the time (handle both 12-hour and 24-hour formats)
  let hour: number
  let minute: number

  if (dueTime.includes(':')) {
    const timeParts = dueTime.replace(/[AP]M/i, '').trim().split(':')
    const isPM = /PM/i.test(dueTime)
    hour = parseInt(timeParts[0])
    minute = parseInt(timeParts[1] || '0')

    if (isPM && hour !== 12) hour += 12
    if (!isPM && hour === 12) hour = 0
  } else {
    hour = 9
    minute = 0
  }

  // Create start and end times (1 hour duration)
  const startDateTime = new Date(`${dateStr}T${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:00`)
  const endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000) // 1 hour later

  const assignedTo = task.assignedToNames?.join(', ') || 'Unassigned'

  // Build recurrence rule based on frequency
  let recurrence: string[] | undefined
  if (task.frequency === 'daily') {
    const interval = task.recurrence_interval || 1
    recurrence = [`RRULE:FREQ=DAILY;INTERVAL=${interval}`]
  } else if (task.frequency === 'weekly') {
    const interval = task.recurrence_interval || 1
    recurrence = [`RRULE:FREQ=WEEKLY;INTERVAL=${interval}`]
  } else if (task.frequency === 'monthly') {
    recurrence = [`RRULE:FREQ=MONTHLY`]
  }

  return {
    summary: `${task.name} (${assignedTo})`,
    description: [
      task.description || '',
      `\nAssigned to: ${assignedTo}`,
      task.category ? `Category: ${task.category}` : '',
      task.points ? `Points: ${task.points}` : '',
      `\nManage in ChorePulse: ${process.env.NEXT_PUBLIC_APP_URL}/tasks`
    ].filter(Boolean).join('\n'),
    start: {
      dateTime: startDateTime.toISOString(),
      timeZone: 'America/New_York'
    },
    end: {
      dateTime: endDateTime.toISOString(),
      timeZone: 'America/New_York'
    },
    recurrence,
    colorId: '11', // Blue color for tasks
    extendedProperties: {
      private: {
        chorepulse_task_id: task.id,
        chorepulse_synced: 'true'
      }
    }
  }
}

/**
 * Sync tasks to Google Calendar
 */
export async function syncTasksToCalendar(
  integration: CalendarIntegration,
  tasks: Task[]
): Promise<{ success: boolean; syncedCount: number; error?: string }> {
  try {
    const calendar = createCalendarClient(
      integration.access_token,
      integration.refresh_token
    )

    // Get or create the calendar
    const calendarId = await getOrCreateCalendar(calendar, integration.calendar_name)

    // Get existing events from the calendar
    const now = new Date()
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const oneMonthAhead = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

    const existingEvents = await calendar.events.list({
      calendarId,
      timeMin: oneMonthAgo.toISOString(),
      timeMax: oneMonthAhead.toISOString(),
      privateExtendedProperty: 'chorepulse_synced=true',
      maxResults: 2500
    })

    // Create a map of existing events by task ID
    const existingEventMap = new Map<string, any>()
    existingEvents.data.items?.forEach((event: any) => {
      const taskId = event.extendedProperties?.private?.chorepulse_task_id
      if (taskId) {
        existingEventMap.set(taskId, event)
      }
    })

    let syncedCount = 0

    // Sync each task
    for (const task of tasks) {
      try {
        const event = taskToEvent(task, calendarId)
        const existingEvent = existingEventMap.get(task.id)

        if (existingEvent) {
          // Update existing event
          await calendar.events.update({
            calendarId,
            eventId: existingEvent.id,
            requestBody: event
          })
        } else {
          // Create new event
          await calendar.events.insert({
            calendarId,
            requestBody: event
          })
        }

        syncedCount++
      } catch (taskError) {
        console.error(`Error syncing task ${task.id}:`, taskError)
        // Continue with other tasks
      }
    }

    // Delete events for tasks that no longer exist
    const taskIds = new Set(tasks.map(t => t.id))
    for (const [taskId, event] of existingEventMap.entries()) {
      if (!taskIds.has(taskId)) {
        try {
          await calendar.events.delete({
            calendarId,
            eventId: event.id
          })
        } catch (deleteError) {
          console.error(`Error deleting event for task ${taskId}:`, deleteError)
        }
      }
    }

    return {
      success: true,
      syncedCount
    }
  } catch (error: any) {
    console.error('Error syncing to Google Calendar:', error)
    return {
      success: false,
      syncedCount: 0,
      error: error.message || 'Unknown error'
    }
  }
}

/**
 * Fetch events from user's Google Calendar
 * @param integration - Calendar integration settings
 * @param startDate - Start date for event range
 * @param endDate - End date for event range
 * @returns Array of calendar events
 */
export async function fetchGoogleCalendarEvents(
  integration: CalendarIntegration,
  startDate: Date,
  endDate: Date
): Promise<any[]> {
  try {
    const calendar = createCalendarClient(
      integration.access_token,
      integration.refresh_token
    )

    // Fetch events from primary calendar (user's main Google Calendar)
    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: startDate.toISOString(),
      timeMax: endDate.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
      maxResults: 250
    })

    const events = response.data.items || []

    // Filter out ChorePulse synced events (we already show those as tasks)
    const filteredEvents = events.filter((event: any) => {
      const isChorePulseEvent = event.extendedProperties?.private?.chorepulse_synced === 'true'
      return !isChorePulseEvent
    })

    return filteredEvents
  } catch (error) {
    console.error('Error fetching Google Calendar events:', error)
    throw error
  }
}

/**
 * Refresh access token if needed
 */
export async function refreshAccessToken(
  integration: CalendarIntegration
): Promise<{ accessToken: string; expiresAt: Date } | null> {
  try {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/google-calendar/callback`
    )

    oauth2Client.setCredentials({
      refresh_token: integration.refresh_token
    })

    const { credentials } = await oauth2Client.refreshAccessToken()

    if (!credentials.access_token) {
      return null
    }

    return {
      accessToken: credentials.access_token,
      expiresAt: new Date(credentials.expiry_date || Date.now() + 3600 * 1000)
    }
  } catch (error) {
    console.error('Error refreshing access token:', error)
    return null
  }
}
