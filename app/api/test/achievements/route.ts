import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/test/achievements
 * Test endpoint to check achievement definitions and user progress
 */
export async function GET() {
  try {
    const supabase = await createClient()

    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    const authStatus = authError || !user ? 'Not authenticated' : `Authenticated as ${user.email}`

    // Get achievement definitions count
    const { data: definitions, error: defsError, count: defsCount } = await supabase
      .from('achievement_definitions')
      .select('*', { count: 'exact' })
      .limit(5)

    // Get user achievements if authenticated
    let userAchievements = null
    let userAchError = null
    let userId = null

    if (user) {
      const { data: userData } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', user.id)
        .single()

      userId = userData?.id

      if (userId) {
        const result = await supabase
          .from('user_achievements')
          .select('*')
          .eq('user_id', userId)
          .limit(5)

        userAchievements = result.data
        userAchError = result.error
      }
    }

    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      auth: authStatus,
      userId,
      achievementDefinitions: {
        total: defsCount,
        error: defsError?.message,
        sample: definitions?.map(d => ({
          key: d.key,
          name: d.name,
          category: d.category,
          tier: d.tier,
          isActive: d.is_active
        }))
      },
      userProgress: {
        error: userAchError?.message,
        sample: userAchievements?.map(ua => ({
          achievementId: ua.achievement_id,
          progress: ua.progress,
          isUnlocked: ua.is_unlocked
        }))
      }
    })
  } catch (error: any) {
    return NextResponse.json({
      status: 'error',
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}
