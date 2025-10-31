/**
 * Email Campaign Utilities
 *
 * Handles rendering email templates with data and sending campaign emails
 */

import { sendEmail } from './email'
import { EMAIL_TEMPLATES } from './email-templates'

/**
 * Simple Mustache-style template renderer
 * Supports {{variable}}, {{#condition}}...{{/condition}}, {{^condition}}...{{/condition}}
 */
export function renderTemplate(template: string, data: Record<string, any>): string {
  let rendered = template

  // Handle conditional blocks: {{#condition}}...{{/condition}}
  rendered = rendered.replace(/\{\{#(\w+)\}\}([\s\S]*?)\{\{\/\1\}\}/g, (match, key, content) => {
    const value = data[key]
    if (Array.isArray(value) && value.length > 0) {
      // Render for each item in array
      return value.map(item => renderTemplate(content, { ...data, ...item })).join('')
    }
    // Render once if truthy
    return value ? renderTemplate(content, data) : ''
  })

  // Handle inverted conditional blocks: {{^condition}}...{{/condition}}
  rendered = rendered.replace(/\{\{\^(\w+)\}\}([\s\S]*?)\{\{\/\1\}\}/g, (match, key, content) => {
    const value = data[key]
    return !value ? renderTemplate(content, data) : ''
  })

  // Handle simple variables: {{variable}}
  rendered = rendered.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    const value = data[key]
    return value !== undefined && value !== null ? String(value) : ''
  })

  return rendered
}

/**
 * Get the appropriate template for a campaign type
 */
export function getTemplate(campaignType: string): string | null {
  const templateMap: Record<string, string> = {
    'owner_welcome': EMAIL_TEMPLATES.OWNER_WELCOME,
    'owner_task_tips': EMAIL_TEMPLATES.OWNER_TASK_TIPS,
    'owner_science_upgrade': EMAIL_TEMPLATES.OWNER_SCIENCE_UPGRADE,
    'owner_family_report': EMAIL_TEMPLATES.OWNER_FAMILY_REPORT,
    'owner_momentum': EMAIL_TEMPLATES.OWNER_MOMENTUM,
    'owner_graduation': EMAIL_TEMPLATES.OWNER_GRADUATION,
    'user_welcome': EMAIL_TEMPLATES.USER_WELCOME,
    'user_first_task': EMAIL_TEMPLATES.USER_FIRST_TASK,
    'user_team_update': EMAIL_TEMPLATES.USER_TEAM_UPDATE,
    'weekly_report': EMAIL_TEMPLATES.WEEKLY_REPORT,
    'trial_renewal_reminder': EMAIL_TEMPLATES.TRIAL_RENEWAL_REMINDER,
    'payment_confirmation': EMAIL_TEMPLATES.PAYMENT_CONFIRMATION,
    'post_payment_encouragement': EMAIL_TEMPLATES.POST_PAYMENT_ENCOURAGEMENT,
  }

  return templateMap[campaignType] || null
}

/**
 * Generate default data for a campaign type
 */
export function getDefaultCampaignData(campaignType: string): Record<string, any> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://chorepulse.com'

  return {
    appUrl,
    // These will be overridden with real data when sending
    parentName: 'Parent',
    userName: 'User',
    familyName: 'Your Family',
    ownerName: 'Family Owner',
    userRole: 'Member',
    unsubscribeUrl: `${appUrl}/unsubscribe`,

    // Pricing (should come from env or config)
    proPricing: '$9.99',
    premiumPricing: '$19.99',
  }
}

/**
 * Send a campaign email
 */
export async function sendCampaignEmail(params: {
  campaignType: string
  to: string
  subject: string
  data: Record<string, any>
}): Promise<boolean> {
  const { campaignType, to, subject, data } = params

  // Get template
  const template = getTemplate(campaignType)
  if (!template) {
    console.error(`Template not found for campaign type: ${campaignType}`)
    return false
  }

  // Merge with default data
  const mergedData = {
    ...getDefaultCampaignData(campaignType),
    ...data
  }

  // Render template
  const html = renderTemplate(template, mergedData)

  // Send email
  return await sendEmail({
    to,
    subject,
    html
  })
}

/**
 * Queue a campaign email for later sending
 */
