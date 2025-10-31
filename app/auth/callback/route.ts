import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const tokenHash = requestUrl.searchParams.get('token_hash')
  const type = requestUrl.searchParams.get('type')
  const next = requestUrl.searchParams.get('next') || '/dashboard'

  const supabase = await createClient()

  // Handle email confirmation code exchange
  if (code) {
    // Exchange the code for a session
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // Successfully confirmed email, redirect to dashboard or specified next page
      return NextResponse.redirect(new URL(next, requestUrl.origin))
    }
  }

  // Handle magic link token verification (for PIN login)
  if (tokenHash && type === 'magiclink') {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: 'magiclink',
    })

    if (!error) {
      console.log('Auth callback - Magic link verified successfully')
      return NextResponse.redirect(new URL(next, requestUrl.origin))
    } else {
      console.error('Auth callback - Magic link verification failed:', error)
    }
  }

  // If there's an error or no code/token, redirect to login with error
  return NextResponse.redirect(
    new URL('/login?error=Could not verify authentication', requestUrl.origin)
  )
}
