import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/approvals
 * Fetch pending approvals (task completions + reward redemptions)
 * Only accessible to account owners and family managers
 * Query params:
 * - limit: maximum number of items to return (default: 10)
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

    // Check permissions
    if (!userData.is_account_owner && !userData.is_family_manager) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '10')

    // Get all family member IDs for filtering
    const { data: familyMembers, error: familyError } = await supabase
      .from('users')
      .select('id')
      .eq('organization_id', userData.organization_id)

    if (familyError) {
      console.error('Error fetching family members:', familyError)
      return NextResponse.json(
        { error: 'Failed to fetch family members' },
        { status: 500 }
      )
    }

    const familyUserIds = familyMembers?.map(m => m.id) || []

    // Fetch pending task completions (requires_approval = true, approved = null)
    const { data: taskCompletions, error: taskCompletionsError } = await supabase
      .from('task_completions')
      .select(`
        id,
        completed_at,
        photo_url,
        notes,
        user_id,
        users!task_completions_user_id_fkey (
          id,
          name,
          username,
          avatar
        ),
        tasks (
          id,
          name,
          points,
          requires_photo
        )
      `)
      .in('user_id', familyUserIds)
      .is('approved', null)
      .order('completed_at', { ascending: false })
      .limit(limit)

    if (taskCompletionsError) {
      console.error('Error fetching task completions:', taskCompletionsError)
    }

    // Fetch pending reward redemptions (status = 'pending')
    const { data: rewardRedemptions, error: rewardRedemptionsError } = await supabase
      .from('reward_redemptions')
      .select(`
        id,
        points_spent,
        requested_at,
        notes,
        user_id,
        users!reward_redemptions_user_id_fkey (
          id,
          name,
          username,
          avatar
        ),
        rewards (
          id,
          name,
          icon,
          points
        )
      `)
      .in('user_id', familyUserIds)
      .eq('status', 'pending')
      .order('requested_at', { ascending: false })
      .limit(limit)

    if (rewardRedemptionsError) {
      console.error('Error fetching reward redemptions:', rewardRedemptionsError)
    }

    // Transform task completions to unified format
    const taskApprovals = (taskCompletions || []).map((completion: any) => ({
      id: completion.id,
      type: 'task' as const,
      memberName: completion.users?.name || completion.users?.username || 'Unknown',
      memberAvatar: completion.users?.avatar,
      title: completion.tasks?.name || 'Unknown Task',
      points: completion.tasks?.points || 0,
      requestedAt: completion.completed_at,
      notes: completion.notes,
      photoUrl: completion.photo_url,
      requiresPhoto: completion.tasks?.requires_photo
    }))

    // Transform reward redemptions to unified format
    const rewardApprovals = (rewardRedemptions || []).map((redemption: any) => ({
      id: redemption.id,
      type: 'reward' as const,
      memberName: redemption.users?.name || redemption.users?.username || 'Unknown',
      memberAvatar: redemption.users?.avatar,
      title: redemption.rewards?.name || 'Unknown Reward',
      points: redemption.points_spent,
      requestedAt: redemption.requested_at,
      notes: redemption.notes,
      icon: redemption.rewards?.icon
    }))

    // Combine and sort by requested date
    const allApprovals = [...taskApprovals, ...rewardApprovals]
      .sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime())
      .slice(0, limit)

    // Calculate time ago for each approval
    const now = new Date()
    const approvalsWithTimeAgo = allApprovals.map(approval => {
      const requestedAt = new Date(approval.requestedAt)
      const diffMs = now.getTime() - requestedAt.getTime()
      const diffMins = Math.floor(diffMs / 60000)
      const diffHours = Math.floor(diffMins / 60)
      const diffDays = Math.floor(diffHours / 24)

      let timeAgo: string
      if (diffMins < 1) {
        timeAgo = 'Just now'
      } else if (diffMins < 60) {
        timeAgo = `${diffMins} min${diffMins !== 1 ? 's' : ''} ago`
      } else if (diffHours < 24) {
        timeAgo = `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`
      } else {
        timeAgo = `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`
      }

      return {
        ...approval,
        timeAgo
      }
    })

    return NextResponse.json({
      approvals: approvalsWithTimeAgo,
      count: approvalsWithTimeAgo.length
    })
  } catch (error) {
    console.error('Unexpected error in GET /api/approvals:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
