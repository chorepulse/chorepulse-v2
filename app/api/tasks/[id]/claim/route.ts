import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/tasks/[id]/claim
 * Claim an Extra Credit task (unassigned task)
 * Creates a temporary assignment that expires in 24 hours
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
      .select('id, organization_id')
      .eq('auth_user_id', user.id)
      .single()

    if (userError || !userData) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Verify task exists and is in the same organization
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select('id, name, organization_id, status')
      .eq('id', taskId)
      .single()

    if (taskError || !task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      )
    }

    if (task.organization_id !== userData.organization_id) {
      return NextResponse.json(
        { error: 'Task not found in your organization' },
        { status: 404 }
      )
    }

    if (task.status !== 'active') {
      return NextResponse.json(
        { error: 'Task is not active' },
        { status: 400 }
      )
    }

    // Check if task already has active assignments (not expired)
    const { data: existingAssignments, error: assignError } = await supabase
      .from('task_assignments')
      .select('id, user_id, is_claimed, claim_expires_at')
      .eq('task_id', taskId)

    if (assignError) {
      console.error('Error checking assignments:', assignError)
      return NextResponse.json(
        { error: 'Failed to check task assignments' },
        { status: 500 }
      )
    }

    // Check if there are any active (non-expired) claims or permanent assignments
    const now = new Date()
    const activeAssignments = existingAssignments?.filter((a: any) => {
      // Permanent assignment (not a claim)
      if (!a.is_claimed) return true
      // Claimed but not expired
      if (a.claim_expires_at && new Date(a.claim_expires_at) > now) return true
      return false
    })

    if (activeAssignments && activeAssignments.length > 0) {
      // Check if user already has this task claimed/assigned
      const userAssignment = activeAssignments.find((a: any) => a.user_id === userData.id)
      if (userAssignment) {
        return NextResponse.json(
          { error: 'You have already claimed this task' },
          { status: 400 }
        )
      }

      return NextResponse.json(
        { error: 'This task has already been claimed by someone else' },
        { status: 400 }
      )
    }

    // Delete any expired claims for this task
    const expiredClaims = existingAssignments?.filter((a: any) =>
      a.is_claimed && a.claim_expires_at && new Date(a.claim_expires_at) <= now
    )

    if (expiredClaims && expiredClaims.length > 0) {
      await supabase
        .from('task_assignments')
        .delete()
        .in('id', expiredClaims.map((a: any) => a.id))
    }

    // Create claim (expires in 24 hours)
    const claimExpiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000) // 24 hours from now

    const { data: claim, error: claimError } = await supabase
      .from('task_assignments')
      .insert({
        task_id: taskId,
        user_id: userData.id,
        assigned_by: userData.id, // Self-assigned
        is_claimed: true,
        claimed_at: now.toISOString(),
        claim_expires_at: claimExpiresAt.toISOString()
      })
      .select()
      .single()

    if (claimError) {
      console.error('Error creating claim:', claimError)
      return NextResponse.json(
        { error: 'Failed to claim task' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        claim,
        message: `Task claimed! You have 24 hours to complete it.`,
        expiresAt: claimExpiresAt.toISOString()
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Unexpected error in POST /api/tasks/[id]/claim:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/tasks/[id]/claim
 * Unclaim a task (remove your claim before it expires)
 */
export async function DELETE(
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

    // Delete the claim (only if it's a claim, not a permanent assignment)
    const { error: deleteError } = await supabase
      .from('task_assignments')
      .delete()
      .eq('task_id', taskId)
      .eq('user_id', userData.id)
      .eq('is_claimed', true)

    if (deleteError) {
      console.error('Error removing claim:', deleteError)
      return NextResponse.json(
        { error: 'Failed to remove claim' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { message: 'Task unclaimed successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Unexpected error in DELETE /api/tasks/[id]/claim:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
