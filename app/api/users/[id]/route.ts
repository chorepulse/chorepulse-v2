import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { type NextRequest } from 'next/server'

/**
 * PATCH /api/users/[id]
 * Update a user's information
 * Only account owners and family managers can update user details
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

    // Get current user's data to check permissions
    const { data: currentUser, error: currentUserError } = await supabase
      .from('users')
      .select('id, organization_id, is_account_owner, is_family_manager')
      .eq('auth_user_id', user.id)
      .single()

    if (currentUserError || !currentUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Get the user to update (await params in Next.js 16)
    const { id: targetUserId } = await params
    const { data: targetUser, error: targetUserError } = await supabase
      .from('users')
      .select('id, organization_id, is_account_owner')
      .eq('id', targetUserId)
      .single()

    if (targetUserError || !targetUser) {
      return NextResponse.json(
        { error: 'Target user not found' },
        { status: 404 }
      )
    }

    // Verify target user is in same organization
    if (targetUser.organization_id !== currentUser.organization_id) {
      return NextResponse.json(
        { error: 'Cannot update users from other organizations' },
        { status: 403 }
      )
    }

    // Check if user has permission to update this user
    // Users can always update their own profile
    // Account owners and family managers can update any user in their organization
    const isUpdatingSelf = currentUser.id === targetUserId
    const hasAdminPermission = currentUser.is_account_owner || currentUser.is_family_manager

    if (!isUpdatingSelf && !hasAdminPermission) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    // Parse request body
    const body = await request.json()
    const {
      name,
      email,
      avatar,
      role,
      color,
      birthday
    } = body

    // Build update object (only include provided fields)
    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (email !== undefined) updateData.email = email
    if (avatar !== undefined) updateData.avatar = avatar
    if (color !== undefined) updateData.color = color
    if (birthday !== undefined) updateData.birthday = birthday

    // Only account owners can update roles
    if (currentUser.is_account_owner && role !== undefined) {
      updateData.role = role
    }

    // Update the user
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', targetUserId)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating user:', updateError)
      return NextResponse.json(
        { error: 'Failed to update user' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      user: updatedUser,
      message: 'User updated successfully'
    })
  } catch (error) {
    console.error('Unexpected error in PATCH /api/users/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/users/[id]
 * Remove a user from the organization
 * Only account owners can delete users
 */
export async function DELETE(
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

    // Get current user's data to check permissions
    const { data: currentUser, error: currentUserError } = await supabase
      .from('users')
      .select('id, organization_id, is_account_owner')
      .eq('auth_user_id', user.id)
      .single()

    if (currentUserError || !currentUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Only account owners can delete users
    if (!currentUser.is_account_owner) {
      return NextResponse.json(
        { error: 'Only account owners can remove family members' },
        { status: 403 }
      )
    }

    // Get the user to delete (await params in Next.js 16)
    const { id: targetUserId } = await params
    const { data: targetUser, error: targetUserError } = await supabase
      .from('users')
      .select('id, organization_id, is_account_owner')
      .eq('id', targetUserId)
      .single()

    if (targetUserError || !targetUser) {
      return NextResponse.json(
        { error: 'Target user not found' },
        { status: 404 }
      )
    }

    // Verify target user is in same organization
    if (targetUser.organization_id !== currentUser.organization_id) {
      return NextResponse.json(
        { error: 'Cannot delete users from other organizations' },
        { status: 403 }
      )
    }

    // Prevent deleting yourself
    if (targetUserId === currentUser.id) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 400 }
      )
    }

    // Prevent deleting the last account owner
    if (targetUser.is_account_owner) {
      const { data: accountOwners, error: ownersError } = await supabase
        .from('users')
        .select('id')
        .eq('organization_id', currentUser.organization_id)
        .eq('is_account_owner', true)

      if (ownersError || !accountOwners || accountOwners.length <= 1) {
        return NextResponse.json(
          { error: 'Cannot delete the last account owner' },
          { status: 400 }
        )
      }
    }

    // Delete the user
    const { error: deleteError } = await supabase
      .from('users')
      .delete()
      .eq('id', targetUserId)

    if (deleteError) {
      console.error('Error deleting user:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete user' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'User deleted successfully'
    })
  } catch (error) {
    console.error('Unexpected error in DELETE /api/users/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
