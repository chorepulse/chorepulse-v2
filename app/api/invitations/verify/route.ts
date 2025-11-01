import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { type NextRequest } from 'next/server'

/**
 * GET /api/invitations/verify
 * Verify an invitation token
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const token = searchParams.get('token')
    const orgId = searchParams.get('org')

    if (!token || !orgId) {
      return NextResponse.json(
        { error: 'Missing token or organization ID' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Find user with this invitation token
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, name, email, role, organization_id, invitation_token_expiry, invitation_status, auth_user_id')
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

    // Get organization name
    const { data: org } = await supabase
      .from('organizations')
      .select('name')
      .eq('id', orgId)
      .single()

    // Get inviter name (account owner or family manager)
    const { data: inviter } = await supabase
      .from('users')
      .select('name')
      .eq('organization_id', orgId)
      .or('is_account_owner.eq.true,is_family_manager.eq.true')
      .limit(1)
      .single()

    return NextResponse.json({
      userName: user.name,
      userEmail: user.email,
      userRole: user.role,
      familyName: org?.name || 'your family',
      inviterName: inviter?.name || 'Your family manager'
    })
  } catch (error) {
    console.error('Error verifying invitation:', error)
    return NextResponse.json(
      { error: 'Failed to verify invitation' },
      { status: 500 }
    )
  }
}
