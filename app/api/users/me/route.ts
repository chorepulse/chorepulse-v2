import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * GET /api/users/me
 * Fetch current user's info including permissions and points
 * Returns: User object with points, permissions, etc.
 */
export async function GET() {
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

    // Get user's full info including birthday
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, name, username, points, is_account_owner, is_family_manager, organization_id, avatar, color, role, birthday, parent_consent_given_at')
      .eq('auth_user_id', user.id)
      .single()

    if (userError || !userData) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Calculate age and age bracket if birthday is provided
    let age = null
    let ageBracket = null

    if (userData.birthday) {
      // Call the Postgres function to get age
      const { data: ageData } = await supabase
        .rpc('get_user_age', { birth_date: userData.birthday })

      if (ageData !== null) {
        age = ageData
      }

      // Call the Postgres function to get age bracket
      const { data: bracketData } = await supabase
        .rpc('get_age_bracket', { birth_date: userData.birthday })

      if (bracketData) {
        ageBracket = bracketData
      }
    }

    // Transform to camelCase for frontend
    return NextResponse.json({
      user: {
        id: userData.id,
        name: userData.name,
        username: userData.username,
        points: userData.points,
        isAccountOwner: userData.is_account_owner,
        isFamilyManager: userData.is_family_manager,
        organizationId: userData.organization_id,
        avatar: userData.avatar,
        color: userData.color,
        role: userData.role,
        birthday: userData.birthday,
        age: age,
        ageBracket: ageBracket,
        parentConsentGivenAt: userData.parent_consent_given_at
      }
    })
  } catch (error) {
    console.error('Unexpected error in GET /api/users/me:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
