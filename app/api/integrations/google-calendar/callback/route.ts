import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

/**
 * GET /api/integrations/google-calendar/callback
 * Handle Google Calendar OAuth callback
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')

    // Handle OAuth errors
    if (error) {
      console.error('Google OAuth error:', error)
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/settings?tab=integrations&error=oauth_failed`
      )
    }

    if (!code || !state) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/settings?tab=integrations&error=invalid_callback`
      )
    }

    // Decode state parameter
    const stateData = JSON.parse(Buffer.from(state, 'base64').toString())
    const { userId, returnUrl } = stateData

    const supabase = await createClient()

    // Verify user is authenticated and matches state
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user || user.id !== userId) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/settings?tab=integrations&error=unauthorized`
      )
    }

    // Get user's organization and ID
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, organization_id')
      .eq('auth_user_id', user.id)
      .single()

    if (userError || !userData) {
      console.error('Error fetching user data:', {
        error: userError,
        authId: user.id,
        message: userError?.message,
        details: userError?.details,
        hint: userError?.hint
      })
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/settings?tab=integrations&error=user_not_found`
      )
    }

    const chorepulseUserId = userData.id

    // Exchange authorization code for tokens
    const clientId = process.env.GOOGLE_CLIENT_ID
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET
    const appUrl = (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/$/, '') // Remove trailing slash
    const redirectUri = `${appUrl}/api/integrations/google-calendar/callback`

    if (!clientId || !clientSecret) {
      console.error('Google OAuth credentials not configured')
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/settings?tab=integrations&error=not_configured`
      )
    }

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code'
      })
    })

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json()
      console.error('Token exchange failed:', errorData)
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/settings?tab=integrations&error=token_exchange_failed`
      )
    }

    const tokens = await tokenResponse.json()
    const { access_token, refresh_token, expires_in } = tokens

    // Get user's email from Google
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${access_token}`
      }
    })

    let googleEmail = ''
    if (userInfoResponse.ok) {
      const userInfo = await userInfoResponse.json()
      googleEmail = userInfo.email
    }

    // Calculate token expiry
    const tokenExpiry = new Date(Date.now() + expires_in * 1000)

    // Store or update integration in database using admin client to bypass RLS
    const adminClient = createAdminClient()
    const { error: upsertError } = await adminClient
      .from('calendar_integrations')
      .upsert({
        user_id: chorepulseUserId,
        organization_id: userData.organization_id,
        provider: 'google',
        access_token, // TODO: Encrypt in production
        refresh_token, // TODO: Encrypt in production
        token_expiry: tokenExpiry.toISOString(),
        email: googleEmail,
        sync_enabled: true,
        sync_tasks_to_calendar: true,
        sync_calendar_to_tasks: false,
        calendar_name: 'ChorePulse Tasks',
        last_sync_status: 'pending',
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,provider'
      })

    if (upsertError) {
      console.error('Error storing calendar integration:', {
        error: upsertError,
        userId: chorepulseUserId,
        orgId: userData.organization_id
      })
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/settings?tab=integrations&error=storage_failed`
      )
    }

    // Redirect back to settings with success message
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}${returnUrl || '/settings?tab=integrations'}&success=calendar_connected`
    )
  } catch (error) {
    console.error('Unexpected error in GET /api/integrations/google-calendar/callback:', error)
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/settings?tab=integrations&error=unexpected_error`
    )
  }
}
