import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { type NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'

/**
 * PATCH /api/users/[id]/pin
 * Update a user's PIN
 * - Teens can update their own PIN
 * - Parents (account owners/family managers) can update PINs for kids
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    // Get current user's data
    const { data: currentUser, error: currentUserError } = await supabase
      .from('users')
      .select('id, organization_id, role, is_account_owner, is_family_manager')
      .eq('auth_user_id', user.id)
      .single()

    if (currentUserError || !currentUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Get the target user
    const { id: targetUserId } = await params
    const { data: targetUser, error: targetUserError } = await supabase
      .from('users')
      .select('id, organization_id, role')
      .eq('id', targetUserId)
      .single()

    if (targetUserError || !targetUser) {
      return NextResponse.json(
        { error: 'Target user not found' },
        { status: 404 }
      )
    }

    // Verify same organization
    if (targetUser.organization_id !== currentUser.organization_id) {
      return NextResponse.json(
        { error: 'Cannot update users from other organizations' },
        { status: 403 }
      )
    }

    // Check permissions:
    // - Teens can update their own PIN
    // - Parents can update PINs for kids
    // - Kids cannot update their own PIN
    const isSelf = currentUser.id === targetUserId
    const isParent = currentUser.is_account_owner || currentUser.is_family_manager || currentUser.role === 'adult'
    const canUpdate =
      (isSelf && currentUser.role === 'teen') || // Teens can update own PIN
      (isParent && targetUser.role === 'kid') || // Parents can update kid PINs
      (isParent && targetUser.role === 'teen')   // Parents can update teen PINs

    if (!canUpdate) {
      return NextResponse.json(
        { error: 'Insufficient permissions to update PIN' },
        { status: 403 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { pin } = body

    // Validate PIN
    if (!pin || pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      return NextResponse.json(
        { error: 'PIN must be exactly 4 digits' },
        { status: 400 }
      )
    }

    // Hash the new PIN
    const pinHash = await bcrypt.hash(pin, 10)

    // Update the PIN
    const { error: updateError } = await supabase
      .from('users')
      .update({
        pin_hash: pinHash,
        pin_required: true
      })
      .eq('id', targetUserId)

    if (updateError) {
      console.error('Error updating PIN:', updateError)
      return NextResponse.json(
        { error: 'Failed to update PIN' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'PIN updated successfully'
    })
  } catch (error) {
    console.error('Unexpected error in PATCH /api/users/[id]/pin:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
