import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/rewards/redemptions
 * Fetch reward redemption requests
 * Query params:
 * - scope: 'my' (user's own requests) | 'all' (all requests in org - managers only)
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

    const searchParams = request.nextUrl.searchParams
    const scope = searchParams.get('scope') || 'my'
    const status = searchParams.get('status')

    const isManager = userData.is_account_owner || userData.is_family_manager

    // Build query
    let query = supabase
      .from('reward_redemptions')
      .select(`
        id,
        points_spent,
        status,
        notes,
        admin_notes,
        requested_at,
        reviewed_at,
        fulfilled_at,
        rewards (
          id,
          name,
          icon,
          points
        ),
        users!reward_redemptions_user_id_fkey (
          id,
          name,
          username,
          avatar
        )
      `)

    // Filter by scope
    if (scope === 'my') {
      query = query.eq('user_id', userData.id)
    } else if (scope === 'all') {
      if (!isManager) {
        return NextResponse.json(
          { error: 'Insufficient permissions to view all redemptions' },
          { status: 403 }
        )
      }
      // For managers, filter by organization through user relationship
      // This is handled by RLS policies
    } else {
      return NextResponse.json(
        { error: 'Invalid scope parameter' },
        { status: 400 }
      )
    }

    // Filter by status
    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    // Order by most recent
    query = query.order('requested_at', { ascending: false })

    const { data: redemptions, error: redemptionsError } = await query

    if (redemptionsError) {
      console.error('Error fetching redemptions:', redemptionsError)
      return NextResponse.json(
        { error: 'Failed to fetch redemptions' },
        { status: 500 }
      )
    }

    // Transform to match frontend interface
    const transformedRedemptions = redemptions?.map((redemption: any) => ({
      id: redemption.id,
      rewardId: redemption.rewards?.id,
      rewardName: redemption.rewards?.name || 'Unknown Reward',
      rewardIcon: redemption.rewards?.icon || '🎁',
      points: redemption.points_spent,
      requestedBy: redemption.users?.name || redemption.users?.username || 'Unknown',
      requestedById: redemption.users?.id,
      requestedAt: getRelativeTime(redemption.requested_at),
      status: redemption.status,
      notes: redemption.notes,
      adminNotes: redemption.admin_notes,
      reviewedAt: redemption.reviewed_at,
      fulfilledAt: redemption.fulfilled_at
    })) || []

    return NextResponse.json({ redemptions: transformedRedemptions })
  } catch (error) {
    console.error('Unexpected error in GET /api/rewards/redemptions:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper function to get relative time
function getRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins} min${diffMins !== 1 ? 's' : ''} ago`
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`
  if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`

  return date.toLocaleDateString()
}
