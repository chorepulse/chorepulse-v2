import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/tasks/[id]/complete
 * Mark a task as completed
 * Body: {
 *   photoUrl?: string
 *   notes?: string
 * }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id: taskId } = await params

    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user's ID from users table
    const { data: userData, error: userError } = await supabase
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

    // Parse request body
    const body = await request.json()
    const { photoUrl, notes } = body

    // Verify task exists and get task details
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select('id, points, requires_photo, requires_approval')
      .eq('id', taskId)
      .single()

    if (taskError || !task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      )
    }

    // Validate photo requirement
    if (task.requires_photo && !photoUrl) {
      return NextResponse.json(
        { error: 'This task requires a photo' },
        { status: 400 }
      )
    }

    // Create task completion record
    const { data: completion, error: completionError} = await supabase
      .from('task_completions')
      .insert({
        task_id: taskId,
        user_id: userData.id,
        photo_url: photoUrl || null,
        notes: notes || null,
        completed_at: new Date().toISOString(),
        requires_approval: task.requires_approval,
        approved: task.requires_approval ? null : true,
        points_awarded: task.requires_approval ? 0 : task.points
      })
      .select()
      .single()

    if (completionError) {
      console.error('Error creating task completion:', completionError)
      return NextResponse.json(
        { error: 'Failed to complete task' },
        { status: 500 }
      )
    }

    // Check if this task was claimed (temporary assignment) and convert to permanent
    const { data: claimedAssignment } = await supabase
      .from('task_assignments')
      .select('id, is_claimed')
      .eq('task_id', taskId)
      .eq('user_id', userData.id)
      .eq('is_claimed', true)
      .single()

    if (claimedAssignment) {
      // Convert claim to permanent assignment by removing claim fields
      const { error: updateError } = await supabase
        .from('task_assignments')
        .update({
          is_claimed: false,
          claimed_at: null,
          claim_expires_at: null
        })
        .eq('id', claimedAssignment.id)

      if (updateError) {
        console.error('Error converting claim to permanent assignment:', updateError)
        // Don't fail the request, task is still completed
      }
    }

    // If task doesn't require approval, award points immediately
    if (!task.requires_approval) {
      // Fetch current points
      const { data: currentUser, error: fetchError } = await supabase
        .from('users')
        .select('points')
        .eq('id', userData.id)
        .single()

      if (!fetchError && currentUser) {
        const { error: pointsError } = await supabase
          .from('users')
          .update({
            points: (currentUser.points || 0) + task.points
          })
          .eq('id', userData.id)

        if (pointsError) {
          console.error('Error awarding points:', pointsError)
          // Don't fail the request, just log the error
        }
      }
    }

    const message = task.requires_approval
      ? 'Task submitted for approval!'
      : `Task completed! You earned ${task.points} points!`

    return NextResponse.json(
      {
        completion,
        message,
        pointsAwarded: task.requires_approval ? 0 : task.points
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Unexpected error in POST /api/tasks/[id]/complete:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
