import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/integrations/google-calendar/connect
 * Initiate Google Calendar OAuth flow
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Google OAuth configuration
    const clientId = process.env.GOOGLE_CLIENT_ID
    const appUrl = (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/$/, '') // Remove trailing slash
    const redirectUri = `${appUrl}/api/integrations/google-calendar/callback`

    if (!clientId) {
      console.error('GOOGLE_CLIENT_ID not configured')
      return NextResponse.json(
        { error: 'Google Calendar integration not configured' },
        { status: 500 }
      )
    }

    // Google Calendar OAuth scopes
    const scopes = [
      'https://www.googleapis.com/auth/calendar', // Full calendar access
      'https://www.googleapis.com/auth/calendar.events', // Events access
      'https://www.googleapis.com/auth/userinfo.email' // User email
    ].join(' ')

    // Generate state parameter for CSRF protection
    const state = Buffer.from(JSON.stringify({
      userId: user.id,
      timestamp: Date.now(),
      returnUrl: request.nextUrl.searchParams.get('returnUrl') || '/settings?tab=integrations'
    })).toString('base64')

    // Build Google OAuth URL
    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
    authUrl.searchParams.set('client_id', clientId)
    authUrl.searchParams.set('redirect_uri', redirectUri)
    authUrl.searchParams.set('response_type', 'code')
    authUrl.searchParams.set('scope', scopes)
    authUrl.searchParams.set('access_type', 'offline') // Get refresh token
    authUrl.searchParams.set('prompt', 'consent') // Force consent to get refresh token
    authUrl.searchParams.set('state', state)

    // Redirect to Google OAuth
    return NextResponse.redirect(authUrl.toString())
  } catch (error) {
    console.error('Unexpected error in GET /api/integrations/google-calendar/connect:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
