import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/rewards/[id]/redeem
 * Redeem a reward with points
 * Body: {
 *   notes?: string
 * }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id: rewardId } = await params

    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user's ID and current points
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, points, organization_id')
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
    const { notes } = body

    // Get reward details
    const { data: reward, error: rewardError } = await supabase
      .from('rewards')
      .select('*')
      .eq('id', rewardId)
      .eq('organization_id', userData.organization_id)
      .single()

    if (rewardError || !reward) {
      return NextResponse.json(
        { error: 'Reward not found' },
        { status: 404 }
      )
    }

    // Check if reward is active
    if (reward.status !== 'active') {
      return NextResponse.json(
        { error: 'This reward is no longer available' },
        { status: 400 }
      )
    }

    // Check if user has enough points
    if (userData.points < reward.points) {
      return NextResponse.json(
        { error: 'Insufficient points' },
        { status: 400 }
      )
    }

    // Check stock quantity
    if (reward.stock_quantity !== null && reward.stock_quantity <= 0) {
      return NextResponse.json(
        { error: 'This reward is out of stock' },
        { status: 400 }
      )
    }

    // Check monthly limit
    if (reward.max_per_month !== null) {
      const now = new Date()
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

      const { data: monthlyRedemptions, error: monthlyError } = await supabase
        .from('reward_redemptions')
        .select('id')
        .eq('reward_id', rewardId)
        .eq('user_id', userData.id)
        .gte('requested_at', firstDayOfMonth.toISOString())
        .in('status', ['pending', 'approved', 'fulfilled'])

      if (monthlyError) {
        console.error('Error checking monthly limit:', monthlyError)
        return NextResponse.json(
          { error: 'Failed to verify redemption eligibility' },
          { status: 500 }
        )
      }

      if (monthlyRedemptions && monthlyRedemptions.length >= reward.max_per_month) {
        return NextResponse.json(
          { error: `You've reached the monthly limit for this reward (${reward.max_per_month} per month)` },
          { status: 400 }
        )
      }
    }

    // Create redemption request
    const { data: redemption, error: redemptionError } = await supabase
      .from('reward_redemptions')
      .insert({
        reward_id: rewardId,
        user_id: userData.id,
        points_spent: reward.points,
        status: reward.requires_approval ? 'pending' : 'approved',
        notes: notes || null,
        requested_at: new Date().toISOString(),
        reviewed_at: reward.requires_approval ? null : new Date().toISOString()
      })
      .select()
      .single()

    if (redemptionError) {
      console.error('Error creating redemption:', redemptionError)
      return NextResponse.json(
        { error: 'Failed to redeem reward' },
        { status: 500 }
      )
    }

    // Deduct points from user (only if doesn't require approval)
    if (!reward.requires_approval) {
      const { error: pointsError } = await supabase
        .from('users')
        .update({
          points: userData.points - reward.points
        })
        .eq('id', userData.id)

      if (pointsError) {
        console.error('Error deducting points:', pointsError)
        // Rollback redemption
        await supabase
          .from('reward_redemptions')
          .delete()
          .eq('id', redemption.id)

        return NextResponse.json(
          { error: 'Failed to process redemption' },
          { status: 500 }
        )
      }
    }

    // Decrease stock quantity if applicable
    if (reward.stock_quantity !== null) {
      const { error: stockError } = await supabase
        .from('rewards')
        .update({
          stock_quantity: reward.stock_quantity - 1
        })
        .eq('id', rewardId)

      if (stockError) {
        console.error('Error updating stock:', stockError)
        // Don't fail the request, just log the error
      }
    }

    const message = reward.requires_approval
      ? 'Reward request submitted for approval!'
      : `Reward redeemed! ${reward.points} points deducted.`

    return NextResponse.json(
      {
        redemption,
        message,
        pointsDeducted: reward.requires_approval ? 0 : reward.points,
        newBalance: reward.requires_approval ? userData.points : userData.points - reward.points
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Unexpected error in POST /api/rewards/[id]/redeem:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
