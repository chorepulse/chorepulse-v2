'use client'

import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent, Button, Select, Badge } from '@/components/ui'
import { useToast } from '@/hooks/useToast'
import { ToastContainer } from '@/components/Toast'
import AdSlot from '@/components/AdSlot'
import { useSubscription } from '@/hooks/useSubscription'
import { useAgeBracket } from '@/hooks/useAgeBracket'
import { useLocation } from '@/hooks/useLocation'

// Category display name mapping
const categoryDisplayNames: Record<string, string> = {
  'all': 'All',
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

// Helper to get display name from database value
const getCategoryDisplayName = (dbValue: string): string => {
  return categoryDisplayNames[dbValue] || dbValue
}

interface CompletionTrend {
  date: string
  completions: number
}

interface MemberPerformance {
  id: string
  name: string
  avatar: string
  color: string
  tasksCompleted: number
  points: number
  completionRate: number
  last7Days: number
}

interface TaskCategory {
  category: string
  count: number
  percentage: number
}

interface PeakTime {
  hour: number
  count: number
  label: string
}

interface Insight {
  type: 'positive' | 'celebrate' | 'neutral' | 'suggestion' | 'warning'
  title: string
  message: string
}

interface StreakAlert {
  memberId: string
  memberName: string
  avatar: string
  color: string
  currentStreak: number
  completedToday: boolean
  atRisk: boolean
}

interface TaskDistributionMember {
  memberId: string
  memberName: string
  avatar: string
  color: string
  totalCompletions: number
  last7Days: number
  last30Days: number
  pointsEarned: number
  averagePointsPerTask: number
}

interface BehaviorPattern {
  memberId: string
  memberName: string
  avatar: string
  peakHours: Array<{
    hour: number
    count: number
    label: string
    timeOfDay: string
  }> | null
  bestDays: Array<{
    day: number
    count: number
    dayName: string
  }> | null
  totalTasks: number
}

interface AnalyticsData {
  overview: {
    totalTasksCompleted: number
    totalPoints: number
    completionRate: number
    longestStreak: number
  }
  advancedMetrics: {
    timeSavedHours: number
    independenceIndex: number
    proactiveRate: number
    familyHarmonyScore: number
    mentalLoadScore: number
    growthRate: number
    achievementVelocity: number
  }
  completionTrends: CompletionTrend[]
  memberPerformance: MemberPerformance[]
  tasksByCategory: TaskCategory[]
  peakTimes: PeakTime[]
  insights: Insight[]
  streakAlerts?: StreakAlert[]
  taskDistribution?: TaskDistributionMember[]
  fairnessScore?: number
  behaviorPatterns?: BehaviorPattern[]
}

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('week')
  const [selectedMember, setSelectedMember] = useState<string>('all')
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [userRole, setUserRole] = useState<'kid' | 'teen' | 'adult'>('adult')
  const toastHook = useToast()
  const { subscriptionTier } = useSubscription()
  const { ageBracket } = useAgeBracket()
  const { getLocationString } = useLocation()

  useEffect(() => {
    fetchAnalyticsData()
    fetchUserRole()
  }, [])

  const fetchUserRole = async () => {
    try {
      const response = await fetch('/api/users/me')
      if (response.ok) {
        const data = await response.json()
        if (data.user?.role) {
          setUserRole(data.user.role)
        }
      }
    } catch (error) {
      console.error('Error fetching user role:', error)
      // Default to 'adult' if fetch fails
    }
  }

  const fetchAnalyticsData = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/analytics')

      if (!response.ok) {
        throw new Error('Failed to fetch analytics data')
      }

      const data = await response.json()
      console.log('📊 Analytics Data Received:', data)
      console.log('  - Debug info:', data.debug)
      console.log('  - Overview:', data.overview)
      setAnalyticsData(data)
    } catch (error) {
      console.error('Error fetching analytics:', error)
      toastHook.error('Failed to load analytics data')
    } finally {
      setIsLoading(false)
    }
  }

  const handleExport = (format: 'csv' | 'pdf') => {
    console.log(`Exporting as ${format}...`)
    toastHook.info('Export feature coming soon!')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 pb-24 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">📊</div>
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    )
  }

  if (!analyticsData) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 pb-24 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">❌</div>
          <p className="text-gray-600">Failed to load analytics data</p>
        </div>
      </div>
    )
  }

  const {
    overview,
    advancedMetrics,
    completionTrends,
    memberPerformance,
    tasksByCategory,
    peakTimes,
    insights,
    streakAlerts,
    taskDistribution,
    fairnessScore,
    behaviorPatterns
  } = analyticsData

  const filteredMembers = selectedMember === 'all'
    ? memberPerformance
    : memberPerformance.filter(m => m.id === selectedMember)

  // Category colors mapping (using database enum values)
  const categoryColors: Record<string, string> = {
    'cleaning': '#FF6B6B',
    'cooking': '#FFA07A',
    'pet_care': '#4ECDC4',
    'outdoor': '#2ECC71',
    'homework': '#6C63FF',
    'errands': '#F39C12',
    'personal_care': '#9B59B6',
    'organization': '#E67E22',
    'maintenance': '#E67E22',
    'other': '#95A5A6'
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 pb-24">
      <ToastContainer toasts={toastHook.toasts} onRemove={toastHook.removeToast} />

      {/* Header */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-1">Analytics</h1>
            <p className="text-gray-600">Track your family's progress and insights</p>
          </div>

          <div className="flex items-center gap-3">
            <Select
              options={[
                { label: 'This Week', value: 'week' },
                { label: 'This Month', value: 'month' },
                { label: 'This Year', value: 'year' }
              ]}
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as 'week' | 'month' | 'year')}
            />
            <Button variant="outline" onClick={() => handleExport('csv')}>
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export
            </Button>
          </div>
        </div>

        {/* Family Overview Stats */}
        <div className="grid md:grid-cols-4 gap-4 mb-6">
          <Card variant="elevated" padding="md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Tasks Completed</p>
                <div className="text-3xl font-bold text-success-green">{overview.totalTasksCompleted}</div>
                <p className="text-xs text-gray-500 mt-1">All time</p>
              </div>
              <div className="w-12 h-12 bg-success-green/10 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-success-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </Card>

          <Card variant="elevated" padding="md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Points</p>
                <div className="text-3xl font-bold text-deep-purple">{overview.totalPoints}</div>
                <p className="text-xs text-gray-500 mt-1">Family total</p>
              </div>
              <div className="w-12 h-12 bg-deep-purple/10 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-deep-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
            </div>
          </Card>

          <Card variant="elevated" padding="md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Completion Rate</p>
                <div className="text-3xl font-bold text-soft-blue">{overview.completionRate}%</div>
                <p className="text-xs text-gray-500 mt-1">On-time tasks</p>
              </div>
              <div className="w-12 h-12 bg-soft-blue/10 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-soft-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
          </Card>

          <Card variant="elevated" padding="md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Longest Streak</p>
                <div className="text-3xl font-bold text-warm-orange">{overview.longestStreak} days</div>
                <p className="text-xs text-gray-500 mt-1">Current best</p>
              </div>
              <div className="w-12 h-12 bg-warm-orange/10 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-warm-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                </svg>
              </div>
            </div>
          </Card>
        </div>

        {/* Advanced Metrics Row */}
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <Card variant="elevated" padding="md" className="bg-gradient-to-br from-blue-50 to-purple-50">
            <div>
              <p className="text-sm text-gray-600 mb-1">⏰ Time Saved This Week</p>
              <div className="text-3xl font-bold text-blue-600">{advancedMetrics.timeSavedHours}h</div>
              <p className="text-xs text-gray-600 mt-1">From proactive task completion</p>
            </div>
          </Card>

          <Card variant="elevated" padding="md" className="bg-gradient-to-br from-green-50 to-emerald-50">
            <div>
              <p className="text-sm text-gray-600 mb-1">🎯 Independence Index</p>
              <div className="text-3xl font-bold text-green-600">{advancedMetrics.independenceIndex}%</div>
              <p className="text-xs text-gray-600 mt-1">Tasks done without reminders</p>
            </div>
          </Card>

          <Card variant="elevated" padding="md" className="bg-gradient-to-br from-purple-50 to-pink-50">
            <div>
              <p className="text-sm text-gray-600 mb-1">❤️ Family Harmony Score</p>
              <div className="text-3xl font-bold text-purple-600">{advancedMetrics.familyHarmonyScore}/100</div>
              <p className="text-xs text-gray-600 mt-1">Fairness + Consistency</p>
            </div>
          </Card>
        </div>

        {/* Streak Risk Alerts - Parent-Focused */}
        {streakAlerts && streakAlerts.length > 0 && (
          <Card variant="default" padding="lg" className="mb-6 border-2 border-red-300 bg-red-50">
            <CardHeader>
              <div className="flex items-center gap-2">
                <span className="text-2xl">🔥</span>
                <CardTitle className="text-red-900">Streak Alerts - Action Needed!</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-red-800 mb-4">
                These family members have active streaks at risk. They need to complete a task today to keep their streak alive!
              </p>
              <div className="space-y-3">
                {streakAlerts.map((alert) => (
                  <div
                    key={alert.memberId}
                    className="bg-white border-2 border-red-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-12 h-12 rounded-full flex items-center justify-center text-2xl shadow-sm"
                          style={{ backgroundColor: alert.color }}
                        >
                          {alert.avatar}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">{alert.memberName}</p>
                          <p className="text-sm text-gray-600">
                            Current streak: <span className="font-semibold text-warm-orange">{alert.currentStreak} days</span>
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="danger" size="md">
                          ⚠️ At Risk
                        </Badge>
                        <p className="text-xs text-red-600 mt-1">No tasks today</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Task Distribution Fairness - Parent-Focused */}
        {taskDistribution && taskDistribution.length > 0 && (
          <Card variant="default" padding="lg" className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">⚖️</span>
                  <CardTitle>Task Distribution & Fairness</CardTitle>
                </div>
                {fairnessScore !== undefined && (
                  <div className="text-right">
                    <div className="text-2xl font-bold" style={{ color: fairnessScore >= 70 ? '#2ECC71' : '#F39C12' }}>
                      {fairnessScore}/100
                    </div>
                    <p className="text-xs text-gray-600">Fairness Score</p>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {fairnessScore !== undefined && (
                <div className={`p-3 mb-4 rounded-lg border ${fairnessScore >= 70 ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
                  <p className={`text-sm ${fairnessScore >= 70 ? 'text-green-800' : 'text-yellow-800'}`}>
                    {fairnessScore >= 70
                      ? '✓ Tasks are fairly distributed across family members'
                      : '⚠️ Task distribution is uneven - consider balancing assignments'}
                  </p>
                </div>
              )}
              <div className="space-y-4">
                {taskDistribution.map((member) => (
                  <div key={member.memberId} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-xl"
                        style={{ backgroundColor: member.color }}
                      >
                        {member.avatar}
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-gray-900">{member.memberName}</p>
                        <p className="text-xs text-gray-600">
                          {member.averagePointsPerTask > 0 ? `Avg ${member.averagePointsPerTask} pts/task` : 'No tasks completed yet'}
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-2 text-center">
                      <div className="p-2 bg-gray-50 rounded">
                        <div className="text-lg font-bold text-gray-900">{member.totalCompletions}</div>
                        <p className="text-xs text-gray-600">All Time</p>
                      </div>
                      <div className="p-2 bg-gray-50 rounded">
                        <div className="text-lg font-bold text-gray-900">{member.last30Days}</div>
                        <p className="text-xs text-gray-600">30 Days</p>
                      </div>
                      <div className="p-2 bg-gray-50 rounded">
                        <div className="text-lg font-bold text-gray-900">{member.last7Days}</div>
                        <p className="text-xs text-gray-600">7 Days</p>
                      </div>
                      <div className="p-2 bg-deep-purple/10 rounded">
                        <div className="text-lg font-bold text-deep-purple">{member.pointsEarned}</div>
                        <p className="text-xs text-gray-600">Points</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Behavior Patterns - Parent-Focused */}
        {behaviorPatterns && behaviorPatterns.length > 0 && (
          <Card variant="default" padding="lg" className="mb-6">
            <CardHeader>
              <div className="flex items-center gap-2">
                <span className="text-2xl">📊</span>
                <CardTitle>Behavior Patterns & Best Times</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Understand when each family member is most productive to optimize task scheduling
              </p>
              <div className="space-y-4">
                {behaviorPatterns.map((pattern) => (
                  <div key={pattern.memberId} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <div className="flex items-center gap-3 mb-3">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-xl"
                        style={{ backgroundColor: '#6C63FF' }}
                      >
                        {pattern.avatar}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">{pattern.memberName}</p>
                        <p className="text-xs text-gray-600">{pattern.totalTasks} tasks completed</p>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      {/* Peak Hours */}
                      {pattern.peakHours && pattern.peakHours.length > 0 && (
                        <div className="bg-white rounded-lg p-3 border border-blue-100">
                          <p className="text-xs font-semibold text-gray-700 mb-2">🕐 Peak Hours</p>
                          <div className="space-y-2">
                            {pattern.peakHours.slice(0, 3).map((hour, idx) => (
                              <div key={idx} className="flex items-center justify-between">
                                <span className="text-sm text-gray-700">
                                  {hour.timeOfDay === 'morning' && '🌅'}
                                  {hour.timeOfDay === 'afternoon' && '☀️'}
                                  {hour.timeOfDay === 'evening' && '🌙'}
                                  {' '}{hour.label}
                                </span>
                                <span className="text-xs font-semibold text-blue-600">{hour.count} tasks</span>
                              </div>
                            ))}
                          </div>
                          <p className="text-xs text-blue-600 mt-2 italic">
                            Most productive in the {pattern.peakHours[0].timeOfDay}
                          </p>
                        </div>
                      )}

                      {/* Best Days */}
                      {pattern.bestDays && pattern.bestDays.length > 0 && (
                        <div className="bg-white rounded-lg p-3 border border-green-100">
                          <p className="text-xs font-semibold text-gray-700 mb-2">📅 Best Days</p>
                          <div className="space-y-2">
                            {pattern.bestDays.slice(0, 2).map((day, idx) => (
                              <div key={idx} className="flex items-center justify-between">
                                <span className="text-sm text-gray-700">{day.dayName}</span>
                                <span className="text-xs font-semibold text-green-600">{day.count} tasks</span>
                              </div>
                            ))}
                          </div>
                          <p className="text-xs text-green-600 mt-2 italic">
                            Schedule important tasks on {pattern.bestDays[0].dayName}
                          </p>
                        </div>
                      )}
                    </div>

                    {!pattern.peakHours && !pattern.bestDays && (
                      <p className="text-sm text-gray-500 italic">More data needed to identify patterns</p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Member Filter */}
        <Card variant="default" padding="md" className="mb-6">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Filter by Family Member</h3>
            <Select
              options={[
                { label: 'All Members', value: 'all' },
                ...memberPerformance.map(m => ({ label: m.name, value: m.id }))
              ]}
              value={selectedMember}
              onChange={(e) => setSelectedMember(e.target.value)}
            />
          </div>
        </Card>

        {/* Top Banner Ad */}
        <div className="flex justify-center">
          <AdSlot adUnit="banner"
            userRole={userRole}
            subscriptionTier={subscriptionTier}
          ageBracket={ageBracket}
            location={getLocationString()}
            testMode={true}
          />
        </div>
      </div>

      {/* Charts and Analytics */}
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Completion Trend */}
        <Card variant="default" padding="lg">
          <CardHeader>
            <CardTitle>Completion Trend (Last 30 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {completionTrends.slice(-7).map((day) => {
                const maxCompletions = Math.max(...completionTrends.map(d => d.completions), 1)
                const percentage = Math.round((day.completions / maxCompletions) * 100)
                const dateObj = new Date(day.date)
                const dayLabel = dateObj.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })

                return (
                  <div key={day.date}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700 w-32">{dayLabel}</span>
                      <span className="text-sm text-gray-600">{day.completions} tasks</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-soft-blue to-deep-purple h-full rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Member Performance */}
        <Card variant="default" padding="lg">
          <CardHeader>
            <CardTitle>Member Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredMembers.map((member) => (
                <div key={member.id} className="border-2 border-gray-100 rounded-xl p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
                        style={{ backgroundColor: member.color }}
                      >
                        {member.avatar}
                      </div>
                      <h4 className="font-bold text-lg text-gray-900">{member.name}</h4>
                    </div>
                    <Badge variant="success" size="md">
                      {member.completionRate}% on-time
                    </Badge>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-gray-900">{member.tasksCompleted}</div>
                      <p className="text-xs text-gray-600 mt-1">Tasks Done</p>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-deep-purple">{member.points}</div>
                      <p className="text-xs text-gray-600 mt-1">Points Earned</p>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-warm-orange">{member.last7Days}</div>
                      <p className="text-xs text-gray-600 mt-1">Last 7 Days</p>
                    </div>
                  </div>

                  {/* Completion Rate Bar */}
                  <div className="mt-4">
                    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${member.completionRate}%`,
                          backgroundColor: member.color
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Middle Native Ad */}
        <div className="flex justify-center">
          <AdSlot adUnit="native"
            userRole={userRole}
            subscriptionTier={subscriptionTier}
          ageBracket={ageBracket}
            location={getLocationString()}
            testMode={true}
          />
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Task Distribution */}
          <Card variant="default" padding="lg">
            <CardHeader>
              <CardTitle>Task Distribution by Category</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {tasksByCategory.length > 0 ? (
                  tasksByCategory.map((category) => {
                    const color = categoryColors[category.category] || categoryColors['Other']

                    return (
                      <div key={category.category}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: color }}
                            />
                            <span className="text-sm font-medium text-gray-700">{getCategoryDisplayName(category.category)}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-sm text-gray-600">{category.count} tasks</span>
                            <span className="text-sm font-semibold text-gray-900 w-12 text-right">{category.percentage}%</span>
                          </div>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${category.percentage}%`,
                              backgroundColor: color
                            }}
                          />
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">No task data available yet</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Peak Times */}
          <Card variant="default" padding="lg">
            <CardHeader>
              <CardTitle>Peak Completion Times</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {peakTimes.length > 0 ? (
                  peakTimes.map((time) => {
                    const maxCount = Math.max(...peakTimes.map(t => t.count), 1)
                    const percentage = Math.round((time.count / maxCount) * 100)
                    const hourLabel = time.hour === 0 ? '12 AM' :
                                     time.hour < 12 ? `${time.hour} AM` :
                                     time.hour === 12 ? '12 PM' :
                                     `${time.hour - 12} PM`

                    return (
                      <div key={time.hour}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700">{hourLabel}</span>
                          <div className="flex items-center gap-3">
                            <span className="text-sm text-gray-600">{time.count} tasks</span>
                          </div>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-heartbeat-red to-warm-orange h-full rounded-full transition-all duration-500"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">No completion time data yet</p>
                )}
              </div>

              {peakTimes.length > 0 && (
                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <p className="text-sm font-semibold text-blue-900 mb-1">Insight</p>
                      <p className="text-sm text-blue-800">
                        Your family is most productive around {peakTimes[0].hour === 0 ? '12 AM' :
                                                                peakTimes[0].hour < 12 ? `${peakTimes[0].hour} AM` :
                                                                peakTimes[0].hour === 12 ? '12 PM' :
                                                                `${peakTimes[0].hour - 12} PM`}.
                        Consider scheduling important tasks during this time.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* AI Insights */}
        <Card variant="default" padding="lg" className="border-2 border-deep-purple">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-r from-deep-purple to-soft-blue rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <CardTitle>Pulse AI Insights</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {insights.length > 0 ? (
              <div className="space-y-4">
                {insights.map((insight, index) => {
                  const colors = {
                    positive: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-900', subtext: 'text-green-800' },
                    celebrate: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-900', subtext: 'text-purple-800' },
                    neutral: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-900', subtext: 'text-blue-800' },
                    suggestion: { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-900', subtext: 'text-yellow-800' },
                    warning: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-900', subtext: 'text-red-800' }
                  }
                  const color = colors[insight.type]

                  const icons = {
                    positive: '✨',
                    celebrate: '🎉',
                    neutral: '💡',
                    suggestion: '💭',
                    warning: '⚠️'
                  }
                  const icon = icons[insight.type]

                  return (
                    <div key={index} className={`p-4 ${color.bg} border ${color.border} rounded-lg`}>
                      <div className="flex items-start gap-3">
                        <div className="text-2xl">{icon}</div>
                        <div>
                          <p className={`font-semibold ${color.text} mb-1`}>{insight.title}</p>
                          <p className={`text-sm ${color.subtext}`}>{insight.message}</p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-4xl mb-2">🤖</div>
                <p className="text-gray-600">Complete more tasks to unlock AI-powered insights!</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Bottom Banner Ad */}
        <div className="flex justify-center">
          <AdSlot adUnit="banner"
            userRole={userRole}
            subscriptionTier={subscriptionTier}
          ageBracket={ageBracket}
            location={getLocationString()}
            testMode={true}
          />
        </div>
      </div>
    </div>
  )
}
