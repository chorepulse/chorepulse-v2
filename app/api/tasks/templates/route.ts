import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/tasks/templates
 * Fetch task templates
 * Query params:
 * - category: filter by category (optional)
 * - ageGroup: filter by age appropriateness (optional)
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

    const searchParams = request.nextUrl.searchParams
    const category = searchParams.get('category')
    const ageGroup = searchParams.get('ageGroup')

    // Build query
    let query = supabase
      .from('task_templates')
      .select('*')
      .eq('is_system', true)
      .order('popularity', { ascending: false })

    // Apply filters
    if (category && category !== 'all') {
      query = query.eq('category', category)
    }

    if (ageGroup) {
      query = query.contains('age_appropriate', [ageGroup])
    }

    const { data: templates, error: templatesError } = await query

    if (templatesError) {
      console.error('Error fetching templates:', templatesError)
      return NextResponse.json(
        { error: 'Failed to fetch templates' },
        { status: 500 }
      )
    }

    // Transform data to match frontend interface
    const transformedTemplates = templates?.map((template: any) => ({
      id: template.id,
      name: template.name,
      description: template.description,
      category: template.category,
      emoji: template.emoji,
      defaultPoints: template.default_points,
      defaultFrequency: template.default_frequency,
      ageAppropriate: template.age_appropriate,
      popularity: template.popularity
    })) || []

    return NextResponse.json({ templates: transformedTemplates })
  } catch (error) {
    console.error('Unexpected error in GET /api/tasks/templates:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
