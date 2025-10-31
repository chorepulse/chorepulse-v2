import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { syncUserCalendar } from '@/lib/calendar-sync-service'

/**
 * GET /api/tasks
 * Fetch tasks for the authenticated user
 * Query params:
 * - scope: 'my' (tasks assigned to user) | 'all' (all family tasks)
 * - category: filter by category (optional)
 * - status: filter by status (optional)
 */
export async function GET(request: NextRequest) {
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

    // Get user's organization and user ID
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, organization_id')
      .eq('auth_user_id', user.id)
      .single()

    if (userError || !userData) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const scope = searchParams.get('scope') || 'my'
    const category = searchParams.get('category')
    const status = searchParams.get('status')

    // Build query based on scope
    // Note: We need to use different query structures for 'my' vs 'all' scopes
    // because filtering on nested relationships requires !inner join

    let selectClause: string

    if (scope === 'my') {
      // For 'my' scope: use !inner join to filter by user assignments
      selectClause = `
        id,
        name,
        description,
        category,
        frequency,
        due_time,
        points,
        status,
        requires_photo,
        requires_approval,
        created_at,
        task_assignments!inner (
          user_id,
          assigned_at,
          is_claimed,
          claimed_at,
          claim_expires_at,
          user:user_id (
            id,
            name,
            username,
            avatar
          )
        ),
        task_completions (
          id,
          completed_at,
          user_id,
          approved
        )
      `
    } else {
      // For 'all' scope: use left join to include tasks without assignments (Extra Credit)
      selectClause = `
        id,
        name,
        description,
        category,
        frequency,
        due_time,
        points,
        status,
        requires_photo,
        requires_approval,
        created_at,
        task_assignments (
          user_id,
          assigned_at,
          is_claimed,
          claimed_at,
          claim_expires_at,
          user:user_id (
            id,
            name,
            username,
            avatar
          )
        ),
        task_completions (
          id,
          completed_at,
          user_id,
          approved
        )
      `
    }

    let query = supabase
      .from('tasks')
      .select(selectClause)
      .eq('organization_id', userData.organization_id)
      .eq('status', 'active')

    // For 'my' scope, filter by user assignments
    if (scope === 'my') {
      query = query.eq('task_assignments.user_id', userData.id)
    }

    // Apply filters
    if (category && category !== 'all') {
      query = query.eq('category', category)
    }

    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    query = query.order('created_at', { ascending: false })

    const { data: tasks, error: tasksError } = await query

    if (tasksError) {
      console.error('Error fetching tasks:', tasksError)
      return NextResponse.json(
        { error: 'Failed to fetch tasks' },
        { status: 500 }
      )
    }

    // Transform data to match frontend interface
    const transformedTasks = tasks?.map((task: any) => {
      // Get today's date at start of day for comparison
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      // Check if task was completed today by current user
      const completedToday = task.task_completions?.some((completion: any) => {
        if (completion.user_id !== userData.id) return false
        const completionDate = new Date(completion.completed_at)
        completionDate.setHours(0, 0, 0, 0)
        return completionDate.getTime() === today.getTime()
      })

      // Check if task is claimed by current user and get claim info
      const now = new Date()
      const userClaim = task.task_assignments?.find((a: any) =>
        a.user_id === userData.id && a.is_claimed &&
        a.claim_expires_at && new Date(a.claim_expires_at) > now
      )

      // Check if task is claimed by someone else
      const otherClaim = task.task_assignments?.find((a: any) =>
        a.user_id !== userData.id && a.is_claimed &&
        a.claim_expires_at && new Date(a.claim_expires_at) > now
      )

      return {
        id: task.id,
        name: task.name,
        description: task.description,
        category: task.category,
        frequency: task.frequency,
        dueTime: task.due_time,
        points: task.points,
        status: task.status,
        requiresPhoto: task.requires_photo,
        requiresApproval: task.requires_approval,
        assignedTo: task.task_assignments?.map((a: any) => a.user_id) || [],
        assignedToNames: task.task_assignments?.map((a: any) =>
          a.user?.name || a.user?.username || 'Unknown'
        ) || [],
        assignments: task.task_assignments?.map((a: any) => ({
          userId: a.user_id,
          assignedAt: a.assigned_at,
          isClaimed: a.is_claimed,
          claimedAt: a.claimed_at,
          claimExpiresAt: a.claim_expires_at,
          user: {
            id: a.user?.id,
            name: a.user?.name || a.user?.username || 'Unknown',
            avatar: a.user?.avatar
          }
        })) || [],
        completions: task.task_completions?.map((c: any) => ({
          id: c.id,
          completedAt: c.completed_at,
          userId: c.user_id,
          approved: c.approved
        })) || [],
        completedToday,
        lastCompletion: task.task_completions?.[0]?.completed_at || null,
        isClaimed: !!userClaim,
        claimExpiresAt: userClaim?.claim_expires_at || null,
        isClaimedByOther: !!otherClaim
      }
    }) || []

    return NextResponse.json({ tasks: transformedTasks })
  } catch (error) {
    console.error('Unexpected error in GET /api/tasks:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/tasks
 * Create a new task
 * Body: {
 *   name: string
 *   description?: string
 *   category: string
 *   frequency: string
 *   dueTime?: string
 *   points: number
 *   requiresPhoto?: boolean
 *   requiresApproval?: boolean
 *   assignTo: string[] (user IDs)
 * }
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

    // Get user's organization and permissions
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, organization_id, is_account_owner, is_family_manager')
      .eq('auth_user_id', user.id)
      .single()

    if (userError || !userData) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Verify user has permission to create tasks
    if (!userData.is_account_owner && !userData.is_family_manager) {
      return NextResponse.json(
        { error: 'Insufficient permissions to create tasks' },
        { status: 403 }
      )
    }

    // Parse request body
    const body = await request.json()
    const {
      name,
      description,
      category,
      frequency,
      dueTime,
      points,
      requiresPhoto = false,
      requiresApproval = false,
      assignTo = [],
      recurrenceInterval,
      recurrenceDayOfWeek,
      recurrenceWeekOfMonth,
      recurrenceDayOfMonth,
      recurrencePattern
    } = body

    // Validate required fields
    if (!name || !category || !frequency || points === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: name, category, frequency, points' },
        { status: 400 }
      )
    }

    // Validate points
    if (points < 0) {
      return NextResponse.json(
        { error: 'Points must be a positive number' },
        { status: 400 }
      )
    }

    // Create task
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .insert({
        organization_id: userData.organization_id,
        name,
        description,
        category,
        frequency,
        due_time: dueTime || null,
        points,
        requires_photo: requiresPhoto,
        requires_approval: requiresApproval,
        status: 'active',
        created_by: userData.id,
        recurrence_interval: recurrenceInterval,
        recurrence_day_of_week: recurrenceDayOfWeek,
        recurrence_week_of_month: recurrenceWeekOfMonth,
        recurrence_day_of_month: recurrenceDayOfMonth,
        recurrence_pattern: recurrencePattern ? JSON.stringify(recurrencePattern) : null
      })
      .select()
      .single()

    if (taskError) {
      console.error('Error creating task:', taskError)
      return NextResponse.json(
        { error: 'Failed to create task' },
        { status: 500 }
      )
    }

    // Create task assignments
    if (assignTo.length > 0) {
      const assignments = assignTo.map((userId: string) => ({
        task_id: task.id,
        user_id: userId,
        assigned_by: userData.id
      }))

      const { error: assignError } = await supabase
        .from('task_assignments')
        .insert(assignments)

      if (assignError) {
        console.error('Error creating task assignments:', assignError)
        // Note: Task was created but assignments failed
        // You may want to delete the task or return partial success
      } else {
        // Trigger calendar sync for each assigned user (fire and forget)
        assignTo.forEach((userId: string) => {
          syncUserCalendar(userId).catch((error) => {
            console.error(`Auto-sync failed for user ${userId}:`, error)
            // Silently fail - will be synced by cron job
          })
        })
      }
    }

    return NextResponse.json(
      {
        task,
        message: 'Task created successfully'
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Unexpected error in POST /api/tasks:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
