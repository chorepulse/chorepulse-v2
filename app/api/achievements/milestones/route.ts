import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/achievements/milestones
 * Fetch user's recent milestones
 * Query params:
 * - limit: number of milestones to fetch (default: 10)
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

    // Get user's internal ID
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

    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '10')

    // Fetch user's milestones
    const { data: milestones, error: milestonesError } = await supabase
      .from('user_milestones')
      .select('*')
      .eq('user_id', userData.id)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (milestonesError) {
      console.error('Error fetching milestones:', milestonesError)
      return NextResponse.json(
        { error: 'Failed to fetch milestones' },
        { status: 500 }
      )
    }

    // Transform to frontend format
    const transformedMilestones = milestones?.map((milestone: any) => ({
      id: milestone.id,
      title: milestone.title,
      description: milestone.description,
      icon: milestone.icon,
      date: milestone.created_at,
      type: milestone.milestone_type,
      referenceId: milestone.reference_id
    })) || []

    return NextResponse.json({
      milestones: transformedMilestones
    })
  } catch (error) {
    console.error('Unexpected error in GET /api/achievements/milestones:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/achievements/milestones
 * Create a new milestone (typically called by the system)
 * Body: {
 *   title: string
 *   description?: string
 *   icon?: string
 *   type: 'achievement' | 'streak' | 'goal' | 'special'
 *   referenceId?: string
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

    // Get user's internal ID
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

    const body = await request.json()
    const { title, description, icon, type, referenceId } = body

    if (!title || !type) {
      return NextResponse.json(
        { error: 'Missing required fields: title, type' },
        { status: 400 }
      )
    }

    // Create milestone
    const { data: milestone, error: createError } = await supabase
      .from('user_milestones')
      .insert({
        user_id: userData.id,
        title,
        description: description || null,
        icon: icon || '🎯',
        milestone_type: type,
        reference_id: referenceId || null
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creating milestone:', createError)
      return NextResponse.json(
        { error: 'Failed to create milestone' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Milestone created',
      milestone: {
        id: milestone.id,
        title: milestone.title,
        description: milestone.description,
        icon: milestone.icon,
        date: milestone.created_at,
        type: milestone.milestone_type
      }
    })
  } catch (error) {
    console.error('Unexpected error in POST /api/achievements/milestones:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
