import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  sendCampaignEmail,
  recordEmailSend,
  canSendEmail,
  getCampaignSubject
} from '@/lib/email-campaigns'

/**
 * POST /api/campaigns/trigger
 *
 * Trigger a campaign email for a user
 * This is typically called by backend processes or webhooks
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication (service role for backend calls)
    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse request body
    const body = await request.json()
    const { userId, campaignType, customData } = body

    if (!userId || !campaignType) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, campaignType' },
        { status: 400 }
      )
    }

    // Get user data
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select(`
        id,
        name,
        email,
        role,
        organization_id,
        created_at,
        organizations (
          id,
          name
        )
      `)
      .eq('id', userId)
      .single()

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if user has email
    if (!userData.email) {
      return NextResponse.json(
        { error: 'User has no email address' },
        { status: 400 }
      )
    }

    // Check email preferences
    const canSend = await canSendEmail({ supabase, userId, campaignType })
    if (!canSend) {
      return NextResponse.json(
        { message: 'User has opted out of this email type', sent: false },
        { status: 200 }
      )
    }

    // Check if this is an onboarding email and if it's already been sent
    const onboardingCampaigns = [
      'owner_welcome',
      'owner_task_tips',
      'owner_science_upgrade',
      'owner_family_report',
      'owner_momentum',
      'owner_graduation',
      'user_welcome',
      'user_first_task',
      'user_team_update'
    ]

    if (onboardingCampaigns.includes(campaignType)) {
      // Check if already sent
      const { data: existingSend } = await supabase
        .from('email_send_history')
        .select('id')
        .eq('user_id', userId)
        .eq('campaign_type', campaignType)
        .eq('status', 'sent')
        .single()

      if (existingSend) {
        return NextResponse.json(
          { message: 'Campaign already sent to this user', sent: false },
          { status: 200 }
        )
      }
    }

    // Prepare campaign data
    const campaignData: Record<string, any> = {
      userName: userData.name,
      userRole: userData.role,
      familyName: userData.organizations?.name || 'Your Family',
      unsubscribeUrl: `${process.env.NEXT_PUBLIC_APP_URL}/unsubscribe?user=${userId}`,
      ...customData
    }

    // Add role-specific flags
    campaignData.isKidOrTeen = ['kid', 'teen'].includes(userData.role)
    campaignData.isManagerOrParent = ['parent', 'admin'].includes(userData.role)
    campaignData.isFreeUser = customData?.subscriptionTier === 'free'
    campaignData.isTrialUser = customData?.subscriptionTier === 'trial'

    // For owner emails, add owner-specific data
    if (campaignType.startsWith('owner_')) {
      campaignData.parentName = userData.name
    }

    // Generate subject
    const subject = getCampaignSubject(campaignType, campaignData)

    // Send email
    const sent = await sendCampaignEmail({
      campaignType,
      to: userData.email,
      subject,
      data: campaignData
    })

    // Record in history
    await recordEmailSend({
      supabase,
      userId,
      campaignId: null, // We'll add campaign_id when we seed campaigns
      email: userData.email,
      subject,
      campaignType,
      status: sent ? 'sent' : 'failed',
      errorMessage: sent ? undefined : 'Failed to send email'
    })

    if (!sent) {
      return NextResponse.json(
        { error: 'Failed to send email' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      sent: true,
      message: `Campaign ${campaignType} sent to ${userData.email}`
    })
  } catch (error) {
    console.error('Unexpected error in POST /api/campaigns/trigger:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
