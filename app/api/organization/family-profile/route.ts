import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * GET /api/organization/family-profile
 * Fetch the family profile information for the current user's organization
 */
export async function GET() {
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
      .select('organization_id')
      .eq('auth_user_id', user.id)
      .single()

    if (userError || !userData) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Fetch family profile
    const { data: familyProfile, error: profileError } = await supabase
      .from('family_profiles')
      .select('*')
      .eq('organization_id', userData.organization_id)
      .single()

    // If no profile exists yet, return empty profile
    if (profileError || !familyProfile) {
      return NextResponse.json({
        profile: null,
        exists: false
      })
    }

    return NextResponse.json({
      profile: familyProfile,
      exists: true
    })
  } catch (error) {
    console.error('Unexpected error in GET /api/organization/family-profile:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/organization/family-profile
 * Update the family profile information
 */
export async function PATCH(request: Request) {
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
      .select('organization_id, is_account_owner, is_family_manager')
      .eq('auth_user_id', user.id)
      .single()

    if (currentUserError || !currentUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Check permissions
    if (!currentUser.is_account_owner && !currentUser.is_family_manager) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    // Parse request body
    const body = await request.json()
    const {
      family_type,
      household_size,
      age_groups,
      home_type,
      has_yard,
      has_pets,
      pet_types,
      dietary_restrictions,
      food_allergies,
      meal_preferences,
      meals_to_plan,
      task_time_preferences,
      tasks_per_child_per_day,
      task_assignment_style,
      rotate_tasks_weekly,
      preferred_reward_types,
      reward_approval_style,
      reward_point_preference
    } = body

    // Build update object
    const updateData: any = {}
    if (family_type !== undefined) updateData.family_type = family_type
    if (household_size !== undefined) updateData.household_size = household_size
    if (age_groups !== undefined) updateData.age_groups = age_groups
    if (home_type !== undefined) updateData.home_type = home_type
    if (has_yard !== undefined) updateData.has_yard = has_yard
    if (has_pets !== undefined) updateData.has_pets = has_pets
    if (pet_types !== undefined) updateData.pet_types = pet_types
    if (dietary_restrictions !== undefined) updateData.dietary_restrictions = dietary_restrictions
    if (food_allergies !== undefined) updateData.food_allergies = food_allergies
    if (meal_preferences !== undefined) updateData.meal_preferences = meal_preferences
    if (meals_to_plan !== undefined) updateData.meals_to_plan = meals_to_plan
    if (task_time_preferences !== undefined) updateData.task_time_preferences = task_time_preferences
    if (tasks_per_child_per_day !== undefined) updateData.tasks_per_child_per_day = tasks_per_child_per_day
    if (task_assignment_style !== undefined) updateData.task_assignment_style = task_assignment_style
    if (rotate_tasks_weekly !== undefined) updateData.rotate_tasks_weekly = rotate_tasks_weekly
    if (preferred_reward_types !== undefined) updateData.preferred_reward_types = preferred_reward_types
    if (reward_approval_style !== undefined) updateData.reward_approval_style = reward_approval_style
    if (reward_point_preference !== undefined) updateData.reward_point_preference = reward_point_preference

    // Check if profile exists
    const { data: existingProfile } = await supabase
      .from('family_profiles')
      .select('organization_id')
      .eq('organization_id', currentUser.organization_id)
      .single()

    if (existingProfile) {
      // Update existing profile
      const { data: updatedProfile, error: updateError } = await supabase
        .from('family_profiles')
        .update(updateData)
        .eq('organization_id', currentUser.organization_id)
        .select()
        .single()

      if (updateError) {
        console.error('Error updating family profile:', updateError)
        return NextResponse.json(
          { error: 'Failed to update family profile' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        profile: updatedProfile,
        message: 'Family profile updated successfully'
      })
    } else {
      // Create new profile
      const { data: newProfile, error: createError } = await supabase
        .from('family_profiles')
        .insert({
          organization_id: currentUser.organization_id,
          ...updateData
        })
        .select()
        .single()

      if (createError) {
        console.error('Error creating family profile:', createError)
        return NextResponse.json(
          { error: 'Failed to create family profile' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        profile: newProfile,
        message: 'Family profile created successfully'
      })
    }
  } catch (error) {
    console.error('Unexpected error in PATCH /api/organization/family-profile:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
