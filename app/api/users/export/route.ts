import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { type NextRequest } from 'next/server'

/**
 * GET /api/users/export
 * GDPR Data Export - Allow users to download all their personal data
 * Returns a comprehensive JSON file with all user data
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Verify authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get current user's data
    const { data: currentUser, error: currentUserError } = await supabase
      .from('users')
      .select('*')
      .eq('auth_user_id', user.id)
      .single()

    if (currentUserError || !currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get organization data
    const { data: organization } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', currentUser.organization_id)
      .single()

    // Get all tasks assigned to user
    const { data: tasks } = await supabase
      .from('tasks')
      .select('*')
      .eq('assigned_to', currentUser.id)

    // Get all task completions
    const { data: completions } = await supabase
      .from('task_completions')
      .select('*')
      .eq('user_id', currentUser.id)

    // Get all rewards
    const { data: rewards } = await supabase
      .from('rewards')
      .select('*')
      .eq('user_id', currentUser.id)

    // Get all reward redemptions
    const { data: redemptions } = await supabase
      .from('reward_redemptions')
      .select('*')
      .eq('user_id', currentUser.id)

    // Get all family members in organization (limited info)
    const { data: familyMembers } = await supabase
      .from('users')
      .select('id, name, role, created_at')
      .eq('organization_id', currentUser.organization_id)

    // Compile all data
    const exportData = {
      exportDate: new Date().toISOString(),
      exportType: 'GDPR Data Export',
      user: {
        id: currentUser.id,
        name: currentUser.name,
        username: currentUser.username,
        email: currentUser.email,
        role: currentUser.role,
        avatar: currentUser.avatar,
        color: currentUser.color,
        birthday: currentUser.birthday,
        points: currentUser.points,
        isAccountOwner: currentUser.is_account_owner,
        isFamilyManager: currentUser.is_family_manager,
        createdAt: currentUser.created_at,
        updatedAt: currentUser.updated_at,
        // COPPA consent data (if applicable)
        coppaConsentGiven: currentUser.coppa_consent_given,
        coppaConsentDate: currentUser.coppa_consent_date,
        coppaConsentIp: currentUser.coppa_consent_ip,
        coppaConsentParentEmail: currentUser.coppa_consent_parent_email,
      },
      organization: organization
        ? {
            id: organization.id,
            name: organization.name,
            createdAt: organization.created_at,
          }
        : null,
      familyMembers: familyMembers || [],
      tasks: tasks || [],
      taskCompletions: completions || [],
      rewards: rewards || [],
      rewardRedemptions: redemptions || [],
      statistics: {
        totalTasksCompleted: completions?.length || 0,
        totalPointsEarned: currentUser.points || 0,
        totalRewards: rewards?.length || 0,
        totalRedemptions: redemptions?.length || 0,
      },
    }

    // Return as downloadable JSON file
    return new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="chorepulse-data-export-${currentUser.username}-${new Date().toISOString().split('T')[0]}.json"`,
      },
    })
  } catch (error) {
    console.error('Unexpected error in GET /api/users/export:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
