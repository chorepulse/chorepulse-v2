import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * PATCH /api/rewards/redemptions/[id]
 * Approve or deny a reward redemption request (managers only)
 * Body: {
 *   action: 'approve' | 'deny'
 *   adminNotes?: string
 * }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id: redemptionId } = await params

    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user's permissions
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

    // Verify user is a manager
    if (!userData.is_account_owner && !userData.is_family_manager) {
      return NextResponse.json(
        { error: 'Insufficient permissions. Only managers can approve/deny rewards.' },
        { status: 403 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { action, adminNotes } = body

    if (!action || !['approve', 'deny'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be "approve" or "deny"' },
        { status: 400 }
      )
    }

    // Get redemption details with user and reward info
    const { data: redemption, error: redemptionError } = await supabase
      .from('reward_redemptions')
      .select(`
        *,
        rewards (id, name, points, organization_id),
        users!reward_redemptions_user_id_fkey (id, name, points, organization_id)
      `)
      .eq('id', redemptionId)
      .single()

    if (redemptionError || !redemption) {
      return NextResponse.json(
        { error: 'Redemption request not found' },
        { status: 404 }
      )
    }

    // Verify redemption is in the same organization
    if (redemption.users.organization_id !== userData.organization_id) {
      return NextResponse.json(
        { error: 'Cannot manage redemptions from other organizations' },
        { status: 403 }
      )
    }

    // Check if already processed
    if (redemption.status !== 'pending') {
      return NextResponse.json(
        { error: `This request has already been ${redemption.status}` },
        { status: 400 }
      )
    }

    const now = new Date().toISOString()

    if (action === 'approve') {
      // Check if user still has enough points
      if (redemption.users.points < redemption.points_spent) {
        return NextResponse.json(
          { error: 'User no longer has enough points for this reward' },
          { status: 400 }
      )
      }

      // Update redemption status
      const { error: updateError } = await supabase
        .from('reward_redemptions')
        .update({
          status: 'approved',
          reviewed_at: now,
          reviewed_by: userData.id,
          admin_notes: adminNotes || null
        })
        .eq('id', redemptionId)

      if (updateError) {
        console.error('Error updating redemption:', updateError)
        return NextResponse.json(
          { error: 'Failed to approve redemption' },
          { status: 500 }
        )
      }

      // Deduct points from user
      const { error: pointsError } = await supabase
        .from('users')
        .update({
          points: redemption.users.points - redemption.points_spent
        })
        .eq('id', redemption.users.id)

      if (pointsError) {
        console.error('Error deducting points:', pointsError)
        // Rollback redemption approval
        await supabase
          .from('reward_redemptions')
          .update({ status: 'pending', reviewed_at: null, reviewed_by: null })
          .eq('id', redemptionId)

        return NextResponse.json(
          { error: 'Failed to deduct points' },
          { status: 500 }
        )
      }

      return NextResponse.json(
        {
          message: `Reward approved! ${redemption.points_spent} points deducted from ${redemption.users.name}.`,
          redemption: {
            id: redemption.id,
            status: 'approved',
            pointsDeducted: redemption.points_spent,
            userNewBalance: redemption.users.points - redemption.points_spent
          }
        },
        { status: 200 }
      )
    } else {
      // Deny the request
      const { error: updateError } = await supabase
        .from('reward_redemptions')
        .update({
          status: 'denied',
          reviewed_at: now,
          reviewed_by: userData.id,
          admin_notes: adminNotes || null
        })
        .eq('id', redemptionId)

      if (updateError) {
        console.error('Error updating redemption:', updateError)
        return NextResponse.json(
          { error: 'Failed to deny redemption' },
          { status: 500 }
        )
      }

      return NextResponse.json(
        {
          message: `Reward request denied.`,
          redemption: {
            id: redemption.id,
            status: 'denied'
          }
        },
        { status: 200 }
      )
    }
  } catch (error) {
    console.error('Unexpected error in PATCH /api/rewards/redemptions/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
