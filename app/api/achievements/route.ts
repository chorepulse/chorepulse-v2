import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/achievements
 * Fetch user's achievements with progress
 * Query params:
 * - category: filter by category (optional)
 * - status: 'unlocked' | 'locked' | 'all' (default: 'all')
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
      .select('id, points')
      .eq('auth_user_id', user.id)
      .single()

    if (userError || !userData) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const category = searchParams.get('category')
    const status = searchParams.get('status') || 'all'

    // Build query for achievement definitions
    let defsQuery = supabase
      .from('achievement_definitions')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })

    // Filter by category
    if (category && category !== 'all') {
      defsQuery = defsQuery.eq('category', category)
    }

    const { data: definitions, error: defsError } = await defsQuery

    if (defsError) {
      console.error('Error fetching achievement definitions:', defsError)
      return NextResponse.json(
        { error: 'Failed to fetch achievements' },
        { status: 500 }
      )
    }

    // Get user's achievement progress
    const { data: userAchievements, error: userAchError } = await supabase
      .from('user_achievements')
      .select('*')
      .eq('user_id', userData.id)

    if (userAchError) {
      console.error('Error fetching user achievements:', userAchError)
      return NextResponse.json(
        { error: 'Failed to fetch user progress' },
        { status: 500 }
      )
    }

    // Create a map of user progress by achievement_id
    const progressMap = new Map()
    userAchievements?.forEach((ua: any) => {
      progressMap.set(ua.achievement_id, ua)
    })

    // Combine definitions with user progress
    const achievements = definitions?.map((def: any) => {
      const userProgress = progressMap.get(def.id)
      const progress = userProgress?.progress || 0
      const isUnlocked = userProgress?.is_unlocked || false
      const unlockedDate = userProgress?.unlocked_at

      return {
        id: def.id,
        key: def.key,
        name: def.name,
        description: def.description,
        icon: def.icon,
        category: def.category,
        tier: def.tier,
        progress,
        maxProgress: def.max_progress,
        isUnlocked,
        unlockedDate,
        points: def.points_reward
      }
    }) || []

    // Filter by status
    const filteredAchievements = achievements.filter((a: any) => {
      if (status === 'unlocked') return a.isUnlocked
      if (status === 'locked') return !a.isUnlocked
      return true
    })

    // Calculate summary stats
    const unlockedCount = achievements.filter((a: any) => a.isUnlocked).length
    const totalAchievementPoints = achievements
      .filter((a: any) => a.isUnlocked)
      .reduce((sum: number, a: any) => sum + a.points, 0)
    const completionPercentage = Math.round((unlockedCount / achievements.length) * 100)

    // Get tier breakdown
    const tierBreakdown = {
      bronze: achievements.filter((a: any) => a.isUnlocked && a.tier === 'bronze').length,
      silver: achievements.filter((a: any) => a.isUnlocked && a.tier === 'silver').length,
      gold: achievements.filter((a: any) => a.isUnlocked && a.tier === 'gold').length,
      platinum: achievements.filter((a: any) => a.isUnlocked && a.tier === 'platinum').length
    }

    return NextResponse.json({
      achievements: filteredAchievements,
      summary: {
        total: achievements.length,
        unlocked: unlockedCount,
        locked: achievements.length - unlockedCount,
        completionPercentage,
        totalPoints: totalAchievementPoints,
        currentUserPoints: userData.points,
        tierBreakdown
      }
    })
  } catch (error) {
    console.error('Unexpected error in GET /api/achievements:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
