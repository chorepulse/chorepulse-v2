'use client'

import { useState, useEffect } from 'react'
import { PageTransition, StaggerContainer, StaggerItem, useConfettiCelebration } from '@/components/animations'
import { SwipeableCard } from '@/components/gestures/SwipeableCard'
import GlassCard from '@/components/ui/GlassCard'
import { Check, Plus, Flame, Star, Clock, Gift } from 'lucide-react'
import AdSlot from '@/components/AdSlot'
import { useSubscription } from '@/hooks/useSubscription'
import { useAgeBracket } from '@/hooks/useAgeBracket'
import { useLocation } from '@/hooks/useLocation'

interface Task {
  id: string
  name: string
  description: string
  category: string
  points: number
  status: 'active' | 'completed' | 'overdue'
  dueTime?: string
  assignedToNames: string[]
  completedToday?: boolean
  isClaimed?: boolean
  requiresPhoto?: boolean
  requiresApproval?: boolean
}

const categoryIcons: Record<string, string> = {
  'cleaning': '🧹',
  'cooking': '🍳',
  'outdoor': '🌳',
  'pet_care': '🐕',
  'homework': '📚',
  'organization': '📦',
  'maintenance': '🔧',
  'errands': '🛒',
  'personal_care': '🧼',
  'other': '✨'
}

