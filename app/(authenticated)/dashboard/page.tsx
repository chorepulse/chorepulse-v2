'use client'

/**
 * ChorePulse Dashboard V2 - Enhanced with All Improvements
 *
 * New Features:
 * - Quick stats row (streak, weekly points, badges, family)
 * - Weekly overview card
 * - Points needed for next reward
 * - Streak protection warning
 * - Upcoming deadlines alert
 * - Leaderboard widget
 * - Time-based motivational messages
 * - Achievement progress tracker
 * - Parent approvals widget
 * - Quick action shortcuts
 */

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useDashboard } from '@/hooks/useDashboard'
import { PageTransition, StaggerContainer, StaggerItem, useConfettiCelebration } from '@/components/animations'
import { LiftCard, PointsBadge, FloatingActionButton } from '@/components/animations/MicroInteractions'
import { SwipeableCard } from '@/components/gestures/SwipeableCard'
import GlassCard from '@/components/ui/GlassCard'
import { Check, Plus, Star, TrendingUp, Clock, Flame, Target, Gift, Users, Award, Sparkles, Trophy, AlertCircle, Zap, Calendar, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import AdSlot from '@/components/AdSlot'
import { useSubscription } from '@/hooks/useSubscription'
import { useAgeBracket } from '@/hooks/useAgeBracket'
import { useLocation } from '@/hooks/useLocation'

export default function DashboardV2Enhanced() {
  const router = useRouter()
  const { celebrate } = useConfettiCelebration()
  const [userRole, setUserRole] = useState<'kid' | 'teen' | 'adult'>('adult')
  const [currentTime, setCurrentTime] = useState(new Date())
  const [weeklyTasks, setWeeklyTasks] = useState<any[]>([])
  const [weeklyCompletions, setWeeklyCompletions] = useState(0)
  const [leaderboard, setLeaderboard] = useState<any[]>([])
  const [nextBadge, setNextBadge] = useState<any>(null)
  const [pendingApprovals, setPendingApprovals] = useState<any[]>([])
  const [speedDialOpen, setSpeedDialOpen] = useState(false)

  // For ads
  const { subscriptionTier } = useSubscription()
  const { ageBracket } = useAgeBracket()
  const { getLocationString } = useLocation()

  const {
    currentUser,
    myTasks,
    familyStats,
    familyMembers,
    allTasks,
    achievements,
    isLoading,
    refresh
  } = useDashboard({ autoRefresh: true, refreshInterval: 60000 })

  // Update time every minute for time-based messages
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000)
    return () => clearInterval(timer)
  }, [])

  // Set user role from currentUser data
  useEffect(() => {
    if (currentUser?.role) {
      setUserRole(currentUser.role as 'kid' | 'teen' | 'adult')
    }
  }, [currentUser])

  // Fetch pending approvals (for parents)
  useEffect(() => {
    const fetchApprovals = async () => {
      if (userRole === 'adult') {
        try {
          const approvalsRes = await fetch('/api/approvals?limit=5')
          if (approvalsRes.ok) {
            const data = await approvalsRes.json()
            setPendingApprovals(data.approvals || [])
          }
        } catch (err) {
          console.error('Failed to fetch approvals:', err)
        }
      }
    }
    fetchApprovals()
  }, [userRole])

  // Calculate weekly stats
  useEffect(() => {
    if (!myTasks) return

    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

    const thisWeekCompletions = myTasks.filter(task =>
      task.completions && task.completions.some((c: any) =>
        new Date(c.completedAt) >= oneWeekAgo
      )
    )

    setWeeklyCompletions(thisWeekCompletions.length)
  }, [myTasks])

  // Build leaderboard
  useEffect(() => {
    if (!familyMembers) return

    const leaderboardData = familyMembers
      .map(member => ({
        id: member.id,
        name: member.name,
        avatar: member.avatar || '👤',
        points: member.points || 0
      }))
      .sort((a, b) => b.points - a.points)
      .slice(0, 5)

    setLeaderboard(leaderboardData)
  }, [familyMembers])

  // Find next achievable badge
  useEffect(() => {
    const fetchNextBadge = async () => {
      try {
        const res = await fetch('/api/achievements/milestones?limit=1')
        if (res.ok) {
          const data = await res.json()
          if (data.milestones && data.milestones.length > 0) {
            setNextBadge(data.milestones[0])
          }
        }
      } catch (err) {
        console.error('Failed to fetch next badge:', err)
      }
    }
    fetchNextBadge()
  }, [])

  const handleCompleteTask = async (taskId: string) => {
    try {
      const response = await fetch('/api/task-completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId })
      })

      if (response.ok) {
        celebrate()
        await refresh()
      }
    } catch (error) {
      console.error('Error completing task:', error)
    }
  }

  // Calculate streak
  const calculateStreak = () => {
    if (!myTasks || myTasks.length === 0) return 0

    const completions = myTasks
      .filter(t => t.completions && t.completions.length > 0)
      .flatMap(t => t.completions)
      .sort((a: any, b: any) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())

    let streak = 0
    let currentDate = new Date()
    currentDate.setHours(0, 0, 0, 0)

    for (const completion of completions) {
      const completionDate = new Date(completion.completedAt)
      completionDate.setHours(0, 0, 0, 0)
      const daysDiff = Math.floor((currentDate.getTime() - completionDate.getTime()) / (1000 * 60 * 60 * 24))

      if (daysDiff === streak) {
        streak++
      } else if (daysDiff > streak) {
        break
      }
    }
    return streak
  }

  // Get time-based greeting and message
  const getTimeBasedMessage = () => {
    const hour = currentTime.getHours()
    const name = currentUser?.name?.split(' ')[0] || 'there'

    if (hour >= 5 && hour < 12) {
      return {
        greeting: `Good morning, ${name}! ☀️`,
        message: 'Start your day strong!'
      }
    } else if (hour >= 12 && hour < 17) {
      return {
        greeting: `Good afternoon, ${name}! 👋`,
        message: `You've completed ${completedToday} tasks today!`
      }
    } else if (hour >= 17 && hour < 22) {
      return {
        greeting: `Good evening, ${name}! 🌙`,
        message: 'Time to wrap up your day!'
      }
    } else {
      return {
        greeting: `Hey ${name}! 🌟`,
        message: 'Still going strong!'
      }
    }
  }

  // Categorize tasks
  const pendingTasks = myTasks?.filter(task =>
    !task.completions || task.completions.length === 0 ||
    task.completions[0].approved === false
  ) || []

  const todayTasks = pendingTasks.filter(task => {
    if (!task.dueTime) return false
    const now = new Date()
    const taskHour = parseInt(task.dueTime.split(':')[0])
    const currentHour = now.getHours()
    return Math.abs(taskHour - currentHour) <= 3
  })

  const upcomingTasks = pendingTasks.filter(task =>
    !todayTasks.includes(task)
  ).slice(0, 5)

  // Urgent tasks (due in next hour)
  const urgentTasks = pendingTasks.filter(task => {
    if (!task.dueTime) return false
    const now = new Date()
    const [hours, minutes] = task.dueTime.split(':').map(Number)
    const dueDate = new Date()
    dueDate.setHours(hours, minutes, 0, 0)
    const diffMs = dueDate.getTime() - now.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    return diffMins > 0 && diffMins <= 60
  })

  const completedToday = myTasks?.filter(task =>
    task.completions && task.completions.length > 0 &&
    new Date(task.completions[0].completedAt).toDateString() === new Date().toDateString()
  ).length || 0

  const totalPoints = currentUser?.points || 0
  const todayPoints = completedToday * 10
  const streak = calculateStreak()
  const totalBadges = achievements?.filter((a: any) => a.unlockedAt).length || 0

  // Progress calculation
  const totalTasksToday = todayTasks.length + completedToday
  const progressPercentage = totalTasksToday > 0 ? Math.round((completedToday / totalTasksToday) * 100) : 0

  // Weekly progress
  const weeklyGoal = 20 // Could be dynamic
  const weeklyProgress = Math.min(Math.round((weeklyCompletions / weeklyGoal) * 100), 100)

  // Get suggested next task
  const suggestedTask = todayTasks.length > 0
    ? todayTasks.sort((a, b) => b.points - a.points)[0]
    : null

  // Recent family activity
  const recentActivity = allTasks
    ?.filter(task => task.completions && task.completions.length > 0)
    .flatMap(task =>
      task.completions.map((completion: any) => ({
        id: completion.id,
        taskName: task.name,
        userId: completion.userId,
        userName: familyMembers?.find(m => m.id === completion.userId)?.name || 'Someone',
        userAvatar: familyMembers?.find(m => m.id === completion.userId)?.avatar || '👤',
        points: task.points,
        completedAt: completion.completedAt
      }))
    )
    .sort((a: any, b: any) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())
    .slice(0, 5) || []

  // Affordable rewards
  const [affordableRewards, setAffordableRewards] = useState<any[]>([])
  const [nextReward, setNextReward] = useState<any>(null)

  useEffect(() => {
    const fetchRewards = async () => {
      try {
        const response = await fetch('/api/rewards')
        if (response.ok) {
          const data = await response.json()
          const affordable = data.rewards
            ?.filter((r: any) => r.pointsCost <= totalPoints && r.stock > 0)
            .sort((a: any, b: any) => a.pointsCost - b.pointsCost)
            .slice(0, 3) || []
          setAffordableRewards(affordable)

          // Find next reward goal
          const nextGoal = data.rewards
            ?.filter((r: any) => r.pointsCost > totalPoints && r.stock > 0)
            .sort((a: any, b: any) => a.pointsCost - b.pointsCost)[0]
          setNextReward(nextGoal)
        }
      } catch (err) {
        console.error('Error fetching rewards:', err)
      }
    }
    if (totalPoints >= 0) {
      fetchRewards()
    }
  }, [totalPoints])

  // Streak protection check
  const needsTaskForStreak = streak > 0 && completedToday === 0

  // User's leaderboard position
  const myPosition = leaderboard.findIndex(m => m.id === currentUser?.id) + 1
  const pointsToFirst = myPosition > 1 ? (leaderboard[0]?.points || 0) - totalPoints : 0

  const timeBasedMsg = getTimeBasedMessage()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-mesh-purple">
        <div className="w-16 h-16 border-4 border-deep-purple border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-gradient-mesh-purple pb-24 md:pb-8">
        {/* Compact Header */}
        <div className="sticky top-0 z-10 glass-strong px-4 py-3 border-b border-white/10">
          <div className="flex items-center justify-between max-w-3xl mx-auto">
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                {timeBasedMsg.greeting}
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {timeBasedMsg.message}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-warning-yellow fill-warning-yellow" />
              <span className="text-2xl font-black gradient-text">{totalPoints}</span>
            </div>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
          {/* Quick Stats Row */}
          <div className="grid grid-cols-4 gap-3">
            <LiftCard className="glass p-3 rounded-xl text-center">
              <Flame className="w-6 h-6 mx-auto mb-1 text-warning-yellow fill-warning-yellow" />
              <div className="text-2xl font-black text-gray-900 dark:text-white">{streak}</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Streak</div>
            </LiftCard>

            <LiftCard className="glass p-3 rounded-xl text-center">
              <Star className="w-6 h-6 mx-auto mb-1 text-success-green fill-success-green" />
              <div className="text-2xl font-black text-gray-900 dark:text-white">{weeklyCompletions}</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">This Week</div>
            </LiftCard>

            <LiftCard className="glass p-3 rounded-xl text-center">
              <Trophy className="w-6 h-6 mx-auto mb-1 text-deep-purple" />
              <div className="text-2xl font-black text-gray-900 dark:text-white">{totalBadges}</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Badges</div>
            </LiftCard>

            <LiftCard className="glass p-3 rounded-xl text-center">
              <Users className="w-6 h-6 mx-auto mb-1 text-soft-blue" />
              <div className="text-2xl font-black text-gray-900 dark:text-white">{familyMembers?.length || 0}</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Family</div>
            </LiftCard>
          </div>

          {/* Streak Protection Warning */}
          {needsTaskForStreak && (
            <GlassCard variant="strong" className="p-4 border-2 border-warning-yellow/50 bg-warning-yellow/5">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-6 h-6 text-warning-yellow flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 dark:text-white">Protect Your Streak! 🔥</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Complete 1 task today to maintain your {streak}-day streak!
                  </p>
                </div>
              </div>
            </GlassCard>
          )}

          {/* Urgent Deadlines Alert */}
          {urgentTasks.length > 0 && (
            <GlassCard variant="strong" className="p-4 border-2 border-heartbeat-red/50 bg-heartbeat-red/5">
              <div className="flex items-center gap-3 mb-3">
                <Clock className="w-5 h-5 text-heartbeat-red flex-shrink-0" />
                <h3 className="font-bold text-gray-900 dark:text-white">
                  ⚠️ {urgentTasks.length} task{urgentTasks.length > 1 ? 's' : ''} due soon
                </h3>
              </div>
              <div className="space-y-2">
                {urgentTasks.slice(0, 2).map(task => (
                  <div key={task.id} className="flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4 text-heartbeat-red" />
                    <span className="flex-1 text-gray-900 dark:text-white font-medium">{task.name}</span>
                    <span className="text-xs text-gray-600 dark:text-gray-400">Due {task.dueTime}</span>
                  </div>
                ))}
              </div>
            </GlassCard>
          )}

          {/* Next Reward Goal */}
          {nextReward && (
            <GlassCard variant="strong" blur="lg" className="p-4 border-2 border-heartbeat-red/30">
              <div className="flex items-center gap-3 mb-3">
                <Target className="w-5 h-5 text-heartbeat-red" />
                <h3 className="font-bold text-gray-900 dark:text-white">Next Goal</h3>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {nextReward.pointsCost - totalPoints} more points for
                  </span>
                  <PointsBadge
                    points={nextReward.pointsCost}
                    className="px-2 py-1 bg-heartbeat-red/10 text-heartbeat-red rounded-full text-xs font-bold"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg">{nextReward.icon || '🎁'}</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{nextReward.name}</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-gradient-cta h-2 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min((totalPoints / nextReward.pointsCost) * 100, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-center text-gray-600 dark:text-gray-400">
                  {Math.round((totalPoints / nextReward.pointsCost) * 100)}% there!
                </p>
              </div>
            </GlassCard>
          )}

          {/* Weekly Overview */}
          <GlassCard variant="strong" blur="md" className="p-5">
            <div className="flex items-center gap-3 mb-4">
              <Calendar className="w-5 h-5 text-soft-blue" />
              <h3 className="font-bold text-gray-900 dark:text-white">This Week</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Progress</span>
                <span className="text-sm font-bold text-gray-900 dark:text-white">
                  {weeklyCompletions} of {weeklyGoal} tasks
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                <div
                  className="bg-gradient-ai h-3 rounded-full transition-all duration-500"
                  style={{ width: `${weeklyProgress}%` }}
                />
              </div>
              {weeklyProgress >= 70 && (
                <p className="text-sm text-success-green font-semibold flex items-center gap-1">
                  <TrendingUp className="w-4 h-4" />
                  On track to beat last week! 🔥
                </p>
              )}
            </div>
          </GlassCard>

          {/* Achievement Progress */}
          {nextBadge && (
            <GlassCard variant="subtle" className="p-4">
              <div className="flex items-center gap-3">
                <Trophy className="w-5 h-5 text-warning-yellow fill-warning-yellow" />
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 dark:text-white text-sm">Almost there! 🏆</h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {nextBadge.tasksRemaining || 2} more tasks to unlock "{nextBadge.name}"
                  </p>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mt-2">
                    <div
                      className="bg-warning-yellow h-1.5 rounded-full"
                      style={{ width: `${nextBadge.progress || 80}%` }}
                    />
                  </div>
                </div>
              </div>
            </GlassCard>
          )}

          {/* Parent: Pending Approvals */}
          {userRole === 'adult' && pendingApprovals.length > 0 && (
            <GlassCard variant="strong" className="p-4 border-2 border-deep-purple/30">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-deep-purple" />
                  <h3 className="font-bold text-gray-900 dark:text-white">
                    {pendingApprovals.length} Task{pendingApprovals.length > 1 ? 's' : ''} Need Approval
                  </h3>
                </div>
                <button
                  onClick={() => router.push('/approvals')}
                  className="text-sm text-deep-purple font-semibold hover:underline"
                >
                  Review →
                </button>
              </div>
              <div className="space-y-2">
                {pendingApprovals.slice(0, 3).map((approval: any) => (
                  <div key={approval.id} className="flex items-center gap-2 text-sm">
                    <span className="text-lg">{approval.userAvatar || '👤'}</span>
                    <span className="flex-1 text-gray-900 dark:text-white">{approval.userName}</span>
                    <span className="text-xs text-gray-600 dark:text-gray-400 truncate max-w-[120px]">
                      {approval.taskName}
                    </span>
                  </div>
                ))}
              </div>
            </GlassCard>
          )}

          {/* Daily Progress Ring */}
          {totalTasksToday > 0 && (
            <LiftCard className="glass p-5 rounded-2xl">
              <div className="flex items-center gap-4">
                <div className="relative w-20 h-20">
                  <svg className="w-full h-full -rotate-90">
                    <circle
                      cx="40" cy="40" r="32"
                      stroke="currentColor"
                      strokeWidth="6"
                      fill="none"
                      className="text-gray-200 dark:text-gray-700"
                    />
                    <circle
                      cx="40" cy="40" r="32"
                      stroke="currentColor"
                      strokeWidth="6"
                      fill="none"
                      strokeDasharray={`${2 * Math.PI * 32}`}
                      strokeDashoffset={`${2 * Math.PI * 32 * (1 - progressPercentage / 100)}`}
                      className="text-success-green transition-all duration-500"
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-lg font-black text-gray-900 dark:text-white">{progressPercentage}%</span>
                  </div>
                </div>

                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 dark:text-white text-lg">Today's Progress</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {completedToday} of {totalTasksToday} tasks completed
                  </p>
                  {progressPercentage === 100 && (
                    <p className="text-sm text-success-green font-semibold mt-1 flex items-center gap-1">
                      <Award className="w-4 h-4" />
                      Perfect day!
                    </p>
                  )}
                </div>

                {progressPercentage >= 50 && <div className="text-3xl">🔥</div>}
              </div>
            </LiftCard>
          )}

          {/* Smart Suggestion */}
          {suggestedTask && (
            <GlassCard variant="strong" blur="lg" className="p-4 border-2 border-deep-purple/30">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-5 h-5 text-deep-purple" />
                <h3 className="font-bold text-gray-900 dark:text-white">Suggested Next</h3>
              </div>
              <SwipeableCard
                onSwipeRight={() => handleCompleteTask(suggestedTask.id)}
                rightAction={{
                  icon: <Check className="w-5 h-5" />,
                  color: '#2ECC71',
                  label: 'Done',
                }}
              >
                <div className="glass-strong p-4 rounded-2xl flex items-center gap-4">
                  <div className="text-3xl">{suggestedTask.icon || '⭐'}</div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 dark:text-white">{suggestedTask.name}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Highest value task</p>
                  </div>
                  <PointsBadge
                    points={suggestedTask.points}
                    className="px-3 py-1 bg-success-green/20 text-success-green rounded-full text-sm font-bold"
                  />
                </div>
              </SwipeableCard>
            </GlassCard>
          )}

          {/* Up Next */}
          {todayTasks.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Clock className="w-5 h-5 text-deep-purple" />
                  Up Next
                </h2>
                <span className="text-sm text-gray-500">{todayTasks.length} tasks</span>
              </div>

              <StaggerContainer className="space-y-3">
                {todayTasks.slice(0, 3).map((task) => (
                  <StaggerItem key={task.id}>
                    <SwipeableCard
                      onSwipeRight={() => handleCompleteTask(task.id)}
                      rightAction={{
                        icon: <Check className="w-5 h-5" />,
                        color: '#2ECC71',
                        label: 'Done',
                      }}
                    >
                      <div className="glass-strong p-4 rounded-2xl flex items-center gap-4">
                        <div className="text-3xl">{task.icon || '✨'}</div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                            {task.name}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {task.dueTime && `Due ${task.dueTime}`}
                          </p>
                        </div>
                        <PointsBadge
                          points={task.points}
                          className="px-3 py-1 bg-deep-purple/10 text-deep-purple rounded-full text-sm font-bold"
                        />
                      </div>
                    </SwipeableCard>
                  </StaggerItem>
                ))}
              </StaggerContainer>

              {todayTasks.length > 3 && (
                <button
                  onClick={() => router.push('/tasks')}
                  className="w-full mt-3 py-2 text-sm text-deep-purple font-semibold hover:underline"
                >
                  See {todayTasks.length - 3} more →
                </button>
              )}
            </div>
          )}

          {/* Leaderboard Widget */}
          {leaderboard.length > 0 && (
            <details className="group">
              <summary className="cursor-pointer list-none">
                <div className="flex items-center justify-between py-2">
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-warning-yellow fill-warning-yellow" />
                    Family Leaderboard
                  </h2>
                  <span className="text-sm text-gray-500 group-open:rotate-180 transition-transform">▼</span>
                </div>
              </summary>

              <div className="mt-3 space-y-2">
                {leaderboard.map((member, index) => {
                  const isCurrentUser = member.id === currentUser?.id
                  const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`

                  return (
                    <div
                      key={member.id}
                      className={`glass-subtle p-3 rounded-xl flex items-center gap-3 ${
                        isCurrentUser ? 'border-2 border-deep-purple/30' : ''
                      }`}
                    >
                      <span className="text-2xl w-8 text-center">{medal}</span>
                      <span className="text-xl">{member.avatar}</span>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {isCurrentUser ? 'You' : member.name}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-warning-yellow fill-warning-yellow" />
                        <span className="font-bold text-gray-900 dark:text-white">{member.points}</span>
                      </div>
                    </div>
                  )
                })}
                {myPosition > 1 && pointsToFirst > 0 && (
                  <p className="text-sm text-center text-gray-600 dark:text-gray-400 pt-2">
                    Only {pointsToFirst} points to #1! 🎯
                  </p>
                )}
              </div>
            </details>
          )}

          {/* Affordable Rewards */}
          {affordableRewards.length > 0 && (
            <details className="group">
              <summary className="cursor-pointer list-none">
                <div className="flex items-center justify-between py-2">
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Gift className="w-5 h-5 text-heartbeat-red" />
                    You Can Afford
                  </h2>
                  <span className="text-sm text-gray-500 group-open:rotate-180 transition-transform">▼</span>
                </div>
              </summary>

              <div className="mt-3 space-y-2">
                {affordableRewards.map((reward) => (
                  <button
                    key={reward.id}
                    onClick={() => router.push(`/rewards`)}
                    className="w-full glass-subtle p-3 rounded-xl flex items-center gap-3 hover:glass transition-all"
                  >
                    <span className="text-2xl">{reward.icon || '🎁'}</span>
                    <div className="flex-1 text-left min-w-0">
                      <p className="font-medium text-gray-900 dark:text-white text-sm truncate">
                        {reward.name}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 px-2 py-1 bg-heartbeat-red/10 rounded-full">
                      <Star className="w-3 h-3 text-heartbeat-red fill-heartbeat-red" />
                      <span className="text-xs font-bold text-heartbeat-red">{reward.pointsCost}</span>
                    </div>
                  </button>
                ))}
              </div>
            </details>
          )}

          {/* Family Activity */}
          {recentActivity.length > 0 && (
            <details className="group">
              <summary className="cursor-pointer list-none">
                <div className="flex items-center justify-between py-2">
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Users className="w-5 h-5 text-soft-blue" />
                    Family Activity
                  </h2>
                  <span className="text-sm text-gray-500 group-open:rotate-180 transition-transform">▼</span>
                </div>
              </summary>

              <div className="mt-3 space-y-2">
                {recentActivity.slice(0, 5).map((activity: any) => (
                  <div key={activity.id} className="glass-subtle p-3 rounded-xl flex items-center gap-3">
                    <span className="text-2xl">{activity.userAvatar}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900 dark:text-white">
                        <span className="font-semibold">{activity.userName}</span> completed
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                        {activity.taskName}
                      </p>
                    </div>
                    <span className="text-xs font-semibold text-success-green">
                      +{activity.points}
                    </span>
                  </div>
                ))}
              </div>
            </details>
          )}

          {/* Later */}
          {upcomingTasks.length > 0 && (
            <details className="group">
              <summary className="cursor-pointer list-none">
                <div className="flex items-center justify-between py-2">
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Zap className="w-5 h-5 text-warm-orange" />
                    Later
                  </h2>
                  <span className="text-sm text-gray-500 group-open:rotate-180 transition-transform">▼</span>
                </div>
              </summary>

              <div className="mt-3 space-y-3">
                {upcomingTasks.map((task) => (
                  <div key={task.id} className="glass-subtle p-3 rounded-xl flex items-center gap-3">
                    <span className="text-2xl">{task.icon || '✨'}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 dark:text-white text-sm truncate">
                        {task.name}
                      </p>
                    </div>
                    <span className="text-xs font-semibold text-gray-500">
                      +{task.points}
                    </span>
                  </div>
                ))}
              </div>
            </details>
          )}

          {/* Empty State */}
          {pendingTasks.length === 0 && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🎉</div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                All Caught Up!
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                You're ahead of the game. Nice work!
              </p>
              <button
                onClick={() => router.push('/rewards')}
                className="px-6 py-3 bg-gradient-ai text-white rounded-full font-semibold shadow-elevated hover:scale-105 transition-transform"
              >
                Browse Rewards
              </button>
            </div>
          )}
        </div>

        {/* Speed Dial Menu - Quick Actions */}
        <div className="flex justify-end mt-8 mb-6 pr-4">
          <div className="relative">
          {/* Speed Dial Options */}
          <AnimatePresence>
            {speedDialOpen && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="absolute bottom-24 right-0 space-y-3 mb-2"
              >
                {/* Add Task */}
                <motion.button
                  whileHover={{ scale: 1.05, x: -5 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    router.push('/tasks')
                    setSpeedDialOpen(false)
                  }}
                  className="flex items-center gap-3 glass-strong backdrop-blur-xl px-4 py-3 rounded-full shadow-elevated hover:shadow-premium transition-all group"
                >
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-200 whitespace-nowrap">
                    Add Task
                  </span>
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                    <Check className="w-5 h-5 text-white" />
                  </div>
                </motion.button>

                {/* Add Reward */}
                <motion.button
                  whileHover={{ scale: 1.05, x: -5 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    router.push('/rewards')
                    setSpeedDialOpen(false)
                  }}
                  className="flex items-center gap-3 glass-strong backdrop-blur-xl px-4 py-3 rounded-full shadow-elevated hover:shadow-premium transition-all group"
                >
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-200 whitespace-nowrap">
                    Add Reward
                  </span>
                  <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-pink-600 rounded-full flex items-center justify-center">
                    <Gift className="w-5 h-5 text-white" />
                  </div>
                </motion.button>

                {/* Add Badge/Achievement */}
                <motion.button
                  whileHover={{ scale: 1.05, x: -5 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    router.push('/badges')
                    setSpeedDialOpen(false)
                  }}
                  className="flex items-center gap-3 glass-strong backdrop-blur-xl px-4 py-3 rounded-full shadow-elevated hover:shadow-premium transition-all group"
                >
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-200 whitespace-nowrap">
                    View Badges
                  </span>
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center">
                    <Trophy className="w-5 h-5 text-white" />
                  </div>
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Main FAB */}
          <motion.button
            onClick={() => setSpeedDialOpen(!speedDialOpen)}
            className="w-20 h-20 bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-600 text-white rounded-full shadow-2xl flex items-center justify-center border-4 border-white dark:border-gray-800"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            animate={{
              rotate: speedDialOpen ? 45 : 0,
              boxShadow: [
                '0 15px 50px rgba(108, 99, 255, 0.6)',
                '0 20px 70px rgba(108, 99, 255, 0.8)',
                '0 15px 50px rgba(108, 99, 255, 0.6)',
              ],
            }}
            transition={{
              rotate: { duration: 0.2 },
              boxShadow: {
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              },
            }}
          >
            {speedDialOpen ? (
              <X className="w-8 h-8 stroke-[3]" />
            ) : (
              <Plus className="w-8 h-8 stroke-[3]" />
            )}
          </motion.button>
          </div>
        </div>

        {/* Google AdSense */}
        <AdSlot
          adUnit="banner"
          userRole={userRole}
          subscriptionTier={subscriptionTier}
          ageBracket={ageBracket}
          location={getLocationString()}
          className="mt-6"
          testMode={true}
        />
      </div>
    </PageTransition>
  )
}
