import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * GET /api/user/current
 * Get the current logged-in user's data
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

    // Get user's data from users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select(`
        id,
        name,
        username,
        email,
        avatar,
        role,
        color,
        is_account_owner,
        is_family_manager,
        points,
        created_at
      `)
      .eq('auth_user_id', user.id)
      .single()

    if (userError || !userData) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Transform the data to match the interface
    const transformedUser = {
      id: userData.id,
      name: userData.name || userData.username || 'Unknown',
      email: userData.email,
      avatar: userData.avatar || 'smile',
      role: userData.role || 'kid',
      color: userData.color || '#3B82F6',
      isAccountOwner: userData.is_account_owner,
      isFamilyManager: userData.is_family_manager,
      points: userData.points || 0,
      joinedDate: userData.created_at
    }

    return NextResponse.json({
      user: transformedUser
    })
  } catch (error) {
    console.error('Unexpected error in GET /api/user/current:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
