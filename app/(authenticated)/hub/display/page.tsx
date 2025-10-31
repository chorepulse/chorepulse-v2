'use client'

import { useState, useEffect } from 'react'
import { Card, Badge } from '@/components/ui'

interface HubSettings {
  showTodayTasks: boolean
  showTomorrowTasks: boolean
  showWeeklyTasks: boolean
  showLeaderboard: boolean
  showFamilyStats: boolean
  showUpcomingEvents: boolean
  showCalendarEvents: boolean
  showMotivationalQuote: boolean
  showWeather: boolean
  weatherZipCode?: string
  autoRefreshInterval: number
  theme: 'light' | 'dark' | 'auto'
}

interface GoogleCalendarEvent {
  id: string
  summary: string
  start: string
  end: string
  isAllDay: boolean
  location?: string
}

interface WeatherData {
  location: string
  temperature: number
  condition: string
  icon: string
  windSpeed: number
  lastUpdated: string
}

interface Task {
  id: string
  name: string
  assignedToName: string
  assignedToColor: string
  assignedToAvatar: string
  dueDate: string
  points: number
  status: string
  category: string
}

interface FamilyMember {
  id: string
  name: string
  points: number
  tasksCompleted: number
  color: string
  avatar: string
}

interface FamilyStats {
  currentStreak: number
  totalPoints: number
  tasksThisMonth: number
}

interface Achievement {
  id: string
  name: string
  icon: string
  userName: string
  description: string
}

