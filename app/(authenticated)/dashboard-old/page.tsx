'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardHeader, CardTitle, CardContent, CardDescription, Badge, Avatar, Button } from '@/components/ui'
import { useDashboard } from '@/hooks/useDashboard'
import { QuickCreateTaskModal, QuickAddMemberModal, QuickCreateRewardModal } from '@/components/modals'
import { useToast } from '@/hooks/useToast'
import { ToastContainer } from '@/components/Toast'
import AdSlot from '@/components/AdSlot'
import { useSubscription } from '@/hooks/useSubscription'
import { useAgeBracket } from '@/hooks/useAgeBracket'
import { useLocation } from '@/hooks/useLocation'

export default function Dashboard() {
  const router = useRouter()
  const toast = useToast()
  const { subscriptionTier } = useSubscription()
  const { ageBracket } = useAgeBracket()
  const { getLocationString } = useLocation()

  // State for user role
  const [userRole, setUserRole] = useState<'kid' | 'teen' | 'adult'>('adult')
  const [devRoleOverride, setDevRoleOverride] = useState<'kid' | 'teen' | 'adult' | null>(null)
  const effectiveRole = devRoleOverride || userRole

  // Modal states (for adult view)
  const [showCreateTaskModal, setShowCreateTaskModal] = useState(false)
  const [showAddMemberModal, setShowAddMemberModal] = useState(false)
  const [showCreateRewardModal, setShowCreateRewardModal] = useState(false)

  // Filter and sort states (for adult view)
  const [selectedMemberId, setSelectedMemberId] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'name' | 'dueTime' | 'points' | 'status'>('status')
  const [sortAscending, setSortAscending] = useState<boolean>(true)
  const [timeFilter, setTimeFilter] = useState<'all' | 'today' | 'yesterday' | 'last7days' | 'last30days'>('all')

  // Approval processing state (for adult view)
  const [processingApprovalId, setProcessingApprovalId] = useState<string | null>(null)

  // Fetch all dashboard data with auto-refresh
  const {
    currentUser,
    familyMembers,
    familyStats,
    myTasks,
    allTasks,
    approvals,
    achievements,
    isLoading,
    error,
    lastRefresh,
    refresh
  } = useDashboard({
    autoRefresh: true,
    refreshInterval: 60000
  })

  // Fetch user role from API and listen for dev overrides
  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const response = await fetch('/api/profile')
        if (response.ok) {
          const data = await response.json()
          if (data.user?.role) {
            setUserRole(data.user.role)
          }
        }
      } catch (err) {
        console.error('Failed to fetch user role:', err)
      }
    }

    fetchUserRole()

    // Check for dev role override in localStorage
    const storedRole = localStorage.getItem('devRoleOverride') as 'kid' | 'teen' | 'adult' | null
    if (storedRole) {
      setDevRoleOverride(storedRole)
    }

    // Listen for storage changes (when other components update the override)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'devRoleOverride') {
        setDevRoleOverride(e.newValue as 'kid' | 'teen' | 'adult' | null)
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  // Check if user is a manager or owner
  const isManager = currentUser?.isAccountOwner || currentUser?.isFamilyManager

  // ============================================================================
  // SHARED HELPER FUNCTIONS
  // ============================================================================

  const getTaskStatus = (task: any) => {
    const hasCompletions = task.completions && task.completions.length > 0
    if (!hasCompletions) {
      if (task.dueTime) {
        const now = new Date()
        const [hours, minutes] = task.dueTime.split(':').map(Number)
        const dueDateTime = new Date()
        dueDateTime.setHours(hours, minutes, 0, 0)

        if (now > dueDateTime && task.frequency === 'daily') {
          return 'overdue'
        }
      }
      return 'pending'
    }

    const latestCompletion = task.completions[0]
    if (latestCompletion.approved === false) return 'pending'
    if (latestCompletion.approved === true) return 'completed'
    return 'pending'
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, 'success' | 'warning' | 'danger'> = {
      'completed': 'success',
      'pending': 'warning',
      'overdue': 'danger'
    }
    return colors[status] || 'warning'
  }

  const getStatusText = (status: string) => {
    const text: Record<string, string> = {
      'completed': 'Done',
      'pending': 'Pending',
      'overdue': 'Overdue'
    }
    return text[status] || status
  }

  const filterTasksByTime = (task: any) => {
    if (timeFilter === 'all') return true

    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    const taskDate = task.completions && task.completions.length > 0
      ? new Date(task.completions[0].completedAt)
      : new Date(task.created_at || now)

    switch (timeFilter) {
      case 'today':
        return taskDate >= today

      case 'yesterday':
        const yesterday = new Date(today)
        yesterday.setDate(yesterday.getDate() - 1)
        return taskDate >= yesterday && taskDate < today

      case 'last7days':
        const sevenDaysAgo = new Date(today)
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
        return taskDate >= sevenDaysAgo

      case 'last30days':
        const thirtyDaysAgo = new Date(today)
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
        return taskDate >= thirtyDaysAgo

      default:
        return true
    }
  }

  const handleApprove = async (item: any) => {
    setProcessingApprovalId(item.id)
    try {
      if (item.type === 'task') {
        const response = await fetch(`/api/tasks/completions/${item.id}/approve`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ approved: true })
        })

        if (!response.ok) {
          const error = await response.json()
          toast.error(error.error || 'Failed to approve task')
          return
        }

        const data = await response.json()
        toast.success(data.message || 'Task approved!')
      } else {
        const response = await fetch(`/api/rewards/redemptions/${item.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'approve' })
        })

        if (!response.ok) {
          const error = await response.json()
          toast.error(error.error || 'Failed to approve reward')
          return
        }

        const data = await response.json()
        toast.success(data.message || 'Reward approved!')
      }

      await refresh()
    } catch (error) {
      console.error('Error approving:', error)
      toast.error('Failed to process approval')
    } finally {
      setProcessingApprovalId(null)
    }
  }

  const handleDeny = async (item: any) => {
    setProcessingApprovalId(item.id)
    try {
      if (item.type === 'task') {
        const response = await fetch(`/api/tasks/completions/${item.id}/approve`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ approved: false })
        })

        if (!response.ok) {
          const error = await response.json()
          toast.error(error.error || 'Failed to deny task')
          return
        }

        const data = await response.json()
        toast.success(data.message || 'Task rejected')
      } else {
        const response = await fetch(`/api/rewards/redemptions/${item.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'deny' })
        })

        if (!response.ok) {
          const error = await response.json()
          toast.error(error.error || 'Failed to deny reward')
          return
        }

        const data = await response.json()
        toast.success(data.message || 'Reward request denied')
      }

      await refresh()
    } catch (error) {
      console.error('Error denying:', error)
      toast.error('Failed to process denial')
    } finally {
      setProcessingApprovalId(null)
    }
  }

  // ============================================================================
  // KID DASHBOARD HELPERS
  // ============================================================================

  const getRankEmoji = (rank: number) => {
    switch (rank) {
      case 1: return '🥇'
      case 2: return '🥈'
      case 3: return '🥉'
      default: return '👤'
    }
  }

  const getRarityColor = (rarity: string) => {
    const colors: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
      'common': 'default',
      'uncommon': 'success',
      'rare': 'info',
      'legendary': 'warning'
    }
    return colors[rarity] || 'default'
  }

  const getTaskEmoji = (taskName: string) => {
    const name = taskName.toLowerCase()
    if (name.includes('bed')) return '🛏️'
    if (name.includes('homework') || name.includes('study')) return '📚'
    if (name.includes('dog') || name.includes('pet')) return '🐕'
    if (name.includes('cat')) return '🐱'
    if (name.includes('toy') || name.includes('clean')) return '🧸'
    if (name.includes('dish')) return '🍽️'
    if (name.includes('trash') || name.includes('garbage')) return '🗑️'
    if (name.includes('room')) return '🧹'
    if (name.includes('laundry')) return '👕'
    if (name.includes('plant') || name.includes('water')) return '🌱'
    if (name.includes('cook') || name.includes('meal')) return '🍳'
    if (name.includes('read')) return '📖'
    if (name.includes('exercise') || name.includes('play')) return '⚽'
    return '✨'
  }

  const getTimeOfDay = (dueTime: string) => {
    if (!dueTime) return 'Anytime'
    const hour = parseInt(dueTime.split(':')[0])
    if (hour < 12) return 'Morning'
    if (hour < 17) return 'Afternoon'
    return 'Evening'
  }

  // ============================================================================
  // ADULT DASHBOARD HELPERS
  // ============================================================================

  const hasMetricsData = familyStats && allTasks && allTasks.length > 0 &&
    (familyStats.completionRate > 0 || familyStats.completedToday > 0 || familyStats.overdueTasks > 0)

  const calculateHealthMetrics = () => {
    if (!hasMetricsData) {
      return null
    }

    const tasksPerMember = familyMembers.map(member =>
      allTasks.filter(task => task.assignments?.some((a: any) => a.userId === member.id)).length
    )
    const avgTasksPerMember = tasksPerMember.reduce((a, b) => a + b, 0) / familyMembers.length
    const variance = tasksPerMember.reduce((sum, count) => sum + Math.pow(count - avgTasksPerMember, 2), 0) / familyMembers.length
    const taskDistribution = Math.max(0, Math.min(100, 100 - (variance * 10)))

    let taskDistributionLabel = 'Unbalanced'
    let taskDistributionColor = 'text-red-600'
    if (taskDistribution >= 80) {
      taskDistributionLabel = 'Balanced'
      taskDistributionColor = 'text-green-600'
    } else if (taskDistribution >= 60) {
      taskDistributionLabel = 'Fair'
      taskDistributionColor = 'text-yellow-600'
    }

    const engagement = familyStats.completionRate || 0
    let engagementLabel = 'Getting Started'
    let engagementColor = 'text-blue-600'
    if (engagement >= 80) {
      engagementLabel = 'High'
      engagementColor = 'text-green-600'
    } else if (engagement >= 60) {
      engagementLabel = 'Medium'
      engagementColor = 'text-blue-600'
    } else if (engagement >= 30) {
      engagementLabel = 'Building'
      engagementColor = 'text-yellow-600'
    }

    const completedTasks = allTasks.filter(task =>
      task.completions && task.completions.length > 0 && task.completions[0].approved === true
    )
    const totalCompletions = completedTasks.length
    const overdueCount = familyStats.overdueTasks || 0
    const onTimeCount = Math.max(0, totalCompletions - overdueCount)
    const onTimeCompletion = totalCompletions > 0 ? Math.round((onTimeCount / totalCompletions) * 100) : 0

    let onTimeCompletionLabel = 'Getting Started'
    let onTimeCompletionColor = 'text-blue-600'
    if (onTimeCompletion >= 85) {
      onTimeCompletionLabel = 'Excellent'
      onTimeCompletionColor = 'text-green-600'
    } else if (onTimeCompletion >= 70) {
      onTimeCompletionLabel = 'Good'
      onTimeCompletionColor = 'text-yellow-600'
    } else if (onTimeCompletion >= 50) {
      onTimeCompletionLabel = 'Fair'
      onTimeCompletionColor = 'text-blue-600'
    } else if (onTimeCompletion >= 30) {
      onTimeCompletionLabel = 'Building'
      onTimeCompletionColor = 'text-yellow-600'
    }

    return {
      taskDistribution: Math.round(taskDistribution),
      taskDistributionLabel,
      taskDistributionColor,
      engagement: Math.round(engagement),
      engagementLabel,
      engagementColor,
      onTimeCompletion,
      onTimeCompletionLabel,
      onTimeCompletionColor
    }
  }

  const healthMetrics = calculateHealthMetrics()

  const tasksByMember = familyMembers
    .filter(member => {
      if (!isManager) return member.id === currentUser?.id
      return selectedMemberId === 'all' || member.id === selectedMemberId
    })
    .map(member => {
      let memberTasks = allTasks
        .filter(task => task.assignments?.some((a: any) => a.userId === member.id))
        .filter(filterTasksByTime)
        .map(task => ({
          id: task.id,
          name: task.name,
          category: task.category,
          dueTime: task.dueTime || '',
          status: getTaskStatus(task),
          points: task.points
        }))

      memberTasks = memberTasks.sort((a, b) => {
        let comparison = 0

        switch (sortBy) {
          case 'name':
            comparison = a.name.localeCompare(b.name)
            break
          case 'dueTime':
            if (!a.dueTime) return 1
            if (!b.dueTime) return -1
            comparison = a.dueTime.localeCompare(b.dueTime)
            break
          case 'points':
            comparison = a.points - b.points
            break
          case 'status':
            const statusOrder = { overdue: 0, pending: 1, completed: 2 }
            comparison = statusOrder[a.status as keyof typeof statusOrder] - statusOrder[b.status as keyof typeof statusOrder]
            break
          default:
            comparison = 0
        }

        return sortAscending ? comparison : -comparison
      })

      return {
        memberId: member.id,
        memberName: member.name + (member.id === currentUser?.id ? ' (You)' : ''),
        avatar: member.avatar,
        color: member.color,
        tasks: memberTasks
      }
    })
    .filter(member => member.tasks.length > 0)

  // ============================================================================
  // LOADING STATE
  // ============================================================================

  if (isLoading) {
    if (effectiveRole === 'kid') {
      return (
        <div className="min-h-screen bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 p-4 flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl mb-4 animate-bounce">🎨</div>
            <p className="text-2xl font-bold text-gray-700">Loading your fun dashboard...</p>
          </div>
        </div>
      )
    } else if (effectiveRole === 'teen') {
      return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-4 flex items-center justify-center">
          <div className="text-center">
            <div className="text-5xl mb-4">⏳</div>
            <p className="text-gray-600">Loading your dashboard...</p>
          </div>
        </div>
      )
    } else {
      return (
        <div className="min-h-screen bg-gray-50 p-4 pb-24">
          <div className="max-w-7xl mx-auto">
            <div className="mb-6">
              <div className="h-8 w-64 bg-gray-200 rounded animate-pulse mb-2"></div>
              <div className="h-4 w-96 bg-gray-200 rounded animate-pulse"></div>
            </div>
            <div className="grid md:grid-cols-4 gap-4 mb-6">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="bg-white rounded-xl border border-gray-200 p-6 h-24 animate-pulse"></div>
              ))}
            </div>
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6 h-96 animate-pulse"></div>
              <div className="bg-white rounded-xl border border-gray-200 p-6 h-96 animate-pulse"></div>
            </div>
          </div>
        </div>
      )
    }
  }

  // ============================================================================
  // ERROR STATE
  // ============================================================================

  if (error) {
    if (effectiveRole === 'kid') {
      return (
        <div className="min-h-screen bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 p-4 flex items-center justify-center">
          <Card variant="elevated" padding="lg">
            <div className="text-center">
              <div className="text-6xl mb-4">😢</div>
              <p className="text-2xl font-bold text-gray-700 mb-2">Oops! Something went wrong</p>
              <p className="text-gray-600">{error}</p>
            </div>
          </Card>
        </div>
      )
    } else if (effectiveRole === 'teen') {
      return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-4 flex items-center justify-center">
          <Card variant="default" padding="lg">
            <div className="text-center">
              <div className="text-5xl mb-4">⚠️</div>
              <p className="text-gray-600">{error || 'Failed to load dashboard'}</p>
            </div>
          </Card>
        </div>
      )
    } else {
      return (
        <div className="min-h-screen bg-gray-50 p-4 flex items-center justify-center">
          <Card variant="default" padding="lg" className="max-w-md">
            <div className="text-center">
              <div className="text-5xl mb-4">⚠️</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Dashboard</h2>
              <p className="text-gray-600 mb-4">{error}</p>
              <Button variant="primary" onClick={refresh}>
                Try Again
              </Button>
            </div>
          </Card>
        </div>
      )
    }
  }

  // ============================================================================
  // KID DASHBOARD
  // ============================================================================

  if (effectiveRole === 'kid') {
    const myPoints = currentUser?.pointsEarned || 0
    const completedTasksToday = myTasks.filter(t => getTaskStatus(t) === 'completed').length
    const totalTasksToday = myTasks.length
    const progressPercentage = totalTasksToday > 0 ? Math.round((completedTasksToday / totalTasksToday) * 100) : 0

    // Sort family members by points
    const sortedFamily = [...familyMembers].sort((a, b) => b.pointsEarned - a.pointsEarned)

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 p-4 pb-24">
        <ToastContainer toasts={toast.toasts} onRemove={toast.removeToast} />

        {/* Top Banner Ad */}
        <AdSlot
          adUnit="banner"
          userRole="kid"
          subscriptionTier={subscriptionTier}
          ageBracket={ageBracket}
          location={getLocationString()}
          className="mb-6"
          testMode={true}
        />

        <div className="max-w-6xl mx-auto space-y-6">
          {/* Big Greeting */}
          <div className="text-center mb-6">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 mb-2">
              Hey {currentUser?.name}! 🎉
            </h1>
            <p className="text-xl sm:text-2xl font-bold text-purple-700">
              {completedTasksToday === 0 ? "Let's do some chores!" : completedTasksToday === totalTasksToday ? "Amazing work today!" : "Keep going, you're doing great!"}
            </p>
          </div>

          {/* Big Points Card */}
          <Card variant="elevated" padding="lg" className="bg-gradient-to-br from-yellow-400 to-orange-400 border-4 border-yellow-300 shadow-2xl">
            <div className="text-center">
              <div className="text-6xl sm:text-7xl mb-4 animate-bounce">💎</div>
              <p className="text-2xl font-black text-white mb-2">Your Points!</p>
              <p className="text-6xl sm:text-7xl font-black text-white drop-shadow-lg">{myPoints}</p>
            </div>
          </Card>

          {/* Progress */}
          <Card variant="elevated" padding="lg" className="bg-gradient-to-br from-green-400 to-teal-400 border-4 border-green-300">
            <div className="text-center mb-4">
              <p className="text-2xl font-black text-white mb-2">Today's Chores 📋</p>
              <p className="text-5xl font-black text-white">{completedTasksToday}/{totalTasksToday}</p>
            </div>
            <div className="w-full bg-white/30 rounded-full h-6">
              <div
                className="bg-white h-full rounded-full transition-all duration-500 flex items-center justify-center"
                style={{ width: `${progressPercentage}%` }}
              >
                {progressPercentage > 0 && (
                  <span className="text-sm font-bold text-green-600">{progressPercentage}%</span>
                )}
              </div>
            </div>
          </Card>

          {/* My Tasks */}
          <div>
            <h2 className="text-3xl font-black text-purple-700 mb-4">🎯 Your Chores</h2>
            <div className="space-y-4">
              {myTasks.length === 0 ? (
                <Card variant="elevated" padding="lg" className="border-4 border-blue-300">
                  <div className="text-center">
                    <div className="text-7xl mb-4">🎈</div>
                    <p className="text-2xl font-bold text-gray-700">No chores today!</p>
                    <p className="text-lg text-gray-600">You're all caught up!</p>
                  </div>
                </Card>
              ) : (
                myTasks.map(task => {
                  const status = getTaskStatus(task)
                  const isDone = status === 'completed'
                  return (
                    <Card
                      key={task.id}
                      variant="elevated"
                      padding="lg"
                      className={`border-4 ${isDone ? 'border-green-300 bg-gradient-to-br from-green-50 to-teal-50' : 'border-blue-300 bg-white'} transition-all ${isDone ? 'opacity-70' : 'hover:scale-102 hover:shadow-2xl'}`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="text-6xl">{getTaskEmoji(task.name)}</div>
                        <div className="flex-1">
                          <h3 className="text-2xl font-black text-gray-900 mb-1">{task.name}</h3>
                          <div className="flex items-center gap-3 mb-2">
                            <Badge variant="warning" size="lg" className="text-lg font-bold">
                              +{task.points} points!
                            </Badge>
                            {task.dueTime && (
                              <span className="text-lg font-bold text-purple-600">
                                {getTimeOfDay(task.dueTime)}
                              </span>
                            )}
                          </div>
                          {isDone ? (
                            <div className="flex items-center gap-2">
                              <div className="text-3xl">✅</div>
                              <span className="text-xl font-bold text-green-600">Done! Great job!</span>
                            </div>
                          ) : (
                            <Button
                              variant="primary"
                              size="lg"
                              onClick={() => router.push('/tasks')}
                              className="text-xl font-bold bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600"
                            >
                              Do it now! 🚀
                            </Button>
                          )}
                        </div>
                      </div>
                    </Card>
                  )
                })
              )}
            </div>
          </div>

          {/* Leaderboard */}
          <div>
            <h2 className="text-3xl font-black text-purple-700 mb-4">🏆 Family Scoreboard</h2>
            <div className="space-y-3">
              {sortedFamily.map((member, index) => (
                <Card
                  key={member.id}
                  variant="elevated"
                  padding="md"
                  className={`border-4 ${member.id === currentUser?.id ? 'border-yellow-400 bg-gradient-to-r from-yellow-50 to-orange-50' : 'border-blue-200'}`}
                >
                  <div className="flex items-center gap-4">
                    <div className="text-5xl">{getRankEmoji(index + 1)}</div>
                    <Avatar size="lg" src={member.avatar} />
                    <div className="flex-1">
                      <p className="text-2xl font-black text-gray-900">
                        {member.name}
                        {member.id === currentUser?.id && ' (You!)'}
                      </p>
                      <p className="text-xl font-bold text-purple-600">{member.pointsEarned} points</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Recent Badges */}
          {achievements && achievements.length > 0 && (
            <div>
              <h2 className="text-3xl font-black text-purple-700 mb-4">🌟 Your Badges</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {achievements.slice(0, 4).map(achievement => (
                  <Card
                    key={achievement.id}
                    variant="elevated"
                    padding="lg"
                    className="border-4 border-purple-300 bg-gradient-to-br from-purple-50 to-pink-50"
                  >
                    <div className="text-center">
                      <div className="text-6xl mb-3 animate-bounce">{achievement.icon}</div>
                      <h3 className="text-xl font-black text-gray-900 mb-1">{achievement.name}</h3>
                      <p className="text-base font-semibold text-purple-600">+{achievement.points} bonus points!</p>
                    </div>
                  </Card>
                ))}
              </div>
              <Button
                variant="outline"
                fullWidth
                size="lg"
                onClick={() => router.push('/badges')}
                className="mt-4 text-xl font-bold"
              >
                See All Badges! ✨
              </Button>
            </div>
          )}

          {/* Encouragement Card */}
          <Card variant="elevated" padding="lg" className="bg-gradient-to-br from-pink-400 to-purple-400 border-4 border-pink-300">
            <div className="text-center">
              <div className="text-6xl mb-4">🎊</div>
              <p className="text-2xl font-black text-white mb-2">You're Awesome!</p>
              <p className="text-lg font-bold text-white">Keep doing chores to earn more points and unlock cool rewards!</p>
            </div>
          </Card>
        </div>

        {/* Bottom Banner Ad */}
        <AdSlot adUnit="banner"
          userRole="kid"
          subscriptionTier={subscriptionTier}
          ageBracket={ageBracket}
            location={getLocationString()}
          className="mt-6"
          testMode={true}
        />
      </div>
    )
  }

  // ============================================================================
  // TEEN DASHBOARD
  // ============================================================================

  if (effectiveRole === 'teen') {
    const myPoints = currentUser?.pointsEarned || 0
    const tasksCompleted = currentUser?.tasksCompleted || 0
    const currentStreak = 3 // TODO: Calculate from API

    const todaysTasks = myTasks.filter(task => {
      // For daily tasks, show them
      if (task.frequency === 'daily') return true
      return false
    })

    const completedToday = todaysTasks.filter(t => getTaskStatus(t) === 'completed').length

    // Sort family by points
    const sortedFamily = [...familyMembers].sort((a, b) => b.pointsEarned - a.pointsEarned)

    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-4 pb-24">
        <ToastContainer toasts={toast.toasts} onRemove={toast.removeToast} />

        {/* Top Banner Ad */}
        <AdSlot adUnit="banner"
          userRole="teen"
          subscriptionTier={subscriptionTier}
          ageBracket={ageBracket}
            location={getLocationString()}
          className="mb-6"
          testMode={true}
        />

        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 mb-2">
              Welcome back, {currentUser?.name}
            </h1>
            <p className="text-lg text-gray-600">Here's what's happening today</p>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card variant="elevated" padding="md" className="bg-gradient-to-br from-indigo-500 to-purple-500 border-2 border-indigo-300">
              <div className="text-center">
                <div className="text-4xl font-bold text-white mb-1">{myPoints}</div>
                <p className="text-sm font-semibold text-white/90">Total Points</p>
              </div>
            </Card>

            <Card variant="elevated" padding="md" className="bg-gradient-to-br from-purple-500 to-pink-500 border-2 border-purple-300">
              <div className="text-center">
                <div className="text-4xl font-bold text-white mb-1">{completedToday}/{todaysTasks.length}</div>
                <p className="text-sm font-semibold text-white/90">Tasks Today</p>
              </div>
            </Card>

            <Card variant="elevated" padding="md" className="bg-gradient-to-br from-pink-500 to-red-500 border-2 border-pink-300">
              <div className="text-center">
                <div className="text-4xl font-bold text-white mb-1">{currentStreak} 🔥</div>
                <p className="text-sm font-semibold text-white/90">Day Streak</p>
              </div>
            </Card>
          </div>

          {/* Today's Tasks */}
          <Card variant="default" padding="lg">
            <CardHeader>
              <CardTitle className="text-2xl">Today's Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {todaysTasks.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-5xl mb-3">✨</div>
                    <p className="text-gray-600">No tasks for today</p>
                  </div>
                ) : (
                  todaysTasks.map(task => {
                    const status = getTaskStatus(task)
                    const isDone = status === 'completed'
                    return (
                      <div
                        key={task.id}
                        className={`p-4 border-2 rounded-xl transition-all ${
                          isDone
                            ? 'border-green-200 bg-green-50'
                            : 'border-gray-200 bg-white hover:border-indigo-300 hover:shadow-md'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="text-3xl">{getTaskEmoji(task.name)}</div>
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900">{task.name}</h3>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="info" size="sm">{task.points} pts</Badge>
                              {task.dueTime && (
                                <span className="text-sm text-gray-600">Due: {task.dueTime}</span>
                              )}
                            </div>
                          </div>
                          {isDone ? (
                            <div className="text-2xl">✅</div>
                          ) : (
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => router.push('/tasks')}
                            >
                              Complete
                            </Button>
                          )}
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-4">
            <Card
              variant="elevated"
              padding="md"
              className="cursor-pointer hover:shadow-xl transition-shadow bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200"
              onClick={() => router.push('/tasks')}
            >
              <div className="text-center">
                <div className="text-4xl mb-2">📋</div>
                <p className="font-semibold text-gray-900">All Tasks</p>
              </div>
            </Card>

            <Card
              variant="elevated"
              padding="md"
              className="cursor-pointer hover:shadow-xl transition-shadow bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200"
              onClick={() => router.push('/rewards')}
            >
              <div className="text-center">
                <div className="text-4xl mb-2">🎁</div>
                <p className="font-semibold text-gray-900">Rewards</p>
              </div>
            </Card>
          </div>

          {/* Family Leaderboard */}
          <Card variant="default" padding="lg">
            <CardHeader>
              <CardTitle className="text-2xl">Family Leaderboard</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {sortedFamily.map((member, index) => (
                  <div
                    key={member.id}
                    className={`flex items-center gap-3 p-3 rounded-lg ${
                      member.id === currentUser?.id
                        ? 'bg-indigo-50 border-2 border-indigo-200'
                        : 'bg-gray-50'
                    }`}
                  >
                    <div className="text-2xl">{getRankEmoji(index + 1)}</div>
                    <Avatar src={member.avatar} />
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">
                        {member.name}
                        {member.id === currentUser?.id && ' (You)'}
                      </p>
                      <p className="text-sm text-gray-600">{member.pointsEarned} points</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Achievements */}
          {achievements && achievements.length > 0 && (
            <Card variant="default" padding="lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-2xl">Recent Badges</CardTitle>
                  <Button variant="outline" size="sm" onClick={() => router.push('/badges')}>
                    View All
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {achievements.slice(0, 4).map(achievement => (
                    <div key={achievement.id} className="text-center p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border-2 border-purple-200">
                      <div className="text-4xl mb-2">{achievement.icon}</div>
                      <p className="text-sm font-semibold text-gray-900">{achievement.name}</p>
                      <p className="text-xs text-purple-600">+{achievement.points} pts</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Bottom Banner Ad */}
        <AdSlot adUnit="banner"
          userRole="teen"
          subscriptionTier={subscriptionTier}
          ageBracket={ageBracket}
            location={getLocationString()}
          className="mt-6"
          testMode={true}
        />
      </div>
    )
  }

  // ============================================================================
  // ADULT DASHBOARD
  // ============================================================================

  const myCompletedToday = myTasks.filter(t => getTaskStatus(t) === 'completed').length
  const myPendingToday = myTasks.filter(t => getTaskStatus(t) === 'pending').length

  return (
    <div className="min-h-screen bg-gray-50 p-4 pb-24">
      <ToastContainer toasts={toast.toasts} onRemove={toast.removeToast} />

      {/* Top Banner Ad */}
      <AdSlot adUnit="banner"
        userRole="adult"
        subscriptionTier={subscriptionTier}
          ageBracket={ageBracket}
            location={getLocationString()}
        className="mb-6"
        testMode={true}
      />

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Dashboard
            </h1>
            <p className="text-gray-600">
              Welcome back, {currentUser?.name}
            </p>
          </div>

          {isManager && (
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowCreateTaskModal(true)}>
                + Task
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowAddMemberModal(true)}>
                + Member
              </Button>
              <Button variant="primary" size="sm" onClick={() => setShowCreateRewardModal(true)}>
                + Reward
              </Button>
            </div>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-4 mb-6">
          <Card variant="default" padding="md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">My Points</p>
                <p className="text-3xl font-bold text-purple-600">{currentUser?.pointsEarned || 0}</p>
              </div>
              <div className="text-4xl">💎</div>
            </div>
          </Card>

          <Card variant="default" padding="md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Completed Today</p>
                <p className="text-3xl font-bold text-green-600">{myCompletedToday}</p>
              </div>
              <div className="text-4xl">✅</div>
            </div>
          </Card>

          <Card variant="default" padding="md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Pending Tasks</p>
                <p className="text-3xl font-bold text-yellow-600">{myPendingToday}</p>
              </div>
              <div className="text-4xl">⏳</div>
            </div>
          </Card>

          <Card variant="default" padding="md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Family Members</p>
                <p className="text-3xl font-bold text-blue-600">{familyMembers.length}</p>
              </div>
              <div className="text-4xl">👨‍👩‍👧‍👦</div>
            </div>
          </Card>
        </div>

        {/* Manager Stats (if applicable) */}
        {isManager && familyStats && (
          <div className="grid md:grid-cols-3 gap-4 mb-6">
            <Card variant="default" padding="md">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-1">Completion Rate</p>
                <p className="text-4xl font-bold text-blue-600">{Math.round(familyStats.completionRate)}%</p>
                <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-full rounded-full transition-all"
                    style={{ width: `${familyStats.completionRate}%` }}
                  />
                </div>
              </div>
            </Card>

            <Card variant="default" padding="md">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-1">Family Tasks Today</p>
                <p className="text-4xl font-bold text-green-600">{familyStats.completedToday}</p>
                <p className="text-sm text-gray-500 mt-1">completed</p>
              </div>
            </Card>

            <Card variant="default" padding="md">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-1">Overdue Tasks</p>
                <p className="text-4xl font-bold text-red-600">{familyStats.overdueTasks || 0}</p>
                <p className="text-sm text-gray-500 mt-1">need attention</p>
              </div>
            </Card>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Task Management */}
            <Card variant="default" padding="lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>
                    {isManager ? 'Task Management' : 'My Tasks'}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    {isManager && (
                      <>
                        <select
                          value={selectedMemberId}
                          onChange={(e) => setSelectedMemberId(e.target.value)}
                          className="text-sm border border-gray-300 rounded-lg px-3 py-1.5"
                        >
                          <option value="all">All Members</option>
                          {familyMembers.map(member => (
                            <option key={member.id} value={member.id}>
                              {member.name}
                            </option>
                          ))}
                        </select>

                        <select
                          value={timeFilter}
                          onChange={(e) => setTimeFilter(e.target.value as any)}
                          className="text-sm border border-gray-300 rounded-lg px-3 py-1.5"
                        >
                          <option value="all">All Time</option>
                          <option value="today">Today</option>
                          <option value="yesterday">Yesterday</option>
                          <option value="last7days">Last 7 Days</option>
                          <option value="last30days">Last 30 Days</option>
                        </select>

                        <select
                          value={sortBy}
                          onChange={(e) => setSortBy(e.target.value as any)}
                          className="text-sm border border-gray-300 rounded-lg px-3 py-1.5"
                        >
                          <option value="status">Sort by Status</option>
                          <option value="name">Sort by Name</option>
                          <option value="dueTime">Sort by Time</option>
                          <option value="points">Sort by Points</option>
                        </select>
                      </>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {isManager ? (
                    tasksByMember.length === 0 ? (
                      <div className="text-center py-8">
                        <div className="text-5xl mb-3">📋</div>
                        <p className="text-gray-600">No tasks found</p>
                      </div>
                    ) : (
                      tasksByMember.map(member => (
                        <div key={member.memberId} className="border-b border-gray-200 pb-4 last:border-b-0 last:pb-0">
                          <div className="flex items-center gap-3 mb-3">
                            <Avatar src={member.avatar} />
                            <h3 className="font-semibold text-gray-900">{member.memberName}</h3>
                            <Badge variant="default" size="sm">{member.tasks.length} tasks</Badge>
                          </div>
                          <div className="space-y-2 ml-12">
                            {member.tasks.map(task => (
                              <div
                                key={task.id}
                                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                              >
                                <div className="flex-1">
                                  <p className="font-medium text-gray-900">{task.name}</p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <Badge variant="info" size="sm">{task.category}</Badge>
                                    <span className="text-sm text-gray-600">{task.points} pts</span>
                                    {task.dueTime && (
                                      <span className="text-sm text-gray-600">Due: {task.dueTime}</span>
                                    )}
                                  </div>
                                </div>
                                <Badge variant={getStatusColor(task.status)} size="sm">
                                  {getStatusText(task.status)}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))
                    )
                  ) : (
                    myTasks.length === 0 ? (
                      <div className="text-center py-8">
                        <div className="text-5xl mb-3">✨</div>
                        <p className="text-gray-600">No tasks assigned</p>
                      </div>
                    ) : (
                      myTasks.map(task => {
                        const status = getTaskStatus(task)
                        return (
                          <div
                            key={task.id}
                            className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                          >
                            <div className="flex-1">
                              <h3 className="font-semibold text-gray-900 mb-1">{task.name}</h3>
                              <div className="flex items-center gap-2">
                                <Badge variant="info" size="sm">{task.category}</Badge>
                                <span className="text-sm text-gray-600">{task.points} pts</span>
                                {task.dueTime && (
                                  <span className="text-sm text-gray-600">Due: {task.dueTime}</span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant={getStatusColor(status)} size="sm">
                                {getStatusText(status)}
                              </Badge>
                              {status !== 'completed' && (
                                <Button variant="outline" size="sm" onClick={() => router.push('/tasks')}>
                                  Complete
                                </Button>
                              )}
                            </div>
                          </div>
                        )
                      })
                    )
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Health Metrics (Manager Only) */}
            {isManager && healthMetrics && (
              <Card variant="default" padding="lg">
                <CardHeader>
                  <CardTitle>Family Health Metrics</CardTitle>
                  <CardDescription>Track how well your family system is working</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Task Distribution */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">Task Distribution</span>
                        <span className={`text-sm font-semibold ${healthMetrics.taskDistributionColor}`}>
                          {healthMetrics.taskDistributionLabel}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-purple-500 h-full rounded-full transition-all"
                          style={{ width: `${healthMetrics.taskDistribution}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        How evenly tasks are distributed across family members
                      </p>
                    </div>

                    {/* Engagement */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">Family Engagement</span>
                        <span className={`text-sm font-semibold ${healthMetrics.engagementColor}`}>
                          {healthMetrics.engagementLabel}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-green-500 to-teal-500 h-full rounded-full transition-all"
                          style={{ width: `${healthMetrics.engagement}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Overall completion rate and participation
                      </p>
                    </div>

                    {/* On-Time Completion */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">On-Time Completion</span>
                        <span className={`text-sm font-semibold ${healthMetrics.onTimeCompletionColor}`}>
                          {healthMetrics.onTimeCompletionLabel}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-yellow-500 to-orange-500 h-full rounded-full transition-all"
                          style={{ width: `${healthMetrics.onTimeCompletion}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Tasks completed before their due time
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Pending Approvals (Manager Only) */}
            {isManager && approvals && approvals.length > 0 && (
              <Card variant="default" padding="lg">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Pending Approvals</CardTitle>
                    <Badge variant="warning">{approvals.length}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {approvals.slice(0, 5).map(approval => (
                      <div
                        key={approval.id}
                        className="p-3 bg-yellow-50 border-2 border-yellow-200 rounded-lg"
                      >
                        <div className="flex items-start gap-3 mb-2">
                          <div className="text-2xl">{approval.icon || (approval.type === 'task' ? '📋' : '🎁')}</div>
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900 text-sm">{approval.memberName}</p>
                            <p className="text-sm text-gray-700">{approval.title}</p>
                            <span className="text-xs text-gray-500">{approval.timeAgo}</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="primary"
                            size="sm"
                            fullWidth
                            onClick={() => handleApprove(approval)}
                            disabled={processingApprovalId === approval.id}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            ✓ Approve
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            fullWidth
                            onClick={() => handleDeny(approval)}
                            disabled={processingApprovalId === approval.id}
                          >
                            ✗ Deny
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Family Overview */}
            <Card variant="default" padding="lg">
              <CardHeader>
                <CardTitle>Family Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {familyMembers
                    .sort((a, b) => b.pointsEarned - a.pointsEarned)
                    .map((member, index) => (
                      <div
                        key={member.id}
                        className={`flex items-center gap-3 p-3 rounded-lg ${
                          member.id === currentUser?.id ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50'
                        }`}
                      >
                        <div className="text-xl">{getRankEmoji(index + 1)}</div>
                        <Avatar src={member.avatar} size="sm" />
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 text-sm">
                            {member.name}
                            {member.id === currentUser?.id && ' (You)'}
                          </p>
                          <p className="text-xs text-gray-600">{member.pointsEarned} points</p>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Achievements */}
            {achievements && achievements.length > 0 && (
              <Card variant="default" padding="lg">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Recent Badges</CardTitle>
                    <Button variant="outline" size="sm" onClick={() => router.push('/badges')}>
                      View All
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {achievements.slice(0, 3).map(achievement => (
                      <div key={achievement.id} className="flex items-center gap-3 p-2 bg-purple-50 rounded-lg">
                        <div className="text-3xl">{achievement.icon}</div>
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900 text-sm">{achievement.name}</p>
                          <p className="text-xs text-purple-600">+{achievement.points} pts</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Banner Ad */}
      <AdSlot adUnit="banner"
        userRole="adult"
        subscriptionTier={subscriptionTier}
          ageBracket={ageBracket}
            location={getLocationString()}
        className="mt-6"
        testMode={true}
      />

      {/* Modals */}
      {isManager && (
        <>
          <QuickCreateTaskModal
            isOpen={showCreateTaskModal}
            onClose={() => setShowCreateTaskModal(false)}
            onSuccess={refresh}
          />
          <QuickAddMemberModal
            isOpen={showAddMemberModal}
            onClose={() => setShowAddMemberModal(false)}
            onSuccess={refresh}
          />
          <QuickCreateRewardModal
            isOpen={showCreateRewardModal}
            onClose={() => setShowCreateRewardModal(false)}
            onSuccess={refresh}
          />
        </>
      )}
    </div>
  )
}
