import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { type NextRequest } from 'next/server'

/**
 * POST /api/invitations/accept
 * Accept an invitation and set up the user's Supabase Auth account
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, orgId, password } = body

    if (!token || !orgId || !password) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Find user with this invitation token
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, invitation_token_expiry, invitation_status, auth_user_id')
      .eq('invitation_token', token)
      .eq('organization_id', orgId)
      .single()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Invalid invitation token' },
        { status: 404 }
      )
    }

    // Check if already accepted
    if (user.invitation_status === 'accepted' || user.auth_user_id) {
      return NextResponse.json(
        { error: 'This invitation has already been accepted' },
        { status: 400 }
      )
    }

    // Check if expired
    const expiryDate = new Date(user.invitation_token_expiry)
    if (expiryDate < new Date()) {
      return NextResponse.json(
        { error: 'This invitation has expired' },
        { status: 400 }
      )
    }

    if (!user.email) {
      return NextResponse.json(
        { error: 'No email address associated with this invitation' },
        { status: 400 }
      )
    }

    // Create Supabase Auth user
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email: user.email,
      password: password,
      options: {
        data: {
          linked_user_id: user.id // Store reference to our users table
        }
      }
    })

    if (signUpError) {
      console.error('Error creating auth user:', signUpError)
      return NextResponse.json(
        { error: signUpError.message || 'Failed to create account' },
        { status: 500 }
      )
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'Failed to create account' },
        { status: 500 }
      )
    }

    // Update user record with auth_user_id and mark invitation as accepted
    const { error: updateError } = await supabase
      .from('users')
      .update({
        auth_user_id: authData.user.id,
        invitation_status: 'accepted',
        invitation_token: null, // Clear the token
        invitation_token_expiry: null
      })
      .eq('id', user.id)

    if (updateError) {
      console.error('Error updating user record:', updateError)
      // Note: Auth user was created but user record update failed
      // This should be handled in cleanup or monitoring
      return NextResponse.json(
        { error: 'Account created but failed to update user record' },
        { status: 500 }
      )
    }

    // Sign in the user automatically
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: password
    })

    if (signInError) {
      console.error('Error signing in user:', signInError)
      // User account was created successfully, they can sign in manually
      return NextResponse.json({
        message: 'Account created successfully. Please sign in.',
        requiresSignIn: true
      })
    }

    return NextResponse.json({
      message: 'Invitation accepted successfully',
      user: {
        id: user.id,
        email: user.email
      }
    })
  } catch (error) {
    console.error('Error accepting invitation:', error)
    return NextResponse.json(
      { error: 'Failed to accept invitation' },
      { status: 500 }
    )
  }
}