const motivationalQuotes = [
  { text: "Great things are done by a series of small things brought together.", author: "Vincent Van Gogh" },
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
  { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { text: "Success is the sum of small efforts repeated day in and day out.", author: "Robert Collier" }
]

export default function HubDisplayPage() {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [greeting, setGreeting] = useState('')
  const [settings, setSettings] = useState<HubSettings | null>(null)
  const [todayTasks, setTodayTasks] = useState<Task[]>([])
  const [tomorrowTasks, setTomorrowTasks] = useState<Task[]>([])
  const [leaderboard, setLeaderboard] = useState<FamilyMember[]>([])
  const [familyStats, setFamilyStats] = useState<FamilyStats>({ currentStreak: 0, totalPoints: 0, tasksThisMonth: 0 })
  const [recentAchievements, setRecentAchievements] = useState<Achievement[]>([])
  const [quote] = useState(motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)])
  const [familyName, setFamilyName] = useState('Family')
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [googleEvents, setGoogleEvents] = useState<GoogleCalendarEvent[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Update time
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000)

    const hour = new Date().getHours()
    if (hour < 12) setGreeting('Good Morning')
    else if (hour < 17) setGreeting('Good Afternoon')
    else setGreeting('Good Evening')

    return () => clearInterval(timer)
  }, [])

  // Fetch hub settings
  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/hub/settings')
      if (response.ok) {
        const data = await response.json()
        setSettings(data.settings)
      }
    } catch (error) {
      console.error('Error fetching hub settings:', error)
    }
  }

  // Fetch family name and location data
  const fetchFamilyName = async () => {
    try {
      const response = await fetch('/api/organizations/current')
      if (response.ok) {
        const data = await response.json()
        if (data.organization?.name) {
          setFamilyName(data.organization.name)
        }

        // Fetch weather if enabled and we have location data
        if (settings?.showWeather) {
          const org = data.organization
          // Prefer lat/lon if available
          if (org.latitude && org.longitude) {
            fetchWeather(org.latitude, org.longitude)
          }
          // Fallback to ZIP code from settings
          else if (settings.weatherZipCode) {
            fetchWeather(undefined, undefined, settings.weatherZipCode)
          }
        }
      }
    } catch (error) {
      console.error('Error fetching family name:', error)
    }
  }

  // Fetch today's tasks
  const fetchTodayTasks = async () => {
    try {
      const today = new Date().toISOString().split('T')[0]
      const response = await fetch(`/api/tasks?scope=all&status=active`)
      if (response.ok) {
        const data = await response.json()
        // Filter tasks due today
        const todayTasks = (data.tasks || []).filter((task: Task) => {
          return task.dueDate && task.dueDate.startsWith(today)
        })
        setTodayTasks(todayTasks)
      }
    } catch (error) {
      console.error('Error fetching today\'s tasks:', error)
    }
  }

  // Fetch tomorrow's tasks
  const fetchTomorrowTasks = async () => {
    try {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      const tomorrowStr = tomorrow.toISOString().split('T')[0]
      const response = await fetch(`/api/tasks?scope=all&status=active`)
      if (response.ok) {
        const data = await response.json()
        // Filter tasks due tomorrow
        const tomorrowTasks = (data.tasks || []).filter((task: Task) => {
          return task.dueDate && task.dueDate.startsWith(tomorrowStr)
        })
        setTomorrowTasks(tomorrowTasks)
      }
    } catch (error) {
      console.error('Error fetching tomorrow\'s tasks:', error)
    }
  }

  // Fetch leaderboard
  const fetchLeaderboard = async () => {
    try {
      const response = await fetch('/api/users')
      if (response.ok) {
        const data = await response.json()
        const sorted = (data.users || [])
          .map((user: any) => ({
            id: user.id,
            name: user.name,
            points: user.pointsEarned || 0,
            tasksCompleted: user.tasksCompleted || 0,
            color: user.color || '#6C63FF',
            avatar: user.avatar || user.name.charAt(0)
          }))
          .sort((a: FamilyMember, b: FamilyMember) => b.points - a.points)
        setLeaderboard(sorted)
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error)
    }
  }

  // Fetch family stats
  const fetchFamilyStats = async () => {
    try {
      const [usersResponse, tasksResponse] = await Promise.all([
        fetch('/api/users'),
        fetch('/api/tasks?scope=all')
      ])

      let totalPoints = 0
      let tasksCompleted = 0
      if (usersResponse.ok) {
        const usersData = await usersResponse.json()
        totalPoints = (usersData.users || []).reduce((sum: number, user: any) => sum + (user.pointsEarned || 0), 0)
        tasksCompleted = (usersData.users || []).reduce((sum: number, user: any) => sum + (user.tasksCompleted || 0), 0)
      }

      let tasksThisMonth = tasksCompleted // Use completed count from users
      if (tasksResponse.ok) {
        const tasksData = await tasksResponse.json()
        const now = new Date()
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
        const completedThisMonth = (tasksData.tasks || []).filter((task: any) => {
          return task.status === 'completed' && task.completedAt && new Date(task.completedAt) >= firstDay
        }).length
        if (completedThisMonth > 0) {
          tasksThisMonth = completedThisMonth
        }
      }

      setFamilyStats({
        currentStreak: 0, // TODO: Implement streak calculation
        totalPoints,
        tasksThisMonth
      })
    } catch (error) {
      console.error('Error fetching family stats:', error)
    }
  }

  // Fetch recent achievements
  const fetchRecentAchievements = async () => {
    try {
      const response = await fetch('/api/achievements/milestones?limit=3')
      if (response.ok) {
        const data = await response.json()
        setRecentAchievements((data.milestones || []).map((m: any) => ({
          id: m.id,
          name: m.title,
          icon: m.icon,
          userName: m.userName || 'Unknown',
          description: m.description
        })))
      }
    } catch (error) {
      console.error('Error fetching achievements:', error)
    }
  }

  // Fetch Google Calendar events
  const fetchGoogleEvents = async () => {
    try {
      const today = new Date()
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)

      const response = await fetch(
        `/api/integrations/google-calendar/events?startDate=${today.toISOString()}&endDate=${tomorrow.toISOString()}`
      )

      if (response.ok) {
        const data = await response.json()
        setGoogleEvents(data.events || [])
      } else {
        // User probably doesn't have calendar connected or sync disabled
        setGoogleEvents([])
      }
    } catch (error) {
      console.error('Error fetching Google Calendar events:', error)
      setGoogleEvents([])
    }
  }

  // Fetch weather (supports both lat/lon and zip code)
  const fetchWeather = async (lat?: number, lon?: number, zipCode?: string) => {
    try {
      let url = '/api/weather?'

      // Prefer lat/lon from organization address if available
      if (lat && lon) {
        url += `lat=${lat}&lon=${lon}`
      } else if (zipCode) {
        url += `zip=${zipCode}`
      } else {
        console.error('No location data available for weather')
        setWeather(null)
        return
      }

      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setWeather(data)
      } else {
        console.error('Failed to fetch weather')
        setWeather(null)
      }
    } catch (error) {
      console.error('Error fetching weather:', error)
      setWeather(null)
    }
  }

  // Load all data
  const loadData = async () => {
    setIsLoading(true)
    await Promise.all([
      fetchSettings(),
      fetchFamilyName(),
      fetchTodayTasks(),
      fetchTomorrowTasks(),
      fetchLeaderboard(),
      fetchFamilyStats(),
      fetchRecentAchievements(),
      fetchGoogleEvents()
    ])
    setIsLoading(false)
  }

  // Note: Weather is now fetched in fetchFamilyName() using stored coordinates
  // Falls back to settings.weatherZipCode if no coordinates available

  // Initial load
  useEffect(() => {
    loadData()
  }, [])

  // Auto-refresh
  useEffect(() => {
    if (!settings || settings.autoRefreshInterval === 0) return

    const interval = setInterval(() => {
      loadData()
    }, settings.autoRefreshInterval * 1000)

    return () => clearInterval(interval)
  }, [settings])

  // ESC key to exit fullscreen
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        window.close()
      }
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [])

  // Determine theme
  const getTheme = () => {
    if (!settings) return 'light'
    if (settings.theme === 'auto') {
      const hour = new Date().getHours()
      return hour >= 18 || hour < 6 ? 'dark' : 'light'
    }
    return settings.theme
  }

  const isDark = getTheme() === 'dark'

  if (isLoading || !settings) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🖥️</div>
          <p className="text-2xl text-gray-600">Loading Hub Display...</p>
        </div>
      </div>
    )
  }

  const completedToday = todayTasks.filter(t => t.status === 'completed').length
  const totalToday = todayTasks.length
  const completionPercentage = totalToday > 0 ? Math.round((completedToday / totalToday) * 100) : 0
  const totalPointsToday = todayTasks.reduce((sum, t) => sum + t.points, 0)
  const earnedPointsToday = todayTasks.filter(t => t.status === 'completed').reduce((sum, t) => sum + t.points, 0)

  const getRankEmoji = (rank: number) => {
    switch (rank) {
      case 1: return '🥇'
      case 2: return '🥈'
      case 3: return '🥉'
      default: return '🏅'
    }
  }

  return (
    <div className={`min-h-screen p-6 ${
      isDark
        ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900'
        : 'bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50'
    }`}>
      {/* Hide bottom nav and other UI elements */}
      <style jsx global>{`
        nav, header, footer, .bottom-nav {
          display: none !important;
        }
      `}</style>

      <div className="max-w-[1920px] mx-auto">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className={`text-3xl sm:text-4xl lg:text-5xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {greeting}, {familyName}! 👋
              </h1>
              <p className={`text-lg sm:text-xl lg:text-2xl ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                {currentTime.toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </p>
            </div>
            <div className="text-left md:text-right">
              <div className={`text-4xl sm:text-5xl lg:text-6xl font-bold ${isDark ? 'text-purple-400' : 'text-deep-purple'}`}>
                {currentTime.toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Tasks */}
          <div className="lg:col-span-2 space-y-6">
            {settings.showTodayTasks && (
              <>
                {/* Progress Overview */}
                <Card variant="elevated" padding="lg" className={isDark ? 'bg-gray-800 border-gray-700' : 'bg-white'}>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Today's Progress</h2>
                    <Badge variant="info" size="md" className="text-lg px-4 py-2">
                      {completionPercentage}% Complete
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-6">
                    <div className="text-center p-6 bg-gradient-to-br from-success-green/10 to-success-green/5 rounded-2xl">
                      <div className="text-5xl font-bold text-success-green mb-2">{completedToday}</div>
                      <p className="text-lg text-gray-700">Completed</p>
                    </div>
                    <div className="text-center p-6 bg-gradient-to-br from-warning-yellow/10 to-warning-yellow/5 rounded-2xl">
                      <div className="text-5xl font-bold text-warning-yellow mb-2">{totalToday - completedToday}</div>
                      <p className="text-lg text-gray-700">Remaining</p>
                    </div>
                    <div className="text-center p-6 bg-gradient-to-br from-deep-purple/10 to-deep-purple/5 rounded-2xl">
                      <div className="text-5xl font-bold text-deep-purple mb-2">{earnedPointsToday}/{totalPointsToday}</div>
                      <p className="text-lg text-gray-700">Points</p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-gray-200 rounded-full h-6">
                    <div
                      className="bg-gradient-to-r from-success-green to-soft-blue h-full rounded-full transition-all duration-500 flex items-center justify-end pr-4"
                      style={{ width: `${completionPercentage}%` }}
                    >
                      {completionPercentage > 10 && (
                        <span className="text-white font-semibold text-sm">{completionPercentage}%</span>
                      )}
                    </div>
                  </div>
                </Card>

                {/* Today's Tasks */}
                <Card variant="elevated" padding="lg" className={isDark ? 'bg-gray-800 border-gray-700' : 'bg-white'}>
                  <h2 className={`text-3xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>Today's Tasks</h2>
                  {todayTasks.length === 0 ? (
                    <div className={`text-center py-12 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      <div className="text-5xl mb-3">🎉</div>
                      <p className="text-xl">No tasks for today!</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {todayTasks.map((task) => (
                        <div
                          key={task.id}
                          className={`flex items-center gap-4 p-4 rounded-2xl transition-all ${
                            task.status === 'completed'
                              ? 'bg-success-green/10 border-2 border-success-green/30'
                              : 'bg-gray-50 border-2 border-gray-200'
                          }`}
                        >
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              task.status === 'completed' ? 'bg-success-green' : 'bg-gray-300'
                            }`}
                          >
                            {task.status === 'completed' && (
                              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                          <div className="flex-1">
                            <h3 className={`text-xl font-semibold ${
                              task.status === 'completed'
                                ? `line-through ${isDark ? 'text-gray-500' : 'text-gray-500'}`
                                : isDark ? 'text-white' : 'text-gray-900'
                            }`}>
                              {task.name}
                            </h3>
                            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{task.category}</p>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-center">
                              <div
                                className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
                                style={{ backgroundColor: task.assignedToColor || '#6C63FF' }}
                              >
                                {task.assignedToAvatar || task.assignedToName.charAt(0)}
                              </div>
                              <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{task.assignedToName}</p>
                            </div>
                            <div className="text-center bg-deep-purple/10 px-4 py-2 rounded-xl">
                              <div className="text-2xl font-bold text-deep-purple">{task.points}</div>
                              <p className="text-xs text-gray-600">pts</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              </>
            )}

            {settings.showTomorrowTasks && tomorrowTasks.length > 0 && (
              <Card variant="elevated" padding="lg" className={
                isDark
                  ? 'bg-gray-800/50 border-2 border-purple-500/30'
                  : 'bg-gradient-to-br from-soft-blue/10 to-deep-purple/10 border-2 border-soft-blue/30'
              }>
                <h2 className={`text-2xl sm:text-3xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>Tomorrow's Tasks</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {tomorrowTasks.slice(0, 6).map((task) => (
                    <div
                      key={task.id}
                      className={`flex items-center gap-3 p-4 rounded-xl ${
                        isDark ? 'bg-gray-700 border border-gray-600' : 'bg-white border border-gray-200'
                      }`}
                    >
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-xl"
                        style={{ backgroundColor: task.assignedToColor || '#6C63FF' }}
                      >
                        {task.assignedToAvatar || task.assignedToName.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className={`font-semibold truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>{task.name}</h3>
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{task.assignedToName}</p>
                      </div>
                      <div className="text-sm font-bold text-deep-purple">{task.points}pts</div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Google Calendar Events */}
            {settings.showCalendarEvents && googleEvents.length > 0 && (
              <Card variant="elevated" padding="lg" className={
                isDark
                  ? 'bg-gray-800/50 border-2 border-blue-500/30'
                  : 'bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200'
              }>
                <div className="flex items-center gap-3 mb-6">
                  <span className="text-3xl">📅</span>
                  <h2 className={`text-2xl sm:text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Today's Events
                  </h2>
                </div>
                <div className="space-y-3">
                  {googleEvents.map((event) => {
                    const startTime = new Date(event.start)
                    const timeStr = event.isAllDay
                      ? 'All Day'
                      : startTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })

                    return (
                      <div
                        key={event.id}
                        className={`flex items-start gap-4 p-4 rounded-xl border-2 border-dashed ${
                          isDark
                            ? 'bg-gray-700 border-gray-500'
                            : 'bg-white border-gray-300'
                        }`}
                      >
                        {!event.isAllDay && (
                          <div className="flex-shrink-0 text-center min-w-[60px]">
                            <div className={`text-lg font-bold ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                              {timeStr.split(' ')[0]}
                            </div>
                            <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                              {timeStr.split(' ')[1]}
                            </div>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className={`font-bold text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {event.summary}
                          </h3>
                          {event.location && (
                            <div className="flex items-center gap-1 mt-1">
                              <svg className={`w-4 h-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                              </svg>
                              <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                {event.location}
                              </span>
                            </div>
                          )}
                          {event.isAllDay && (
                            <Badge variant="info" size="sm" className="mt-2">
                              All Day Event
                            </Badge>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </Card>
            )}
          </div>

          {/* Right Column - Leaderboard & Stats */}
          <div className="space-y-6">
            {settings.showWeather && weather && (
              <Card variant="elevated" padding="lg" className={
                isDark
                  ? 'bg-gradient-to-br from-blue-900 to-cyan-900 border-blue-700'
                  : 'bg-gradient-to-br from-sky-100 to-blue-200'
              }>
                <div className="text-center">
                  <div className="text-7xl mb-3">{weather.icon}</div>
                  <div className={`text-6xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {weather.temperature}°F
                  </div>
                  <p className={`text-2xl font-semibold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {weather.condition}
                  </p>
                  <p className={`text-lg mb-3 ${isDark ? 'text-blue-200' : 'text-gray-700'}`}>
                    {weather.location}
                  </p>
                  <div className={`flex items-center justify-center gap-2 text-base ${isDark ? 'text-blue-200' : 'text-gray-600'}`}>
                    <span>💨</span>
                    <span>{weather.windSpeed} mph</span>
                  </div>
                </div>
              </Card>
            )}

            {settings.showLeaderboard && leaderboard.length > 0 && (
              <Card variant="elevated" padding="lg" className={
                isDark ? 'bg-gray-800 border-gray-700' : 'bg-gradient-to-br from-warm-orange/10 to-heartbeat-red/10'
              }>
                <div className="flex items-center gap-3 mb-6">
                  <div className="text-4xl">🏆</div>
                  <h2 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Leaderboard</h2>
                </div>
                <div className="space-y-4">
                  {leaderboard.slice(0, 4).map((member, index) => (
                    <div
                      key={member.id}
                      className={`p-5 rounded-2xl transition-all ${
                        index === 0
                          ? 'bg-gradient-to-r from-yellow-400 to-orange-400 transform scale-105 shadow-xl'
                          : isDark ? 'bg-gray-700 border-2 border-gray-600' : 'bg-white border-2 border-gray-200'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="text-4xl">{getRankEmoji(index + 1)}</div>
                        <div
                          className="w-14 h-14 rounded-full flex items-center justify-center text-2xl"
                          style={{ backgroundColor: member.color }}
                        >
                          {member.avatar}
                        </div>
                        <div className="flex-1">
                          <h3 className={`text-2xl font-bold ${
                            index === 0 ? 'text-white' : isDark ? 'text-white' : 'text-gray-900'
                          }`}>
                            {member.name}
                          </h3>
                          <p className={`text-sm ${
                            index === 0 ? 'text-white/90' : isDark ? 'text-gray-400' : 'text-gray-600'
                          }`}>
                            {member.tasksCompleted} tasks
                          </p>
                        </div>
                        <div className="text-right">
                          <div className={`text-3xl font-bold ${
                            index === 0 ? 'text-white' : isDark ? 'text-purple-400' : 'text-deep-purple'
                          }`}>
                            {member.points}
                          </div>
                          <p className={`text-xs ${
                            index === 0 ? 'text-white/90' : isDark ? 'text-gray-400' : 'text-gray-600'
                          }`}>points</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {settings.showMotivationalQuote && (
              <Card variant="elevated" padding="lg" className="bg-gradient-to-br from-deep-purple to-soft-blue text-white">
                <div className="text-center">
                  <div className="text-5xl mb-4">💪</div>
                  <p className="text-2xl font-semibold mb-3">"{quote.text}"</p>
                  <p className="text-lg opacity-90">— {quote.author}</p>
                </div>
              </Card>
            )}

            {settings.showFamilyStats && (
              <Card variant="elevated" padding="lg" className={isDark ? 'bg-gray-800 border-gray-700' : 'bg-white'}>
                <h3 className={`text-2xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Family Stats</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>Total Points</span>
                    <span className={`text-2xl font-bold ${isDark ? 'text-purple-400' : 'text-deep-purple'}`}>{familyStats.totalPoints.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>This Month</span>
                    <span className="text-2xl font-bold text-success-green">{familyStats.tasksThisMonth} tasks</span>
                  </div>
                </div>
              </Card>
            )}

            {recentAchievements.length > 0 && (
              <Card variant="elevated" padding="lg" className={
                isDark ? 'bg-gray-800/50 border-green-500/30' : 'bg-gradient-to-br from-success-green/10 to-success-green/5'
              }>
                <h3 className={`text-2xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Recent Achievements</h3>
                <div className="space-y-3">
                  {recentAchievements.map((achievement) => (
                    <div key={achievement.id} className={`flex items-center gap-3 p-3 rounded-xl ${
                      isDark ? 'bg-gray-700' : 'bg-white'
                    }`}>
                      <div className="text-3xl">{achievement.icon}</div>
                      <div>
                        <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{achievement.name}</p>
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{achievement.userName}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            Hub Display Mode • Press ESC to exit
            {settings.autoRefreshInterval > 0 && ` • Auto-refresh every ${settings.autoRefreshInterval}s`}
          </p>
        </div>
      </div>
    </div>
  )
}
