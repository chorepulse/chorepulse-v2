import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/family/stats
 * Fetch family-wide statistics for the dashboard
 * Returns:
 * - completionRate: percentage of completed tasks
 * - overdueTasks: count of overdue tasks
 * - completedToday: count of tasks completed today
 * - totalActivePoints: sum of all family member points
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

    // Get user's organization
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

    // Get all family members for point calculation
    const { data: familyMembers, error: familyError } = await supabase
      .from('users')
      .select('id, points')
      .eq('organization_id', userData.organization_id)

    if (familyError) {
      console.error('Error fetching family members:', familyError)
      return NextResponse.json(
        { error: 'Failed to fetch family members' },
        { status: 500 }
      )
    }

    // Calculate total active points
    const totalActivePoints = familyMembers?.reduce((sum, member) => sum + (member.points || 0), 0) || 0

    // Get all tasks for the organization (through family members)
    const familyUserIds = familyMembers?.map(m => m.id) || []

    const { data: allTasks, error: tasksError } = await supabase
      .from('tasks')
      .select(`
        id,
        status,
        frequency,
        due_time,
        task_assignments!inner (
          user_id
        ),
        task_completions (
          id,
          completed_at,
          approved
        )
      `)
      .in('task_assignments.user_id', familyUserIds)
      .eq('status', 'active')

    if (tasksError) {
      console.error('Error fetching tasks:', tasksError)
      return NextResponse.json(
        { error: 'Failed to fetch tasks' },
        { status: 500 }
      )
    }

    // Calculate task statistics
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const todayEnd = new Date(todayStart)
    todayEnd.setDate(todayEnd.getDate() + 1)

    let overdueCount = 0
    let completedTodayCount = 0
    let totalTasksCount = 0
    let completedTasksCount = 0

    allTasks?.forEach((task: any) => {
      totalTasksCount++

      // Check if task has recent completions (approved or not requiring approval)
      const recentCompletions = task.task_completions?.filter((completion: any) => {
        const completedAt = new Date(completion.completed_at)
        return completedAt >= todayStart
      }) || []

      const hasCompletedToday = recentCompletions.some((c: any) => c.approved !== false)

      if (hasCompletedToday) {
        completedTodayCount++
        completedTasksCount++
      } else if (task.frequency === 'daily') {
        // Daily tasks not completed today are overdue
        if (task.due_time) {
          const [hours, minutes] = task.due_time.split(':').map(Number)
          const dueDateTime = new Date(todayStart)
          dueDateTime.setHours(hours, minutes, 0, 0)

          if (now > dueDateTime) {
            overdueCount++
          }
        }
      }
    })

    // Calculate completion rate
    const completionRate = totalTasksCount > 0
      ? Math.round((completedTasksCount / totalTasksCount) * 100)
      : 0

    return NextResponse.json({
      stats: {
        completionRate,
        overdueTasks: overdueCount,
        completedToday: completedTodayCount,
        totalActivePoints,
        totalTasks: totalTasksCount,
        completedTasks: completedTasksCount
      }
    })
  } catch (error) {
    console.error('Unexpected error in GET /api/family/stats:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