export async function queueCampaignEmail(params: {
  supabase: any
  userId: string
  campaignId: string
  email: string
  scheduledFor?: Date
  priority?: number
}): Promise<boolean> {
  const {
    supabase,
    userId,
    campaignId,
    email,
    scheduledFor = new Date(),
    priority = 5
  } = params

  try {
    const { error } = await supabase
      .from('email_queue')
      .insert({
        user_id: userId,
        campaign_id: campaignId,
        email,
        scheduled_for: scheduledFor.toISOString(),
        priority,
        status: 'queued'
      })

    if (error) {
      console.error('Failed to queue email:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error queueing email:', error)
    return false
  }
}

/**
 * Record email send in history
 */
export async function recordEmailSend(params: {
  supabase: any
  userId: string
  campaignId: string | null
  email: string
  subject: string
  campaignType: string
  status: 'sent' | 'failed'
  errorMessage?: string
}): Promise<void> {
  const {
    supabase,
    userId,
    campaignId,
    email,
    subject,
    campaignType,
    status,
    errorMessage
  } = params

  try {
    await supabase
      .from('email_send_history')
      .insert({
        user_id: userId,
        campaign_id: campaignId,
        email,
        subject,
        campaign_type: campaignType,
        status,
        sent_at: status === 'sent' ? new Date().toISOString() : null,
        error_message: errorMessage || null
      })
  } catch (error) {
    console.error('Failed to record email send:', error)
  }
}

/**
 * Check if user should receive an email based on preferences
 */
export async function canSendEmail(params: {
  supabase: any
  userId: string
  campaignType: string
}): Promise<boolean> {
  const { supabase, userId, campaignType } = params

  try {
    // Get email preferences
    const { data: prefs, error } = await supabase
      .from('email_preferences')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error || !prefs) {
      // If no preferences, default to allowing
      return true
    }

    // Check if unsubscribed from all
    if (prefs.unsubscribed_all) {
      return false
    }

    // Check specific preference based on campaign type
    const preferenceMap: Record<string, string> = {
      'owner_welcome': 'welcome_emails',
      'owner_task_tips': 'tips_and_encouragement',
      'owner_science_upgrade': 'product_updates',
      'owner_family_report': 'weekly_reports',
      'owner_momentum': 'tips_and_encouragement',
      'owner_graduation': 'welcome_emails',
      'user_welcome': 'welcome_emails',
      'user_first_task': 'tips_and_encouragement',
      'user_team_update': 'weekly_reports',
      'weekly_report': 'weekly_reports',
      'streak_alert': 'streak_reminders',
      'achievement': 'achievements_notifications',
      'referral': 'referral_emails',
    }

    const prefKey = preferenceMap[campaignType]
    if (prefKey && prefs[prefKey] === false) {
      return false
    }

    return true
  } catch (error) {
    console.error('Error checking email preferences:', error)
    // Default to allowing if there's an error
    return true
  }
}

/**
 * Generate subject line for a campaign
 */
export function getCampaignSubject(campaignType: string, data: Record<string, any>): string {
  const subjectMap: Record<string, string> = {
    'owner_welcome': 'Welcome to ChorePulse! Here\'s what to do first 🎉',
    'owner_task_tips': '3 pro tips to create tasks your family will actually complete ✨',
    'owner_science_upgrade': 'Why organized families are happier families 💙',
    'owner_family_report': `📊 Your first family report: ${data.familyName}'s week in review`,
    'owner_momentum': '5 ways to keep your family motivated 💪',
    'owner_graduation': `🎓 You're a ChorePulse Pro! Here's what's next`,
    'user_welcome': `Welcome to ${data.familyName} on ChorePulse! 👋`,
    'user_first_task': 'Ready to earn your first points? 🌟',
    'user_team_update': `See how ${data.familyName} is doing this week! 📈`,
    'weekly_report': `📊 ${data.familyName}'s Weekly Report: ${data.dateRange}`,
    'streak_alert': `🔥 Don't break your ${data.streakDays}-day streak!`,
    'achievement': `🏆 Achievement Unlocked: ${data.achievementName}`,
    'trial_renewal_reminder': '⏰ Your Trial Ends Tomorrow - Important Billing Information',
    'payment_confirmation': '✅ Payment Confirmed - Thank You!',
    'post_payment_encouragement': `🚀 You're All Set! Make the Most of ${data.planName || 'Your Subscription'}`,
  }

  return subjectMap[campaignType] || 'ChorePulse Update'
}
