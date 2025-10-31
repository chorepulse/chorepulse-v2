import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/tasks/suggestions
 *
 * Returns personalized task suggestions based on:
 * - Household data (pets, home features, age groups, vehicles)
 * - Property data (pool, fireplace, etc.)
 * - Current task gaps (underrepresented categories)
 * - Age-appropriate tasks for family members
 */

interface TaskSuggestion {
  name: string
  description: string
  category: string
  emoji: string
  defaultPoints: number
  defaultFrequency: string
  reason: string // Why this task is suggested
  ageAppropriate: string[]
  priority: number // 1-5, higher = more relevant
}

export async function GET() {
  try {
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's organization_id
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('organization_id')
      .eq('auth_user_id', user.id)
      .single()

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get organization data (household info + property data)
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select(`
        has_pets,
        pet_types,
        home_features,
        age_groups,
        number_of_cars,
        number_of_bikes,
        has_pool,
        has_fireplace,
        has_garage,
        property_type
      `)
      .eq('id', userData.organization_id)
      .single()

    if (orgError || !org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    // Get existing tasks to identify gaps
    const { data: existingTasks } = await supabase
      .from('tasks')
      .select('category, name')
      .eq('organization_id', userData.organization_id)

    const existingCategories = new Set(existingTasks?.map(t => t.category) || [])
    const existingTaskNames = new Set(existingTasks?.map(t => t.name.toLowerCase()) || [])

    // Get family members for age-appropriate filtering
    const { data: familyMembers } = await supabase
      .from('users')
      .select('role')
      .eq('organization_id', userData.organization_id)

    const hasKids = familyMembers?.some(m => m.role === 'kid') || false
    const hasTeens = familyMembers?.some(m => m.role === 'teen') || false

    // Build suggestions array
    const suggestions: TaskSuggestion[] = []

    // ========== PET-BASED SUGGESTIONS ==========
    if (org.has_pets && org.pet_types?.length > 0) {
      const petTypes = org.pet_types as string[]

      if (petTypes.includes('dog')) {
        if (!existingTaskNames.has('walk the dog')) {
          suggestions.push({
            name: 'Walk the Dog',
            description: 'Take the dog for a walk around the neighborhood',
            category: 'pet_care',
            emoji: '🐕',
            defaultPoints: 15,
            defaultFrequency: 'daily',
            reason: 'You have a dog in your household',
            ageAppropriate: ['teen', 'adult'],
            priority: 5
          })
        }

        if (!existingTaskNames.has('feed the dog')) {
          suggestions.push({
            name: 'Feed the Dog',
            description: 'Fill food and water bowls',
            category: 'pet_care',
            emoji: '🐕',
            defaultPoints: 5,
            defaultFrequency: 'daily',
            reason: 'You have a dog in your household',
            ageAppropriate: ['kid', 'teen', 'adult'],
            priority: 5
          })
        }
      }

      if (petTypes.includes('cat')) {
        if (!existingTaskNames.has('clean litter box')) {
          suggestions.push({
            name: 'Clean Litter Box',
            description: 'Scoop and clean the cat litter box',
            category: 'pet_care',
            emoji: '🐱',
            defaultPoints: 10,
            defaultFrequency: 'daily',
            reason: 'You have a cat in your household',
            ageAppropriate: ['teen', 'adult'],
            priority: 5
          })
        }

        if (!existingTaskNames.has('feed the cat')) {
          suggestions.push({
            name: 'Feed the Cat',
            description: 'Fill food and water bowls',
            category: 'pet_care',
            emoji: '🐱',
            defaultPoints: 5,
            defaultFrequency: 'daily',
            reason: 'You have a cat in your household',
            ageAppropriate: ['kid', 'teen', 'adult'],
            priority: 5
          })
        }
      }

      if (petTypes.includes('fish')) {
        if (!existingTaskNames.has('feed the fish')) {
          suggestions.push({
            name: 'Feed the Fish',
            description: 'Feed fish and check water levels',
            category: 'pet_care',
            emoji: '🐠',
            defaultPoints: 5,
            defaultFrequency: 'daily',
            reason: 'You have fish in your household',
            ageAppropriate: ['kid', 'teen', 'adult'],
            priority: 4
          })
        }
      }

      if (petTypes.includes('bird')) {
        if (!existingTaskNames.has('clean bird cage')) {
          suggestions.push({
            name: 'Clean Bird Cage',
            description: 'Clean cage and replace liner',
            category: 'pet_care',
            emoji: '🐦',
            defaultPoints: 15,
            defaultFrequency: 'weekly',
            reason: 'You have a bird in your household',
            ageAppropriate: ['teen', 'adult'],
            priority: 4
          })
        }
      }
    }

    // ========== POOL-BASED SUGGESTIONS ==========
    if (org.has_pool === true || org.home_features?.includes('pool')) {
      if (!existingTaskNames.has('skim pool')) {
        suggestions.push({
          name: 'Skim Pool',
          description: 'Remove leaves and debris from pool surface',
          category: 'outdoor',
          emoji: '🏊',
          defaultPoints: 15,
          defaultFrequency: 'daily',
          reason: 'You have a pool',
          ageAppropriate: ['teen', 'adult'],
          priority: 5
        })
      }

      if (!existingTaskNames.has('check pool chemicals')) {
        suggestions.push({
          name: 'Check Pool Chemicals',
          description: 'Test and adjust pool pH and chlorine levels',
          category: 'maintenance',
          emoji: '🧪',
          defaultPoints: 20,
          defaultFrequency: 'weekly',
          reason: 'Pool maintenance is essential for safety',
          ageAppropriate: ['adult'],
          priority: 5
        })
      }

      if (!existingTaskNames.has('vacuum pool')) {
        suggestions.push({
          name: 'Vacuum Pool',
          description: 'Vacuum pool floor and walls',
          category: 'outdoor',
          emoji: '🏊',
          defaultPoints: 25,
          defaultFrequency: 'weekly',
          reason: 'You have a pool',
          ageAppropriate: ['teen', 'adult'],
          priority: 4
        })
      }
    }

    // ========== HOT TUB SUGGESTIONS ==========
    if (org.home_features?.includes('hot_tub')) {
      if (!existingTaskNames.has('clean hot tub filter')) {
        suggestions.push({
          name: 'Clean Hot Tub Filter',
          description: 'Remove and rinse hot tub filter',
          category: 'maintenance',
          emoji: '🛁',
          defaultPoints: 15,
          defaultFrequency: 'weekly',
          reason: 'You have a hot tub',
          ageAppropriate: ['adult'],
          priority: 4
        })
      }
    }

    // ========== FIREPLACE SUGGESTIONS ==========
    if (org.has_fireplace === true || org.home_features?.includes('fireplace')) {
      if (!existingTaskNames.has('clean fireplace')) {
        suggestions.push({
          name: 'Clean Fireplace',
          description: 'Remove ash and debris from fireplace',
          category: 'cleaning',
          emoji: '🔥',
          defaultPoints: 20,
          defaultFrequency: 'weekly',
          reason: 'You have a fireplace',
          ageAppropriate: ['teen', 'adult'],
          priority: 3
        })
      }

      if (!existingTaskNames.has('stock firewood')) {
        suggestions.push({
          name: 'Stock Firewood',
          description: 'Bring firewood inside and stack near fireplace',
          category: 'outdoor',
          emoji: '🪵',
          defaultPoints: 15,
          defaultFrequency: 'weekly',
          reason: 'You have a fireplace',
          ageAppropriate: ['teen', 'adult'],
          priority: 3
        })
      }
    }

    // ========== GARDEN/YARD SUGGESTIONS ==========
    if (org.home_features?.includes('garden')) {
      if (!existingTaskNames.has('water plants')) {
        suggestions.push({
          name: 'Water Plants',
          description: 'Water garden plants and flowers',
          category: 'outdoor',
          emoji: '🌱',
          defaultPoints: 10,
          defaultFrequency: 'daily',
          reason: 'You have a garden',
          ageAppropriate: ['kid', 'teen', 'adult'],
          priority: 4
        })
      }

      if (!existingTaskNames.has('weed garden')) {
        suggestions.push({
          name: 'Weed Garden',
          description: 'Pull weeds from garden beds',
          category: 'outdoor',
          emoji: '🌿',
          defaultPoints: 20,
          defaultFrequency: 'weekly',
          reason: 'You have a garden',
          ageAppropriate: ['teen', 'adult'],
          priority: 3
        })
      }
    }

    // ========== INDOOR PLANTS SUGGESTIONS ==========
    if (org.home_features?.includes('indoor_plants')) {
      if (!existingTaskNames.has('water indoor plants')) {
        suggestions.push({
          name: 'Water Indoor Plants',
          description: 'Water all indoor plants',
          category: 'cleaning',
          emoji: '🪴',
          defaultPoints: 10,
          defaultFrequency: 'weekly',
          reason: 'You have indoor plants',
          ageAppropriate: ['kid', 'teen', 'adult'],
          priority: 4
        })
      }
    }

    // ========== VEHICLE SUGGESTIONS ==========
    if (org.number_of_cars && org.number_of_cars > 0) {
      if (!existingTaskNames.has('wash car')) {
        suggestions.push({
          name: 'Wash Car',
          description: 'Wash and dry the car',
          category: 'outdoor',
          emoji: '🚗',
          defaultPoints: 25,
          defaultFrequency: 'weekly',
          reason: `You have ${org.number_of_cars} car${org.number_of_cars > 1 ? 's' : ''}`,
          ageAppropriate: ['teen', 'adult'],
          priority: 3
        })
      }

      if (!existingTaskNames.has('vacuum car')) {
        suggestions.push({
          name: 'Vacuum Car',
          description: 'Vacuum car interior',
          category: 'cleaning',
          emoji: '🚗',
          defaultPoints: 15,
          defaultFrequency: 'weekly',
          reason: `You have ${org.number_of_cars} car${org.number_of_cars > 1 ? 's' : ''}`,
          ageAppropriate: ['teen', 'adult'],
          priority: 3
        })
      }
    }

    if (org.number_of_bikes && org.number_of_bikes > 0) {
      if (!existingTaskNames.has('clean bike')) {
        suggestions.push({
          name: 'Clean Bike',
          description: 'Wipe down and check bike condition',
          category: 'outdoor',
          emoji: '🚲',
          defaultPoints: 15,
          defaultFrequency: 'weekly',
          reason: `You have ${org.number_of_bikes} bike${org.number_of_bikes > 1 ? 's' : ''}`,
          ageAppropriate: ['kid', 'teen', 'adult'],
          priority: 2
        })
      }
    }

    // ========== GARAGE SUGGESTIONS ==========
    if (org.has_garage === true) {
      if (!existingTaskNames.has('sweep garage')) {
        suggestions.push({
          name: 'Sweep Garage',
          description: 'Sweep garage floor',
          category: 'cleaning',
          emoji: '🧹',
          defaultPoints: 15,
          defaultFrequency: 'weekly',
          reason: 'You have a garage',
          ageAppropriate: ['teen', 'adult'],
          priority: 2
        })
      }
    }

    // ========== AGE-BASED SUGGESTIONS ==========
    if (org.age_groups?.includes('toddler') || org.age_groups?.includes('kid')) {
      if (!existingTaskNames.has('make bed')) {
        suggestions.push({
          name: 'Make Bed',
          description: 'Make your bed in the morning',
          category: 'personal_care',
          emoji: '🛏️',
          defaultPoints: 5,
          defaultFrequency: 'daily',
          reason: 'Great starter task for young children',
          ageAppropriate: ['kid', 'teen', 'adult'],
          priority: 5
        })
      }

      if (!existingTaskNames.has('put away toys')) {
        suggestions.push({
          name: 'Put Away Toys',
          description: 'Clean up and organize toys',
          category: 'organization',
          emoji: '🧸',
          defaultPoints: 10,
          defaultFrequency: 'daily',
          reason: 'You have young children',
          ageAppropriate: ['kid'],
          priority: 5
        })
      }
    }

    if (org.age_groups?.includes('teen')) {
      if (!existingTaskNames.has('mow lawn')) {
        suggestions.push({
          name: 'Mow Lawn',
          description: 'Mow the front and back yard',
          category: 'outdoor',
          emoji: '🏡',
          defaultPoints: 30,
          defaultFrequency: 'weekly',
          reason: 'Teens can handle more responsibility',
          ageAppropriate: ['teen', 'adult'],
          priority: 3
        })
      }

      if (!existingTaskNames.has('do laundry')) {
        suggestions.push({
          name: 'Do Laundry',
          description: 'Wash, dry, and fold a load of laundry',
          category: 'cleaning',
          emoji: '👕',
          defaultPoints: 20,
          defaultFrequency: 'weekly',
          reason: 'Important life skill for teens',
          ageAppropriate: ['teen', 'adult'],
          priority: 4
        })
      }
    }

    // ========== CATEGORY GAP SUGGESTIONS ==========
    // If they don't have any tasks in key categories, suggest some basics

    if (!existingCategories.has('cleaning')) {
      suggestions.push({
        name: 'Vacuum Living Room',
        description: 'Vacuum the main living areas',
        category: 'cleaning',
        emoji: '🧹',
        defaultPoints: 15,
        defaultFrequency: 'weekly',
        reason: 'Essential household cleaning task',
        ageAppropriate: ['teen', 'adult'],
        priority: 4
      })
    }

    if (!existingCategories.has('cooking') && hasTeens) {
      suggestions.push({
        name: 'Help Prepare Dinner',
        description: 'Assist with cooking dinner',
        category: 'cooking',
        emoji: '🍳',
        defaultPoints: 20,
        defaultFrequency: 'daily',
        reason: 'Cooking skills are valuable life skills',
        ageAppropriate: ['teen', 'adult'],
        priority: 3
      })
    }

    if (!existingCategories.has('homework') && (hasKids || hasTeens)) {
      suggestions.push({
        name: 'Complete Homework',
        description: 'Finish all homework assignments',
        category: 'homework',
        emoji: '📚',
        defaultPoints: 15,
        defaultFrequency: 'daily',
        reason: 'Academic responsibility',
        ageAppropriate: ['kid', 'teen'],
        priority: 5
      })
    }

    // Sort by priority (high to low)
    suggestions.sort((a, b) => b.priority - a.priority)

    // Return top 15 suggestions
    return NextResponse.json({
      suggestions: suggestions.slice(0, 15),
      householdContext: {
        hasPets: org.has_pets,
        petTypes: org.pet_types,
        homeFeatures: org.home_features,
        ageGroups: org.age_groups,
        vehicles: {
          cars: org.number_of_cars,
          bikes: org.number_of_bikes
        }
      }
    })
  } catch (error) {
    console.error('Unexpected error in GET /api/tasks/suggestions:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
