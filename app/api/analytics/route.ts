import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * Helper to format category names for display
 */
const formatCategoryName = (category: string): string => {
  const categoryMap: Record<string, string> = {
    'cleaning': 'Cleaning',
    'cooking': 'Cooking',
    'outdoor': 'Outdoor',
    'pet_care': 'Pet Care',
    'homework': 'Homework',
    'organization': 'Organization',
    'maintenance': 'Maintenance',
    'errands': 'Errands',
    'personal_care': 'Personal Care',
    'other': 'Other'
  }
  return categoryMap[category] || category
}

/**
 * GET /api/analytics
 * Fetch comprehensive analytics data for the current user's family
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
      .select('id, organization_id')
      .eq('auth_user_id', user.id)
      .single()

    if (userError || !userData) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Fetch all family members
    const { data: familyMembers, error: membersError } = await supabase
      .from('users')
      .select('id, name, avatar, color, points')
      .eq('organization_id', userData.organization_id)

    if (membersError) {
      console.error('Error fetching family members:', membersError)
      return NextResponse.json(
        { error: 'Failed to fetch family members' },
        { status: 500 }
      )
    }

    const memberIds = familyMembers?.map(m => m.id) || []

    // Fetch all tasks for the organization
    const { data: allTasks, error: tasksError } = await supabase
      .from('tasks')
      .select('id, name, category, points, recurrence_pattern')
      .eq('organization_id', userData.organization_id)

    if (tasksError) {
      console.error('Error fetching tasks:', tasksError)
    }

    console.log('📊 Tasks query result:', {
      tasksFound: allTasks?.length || 0,
      organizationId: userData.organization_id,
      error: tasksError
    })

    // Fetch all task completions with task details to calculate on-time status
    const { data: completions, error: completionsError } = await supabase
      .from('task_completions')
      .select(`
        id,
        user_id,
        task_id,
        points_awarded,
        completed_at,
        tasks (
          due_time
        )
      `)
      .in('user_id', memberIds)
      .order('completed_at', { ascending: false })

    if (completionsError) {
      console.error('Error fetching task completions:', completionsError)
    }

    // Calculate was_on_time for each completion
    const taskCompletions = (completions || []).map((completion: any) => {
      let wasOnTime = true // Default to true if no due_time specified

      if (completion.tasks?.due_time) {
        const dueTime = completion.tasks.due_time // Format: "HH:MM" (e.g., "14:30")
        const completedAt = new Date(completion.completed_at)

        // Get the date of completion and construct the due datetime
        const completedDate = new Date(completedAt)
        completedDate.setHours(0, 0, 0, 0) // Start of day

        const [dueHours, dueMinutes] = dueTime.split(':').map(Number)
        const dueDateTime = new Date(completedDate)
        dueDateTime.setHours(dueHours, dueMinutes, 0, 0)

        // Task is on time if completed before or at the due time
        wasOnTime = completedAt <= dueDateTime
      }

      return {
        ...completion,
        was_on_time: wasOnTime
      }
    })

    console.log('📊 Analytics API Debug:')
    console.log('  - Family members found:', familyMembers?.length || 0)
    console.log('  - Tasks found:', allTasks?.length || 0)
    console.log('  - Task completions found:', taskCompletions.length)
    if (completionsError) {
      console.log('  - Completions query error:', completionsError)
    }
    if (taskCompletions.length > 0) {
      console.log('  - Sample completion:', taskCompletions[0])
    }

    // Calculate date ranges
    const now = new Date()
    const thirtyDaysAgo = new Date(now)
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const sevenDaysAgo = new Date(now)
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    // Filter completions by time period
    const last30DaysCompletions = taskCompletions.filter(c =>
      new Date(c.completed_at) >= thirtyDaysAgo
    )
    const last7DaysCompletions = taskCompletions.filter(c =>
      new Date(c.completed_at) >= sevenDaysAgo
    )

    console.log('  - Last 30 days completions:', last30DaysCompletions.length)
    console.log('  - Last 7 days completions:', last7DaysCompletions.length)

    // ========== OVERVIEW METRICS ==========

    const totalTasksCompleted = taskCompletions.length
    const totalPoints = familyMembers?.reduce((sum, m) => sum + (m.points || 0), 0) || 0
    const onTimeCompletions = taskCompletions.filter(c => c.was_on_time).length
    const completionRate = totalTasksCompleted > 0
      ? Math.round((onTimeCompletions / totalTasksCompleted) * 100)
      : 0

    // Calculate streaks for each member
    const memberStreaks = familyMembers?.map(member => {
      const memberCompletions = taskCompletions
        .filter(c => c.user_id === member.id)
        .sort((a, b) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime())

      let currentStreak = 0
      let checkDate = new Date()
      checkDate.setHours(0, 0, 0, 0)

      for (let i = 0; i < 365; i++) {
        const dateStr = checkDate.toISOString().split('T')[0]
        const hasCompletion = memberCompletions.some(c =>
          c.completed_at.startsWith(dateStr)
        )

        if (hasCompletion) {
          currentStreak++
          checkDate.setDate(checkDate.getDate() - 1)
        } else if (i === 0) {
          // Today has no completions, check yesterday
          checkDate.setDate(checkDate.getDate() - 1)
        } else {
          break
        }
      }

      return currentStreak
    }) || []

    const longestStreak = Math.max(...memberStreaks, 0)

    // ========== COMPLETION TRENDS (Last 30 Days) ==========

    const completionTrends = []
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now)
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]

      const dayCompletions = taskCompletions.filter(c =>
        c.completed_at.startsWith(dateStr)
      ).length

      completionTrends.push({
        date: dateStr,
        completions: dayCompletions
      })
    }

    // ========== MEMBER PERFORMANCE ==========

    const memberPerformance = familyMembers?.map(member => {
      const memberCompletions = taskCompletions.filter(c => c.user_id === member.id)
      const memberLast7Days = last7DaysCompletions.filter(c => c.user_id === member.id).length
      const onTime = memberCompletions.filter(c => c.was_on_time).length
      const completionRate = memberCompletions.length > 0
        ? Math.round((onTime / memberCompletions.length) * 100)
        : 0

      return {
        id: member.id,
        name: member.name,
        avatar: member.avatar,
        color: member.color,
        tasksCompleted: memberCompletions.length,
        points: member.points || 0,
        completionRate,
        last7Days: memberLast7Days
      }
    }).sort((a, b) => b.points - a.points) || []

    // ========== TASK DISTRIBUTION BY CATEGORY ==========

    const categoryDistribution: Record<string, number> = {}
    taskCompletions.forEach(completion => {
      const task = allTasks?.find(t => t.id === completion.task_id)
      if (task?.category) {
        categoryDistribution[task.category] = (categoryDistribution[task.category] || 0) + 1
      }
    })

    const tasksByCategory = Object.entries(categoryDistribution).map(([category, count]) => ({
      category,
      count,
      percentage: totalTasksCompleted > 0
        ? Math.round((count / totalTasksCompleted) * 100)
        : 0
    })).sort((a, b) => b.count - a.count)

    // ========== PEAK COMPLETION TIMES ==========

    const hourDistribution: Record<number, number> = {}
    taskCompletions.forEach(completion => {
      const hour = new Date(completion.completed_at).getHours()
      hourDistribution[hour] = (hourDistribution[hour] || 0) + 1
    })

    const peakTimes = Object.entries(hourDistribution)
      .map(([hour, count]) => ({
        hour: parseInt(hour),
        count,
        label: `${hour}:00`
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    // ========== ADVANCED METRICS ==========

    // TIME SAVED CALCULATION
    // Assume each task reminder/nag takes 2 minutes, follow-up takes 3 minutes
    // Each completed task saves 5 minutes of parent time
    const timeSavedMinutes = last7DaysCompletions.length * 5
    const timeSavedHours = Math.round(timeSavedMinutes / 60 * 10) / 10

    // INDEPENDENCE INDEX
    // Percentage of tasks completed on time (proactively, before nagging needed)
    const independenceIndex = completionRate

    // BEHAVIOR CHANGE - Proactive Completion Rate
    const proactiveCompletions = last7DaysCompletions.filter(c => c.was_on_time).length
    const proactiveRate = last7DaysCompletions.length > 0
      ? Math.round((proactiveCompletions / last7DaysCompletions.length) * 100)
      : 0

    // FAMILY HARMONY SCORE
    // Based on: consistency (streaks), fairness (even distribution), completion rate
    const avgTasksPerMember = totalTasksCompleted / (familyMembers?.length || 1)
    const taskVariance = familyMembers?.reduce((sum, member) => {
      const memberTasks = taskCompletions.filter(c => c.user_id === member.id).length
      return sum + Math.abs(memberTasks - avgTasksPerMember)
    }, 0) || 0
    const fairnessScore = 100 - Math.min(taskVariance * 2, 50)
    const consistencyScore = Math.min(longestStreak * 10, 100)
    const familyHarmonyScore = Math.round(
      (fairnessScore * 0.4) + (consistencyScore * 0.3) + (completionRate * 0.3)
    )

    // MENTAL LOAD SCORE
    // Higher score = lower mental load (based on on-time completion rate)
    const lateCompletions = taskCompletions.filter(c => !c.was_on_time).length
    const mentalLoadScore = Math.max(0, 100 - (lateCompletions * 5)) // Penalize 5 points per late task

    // HOUSEHOLD HEALTH
    // Percentage increase in task completion over last 30 days
    const firstWeekCompletions = taskCompletions.filter(c => {
      const date = new Date(c.completed_at)
      return date >= thirtyDaysAgo && date < new Date(thirtyDaysAgo.getTime() + 7 * 24 * 60 * 60 * 1000)
    }).length
    const lastWeekCompletions = last7DaysCompletions.length
    const growthRate = firstWeekCompletions > 0
      ? Math.round(((lastWeekCompletions - firstWeekCompletions) / firstWeekCompletions) * 100)
      : lastWeekCompletions > 0 ? 100 : 0

    // ACHIEVEMENT VELOCITY
    // Tasks completed per day over last 7 days
    const achievementVelocity = Math.round((last7DaysCompletions.length / 7) * 10) / 10

    // ========== STREAK RISK ALERTS ==========

    const streakAlerts = familyMembers?.map(member => {
      const memberCompletions = taskCompletions
        .filter(c => c.user_id === member.id)
        .sort((a, b) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime())

      // Calculate current streak
      let currentStreak = 0
      let checkDate = new Date()
      checkDate.setHours(0, 0, 0, 0)

      for (let i = 0; i < 365; i++) {
        const dateStr = checkDate.toISOString().split('T')[0]
        const hasCompletion = memberCompletions.some(c =>
          c.completed_at.startsWith(dateStr)
        )

        if (hasCompletion) {
          currentStreak++
          checkDate.setDate(checkDate.getDate() - 1)
        } else if (i === 0) {
          // Today has no completions, check yesterday
          checkDate.setDate(checkDate.getDate() - 1)
        } else {
          break
        }
      }

      // Check if they completed a task today
      const today = new Date().toISOString().split('T')[0]
      const completedToday = memberCompletions.some(c => c.completed_at.startsWith(today))

      return {
        memberId: member.id,
        memberName: member.name,
        avatar: member.avatar,
        color: member.color,
        currentStreak,
        completedToday,
        atRisk: currentStreak >= 3 && !completedToday // At risk if streak is 3+ days and no completion today
      }
    }).filter(alert => alert.atRisk) || []

    // ========== TASK DISTRIBUTION FAIRNESS ==========

    const taskDistribution = familyMembers?.map(member => {
      const memberCompletions = taskCompletions.filter(c => c.user_id === member.id)
      const memberLast7Days = last7DaysCompletions.filter(c => c.user_id === member.id).length
      const memberLast30Days = last30DaysCompletions.filter(c => c.user_id === member.id).length

      return {
        memberId: member.id,
        memberName: member.name,
        avatar: member.avatar,
        color: member.color,
        totalCompletions: memberCompletions.length,
        last7Days: memberLast7Days,
        last30Days: memberLast30Days,
        pointsEarned: member.points || 0,
        averagePointsPerTask: memberCompletions.length > 0
          ? Math.round((member.points || 0) / memberCompletions.length)
          : 0
      }
    }) || []

    // Calculate fairness score for task distribution
    const avgTasksPerMemberNew = totalTasksCompleted / (familyMembers?.length || 1)
    const taskVarianceNew = taskDistribution.reduce((sum, member) => {
      return sum + Math.abs(member.totalCompletions - avgTasksPerMemberNew)
    }, 0)
    const distributionFairnessScore = Math.max(0, 100 - taskVarianceNew * 2)
    const isFair = distributionFairnessScore >= 70

    // ========== BEHAVIOR PATTERNS (Best Completion Times by Member) ==========

    const behaviorPatterns = familyMembers?.map(member => {
      const memberCompletions = taskCompletions.filter(c => c.user_id === member.id)

      // Group by hour of day
      const hourCounts: Record<number, number> = {}
      memberCompletions.forEach(completion => {
        const hour = new Date(completion.completed_at).getHours()
        hourCounts[hour] = (hourCounts[hour] || 0) + 1
      })

      // Find peak hours
      const peakHours = Object.entries(hourCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([hour, count]) => ({
          hour: parseInt(hour),
          count,
          label: `${hour}:00`,
          timeOfDay: parseInt(hour) < 12 ? 'morning' : parseInt(hour) < 17 ? 'afternoon' : 'evening'
        }))

      // Group by day of week
      const dayOfWeekCounts: Record<number, number> = {}
      memberCompletions.forEach(completion => {
        const dayOfWeek = new Date(completion.completed_at).getDay() // 0 = Sunday, 6 = Saturday
        dayOfWeekCounts[dayOfWeek] = (dayOfWeekCounts[dayOfWeek] || 0) + 1
      })

      const bestDays = Object.entries(dayOfWeekCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 2)
        .map(([day, count]) => ({
          day: parseInt(day),
          count,
          dayName: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][parseInt(day)]
        }))

      return {
        memberId: member.id,
        memberName: member.name,
        avatar: member.avatar,
        peakHours: peakHours.length > 0 ? peakHours : null,
        bestDays: bestDays.length > 0 ? bestDays : null,
        totalTasks: memberCompletions.length
      }
    }).filter(pattern => pattern.totalTasks > 0) || []

    // ========== AI INSIGHTS ==========

    const insights = []

    // Insight 1: Streak Risk Alerts
    if (streakAlerts.length > 0) {
      streakAlerts.forEach(alert => {
        insights.push({
          type: 'warning',
          title: 'Streak at Risk!',
          message: `${alert.memberName}'s ${alert.currentStreak}-day streak is at risk - no tasks completed today yet!`
        })
      })
    }

    // Insight 2: Time saved
    if (timeSavedHours > 1) {
      insights.push({
        type: 'positive',
        title: 'Time Saved',
        message: `Your family saved ${timeSavedHours} hours this week by completing tasks proactively!`
      })
    }

    // Insight 3: Top performer
    if (memberPerformance.length > 0) {
      const topPerformer = memberPerformance[0]
      insights.push({
        type: 'celebrate',
        title: 'Top Performer',
        message: `${topPerformer.name} is leading the family with ${topPerformer.points} points!`
      })
    }

    // Insight 4: Fairness Alert
    if (!isFair && taskDistribution.length > 1) {
      const mostBurdened = taskDistribution.reduce((max, curr) =>
        curr.totalCompletions > max.totalCompletions ? curr : max
      )
      const leastBurdened = taskDistribution.reduce((min, curr) =>
        curr.totalCompletions < min.totalCompletions ? curr : min
      )

      if (mostBurdened.totalCompletions > leastBurdened.totalCompletions * 2) {
        insights.push({
          type: 'suggestion',
          title: 'Uneven Distribution',
          message: `${mostBurdened.memberName} has completed ${mostBurdened.totalCompletions} tasks while ${leastBurdened.memberName} has ${leastBurdened.totalCompletions}. Consider balancing assignments.`
        })
      }
    }

    // Insight 5: Behavior Patterns
    if (behaviorPatterns.length > 0) {
      behaviorPatterns.forEach(pattern => {
        if (pattern.peakHours && pattern.peakHours[0]) {
          const peakTime = pattern.peakHours[0]
          insights.push({
            type: 'neutral',
            title: 'Peak Performance',
            message: `${pattern.memberName} completes most tasks in the ${peakTime.timeOfDay} (around ${peakTime.label})`
          })
        }
      })
    }

    // Insight 6: Independence growth
    if (proactiveRate > 70) {
      insights.push({
        type: 'positive',
        title: 'Growing Independence',
        message: `${proactiveRate}% of tasks are being completed on time - your kids are building great habits!`
      })
    }

    // Insight 7: Consistency
    if (longestStreak >= 7) {
      insights.push({
        type: 'celebrate',
        title: 'Consistency Streak',
        message: `Amazing! Someone in your family has a ${longestStreak}-day streak going!`
      })
    }

    // Insight 8: Category focus
    if (tasksByCategory.length > 0) {
      const topCategory = tasksByCategory[0]
      insights.push({
        type: 'neutral',
        title: 'Category Focus',
        message: `${formatCategoryName(topCategory.category)} tasks are getting the most attention with ${topCategory.count} completions.`
      })
    }

    // Insight 9: Room for improvement
    if (completionRate < 70) {
      insights.push({
        type: 'suggestion',
        title: 'Opportunity',
        message: `Try setting reminders earlier in the day to improve your ${completionRate}% on-time completion rate.`
      })
    }

    // ========== RETURN ANALYTICS DATA ==========

    return NextResponse.json({
      debug: {
        familyMembersCount: familyMembers?.length || 0,
        tasksCount: allTasks?.length || 0,
        taskCompletionsCount: taskCompletions.length,
        last30DaysCount: last30DaysCompletions.length,
        last7DaysCount: last7DaysCompletions.length
      },
      overview: {
        totalTasksCompleted,
        totalPoints,
        completionRate,
        longestStreak
      },
      advancedMetrics: {
        timeSavedHours,
        independenceIndex,
        proactiveRate,
        familyHarmonyScore,
        mentalLoadScore,
        growthRate,
        achievementVelocity
      },
      completionTrends,
      memberPerformance,
      tasksByCategory,
      peakTimes,
      insights,
      // New parent-focused metrics
      streakAlerts,
      taskDistribution,
      fairnessScore: distributionFairnessScore,
      behaviorPatterns
    })
  } catch (error) {
    console.error('Unexpected error in GET /api/analytics:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
