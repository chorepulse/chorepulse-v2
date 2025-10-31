import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * GET /api/auth/user
 * Get the currently authenticated user's auth information (email, etc)
 * Returns: Auth user object from Supabase Auth
 */
export async function GET() {
  try {
    const supabase = await createClient()

    // Get authenticated user from Supabase Auth
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Return auth user data (includes email, etc)
    return NextResponse.json({
      id: user.id,
      email: user.email,
      emailConfirmedAt: user.email_confirmed_at,
      phone: user.phone,
      createdAt: user.created_at,
      updatedAt: user.updated_at
    })
  } catch (error) {
    console.error('Unexpected error in GET /api/auth/user:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
