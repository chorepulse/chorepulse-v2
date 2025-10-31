import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { syncUserCalendar } from '@/lib/calendar-sync-service'

/**
 * GET /api/tasks/[id]
 * Fetch a specific task by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params

    // Fetch task with assignments
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select(`
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
          user:user_id (
            id,
            name,
            username,
            avatar
          )
        )
      `)
      .eq('id', id)
      .single()

    if (taskError) {
      console.error('Error fetching task:', taskError)
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      )
    }

    // Transform data
    const transformedTask = {
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
      ) || []
    }

    return NextResponse.json({ task: transformedTask })
  } catch (error) {
    console.error('Unexpected error in GET /api/tasks/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/tasks/[id]
 * Update a task
 * Body: Partial task object
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    // Verify user has permission to update tasks
    if (!userData.is_account_owner && !userData.is_family_manager) {
      return NextResponse.json(
        { error: 'Insufficient permissions to update tasks' },
        { status: 403 }
      )
    }

    const { id } = await params
    const body = await request.json()

    // Build update object (map camelCase to snake_case)
    const updateData: any = {}
    if (body.name !== undefined) updateData.name = body.name
    if (body.description !== undefined) updateData.description = body.description
    if (body.category !== undefined) updateData.category = body.category
    if (body.frequency !== undefined) updateData.frequency = body.frequency
    if (body.dueTime !== undefined) updateData.due_time = body.dueTime
    if (body.points !== undefined) updateData.points = body.points
    if (body.status !== undefined) updateData.status = body.status
    if (body.requiresPhoto !== undefined) updateData.requires_photo = body.requiresPhoto
    if (body.requiresApproval !== undefined) updateData.requires_approval = body.requiresApproval

    // Update task
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .update(updateData)
      .eq('id', id)
      .eq('organization_id', userData.organization_id)
      .select()
      .single()

    if (taskError) {
      console.error('Error updating task:', taskError)
      return NextResponse.json(
        { error: 'Failed to update task' },
        { status: 500 }
      )
    }

    // Update assignments if provided
    if (body.assignTo !== undefined) {
      // Delete existing assignments
      await supabase
        .from('task_assignments')
        .delete()
        .eq('task_id', id)

      // Create new assignments
      if (body.assignTo.length > 0) {
        const assignments = body.assignTo.map((userId: string) => ({
          task_id: id,
          user_id: userId,
          assigned_by: userData.id
        }))

        const { error: assignError } = await supabase
          .from('task_assignments')
          .insert(assignments)

        if (assignError) {
          console.error('Error updating task assignments:', assignError)
        } else {
          // Trigger calendar sync for assigned users (fire and forget)
          body.assignTo.forEach((userId: string) => {
            syncUserCalendar(userId).catch((error) => {
              console.error(`Auto-sync failed for user ${userId}:`, error)
              // Silently fail - will be synced by cron job
            })
          })
        }
      }
    }

    return NextResponse.json({
      task,
      message: 'Task updated successfully'
    })
  } catch (error) {
    console.error('Unexpected error in PATCH /api/tasks/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/tasks/[id]
 * Delete a task (only account owners)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
      .select('id, organization_id, is_account_owner')
      .eq('auth_user_id', user.id)
      .single()

    if (userError || !userData) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Verify user has permission to delete tasks (only account owners)
    if (!userData.is_account_owner) {
      return NextResponse.json(
        { error: 'Only account owners can delete tasks' },
        { status: 403 }
      )
    }

    const { id } = await params

    // Delete task (cascade will handle assignments and completions)
    const { error: deleteError } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id)
      .eq('organization_id', userData.organization_id)

    if (deleteError) {
      console.error('Error deleting task:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete task' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Task deleted successfully'
    })
  } catch (error) {
    console.error('Unexpected error in DELETE /api/tasks/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
