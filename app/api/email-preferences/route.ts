import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/email-preferences
 * Get current user's email preferences
 */
export async function GET() {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's internal ID
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, email')
      .eq('auth_user_id', user.id)
      .single()

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get email preferences
    const { data: prefs, error: prefsError } = await supabase
      .from('email_preferences')
      .select('*')
      .eq('user_id', userData.id)
      .single()

    if (prefsError) {
      // If no preferences exist, create defaults
      const { data: newPrefs, error: createError } = await supabase
        .from('email_preferences')
        .insert({
          user_id: userData.id,
          email: userData.email,
          unsubscribe_token: crypto.randomUUID()
        })
        .select()
        .single()

      if (createError) {
        console.error('Failed to create email preferences:', createError)
        return NextResponse.json(
          { error: 'Failed to create preferences' },
          { status: 500 }
        )
      }

      return NextResponse.json({ preferences: newPrefs })
    }

    return NextResponse.json({ preferences: prefs })
  } catch (error) {
    console.error('Unexpected error in GET /api/email-preferences:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/email-preferences
 * Update user's email preferences
 */
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's internal ID
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('auth_user_id', user.id)
      .single()

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Parse request body
    const body = await request.json()
    const {
      welcome_emails,
      weekly_reports,
      tips_and_encouragement,
      achievements_notifications,
      streak_reminders,
      referral_emails,
      product_updates,
      surveys,
      unsubscribed_all
    } = body

    // Build update object (only include provided fields)
    const updates: Record<string, any> = {}
    if (welcome_emails !== undefined) updates.welcome_emails = welcome_emails
    if (weekly_reports !== undefined) updates.weekly_reports = weekly_reports
    if (tips_and_encouragement !== undefined) updates.tips_and_encouragement = tips_and_encouragement
    if (achievements_notifications !== undefined) updates.achievements_notifications = achievements_notifications
    if (streak_reminders !== undefined) updates.streak_reminders = streak_reminders
    if (referral_emails !== undefined) updates.referral_emails = referral_emails
    if (product_updates !== undefined) updates.product_updates = product_updates
    if (surveys !== undefined) updates.surveys = surveys
    if (unsubscribed_all !== undefined) updates.unsubscribed_all = unsubscribed_all

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No preferences provided to update' },
        { status: 400 }
      )
    }

    // Update preferences
    const { data: updatedPrefs, error: updateError } = await supabase
      .from('email_preferences')
      .update(updates)
      .eq('user_id', userData.id)
      .select()
      .single()

    if (updateError) {
      console.error('Failed to update email preferences:', updateError)
      return NextResponse.json(
        { error: 'Failed to update preferences' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      preferences: updatedPrefs
    })
  } catch (error) {
    console.error('Unexpected error in PATCH /api/email-preferences:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
