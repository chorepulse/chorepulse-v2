import { createAdminClient, createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const authUserId = requestUrl.searchParams.get('userId')

  if (!authUserId) {
    return NextResponse.redirect(new URL('/login?error=Missing user ID', requestUrl.origin))
  }

  try {
    const adminClient = createAdminClient()

    console.log('PIN Login - Creating session for auth_user_id:', authUserId)

    // Get the user from Supabase Auth using their auth_user_id
    const { data: userData, error: userError } = await adminClient.auth.admin.getUserById(authUserId)

    if (userError || !userData.user) {
      console.error('Error getting user:', userError)
      return NextResponse.redirect(new URL('/login?error=User not found', requestUrl.origin))
    }

    console.log('PIN Login - User found:', userData.user.email)

    // Create a server client to establish the session
    const supabase = await createClient()

    // Sign in the user using the admin client to generate a session
    const { data: sessionData, error: sessionError } = await adminClient.auth.admin.generateLink({
      type: 'magiclink',
      email: userData.user.email!,
    })

    if (sessionError || !sessionData) {
      console.error('Error generating magic link:', sessionError)
      return NextResponse.redirect(new URL('/login?error=Failed to create session', requestUrl.origin))
    }

    console.log('PIN Login - Magic link generated successfully')

    // Verify the OTP token to create a session
    const { data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({
      token_hash: sessionData.properties.hashed_token,
      type: 'magiclink',
    })

    if (verifyError || !verifyData.session) {
      console.error('Error verifying OTP:', verifyError)
      return NextResponse.redirect(new URL('/login?error=Failed to verify session', requestUrl.origin))
    }

    console.log('PIN Login - Session created successfully, redirecting to dashboard')

    // Redirect to dashboard
    return NextResponse.redirect(new URL('/dashboard', requestUrl.origin))
  } catch (err) {
    console.error('PIN login error:', err)
    return NextResponse.redirect(new URL('/login?error=Login failed', requestUrl.origin))
  }
}
