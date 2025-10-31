import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/rewards
 * Fetch all active rewards for the user's organization
 * Returns: Array of rewards
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

    // Fetch all active rewards for the organization
    const { data: rewards, error: rewardsError } = await supabase
      .from('rewards')
      .select('*')
      .eq('organization_id', userData.organization_id)
      .eq('status', 'active')
      .order('category', { ascending: true })
      .order('points', { ascending: true })

    if (rewardsError) {
      console.error('Error fetching rewards:', rewardsError)
      return NextResponse.json(
        { error: 'Failed to fetch rewards' },
        { status: 500 }
      )
    }

    // Transform to camelCase for frontend
    const transformedRewards = rewards?.map((reward: any) => ({
      id: reward.id,
      name: reward.name,
      description: reward.description,
      points: reward.points,
      category: reward.category,
      icon: reward.icon,
      stockQuantity: reward.stock_quantity,
      maxPerMonth: reward.max_per_month,
      ageRestriction: reward.age_restriction,
      requiresApproval: reward.requires_approval,
      status: reward.status,
      available: reward.status === 'active' && (reward.stock_quantity === null || reward.stock_quantity > 0)
    })) || []

    return NextResponse.json({ rewards: transformedRewards })
  } catch (error) {
    console.error('Unexpected error in GET /api/rewards:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/rewards
 * Create a new reward (managers only)
 * Body: {
 *   name: string
 *   description?: string
 *   points: number
 *   category: string
 *   icon?: string
 *   stockQuantity?: number
 *   maxPerMonth?: number
 *   ageRestriction?: string[]
 *   requiresApproval?: boolean
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

    // Verify user has permission to create rewards
    if (!userData.is_account_owner && !userData.is_family_manager) {
      return NextResponse.json(
        { error: 'Insufficient permissions to create rewards' },
        { status: 403 }
      )
    }

    // Parse request body
    const body = await request.json()
    const {
      name,
      description,
      points,
      category,
      icon = '🎁',
      stockQuantity,
      maxPerMonth,
      ageRestriction,
      requiresApproval = true
    } = body

    // Validate required fields
    if (!name || !category || points === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: name, category, points' },
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

    // Create reward
    const { data: reward, error: rewardError } = await supabase
      .from('rewards')
      .insert({
        organization_id: userData.organization_id,
        name,
        description,
        points,
        category,
        icon,
        stock_quantity: stockQuantity || null,
        max_per_month: maxPerMonth || null,
        age_restriction: ageRestriction || null,
        requires_approval: requiresApproval,
        status: 'active',
        created_by: userData.id
      })
      .select()
      .single()

    if (rewardError) {
      console.error('Error creating reward:', rewardError)
      return NextResponse.json(
        { error: 'Failed to create reward' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        reward,
        message: 'Reward created successfully'
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Unexpected error in POST /api/rewards:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
