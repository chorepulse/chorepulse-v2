import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { type NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import { sendParentalConsentConfirmation } from '@/lib/email'

/**
 * POST /api/users
 * Create a new user in the organization
 * Only account owners and family managers can create users
 */
export async function POST(request: NextRequest) {
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

    // Check if user has permission to create members
    if (!currentUser.is_account_owner && !currentUser.is_family_manager) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { name, email, role, avatar, color, pin, birthday, parentConsent } = body

    // Validate required fields
    if (!name || !role) {
      return NextResponse.json(
        { error: 'Name and role are required' },
        { status: 400 }
      )
    }

    // Validate that adults have email
    if (role === 'adult' && !email) {
      return NextResponse.json(
        { error: 'Email is required for adult members' },
        { status: 400 }
      )
    }

    // Validate that kids/teens have PIN
    if ((role === 'kid' || role === 'teen') && (!pin || pin.length !== 4)) {
      return NextResponse.json(
        { error: '4-digit PIN is required for kids and teens' },
        { status: 400 }
      )
    }

    // Hash PIN if provided
    let pinHash = null
    if (pin && pin.length === 4) {
      pinHash = await bcrypt.hash(pin, 10)
    }

    // Generate username from name
    const baseUsername = name.toLowerCase().replace(/[^a-z0-9]/g, '')
    let username = baseUsername
    let counter = 1

    // Check if username exists and append number if needed
    while (true) {
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('username', username)
        .single()

      if (!existingUser) break
      username = `${baseUsername}${counter}`
      counter++
    }

    // Prepare user data
    const userData: any = {
      organization_id: currentUser.organization_id,
      name,
      username,
      email: email || null,
      role,
      avatar: avatar || 'smile',
      color: color || '#3B82F6',
      is_account_owner: false,
      is_family_manager: false,
      pin_hash: pinHash,
      pin_required: pinHash ? true : false
    }

    // Calculate age if birthday is provided
    let actualAge: number | null = null
    if (birthday) {
      userData.birthday = birthday

      const birthDate = new Date(birthday)
      const today = new Date()
      const age = today.getFullYear() - birthDate.getFullYear()
      const monthDiff = today.getMonth() - birthDate.getMonth()
      actualAge = (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) ? age - 1 : age
    }

    // Add COPPA parental consent data if consent was given for child accounts under 13
    if (parentConsent && actualAge !== null && actualAge < 13) {
      // Get client IP address for consent tracking (COPPA requirement)
      const clientIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'

      userData.coppa_consent_given = true
      userData.coppa_consent_date = new Date().toISOString()
      userData.coppa_consent_ip = clientIp
    }

    // Create the new user
    const { data: newUser, error: createError} = await supabase
      .from('users')
      .insert(userData)
      .select()
      .single()

    if (createError) {
      console.error('Error creating user:', createError)
      return NextResponse.json(
        { error: 'Failed to create user', details: createError },
        { status: 500 }
      )
    }

    // Send parental consent confirmation email if child under 13
    if (parentConsent && actualAge !== null && actualAge < 13 && currentUser) {
      // Get parent's email from current user
      const { data: parentUser } = await supabase
        .from('users')
        .select('email, name')
        .eq('id', currentUser.id)
        .single()

      // Store parent's email in the child's record for COPPA compliance
      if (parentUser?.email && newUser) {
        await supabase
          .from('users')
          .update({ coppa_consent_parent_email: parentUser.email })
          .eq('id', newUser.id)
      }

      if (parentUser?.email) {
        // Get organization name
        const { data: org } = await supabase
          .from('organizations')
          .select('name')
          .eq('id', currentUser.organization_id)
          .single()

        // Send confirmation email (don't block on this)
        sendParentalConsentConfirmation({
          parentEmail: parentUser.email,
          parentName: parentUser.name || 'Parent',
          childName: name,
          childAge: actualAge,
          consentDate: new Date(),
          organizationName: org?.name
        }).catch(err => {
          console.error('Failed to send parental consent email:', err)
          // Don't fail the request if email fails
        })
      }
    }

    return NextResponse.json({
      user: newUser,
      message: 'User created successfully'
    }, { status: 201 })
  } catch (error) {
    console.error('Unexpected error in POST /api/users:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/users
 * Fetch all users in the current user's organization
 * Returns: Array of users with basic info (id, name, role)
 */
export async function GET(request: NextRequest) {
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

    // Get user's organization
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, organization_id')
      .eq('auth_user_id', user.id)
      .single()

    if (userError || !userData) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Fetch all users in the organization with comprehensive data
    const { data: orgUsers, error: orgUsersError } = await supabase
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
        created_at,
        points
      `)
      .eq('organization_id', userData.organization_id)
      .order('created_at', { ascending: true })

    if (orgUsersError) {
      console.error('Error fetching organization users:', orgUsersError)
      return NextResponse.json(
        { error: 'Failed to fetch users', details: orgUsersError },
        { status: 500 }
      )
    }

    // Fetch task completion counts for all users in the organization
    const { data: taskCompletions, error: completionsError } = await supabase
      .from('task_completions')
      .select('user_id')
      .in('user_id', orgUsers?.map(u => u.id) || [])

    // Create a map of user_id to completion count
    const completionCounts = new Map<string, number>()
    if (taskCompletions) {
      taskCompletions.forEach(completion => {
        const count = completionCounts.get(completion.user_id) || 0
        completionCounts.set(completion.user_id, count + 1)
      })
    }

    // Transform user data to include calculated stats
    const transformedUsers = orgUsers?.map((user: any) => {
      // Determine permissions based on role and flags
      const canManage = user.is_account_owner || user.is_family_manager || user.role === 'manager' || user.role === 'adult'

      return {
        id: user.id,
        name: user.name || user.username || 'Unknown',
        email: user.email,
        avatar: user.avatar || 'smile',
        role: user.role || 'kid',
        color: user.color || '#3B82F6',
        isAccountOwner: user.is_account_owner,
        isFamilyManager: user.is_family_manager,
        canManageTasks: canManage,
        canApproveRewards: canManage,
        canManageFamily: user.is_account_owner || user.is_family_manager,
        isActive: true, // All users in the database are active
        joinedDate: user.created_at,
        tasksCompleted: completionCounts.get(user.id) || 0,
        pointsEarned: user.points || 0,
        currentStreak: 0 // TODO: Calculate streaks from task_completions
      }
    }) || []

    return NextResponse.json({
      users: transformedUsers
    })
  } catch (error) {
    console.error('Unexpected error in GET /api/users:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