export default function TasksPageV2() {
  const [myTasks, setMyTasks] = useState<Task[]>([])
  const [extraCreditTasks, setExtraCreditTasks] = useState<Task[]>([])
  const [userPoints, setUserPoints] = useState(0)
  const [userRole, setUserRole] = useState<'kid' | 'teen' | 'adult'>('adult')
  const [isLoading, setIsLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState<'today' | 'week' | 'all'>('today')
  const [activeView, setActiveView] = useState<'my' | 'extra'>('my')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const { celebrate } = useConfettiCelebration()

  // For ads (COPPA compliant)
  const { subscriptionTier } = useSubscription()
  const { ageBracket } = useAgeBracket()
  const { getLocationString } = useLocation()

  useEffect(() => {
    fetchData()
  }, [activeView])

  const fetchData = async () => {
    setIsLoading(true)
    try {
      // Fetch user points
      const userRes = await fetch('/api/users/me')
      if (userRes.ok) {
        const userData = await userRes.json()
        setUserPoints(userData.user?.points || 0)
      }

      // Fetch tasks
      const scope = activeView === 'my' ? 'my' : 'all'
      const tasksRes = await fetch(`/api/tasks?scope=${scope}`)
      if (tasksRes.ok) {
        const tasksData = await tasksRes.json()
        const tasks = tasksData.tasks || []

        if (activeView === 'my') {
          setMyTasks(tasks)
        } else {
          // Filter for extra credit tasks (unassigned or claimed)
          setExtraCreditTasks(tasks.filter((t: Task) =>
            t.assignedToNames.length === 0 || t.isClaimed
          ))
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCompleteTask = async (taskId: string) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: null, photoUrl: null })
      })

      if (response.ok) {
        celebrate()
        fetchData()
      }
    } catch (error) {
      console.error('Error completing task:', error)
    }
  }

  const handleClaimTask = async (taskId: string) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}/claim`, {
        method: 'POST'
      })

      if (response.ok) {
        fetchData()
      }
    } catch (error) {
      console.error('Error claiming task:', error)
    }
  }

  const getFilteredTasks = (tasks: Task[]) => {
    const now = new Date()
    const today = now.toISOString().split('T')[0]

    return tasks.filter(task => {
      if (task.completedToday) return false // Hide already completed

      if (activeFilter === 'today') {
        // Show tasks due today or overdue
        return task.status === 'active' || task.status === 'overdue'
      } else if (activeFilter === 'week') {
        // Show tasks for this week
        return task.status === 'active' || task.status === 'overdue'
      }
      return true // 'all' filter
    })
  }

  const currentTasks = activeView === 'my' ? myTasks : extraCreditTasks
  const filteredTasks = getFilteredTasks(currentTasks)
  const completedToday = currentTasks.filter(t => t.completedToday).length

  return (
    <PageTransition>
      <div className="min-h-screen gradient-mesh-purple pb-20">
        {/* Compact Sticky Header */}
        <div className="sticky top-0 z-10 glass-strong px-4 py-3 border-b border-white/10">
          <div className="flex items-center justify-between max-w-2xl mx-auto">
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2">
                ✓ Tasks
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {completedToday} done today
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* Points Display */}
              <div className="flex items-center gap-2 px-3 py-2 bg-gradient-ai rounded-xl">
                <Star className="w-4 h-4 text-white" />
                <span className="text-lg font-black text-white">{userPoints}</span>
              </div>

              {/* Add Task Button */}
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-cta rounded-xl shadow-floating hover:scale-105 transition-transform"
              >
                <Plus className="w-4 h-4 text-white" />
                <span className="text-sm font-bold text-white hidden sm:inline">Add</span>
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
          {/* View Toggle - Compact Chips */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setActiveView('my')}
              className={`px-4 py-2 rounded-full font-semibold whitespace-nowrap transition-all ${
                activeView === 'my'
                  ? 'bg-deep-purple text-white shadow-elevated'
                  : 'glass text-gray-700 dark:text-gray-300'
              }`}
            >
              My Tasks
            </button>
            <button
              onClick={() => setActiveView('extra')}
              className={`px-4 py-2 rounded-full font-semibold whitespace-nowrap transition-all flex items-center gap-1 ${
                activeView === 'extra'
                  ? 'bg-deep-purple text-white shadow-elevated'
                  : 'glass text-gray-700 dark:text-gray-300'
              }`}
            >
              <Star className="w-4 h-4" />
              Extra Credit
            </button>
          </div>

          {/* Time Filter Chips */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {(['today', 'week', 'all'] as const).map(filter => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  activeFilter === filter
                    ? 'bg-soft-blue text-white'
                    : 'glass-subtle text-gray-600 dark:text-gray-400'
                }`}
              >
                {filter === 'today' && 'Today'}
                {filter === 'week' && 'This Week'}
                {filter === 'all' && 'All Tasks'}
              </button>
            ))}
          </div>

          {/* Task List */}
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="shimmer h-24 rounded-2xl" />
              ))}
            </div>
          ) : filteredTasks.length === 0 ? (
            <GlassCard variant="strong" blur="lg" className="p-12 text-center">
              <div className="text-6xl mb-4">🎉</div>
              <h3 className="text-xl font-bold mb-2">All caught up!</h3>
              <p className="text-gray-600 dark:text-gray-400">
                {activeView === 'my'
                  ? "No tasks due right now. Great work!"
                  : "No extra credit tasks available."}
              </p>
            </GlassCard>
          ) : (
            <StaggerContainer>
              {filteredTasks.map(task => (
                <StaggerItem key={task.id}>
                  <SwipeableCard
                    onSwipeRight={() => handleCompleteTask(task.id)}
                    rightAction={{
                      icon: <Check className="w-5 h-5" />,
                      color: '#2ECC71',
                      label: 'Done'
                    }}
                  >
                    <GlassCard
                      variant="strong"
                      blur="md"
                      className="p-4 hover:shadow-elevated transition-all"
                    >
                      <div className="flex items-center gap-4">
                        {/* Category Icon */}
                        <div className="text-4xl flex-shrink-0">
                          {categoryIcons[task.category] || '✨'}
                        </div>

                        {/* Task Info */}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-lg mb-1 truncate">
                            {task.name}
                          </h3>
                          {task.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-1 mb-2">
                              {task.description}
                            </p>
                          )}
                          <div className="flex items-center gap-2 flex-wrap text-xs">
                            {task.dueTime && (
                              <span className="flex items-center gap-1 px-2 py-1 bg-warning-yellow/20 text-warning-yellow rounded-full">
                                <Clock className="w-3 h-3" />
                                {task.dueTime}
                              </span>
                            )}
                            {task.requiresPhoto && (
                              <span className="px-2 py-1 bg-info-blue/20 text-info-blue rounded-full">
                                📸 Photo
                              </span>
                            )}
                            {task.requiresApproval && (
                              <span className="px-2 py-1 bg-deep-purple/20 text-deep-purple rounded-full">
                                ✓ Approval
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Points Badge */}
                        <div className="flex flex-col items-center gap-2">
                          <div className="px-3 py-1.5 bg-gradient-cta rounded-full">
                            <span className="text-lg font-black text-white">
                              +{task.points}
                            </span>
                          </div>

                          {/* Extra Credit Claim Button */}
                          {activeView === 'extra' && !task.isClaimed && (
                            <button
                              onClick={() => handleClaimTask(task.id)}
                              className="px-3 py-1 bg-soft-blue text-white text-xs font-semibold rounded-lg hover:scale-105 transition-transform"
                            >
                              Claim
                            </button>
                          )}

                          {task.isClaimed && (
                            <span className="text-xs text-success-green font-semibold">
                              Claimed!
                            </span>
                          )}
                        </div>
                      </div>
                    </GlassCard>
                  </SwipeableCard>
                </StaggerItem>
              ))}
            </StaggerContainer>
          )}

          {/* Completed Tasks - Collapsible */}
          {currentTasks.filter(t => t.completedToday).length > 0 && (
            <details className="group">
              <summary className="cursor-pointer list-none">
                <GlassCard variant="subtle" className="p-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-bold flex items-center gap-2">
                      <Check className="w-4 h-4 text-success-green" />
                      Completed Today ({currentTasks.filter(t => t.completedToday).length})
                    </h2>
                    <span className="text-sm text-gray-500 group-open:rotate-180 transition-transform">
                      ▼
                    </span>
                  </div>
                </GlassCard>
              </summary>

              <div className="mt-3 space-y-2">
                {currentTasks
                  .filter(t => t.completedToday)
                  .map(task => (
                    <GlassCard key={task.id} variant="subtle" className="p-3 opacity-60">
                      <div className="flex items-center gap-3">
                        <Check className="w-5 h-5 text-success-green" />
                        <div className="flex-1">
                          <p className="font-medium line-through">{task.name}</p>
                        </div>
                        <span className="text-sm text-success-green font-bold">
                          +{task.points}
                        </span>
                      </div>
                    </GlassCard>
                  ))}
              </div>
            </details>
          )}
        </div>
      </div>

      {/* Create Task Modal Placeholder - Will use existing modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="glass-strong p-6 rounded-2xl max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4">Create Task</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Task creation feature coming soon. For now, use the template library or manual creation.
            </p>
            <button
              onClick={() => setShowCreateModal(false)}
              className="w-full py-3 bg-gradient-ai text-white rounded-xl font-semibold hover:scale-105 transition-transform"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Google AdSense - Only show to teens/adults (COPPA compliant) */}
      {ageBracket !== 'child' && (
        <AdSlot
          adUnit="rectangle"
          userRole={userRole}
          subscriptionTier={subscriptionTier}
          ageBracket={ageBracket}
          location={getLocationString()}
          className="mt-6"
          testMode={true}
        />
      )}
    </PageTransition>
  )
}
