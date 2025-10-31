import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/achievements/check-unlocked
 * Check for newly unlocked achievements that haven't been notified yet
 * Returns list of achievements to celebrate
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

    // Get unlocked achievements that haven't been notified
    const { data: unnotifiedAchievements, error: achError } = await supabase
      .from('user_achievements')
      .select(`
        id,
        unlocked_at,
        achievement_definitions (
          id,
          key,
          name,
          description,
          icon,
          tier,
          points_reward
        )
      `)
      .eq('user_id', userData.id)
      .eq('is_unlocked', true)
      .eq('notified', false)
      .order('unlocked_at', { ascending: false })

    if (achError) {
      console.error('Error fetching unnotified achievements:', achError)
      return NextResponse.json(
        { error: 'Failed to fetch achievements' },
        { status: 500 }
      )
    }

    // Transform to frontend format
    const achievements = unnotifiedAchievements?.map((ua: any) => ({
      id: ua.id,
      achievementId: ua.achievement_definitions?.id,
      key: ua.achievement_definitions?.key,
      name: ua.achievement_definitions?.name,
      description: ua.achievement_definitions?.description,
      icon: ua.achievement_definitions?.icon,
      tier: ua.achievement_definitions?.tier,
      points: ua.achievement_definitions?.points_reward,
      unlockedAt: ua.unlocked_at
    })) || []

    return NextResponse.json({
      achievements,
      count: achievements.length
    })
  } catch (error) {
    console.error('Unexpected error in GET /api/achievements/check-unlocked:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/achievements/mark-notified
 * Mark achievements as notified
 * Body: { achievementIds: string[] }
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
    const { achievementIds } = body

    if (!achievementIds || !Array.isArray(achievementIds)) {
      return NextResponse.json(
        { error: 'Invalid request: achievementIds must be an array' },
        { status: 400 }
      )
    }

    // Mark achievements as notified
    const { error: updateError } = await supabase
      .from('user_achievements')
      .update({ notified: true })
      .in('id', achievementIds)
      .eq('user_id', userData.id)

    if (updateError) {
      console.error('Error marking achievements as notified:', updateError)
      return NextResponse.json(
        { error: 'Failed to update notification status' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Achievements marked as notified',
      count: achievementIds.length
    })
  } catch (error) {
    console.error('Unexpected error in POST /api/achievements/mark-notified:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
