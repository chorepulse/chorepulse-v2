import { useState, useEffect, useCallback, useRef } from 'react'

// Types
export interface User {
  id: string
  name: string
  email?: string
  avatar: string
  role: string
  color: string
  isAccountOwner: boolean
  isFamilyManager: boolean
  tasksCompleted: number
  pointsEarned: number
}

export interface FamilyStats {
  completionRate: number
  overdueTasks: number
  completedToday: number
  totalActivePoints: number
  totalTasks: number
  completedTasks: number
}

export interface Task {
  id: string
  name: string
  description?: string
  category: string
  frequency: string
  dueTime?: string
  points: number
  status: string
  requiresPhoto: boolean
  requiresApproval: boolean
  assignments: {
    userId: string
    user: {
      id: string
      name: string
      avatar: string
    }
  }[]
  completions: {
    id: string
    completedAt: string
    userId: string
    approved: boolean | null
  }[]
}

export interface Achievement {
  id: string
  key: string
  name: string
  description: string
  icon: string
  category: string
  tier: string
  progress: number
  maxProgress: number
  isUnlocked: boolean
  unlockedDate?: string
  points: number
}

export interface Approval {
  id: string
  type: 'task' | 'reward'
  memberName: string
  memberAvatar?: string
  title: string
  points: number
  requestedAt: string
  timeAgo: string
  notes?: string
  photoUrl?: string
  icon?: string
}

interface UseDashboardOptions {
  autoRefresh?: boolean
  refreshInterval?: number // in milliseconds
}

export function useDashboard(options: UseDashboardOptions = {}) {
  const { autoRefresh = true, refreshInterval = 60000 } = options // Default: 60 seconds

  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [familyMembers, setFamilyMembers] = useState<User[]>([])
  const [familyStats, setFamilyStats] = useState<FamilyStats | null>(null)
  const [myTasks, setMyTasks] = useState<Task[]>([])
  const [allTasks, setAllTasks] = useState<Task[]>([])
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [approvals, setApprovals] = useState<Approval[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const isVisibleRef = useRef(true)

  // Fetch all dashboard data
  const fetchDashboardData = useCallback(async () => {
    try {
      // Fetch all data in parallel
      const [
        userResponse,
        familyResponse,
        statsResponse,
        myTasksResponse,
        allTasksResponse,
        achievementsResponse,
        approvalsResponse
      ] = await Promise.all([
        fetch('/api/users/me'),
        fetch('/api/users'),
        fetch('/api/family/stats'),
        fetch('/api/tasks?scope=my'),
        fetch('/api/tasks?scope=all'),
        fetch('/api/achievements?status=unlocked&limit=5'),
        fetch('/api/approvals?limit=10')
      ])

      // Parse responses
      const userData = userResponse.ok ? await userResponse.json() : null
      const familyData = familyResponse.ok ? await familyResponse.json() : null
      const statsData = statsResponse.ok ? await statsResponse.json() : null
      const myTasksData = myTasksResponse.ok ? await myTasksResponse.json() : null
      const allTasksData = allTasksResponse.ok ? await allTasksResponse.json() : null
      const achievementsData = achievementsResponse.ok ? await achievementsResponse.json() : null
      const approvalsData = approvalsResponse.ok ? await approvalsResponse.json() : null

      // Update state
      if (userData?.user) {
        setCurrentUser(userData.user)
      }

      if (familyData?.users) {
        setFamilyMembers(familyData.users)
      }

      if (statsData?.stats) {
        setFamilyStats(statsData.stats)
      }

      if (myTasksData?.tasks) {
        setMyTasks(myTasksData.tasks)
      }

      if (allTasksData?.tasks) {
        setAllTasks(allTasksData.tasks)
      }

      if (achievementsData?.achievements) {
        setAchievements(achievementsData.achievements)
      }

      if (approvalsData?.approvals) {
        setApprovals(approvalsData.approvals)
      }

      setLastRefresh(new Date())
      setError(null)
    } catch (err) {
      console.error('Error fetching dashboard data:', err)
      setError('Failed to load dashboard data')
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Handle visibility change (pause refresh when tab hidden)
  useEffect(() => {
    const handleVisibilityChange = () => {
      isVisibleRef.current = !document.hidden

      if (isVisibleRef.current && autoRefresh) {
        // Refresh data when tab becomes visible
        fetchDashboardData()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [autoRefresh, fetchDashboardData])

  // Setup auto-refresh
  useEffect(() => {
    // Initial fetch
    fetchDashboardData()

    // Setup interval for auto-refresh
    if (autoRefresh && refreshInterval > 0) {
      intervalRef.current = setInterval(() => {
        // Only refresh if tab is visible
        if (isVisibleRef.current) {
          fetchDashboardData()
        }
      }, refreshInterval)
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [autoRefresh, refreshInterval, fetchDashboardData])

  // Manual refresh function
  const refresh = useCallback(() => {
    return fetchDashboardData()
  }, [fetchDashboardData])

  return {
    // Data
    currentUser,
    familyMembers,
    familyStats,
    myTasks,
    allTasks,
    achievements,
    approvals,

    // State
    isLoading,
    error,
    lastRefresh,

    // Actions
    refresh
  }
}

// Hook specifically for getting today's tasks
export function useTodayTasks() {
  const [todayTasks, setTodayTasks] = useState<Task[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTodayTasks = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/tasks?scope=my')

      if (!response.ok) {
        throw new Error('Failed to fetch tasks')
      }

      const data = await response.json()

      // Filter for today's tasks
      const today = new Date()
      const todayStr = today.toISOString().split('T')[0]

      const filtered = data.tasks?.filter((task: Task) => {
        if (task.frequency === 'daily') return true
        if (task.frequency === 'weekly') {
          // Check if task is due today based on day of week
          return true // Simplified for now
        }
        return false
      }) || []

      setTodayTasks(filtered)
      setError(null)
    } catch (err) {
      console.error('Error fetching today tasks:', err)
      setError('Failed to load tasks')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTodayTasks()
  }, [fetchTodayTasks])

  return {
    todayTasks,
    isLoading,
    error,
    refresh: fetchTodayTasks
  }
}
