import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/rewards/templates
 * Fetch reward templates from the library
 * Query params:
 * - category: filter by category (optional)
 * - search: search by name/description (optional)
 *
 * Sorting strategy:
 * - Uses organization's redemption history to personalize template ranking
 * - Falls back to global popularity when insufficient family data (<10 redemptions)
 * - Tracks which reward templates are most redeemed by the organization
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
      .select('organization_id')
      .eq('auth_user_id', user.id)
      .single()

    if (userError || !userData) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const category = searchParams.get('category')
    const search = searchParams.get('search')

    // Build query for templates
    let query = supabase
      .from('reward_templates')
      .select('*')

    // Filter by category
    if (category && category !== 'all') {
      query = query.eq('category', category)
    }

    // Search by name or description
    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`)
    }

    const { data: templates, error: templatesError } = await query

    if (templatesError) {
      console.error('Error fetching templates:', templatesError)
      return NextResponse.json(
        { error: 'Failed to fetch reward templates' },
        { status: 500 }
      )
    }

    // Get organization's reward redemption history
    // We'll match rewards to templates by name similarity
    const { data: orgRewards, error: rewardsError } = await supabase
      .from('rewards')
      .select('id, name')
      .eq('organization_id', userData.organization_id)

    const { data: redemptions, error: redemptionsError } = await supabase
      .from('reward_redemptions')
      .select('reward_id')
      .in('status', ['approved', 'fulfilled'])
      .in('reward_id', orgRewards?.map(r => r.id) || [])

    // Calculate redemption counts by reward name
    const redemptionCounts: Record<string, number> = {}
    let totalRedemptions = 0

    if (!redemptionsError && redemptions && orgRewards) {
      redemptions.forEach((redemption) => {
        const reward = orgRewards.find(r => r.id === redemption.reward_id)
        if (reward) {
          // Normalize reward name for matching
          const normalizedName = reward.name.toLowerCase().trim()
          redemptionCounts[normalizedName] = (redemptionCounts[normalizedName] || 0) + 1
          totalRedemptions++
        }
      })
    }

    // Minimum threshold for using personalized data (10 redemptions)
    const usePersonalizedSorting = totalRedemptions >= 10

    // Transform and calculate personalized popularity
    const transformedTemplates = templates?.map((template: any) => {
      let personalizedPopularity = template.popularity // Start with global popularity

      if (usePersonalizedSorting) {
        // Check if template name matches any redeemed rewards
        const normalizedTemplateName = template.name.toLowerCase().trim()
        const redemptionCount = redemptionCounts[normalizedTemplateName] || 0

        // Calculate personalized score (0-100 based on % of redemptions)
        if (redemptionCount > 0) {
          const percentage = (redemptionCount / totalRedemptions) * 100
          // Blend personalized (70%) with global (30%) to avoid echo chamber
          personalizedPopularity = Math.round((percentage * 0.7) + (template.popularity * 0.3))
        }
      }

      return {
        id: template.id,
        name: template.name,
        description: template.description,
        category: template.category,
        suggestedPoints: template.suggested_points,
        icon: template.icon,
        ageAppropriate: template.age_appropriate,
        popularity: personalizedPopularity,
        globalPopularity: template.popularity,
        isPersonalized: usePersonalizedSorting,
        tags: template.tags
      }
    }) || []

    // Sort by personalized popularity
    transformedTemplates.sort((a, b) => b.popularity - a.popularity)

    return NextResponse.json({
      templates: transformedTemplates,
      meta: {
        totalRedemptions,
        isPersonalized: usePersonalizedSorting
      }
    })
  } catch (error) {
    console.error('Unexpected error in GET /api/rewards/templates:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
