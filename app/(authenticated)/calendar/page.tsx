'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Users, CheckCircle, Clock } from 'lucide-react'
import { PageTransition } from '@/components/animations/PageTransition'
import { StaggerContainer, StaggerItem } from '@/components/animations/StaggerList'
import { LiftCard } from '@/components/animations/MicroInteractions'
import GlassCard from '@/components/ui/GlassCard'
import AdSlot from '@/components/AdSlot'
import { useSubscription } from '@/hooks/useSubscription'
import { useAgeBracket } from '@/hooks/useAgeBracket'
import { useLocation } from '@/hooks/useLocation'

interface CalendarTask {
  id: string
  name: string
  description?: string
  assignedTo: string
  assignedToName: string
  color: string
  time?: string
  points: number
  completed: boolean
  category: string
  frequency?: string
  dueDate?: string
}

interface DayData {
  date: Date
  isCurrentMonth: boolean
  isToday: boolean
  tasks: CalendarTask[]
}

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [tasks, setTasks] = useState<CalendarTask[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'week' | 'month'>('week')
  const [userRole, setUserRole] = useState<'kid' | 'teen' | 'adult'>('adult')

  // For ads (COPPA compliant)
  const { subscriptionTier } = useSubscription()
  const { ageBracket } = useAgeBracket()
  const { getLocationString } = useLocation()

  useEffect(() => {
    fetchTasks()
  }, [])

  const fetchTasks = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/tasks?scope=all')
      if (response.ok) {
        const data = await response.json()

        const calendarTasks: CalendarTask[] = data.tasks
          ?.filter((task: any) => {
            const hasNoAssignments = !task.assignedTo || task.assignedTo.length === 0
            const isUnclaimedExtraCredit = hasNoAssignments && !task.isClaimed
            return !isUnclaimedExtraCredit
          })
          .map((task: any) => {
            const isExtraCredit = !task.assignedTo || task.assignedTo.length === 0 || task.isClaimed
            const assignedUserId = isExtraCredit ? 'extra-credit' : task.assignedTo[0]
            const assignedUserName = isExtraCredit
              ? 'Extra Credit'
              : (task.assignedToNames?.[0] || 'Unassigned')

            return {
              id: task.id,
              name: task.name,
              description: task.description,
              assignedTo: assignedUserId,
              assignedToName: assignedUserName,
              color: isExtraCredit ? '#FFA500' : getRandomColor(),
              time: task.dueTime || '9:00 AM',
              points: task.points || 0,
              completed: task.completedToday || false,
              category: task.category || 'Other',
              frequency: task.frequency,
              dueDate: task.due_date
            }
          }) || []

        setTasks(calendarTasks)
      }
    } catch (err) {
      console.error('Error fetching tasks:', err)
    } finally {
      setLoading(false)
    }
  }

  const getRandomColor = () => {
    const colors = ['#FF6B6B', '#4ECDC4', '#FFA07A', '#2ECC71', '#9B59B6', '#3498DB']
    return colors[Math.floor(Math.random() * colors.length)]
  }

  const getTasksForDate = (date: Date): CalendarTask[] => {
    const dateStr = date.toISOString().split('T')[0]
    const today = new Date().toISOString().split('T')[0]

    return tasks.filter(task => {
      if (task.frequency) {
        const dayOfWeek = date.getDay()
        switch (task.frequency) {
          case 'daily':
            return dateStr >= today
          case 'weekdays':
            return dayOfWeek >= 1 && dayOfWeek <= 5 && dateStr >= today
          case 'weekends':
            return (dayOfWeek === 0 || dayOfWeek === 6) && dateStr >= today
          default:
            return dateStr >= today
        }
      }

      if (task.dueDate) {
        return task.dueDate.split('T')[0] === dateStr
      }

      return dateStr === today
    })
  }

  const getWeekDays = (): DayData[] => {
    const startOfWeek = new Date(currentDate)
    const day = startOfWeek.getDay()
    const diff = startOfWeek.getDate() - day
    startOfWeek.setDate(diff)
    startOfWeek.setHours(0, 0, 0, 0)

    const days: DayData[] = []
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek)
      date.setDate(startOfWeek.getDate() + i)
      date.setHours(0, 0, 0, 0)

      days.push({
        date,
        isCurrentMonth: true,
        isToday: date.getTime() === today.getTime(),
        tasks: getTasksForDate(date)
      })
    }

    return days
  }

  const getDaysInMonth = (): DayData[] => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days: DayData[] = []
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Previous month days
    const prevMonthLastDay = new Date(year, month, 0).getDate()
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const dayDate = new Date(year, month - 1, prevMonthLastDay - i)
      days.push({
        date: dayDate,
        isCurrentMonth: false,
        isToday: false,
        tasks: getTasksForDate(dayDate)
      })
    }

    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const dayDate = new Date(year, month, day)
      dayDate.setHours(0, 0, 0, 0)
      const isToday = dayDate.getTime() === today.getTime()

      days.push({
        date: dayDate,
        isCurrentMonth: true,
        isToday,
        tasks: getTasksForDate(dayDate)
      })
    }

    // Next month days
    const remainingDays = 42 - days.length
    for (let day = 1; day <= remainingDays; day++) {
      const dayDate = new Date(year, month + 1, day)
      days.push({
        date: dayDate,
        isCurrentMonth: false,
        isToday: false,
        tasks: getTasksForDate(dayDate)
      })
    }

    return days
  }

  const navigate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate)
    if (view === 'week') {
      newDate.setDate(newDate.getDate() + (direction === 'prev' ? -7 : 7))
    } else {
      newDate.setMonth(newDate.getMonth() + (direction === 'prev' ? -1 : 1))
    }
    setCurrentDate(newDate)
  }

  const goToToday = () => {
    setCurrentDate(new Date())
    setSelectedDate(new Date())
  }

  const days = view === 'week' ? getWeekDays() : getDaysInMonth()
  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  const selectedDayTasks = getTasksForDate(selectedDate).sort((a, b) => {
    const timeA = a.time || '12:00 PM'
    const timeB = b.time || '12:00 PM'
    return timeA.localeCompare(timeB)
  })

  return (
    <PageTransition>
      <div className="min-h-screen pb-24 bg-gradient-to-br from-gray-50 via-white to-blue-50/30 dark:from-gray-900 dark:via-gray-900 dark:to-blue-900/10">
        {/* Compact Header */}
        <div className="sticky top-0 z-10 glass-strong px-4 py-3 border-b border-white/10">
          <div className="flex items-center justify-between max-w-4xl mx-auto">
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-soft-blue" />
                Calendar
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">{monthName}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setView(view === 'week' ? 'month' : 'week')}
                className="px-3 py-1.5 text-sm font-medium bg-gradient-ai text-white rounded-lg shadow-elevated"
              >
                {view === 'week' ? 'Month' : 'Week'}
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
          {/* Navigation */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('prev')}
              className="p-2 glass rounded-xl hover:glass-strong transition-all"
            >
              <ChevronLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            </button>

            <button
              onClick={goToToday}
              className="px-4 py-2 glass rounded-xl font-semibold text-sm text-gray-900 dark:text-white hover:glass-strong transition-all"
            >
              Today
            </button>

            <button
              onClick={() => navigate('next')}
              className="p-2 glass rounded-xl hover:glass-strong transition-all"
            >
              <ChevronRight className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            </button>
          </div>

          {loading ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 mx-auto mb-4 border-4 border-soft-blue border-t-transparent rounded-full animate-spin" />
              <p className="text-gray-600 dark:text-gray-400">Loading calendar...</p>
            </div>
          ) : (
            <>
              {/* Calendar Grid */}
              <GlassCard variant="strong" blur="xl" className="p-4 rounded-2xl">
                {/* Weekday headers */}
                <div className="grid grid-cols-7 gap-2 mb-3">
                  {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                    <div key={i} className="text-center text-xs font-semibold text-gray-600 dark:text-gray-400">
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar days */}
                <div className="grid grid-cols-7 gap-2">
                  {days.map((day, index) => {
                    const isSelected = selectedDate.toDateString() === day.date.toDateString()
                    const hasTasks = day.tasks.length > 0

                    return (
                      <motion.button
                        key={index}
                        onClick={() => day.isCurrentMonth && setSelectedDate(new Date(day.date))}
                        disabled={!day.isCurrentMonth && view === 'month'}
                        whileHover={day.isCurrentMonth ? { scale: 1.05 } : {}}
                        whileTap={day.isCurrentMonth ? { scale: 0.95 } : {}}
                        className={`aspect-square rounded-xl flex flex-col items-center justify-center relative transition-all ${
                          !day.isCurrentMonth && view === 'month'
                            ? 'text-gray-300 dark:text-gray-700 cursor-not-allowed'
                            : isSelected
                            ? 'bg-gradient-ai text-white shadow-elevated'
                            : day.isToday
                            ? 'bg-soft-blue/20 text-soft-blue font-bold ring-2 ring-soft-blue'
                            : 'glass hover:glass-strong'
                        }`}
                      >
                        <span className={`text-sm font-semibold ${
                          isSelected ? 'text-white' : day.isToday ? 'text-soft-blue' : 'text-gray-900 dark:text-white'
                        }`}>
                          {day.date.getDate()}
                        </span>
                        {hasTasks && day.isCurrentMonth && (
                          <div className="flex gap-0.5 mt-1">
                            {day.tasks.slice(0, 3).map((task, i) => (
                              <div
                                key={i}
                                className={`w-1 h-1 rounded-full ${
                                  isSelected ? 'bg-white' : 'bg-current'
                                }`}
                                style={{ backgroundColor: isSelected ? 'white' : task.color }}
                              />
                            ))}
                          </div>
                        )}
                      </motion.button>
                    )
                  })}
                </div>
              </GlassCard>

              {/* Selected Day Tasks */}
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-soft-blue" />
                  {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </h2>

                {selectedDayTasks.length === 0 ? (
                  <GlassCard variant="subtle" blur="md" className="p-8 rounded-2xl text-center">
                    <div className="text-5xl mb-3">📅</div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                      No tasks scheduled
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Enjoy your free time!
                    </p>
                  </GlassCard>
                ) : (
                  <StaggerContainer className="space-y-3">
                    {selectedDayTasks.map(task => (
                      <StaggerItem key={task.id}>
                        <LiftCard
                          className="glass-strong p-4 rounded-xl"
                          style={{
                            borderLeft: `4px solid ${task.color}`
                          }}
                        >
                          <div className="flex items-start gap-3">
                            {/* Time */}
                            {task.time && (
                              <div className="flex-shrink-0 text-center min-w-[50px]">
                                <div className="text-sm font-bold text-gray-900 dark:text-white">
                                  {task.time.split(' ')[0]}
                                </div>
                                <div className="text-xs text-gray-600 dark:text-gray-400">
                                  {task.time.split(' ')[1]}
                                </div>
                              </div>
                            )}

                            {/* Task Details */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2">
                                {task.completed ? (
                                  <CheckCircle className="w-5 h-5 text-success-green flex-shrink-0" />
                                ) : (
                                  <div className="w-5 h-5 rounded-full border-2 border-gray-300 dark:border-gray-600 flex-shrink-0" />
                                )}
                                <h3 className={`font-semibold text-gray-900 dark:text-white ${task.completed ? 'line-through opacity-60' : ''}`}>
                                  {task.name}
                                </h3>
                              </div>

                              {task.description && (
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-1">
                                  {task.description}
                                </p>
                              )}

                              <div className="flex items-center flex-wrap gap-2">
                                <div className="flex items-center gap-1.5 px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
                                  <Users className="w-3 h-3" style={{ color: task.color }} />
                                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                    {task.assignedToName}
                                  </span>
                                </div>

                                <div className="flex items-center gap-1 px-2 py-1 bg-success-green/20 rounded-lg">
                                  <span className="text-xs font-bold text-success-green">
                                    +{task.points}
                                  </span>
                                </div>

                                {task.category && (
                                  <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-lg text-gray-700 dark:text-gray-300">
                                    {task.category}
                                  </span>
                                )}

                                {task.frequency && (
                                  <span className="text-xs px-2 py-1 bg-soft-blue/20 rounded-lg text-soft-blue font-medium">
                                    {task.frequency}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </LiftCard>
                      </StaggerItem>
                    ))}
                  </StaggerContainer>
                )}
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-3">
                <GlassCard variant="strong" blur="md" className="p-4 rounded-xl text-center">
                  <div className="text-2xl font-black text-success-green mb-1">
                    {tasks.filter(t => t.completed).length}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Completed</div>
                </GlassCard>

                <GlassCard variant="strong" blur="md" className="p-4 rounded-xl text-center">
                  <div className="text-2xl font-black text-warning-yellow mb-1">
                    {tasks.filter(t => !t.completed).length}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Pending</div>
                </GlassCard>

                <GlassCard variant="strong" blur="md" className="p-4 rounded-xl text-center">
                  <div className="text-2xl font-black text-deep-purple mb-1">
                    {tasks.reduce((sum, t) => sum + t.points, 0)}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Total Pts</div>
                </GlassCard>
              </div>
            </>
          )}
        </div>

        {/* Google AdSense - Only show to teens/adults (COPPA compliant) */}
        {ageBracket !== 'child' && (
          <AdSlot
            adUnit="leaderboard"
            userRole={userRole}
            subscriptionTier={subscriptionTier}
            ageBracket={ageBracket}
            location={getLocationString()}
            className="mt-6"
            testMode={true}
          />
        )}
      </div>
    </PageTransition>
  )
}
