'use client'

import { useState, useEffect } from 'react'
import Card, { CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Avatar from '@/components/ui/Avatar'
import AdSlot from '@/components/AdSlot'
import { useSubscription } from '@/hooks/useSubscription'
import { useAgeBracket } from '@/hooks/useAgeBracket'
import { useLocation } from '@/hooks/useLocation'
import { PageTransition } from '@/components/animations/PageTransition'
import { StaggerContainer, StaggerItem } from '@/components/animations/StaggerList'
import { LiftCard } from '@/components/animations/MicroInteractions'

type TimePeriod = 'week' | 'month' | 'alltime'
type LeaderboardType = 'points' | 'tasks' | 'streaks'

interface FamilyMember {
  id: string
  name: string
  avatarUrl?: string
  pointsEarned?: number
  tasksCompleted?: number
  currentStreak?: number
}

interface LeaderboardEntry extends FamilyMember {
  rank: number
  score: number
  isCurrentUser: boolean
  change?: number // Position change from previous period
}

export default function LeaderboardPage() {
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([])
  const [currentUserId, setCurrentUserId] = useState<string>('')
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('week')
  const [leaderboardType, setLeaderboardType] = useState<LeaderboardType>('points')
  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState<'kid' | 'teen' | 'adult'>('kid')
  const [devRoleOverride, setDevRoleOverride] = useState<'kid' | 'teen' | 'adult' | null>(null)

  const effectiveRole = devRoleOverride || userRole

  // Subscription status (for ad control)
  const { subscriptionTier } = useSubscription()
  const { ageBracket } = useAgeBracket()
  const { getLocationString } = useLocation()

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        // Fetch current user
        const userResponse = await fetch('/api/users/me')
        if (userResponse.ok) {
          const userData = await userResponse.json()
          setCurrentUserId(userData.user?.id || '')
          setUserRole(userData.user?.role || 'kid')
        }

        // Fetch family members
        const familyResponse = await fetch('/api/users')
        if (familyResponse.ok) {
          const familyData = await familyResponse.json()
          setFamilyMembers(familyData.users || [])
        }
      } catch (error) {
        console.error('Error fetching leaderboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()

    // Check for dev role override in localStorage
    const storedRole = localStorage.getItem('devRoleOverride') as 'kid' | 'teen' | 'adult' | null
    if (storedRole) {
      setDevRoleOverride(storedRole)
    }

    // Listen for storage changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'devRoleOverride') {
        setDevRoleOverride(e.newValue as 'kid' | 'teen' | 'adult' | null)
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  // Calculate leaderboard based on type
  const getLeaderboard = (): LeaderboardEntry[] => {
    return [...familyMembers]
      .map(member => {
        let score = 0
        switch (leaderboardType) {
          case 'points':
            score = member.pointsEarned || 0
            break
          case 'tasks':
            score = member.tasksCompleted || 0
            break
          case 'streaks':
            score = member.currentStreak || 0
            break
        }
        return { ...member, score }
      })
      .sort((a, b) => b.score - a.score)
      .map((member, index) => ({
        ...member,
        rank: index + 1,
        isCurrentUser: member.id === currentUserId,
        change: Math.floor(Math.random() * 5) - 2 // Mock change for now
      }))
  }

  const leaderboard = getLeaderboard()
  const currentUserEntry = leaderboard.find(entry => entry.isCurrentUser)

  const getRankEmoji = (rank: number) => {
    switch (rank) {
      case 1: return '🥇'
      case 2: return '🥈'
      case 3: return '🥉'
      default: return '🏅'
    }
  }

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1: return 'from-yellow-400 via-yellow-300 to-yellow-400'
      case 2: return 'from-gray-300 via-gray-200 to-gray-300'
      case 3: return 'from-orange-400 via-orange-300 to-orange-400'
      default: return 'from-blue-100 to-purple-100'
    }
  }

  const getScoreLabel = () => {
    switch (leaderboardType) {
      case 'points': return 'Points'
      case 'tasks': return 'Tasks'
      case 'streaks': return 'Day Streak'
    }
  }

  const getTimePeriodLabel = () => {
    switch (timePeriod) {
      case 'week': return 'This Week'
      case 'month': return 'This Month'
      case 'alltime': return 'All Time'
    }
  }

  const isKid = effectiveRole === 'kid'
  const isTeen = effectiveRole === 'teen'

  if (loading) {
    return (
      <PageTransition>
        <div className={`min-h-screen p-4 md:p-6 lg:p-8 ${
          isKid
            ? 'bg-gradient-to-br from-purple-50 via-pink-50 to-yellow-50 dark:from-purple-900/20 dark:via-pink-900/20 dark:to-yellow-900/20'
            : isTeen
            ? 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-purple-900/20'
            : 'bg-gray-50 dark:bg-gray-900'
        }`}>
          <div className="max-w-5xl mx-auto">
            <div className="text-center py-12">
              <div className={`text-6xl mb-4 ${isKid ? 'animate-bounce' : ''}`}>🏆</div>
              <p className="text-xl font-bold text-gray-600 dark:text-gray-400">
                {isKid ? 'Loading Champions...' : 'Loading Leaderboard...'}
              </p>
            </div>
          </div>
        </div>
      </PageTransition>
    )
  }

  return (
    <PageTransition>
      <div className={`min-h-screen p-4 md:p-6 lg:p-8 pb-24 md:pb-8 ${
        isKid
          ? 'bg-gradient-to-br from-purple-50 via-pink-50 to-yellow-50 dark:from-purple-900/20 dark:via-pink-900/20 dark:to-yellow-900/20'
          : isTeen
          ? 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-purple-900/20'
          : 'bg-gray-50 dark:bg-gray-900'
      }`}>
        <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className={`${
            isKid ? 'text-6xl md:text-8xl' : isTeen ? 'text-5xl md:text-7xl' : 'text-5xl md:text-6xl'
          } mb-4 ${isKid ? 'animate-bounce' : ''}`}>
            🏆
          </div>
          <h1 className={`${
            isKid ? 'text-4xl md:text-5xl' : isTeen ? 'text-3xl md:text-4xl' : 'text-3xl md:text-4xl'
          } font-black mb-2 ${
            isKid
              ? 'text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600'
              : isTeen
              ? 'text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600'
              : 'text-gray-900'
          }`}>
            {isKid ? 'Family Champions!' : isTeen ? 'Leaderboard 🎯' : 'Family Leaderboard'}
          </h1>
          <p className={`${
            isKid ? 'text-xl md:text-2xl' : isTeen ? 'text-lg md:text-xl' : 'text-lg md:text-xl'
          } ${
            isKid ? 'text-purple-600 font-bold' : isTeen ? 'text-indigo-600 font-semibold' : 'text-gray-600'
          }`}>
            {isKid ? 'See who\'s crushing it! 🌟' : isTeen ? 'Compete with your family and level up! 🚀' : 'Track family progress and achievements'}
          </p>
        </div>

        {/* Current User Rank Card */}
        {(isKid || isTeen) && currentUserEntry && (
          <LiftCard>
            <Card
              variant="elevated"
              padding="lg"
              className={
                isKid
                  ? 'glass-strong bg-gradient-to-r from-yellow-100/80 via-orange-100/80 to-pink-100/80 dark:from-yellow-500/20 dark:via-orange-500/20 dark:to-pink-500/20 border-4 border-yellow-400 dark:border-yellow-500/50 shadow-premium backdrop-blur-xl'
                  : 'glass-strong bg-gradient-to-r from-blue-100/80 via-indigo-100/80 to-purple-100/80 dark:from-blue-500/20 dark:via-indigo-500/20 dark:to-purple-500/20 border-3 border-indigo-400 dark:border-indigo-500/50 shadow-elevated backdrop-blur-xl'
              }
            >
            <div className="text-center">
              <div className={`${isKid ? 'text-2xl' : 'text-xl'} font-black ${
                isKid ? 'text-gray-700' : 'text-indigo-700'
              } mb-2`}>
                {isKid ? 'YOUR RANK' : 'Your Position'}
              </div>
              <div className="flex items-center justify-center gap-4">
                <div className={`${isKid ? 'text-7xl animate-pulse' : 'text-6xl'}`}>
                  {getRankEmoji(currentUserEntry.rank)}
                </div>
                <div>
                  <div className={`${isKid ? 'text-6xl' : 'text-5xl'} font-black text-transparent bg-clip-text ${
                    isKid
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600'
                      : 'bg-gradient-to-r from-blue-600 to-purple-600'
                  }`}>
                    #{currentUserEntry.rank}
                  </div>
                  <div className={`${isKid ? 'text-3xl' : 'text-2xl'} font-black text-gray-900 mt-2`}>
                    {currentUserEntry.score} {getScoreLabel()}
                  </div>
                </div>
              </div>
              {currentUserEntry.rank === 1 && (
                <div className={`mt-4 ${isKid ? 'text-2xl' : 'text-xl'} font-black ${
                  isKid ? 'text-yellow-600 animate-bounce' : 'text-indigo-600'
                }`}>
                  {isKid ? '🎉 YOU\'RE #1! AMAZING! 🎉' : '🏆 Top of the leaderboard! 🏆'}
                </div>
              )}
            </div>
          </Card>
          </LiftCard>
        )}

        {/* Filters */}
        <LiftCard>
          <Card
            variant={isKid || isTeen ? 'elevated' : 'default'}
            padding="lg"
            className={
              isKid
                ? 'glass-subtle border-3 border-purple-200 dark:border-purple-500/30 backdrop-blur-lg'
                : isTeen
                ? 'glass-subtle border-2 border-indigo-200 dark:border-indigo-500/30 backdrop-blur-lg'
                : 'glass-subtle backdrop-blur-lg'
            }
          >
          <div className="space-y-4">
            {/* Time Period Filter */}
            <div>
              <h3 className={`${isKid || isTeen ? 'text-xl' : 'text-lg'} font-bold mb-3 ${
                isKid ? 'text-purple-600' : isTeen ? 'text-indigo-600' : 'text-gray-700'
              }`}>
                📅 {isKid ? 'When' : 'Time Period'}
              </h3>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={timePeriod === 'week' ? 'primary' : 'outline'}
                  size={isKid ? 'lg' : 'md'}
                  onClick={() => setTimePeriod('week')}
                  className={isKid ? 'font-black text-lg' : isTeen ? 'font-bold' : ''}
                >
                  This Week
                </Button>
                <Button
                  variant={timePeriod === 'month' ? 'primary' : 'outline'}
                  size={isKid ? 'lg' : 'md'}
                  onClick={() => setTimePeriod('month')}
                  className={isKid ? 'font-black text-lg' : isTeen ? 'font-bold' : ''}
                >
                  This Month
                </Button>
                <Button
                  variant={timePeriod === 'alltime' ? 'primary' : 'outline'}
                  size={isKid ? 'lg' : 'md'}
                  onClick={() => setTimePeriod('alltime')}
                  className={isKid ? 'font-black text-lg' : isTeen ? 'font-bold' : ''}
                >
                  All Time
                </Button>
              </div>
            </div>

            {/* Leaderboard Type Filter */}
            <div>
              <h3 className={`${isKid || isTeen ? 'text-xl' : 'text-lg'} font-bold mb-3 ${
                isKid ? 'text-purple-600' : isTeen ? 'text-indigo-600' : 'text-gray-700'
              }`}>
                📊 {isKid ? 'Show Me' : 'Category'}
              </h3>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={leaderboardType === 'points' ? 'primary' : 'outline'}
                  size={isKid ? 'lg' : 'md'}
                  onClick={() => setLeaderboardType('points')}
                  className={isKid ? 'font-black text-lg' : isTeen ? 'font-bold' : ''}
                >
                  ⭐ Points
                </Button>
                <Button
                  variant={leaderboardType === 'tasks' ? 'primary' : 'outline'}
                  size={isKid ? 'lg' : 'md'}
                  onClick={() => setLeaderboardType('tasks')}
                  className={isKid ? 'font-black text-lg' : isTeen ? 'font-bold' : ''}
                >
                  ✅ Tasks {isKid ? 'Done' : 'Completed'}
                </Button>
                <Button
                  variant={leaderboardType === 'streaks' ? 'primary' : 'outline'}
                  size={isKid ? 'lg' : 'md'}
                  onClick={() => setLeaderboardType('streaks')}
                  className={isKid ? 'font-black text-lg' : isTeen ? 'font-bold' : ''}
                >
                  🔥 Streaks
                </Button>
              </div>
            </div>
          </div>
        </Card>
        </LiftCard>

        {/* Leaderboard */}
        <LiftCard>
          <Card
            variant={isKid || isTeen ? 'elevated' : 'default'}
            padding="lg"
            className={
              isKid
                ? 'glass-strong bg-gradient-to-br from-yellow-50/70 to-orange-50/70 dark:from-yellow-500/10 dark:to-orange-500/10 border-4 border-yellow-200 dark:border-yellow-500/30 backdrop-blur-xl'
                : isTeen
                ? 'glass-strong bg-gradient-to-br from-blue-50/70 to-indigo-50/70 dark:from-blue-500/10 dark:to-indigo-500/10 border-3 border-indigo-200 dark:border-indigo-500/30 backdrop-blur-xl'
                : 'glass-subtle backdrop-blur-lg'
            }
          >
            <CardHeader>
              <CardTitle className={`${isKid || isTeen ? 'text-3xl' : 'text-2xl'} flex items-center gap-3 ${
                isKid || isTeen ? 'font-black text-gray-900 dark:text-white' : ''
              }`}>
                {isKid ? '🌟 Top Champions' : isTeen ? '🏆 Top Performers' : 'Rankings'} - {getTimePeriodLabel()}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {leaderboard.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">😊</div>
                  <p className={`${isKid || isTeen ? 'text-xl font-bold' : 'text-lg'} text-gray-600 dark:text-gray-400`}>
                    {isKid ? 'No champions yet! Start completing tasks!' : isTeen ? 'No data yet. Complete some tasks to get started!' : 'No data available'}
                  </p>
                </div>
              ) : (
                <StaggerContainer className="space-y-3">
                {leaderboard.map((entry) => (
                  <StaggerItem key={entry.id}>
                  <div
                    className={`flex items-center gap-3 md:gap-4 p-4 md:p-5 rounded-2xl transition-all transform ${
                      entry.isCurrentUser && isKid
                        ? 'bg-gradient-to-r from-yellow-200 via-orange-200 to-pink-200 border-4 border-yellow-400 shadow-2xl scale-105'
                        : entry.isCurrentUser
                        ? 'bg-blue-50 border-2 border-blue-300 shadow-lg'
                        : entry.rank <= 3 && isKid
                        ? `bg-gradient-to-r ${getRankColor(entry.rank)} border-3 border-yellow-300 shadow-lg hover:shadow-xl hover:scale-102`
                        : 'bg-white border-2 border-gray-200 hover:border-blue-300 hover:shadow-md'
                    }`}
                  >
                    {/* Rank Badge */}
                    <div className={`flex-shrink-0 ${isKid ? 'text-5xl animate-bounce' : 'text-3xl'}`}>
                      {getRankEmoji(entry.rank)}
                    </div>

                    {/* Rank Number */}
                    <div className={`flex-shrink-0 ${
                      isKid ? 'w-12 h-12 md:w-16 md:h-16' : 'w-10 h-10 md:w-12 md:h-12'
                    } rounded-full flex items-center justify-center font-black ${
                      entry.rank <= 3
                        ? 'bg-gradient-to-br from-yellow-400 to-orange-500 text-white shadow-lg'
                        : 'bg-gray-200 text-gray-700'
                    }`}>
                      <span className={isKid ? 'text-2xl md:text-3xl' : 'text-lg md:text-xl'}>
                        {entry.rank}
                      </span>
                    </div>

                    {/* Avatar */}
                    <Avatar
                      alt={entry.name}
                      src={entry.avatarUrl}
                      size={isKid ? 'xl' : 'lg'}
                      className={entry.isCurrentUser ? 'ring-4 ring-yellow-400' : ''}
                    />

                    {/* Name and Score */}
                    <div className="flex-1 min-w-0">
                      <h4 className={`${isKid ? 'text-xl md:text-2xl' : 'text-lg md:text-xl'} font-black truncate ${
                        entry.isCurrentUser ? 'text-purple-700' : 'text-gray-900'
                      }`}>
                        {entry.name}
                        {entry.isCurrentUser && (
                          <span className={`ml-2 ${isKid ? 'text-lg' : 'text-sm'}`}>(You!)</span>
                        )}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`${isKid ? 'text-lg md:text-xl font-black' : 'text-base font-bold'} ${
                          entry.rank === 1 ? 'text-yellow-600' : entry.rank === 2 ? 'text-gray-600' : entry.rank === 3 ? 'text-orange-600' : 'text-purple-600'
                        }`}>
                          {entry.score} {getScoreLabel()}
                        </span>
                        {entry.change && entry.change !== 0 && (
                          <Badge
                            variant={entry.change > 0 ? 'success' : 'danger'}
                            size="sm"
                            className="font-bold"
                          >
                            {entry.change > 0 ? '↑' : '↓'} {Math.abs(entry.change)}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Trophy for top 3 */}
                    {entry.rank <= 3 && (
                      <div className={`flex-shrink-0 ${isKid ? 'text-4xl' : 'text-2xl'}`}>
                        {entry.rank === 1 ? '👑' : '⭐'}
                      </div>
                    )}
                  </div>
                  </StaggerItem>
                ))}
                </StaggerContainer>
              )}
            </CardContent>
          </Card>
        </LiftCard>

        {/* Motivational Message */}
        {isKid && (
          <LiftCard>
            <Card variant="elevated" padding="lg" className="glass-strong bg-gradient-to-r from-green-100/70 to-blue-100/70 dark:from-green-500/20 dark:to-blue-500/20 border-3 border-green-300 dark:border-green-500/40 text-center backdrop-blur-xl">
              <div className="text-4xl mb-3">💪✨</div>
              <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2">
                Keep Going, Superstar!
              </h3>
              <p className="text-lg font-bold text-gray-700 dark:text-gray-300">
                Complete more tasks to climb the leaderboard! You've got this! 🚀
              </p>
            </Card>
          </LiftCard>
        )}
        {isTeen && (
          <LiftCard>
            <Card variant="elevated" padding="lg" className="glass-strong bg-gradient-to-r from-indigo-100/70 to-purple-100/70 dark:from-indigo-500/20 dark:to-purple-500/20 border-2 border-indigo-300 dark:border-indigo-500/40 text-center backdrop-blur-xl">
              <div className="text-3xl mb-3">🎯💫</div>
              <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2">
                Level Up Your Game!
              </h3>
              <p className="text-base font-semibold text-gray-700 dark:text-gray-300">
                Keep completing tasks to rise through the ranks and beat your personal best! 🚀
              </p>
            </Card>
          </LiftCard>
        )}

        {/* AdSense - Leaderboard Ad (Teens/Adults only, not kids) */}
        {!isKid && (
          <AdSlot adUnit="leaderboard"
            userRole={effectiveRole}
            subscriptionTier={subscriptionTier}
          ageBracket={ageBracket}
            location={getLocationString()}
            className="mt-6"
            testMode={true}
          />
        )}
      </div>
    </div>
    </PageTransition>
  )
}
