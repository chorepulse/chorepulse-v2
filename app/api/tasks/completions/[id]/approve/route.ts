import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/tasks/completions/[id]/approve
 * Approve or reject a task completion
 * Body: {
 *   approved: boolean
 *   notes?: string
 * }
 */
export async function POST(
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

    // Get user data and verify permissions
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

    // Verify user has permission to approve completions
    if (!userData.is_account_owner && !userData.is_family_manager) {
      return NextResponse.json(
        { error: 'Only account owners and family managers can approve tasks' },
        { status: 403 }
      )
    }

    const { id: completionId } = await params
    const body = await request.json()
    const { approved, notes } = body

    if (typeof approved !== 'boolean') {
      return NextResponse.json(
        { error: 'Missing required field: approved (boolean)' },
        { status: 400 }
      )
    }

    // Fetch completion with task details
    const { data: completion, error: completionError } = await supabase
      .from('task_completions')
      .select(`
        id,
        user_id,
        task_id,
        requires_approval,
        approved,
        tasks!inner (
          id,
          organization_id,
          points
        )
      `)
      .eq('id', completionId)
      .single()

    if (completionError || !completion) {
      return NextResponse.json(
        { error: 'Completion not found' },
        { status: 404 }
      )
    }

    // Verify completion is in same organization
    if (completion.tasks.organization_id !== userData.organization_id) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Verify completion requires approval and hasn't been approved yet
    if (!completion.requires_approval) {
      return NextResponse.json(
        { error: 'This completion does not require approval' },
        { status: 400 }
      )
    }

    if (completion.approved !== null) {
      return NextResponse.json(
        { error: 'This completion has already been reviewed' },
        { status: 400 }
      )
    }

    // Update completion
    const { data: updatedCompletion, error: updateError } = await supabase
      .from('task_completions')
      .update({
        approved,
        approved_by: userData.id,
        approved_at: new Date().toISOString(),
        approval_notes: notes || null,
        points_awarded: approved ? completion.tasks.points : 0
      })
      .eq('id', completionId)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating completion:', updateError)
      return NextResponse.json(
        { error: 'Failed to update completion' },
        { status: 500 }
      )
    }

    // If approved, award points to user
    if (approved) {
      const { error: pointsError } = await supabase.rpc('increment_user_points', {
        user_id_param: completion.user_id,
        points_param: completion.tasks.points
      })

      if (pointsError) {
        console.error('Error awarding points:', pointsError)
        // Note: Approval was recorded but points not awarded
      }
    }

    return NextResponse.json({
      completion: updatedCompletion,
      message: approved
        ? `Task approved! ${completion.tasks.points} points awarded.`
        : 'Task rejected.',
      pointsAwarded: approved ? completion.tasks.points : 0
    })
  } catch (error) {
    console.error('Unexpected error in POST /api/tasks/completions/[id]/approve:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
