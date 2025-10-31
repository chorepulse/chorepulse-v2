'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Trophy, Star, Lock, Flame, Target, Users, Sparkles, TrendingUp } from 'lucide-react'
import { PageTransition } from '@/components/animations/PageTransition'
import { StaggerContainer, StaggerItem } from '@/components/animations/StaggerList'
import { LiftCard } from '@/components/animations/MicroInteractions'
import GlassCard from '@/components/ui/GlassCard'
import { useConfettiCelebration } from '@/components/animations/Confetti'
import AdSlot from '@/components/AdSlot'
import { useSubscription } from '@/hooks/useSubscription'
import { useAgeBracket } from '@/hooks/useAgeBracket'
import { useLocation } from '@/hooks/useLocation'

interface Badge {
  id: string
  name: string
  description: string
  icon: string
  category: 'task' | 'streak' | 'points' | 'team' | 'special'
  tier: 'bronze' | 'silver' | 'gold' | 'platinum'
  progress: number
  maxProgress: number
  isUnlocked: boolean
  unlockedDate?: string
  points: number
}

const categoryIcons = {
  task: Target,
  streak: Flame,
  points: Star,
  team: Users,
  special: Sparkles
}

const categoryColors = {
  task: 'text-heartbeat-red',
  streak: 'text-warning-yellow',
  points: 'text-success-green',
  team: 'text-soft-blue',
  special: 'text-deep-purple'
}

const tierColors = {
  bronze: 'from-amber-600 to-amber-700',
  silver: 'from-gray-400 to-gray-500',
  gold: 'from-yellow-400 to-yellow-500',
  platinum: 'from-purple-400 to-purple-600'
}

const tierGlows = {
  bronze: 'shadow-[0_0_20px_rgba(217,119,6,0.3)]',
  silver: 'shadow-[0_0_20px_rgba(156,163,175,0.3)]',
  gold: 'shadow-[0_0_20px_rgba(250,204,21,0.3)]',
  platinum: 'shadow-[0_0_20px_rgba(168,85,247,0.3)]'
}

export default function BadgesPage() {
  const [badges, setBadges] = useState<Badge[]>([])
  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState<'kid' | 'teen' | 'adult'>('adult')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [summary, setSummary] = useState({
    total: 0,
    unlocked: 0,
    completionPercentage: 0,
    totalPoints: 0,
    nextUnlock: null as Badge | null
  })

  const { celebrate } = useConfettiCelebration()

  // For ads (COPPA compliant)
  const { subscriptionTier } = useSubscription()
  const { ageBracket } = useAgeBracket()
  const { getLocationString } = useLocation()

  useEffect(() => {
    fetchBadges()
  }, [])

  const fetchBadges = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/achievements')
      if (response.ok) {
        const data = await response.json()
        const badgeData = data.achievements || []
        setBadges(badgeData)

        // Calculate summary
        const unlocked = badgeData.filter((b: Badge) => b.isUnlocked).length
        const totalPoints = badgeData
          .filter((b: Badge) => b.isUnlocked)
          .reduce((sum: number, b: Badge) => sum + b.points, 0)

        // Find next badge to unlock (highest progress %)
        const locked = badgeData
          .filter((b: Badge) => !b.isUnlocked)
          .sort((a: Badge, b: Badge) => {
            const aProgress = a.progress / a.maxProgress
            const bProgress = b.progress / b.maxProgress
            return bProgress - aProgress
          })

        setSummary({
          total: badgeData.length,
          unlocked,
          completionPercentage: badgeData.length > 0 ? Math.round((unlocked / badgeData.length) * 100) : 0,
          totalPoints,
          nextUnlock: locked[0] || null
        })
      }
    } catch (err) {
      console.error('Error fetching badges:', err)
    } finally {
      setLoading(false)
    }
  }

  const filteredBadges = badges.filter(badge =>
    selectedCategory === 'all' || badge.category === selectedCategory
  )

  const unlockedBadges = filteredBadges.filter(b => b.isUnlocked)
  const lockedBadges = filteredBadges.filter(b => !b.isUnlocked)

  const categories = ['all', 'task', 'streak', 'points', 'team', 'special']

  return (
    <PageTransition>
      <div className="min-h-screen pb-24 bg-gradient-to-br from-gray-50 via-white to-purple-50/30 dark:from-gray-900 dark:via-gray-900 dark:to-purple-900/10">
        {/* Compact Header */}
        <div className="sticky top-0 z-10 glass-strong px-4 py-3 border-b border-white/10">
          <div className="flex items-center justify-between max-w-4xl mx-auto">
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Trophy className="w-5 h-5 text-deep-purple" />
                Badges
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {summary.unlocked} of {summary.total} unlocked
              </p>
            </div>
            <div className="flex items-center gap-3">
              {/* Progress Ring */}
              <div className="relative w-14 h-14">
                <svg className="transform -rotate-90" width="56" height="56">
                  <circle
                    cx="28"
                    cy="28"
                    r="24"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                    className="text-gray-200 dark:text-gray-700"
                  />
                  <circle
                    cx="28"
                    cy="28"
                    r="24"
                    stroke="url(#progress-gradient)"
                    strokeWidth="4"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 24}`}
                    strokeDashoffset={`${2 * Math.PI * 24 * (1 - summary.completionPercentage / 100)}`}
                    className="transition-all duration-1000"
                    strokeLinecap="round"
                  />
                  <defs>
                    <linearGradient id="progress-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#6C63FF" />
                      <stop offset="100%" stopColor="#4ECDC4" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs font-bold text-gray-900 dark:text-white">
                    {summary.completionPercentage}%
                  </span>
                </div>
              </div>

              {/* Points Badge */}
              <div className="flex items-center gap-2 px-3 py-2 bg-gradient-ai rounded-xl shadow-elevated">
                <Star className="w-4 h-4 text-white fill-white" />
                <span className="text-lg font-black text-white">{summary.totalPoints}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
          {/* Next Badge to Unlock */}
          {summary.nextUnlock && (
            <LiftCard className="glass-strong p-5 rounded-2xl border-2 border-deep-purple/20">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-5 h-5 text-deep-purple" />
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Next Unlock</h2>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-5xl filter grayscale opacity-50">
                  {summary.nextUnlock.icon}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                    {summary.nextUnlock.name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    {summary.nextUnlock.description}
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                      <motion.div
                        className={`h-full rounded-full bg-gradient-to-r ${tierColors[summary.nextUnlock.tier]}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${(summary.nextUnlock.progress / summary.nextUnlock.maxProgress) * 100}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                      />
                    </div>
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 whitespace-nowrap">
                      {summary.nextUnlock.progress}/{summary.nextUnlock.maxProgress}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    {summary.nextUnlock.maxProgress - summary.nextUnlock.progress} more to unlock • +{summary.nextUnlock.points} pts
                  </p>
                </div>
              </div>
            </LiftCard>
          )}

          {/* Category Filters */}
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
            {categories.map(cat => {
              const Icon = cat === 'all' ? Trophy : categoryIcons[cat as keyof typeof categoryIcons]
              const isActive = selectedCategory === cat

              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-gradient-ai text-white shadow-elevated'
                      : 'glass text-gray-700 dark:text-gray-300 hover:glass-strong'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </button>
              )
            })}
          </div>

          {loading ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 mx-auto mb-4 border-4 border-deep-purple border-t-transparent rounded-full animate-spin" />
              <p className="text-gray-600 dark:text-gray-400">Loading badges...</p>
            </div>
          ) : (
            <>
              {/* Unlocked Badges */}
              {unlockedBadges.length > 0 && (
                <div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-success-green" />
                    Unlocked ({unlockedBadges.length})
                  </h2>
                  <StaggerContainer className="grid grid-cols-3 md:grid-cols-4 gap-3">
                    {unlockedBadges.map(badge => {
                      const CategoryIcon = categoryIcons[badge.category]

                      return (
                        <StaggerItem key={badge.id}>
                          <LiftCard
                            className={`glass-strong p-4 rounded-2xl text-center relative ${tierGlows[badge.tier]}`}
                            onClick={() => celebrate()}
                          >
                            {/* Tier indicator */}
                            <div className={`absolute top-2 right-2 w-2 h-2 rounded-full bg-gradient-to-r ${tierColors[badge.tier]}`} />

                            {/* Badge icon */}
                            <motion.div
                              className="text-5xl mb-2"
                              whileHover={{ scale: 1.1, rotate: 5 }}
                              transition={{ type: "spring", stiffness: 300 }}
                            >
                              {badge.icon}
                            </motion.div>

                            {/* Tier glow bar */}
                            <div className={`w-12 h-1 mx-auto mb-2 rounded-full bg-gradient-to-r ${tierColors[badge.tier]}`} />

                            {/* Badge name */}
                            <h3 className="font-semibold text-xs text-gray-900 dark:text-white line-clamp-2 mb-1 min-h-[2.5rem] flex items-center justify-center">
                              {badge.name}
                            </h3>

                            {/* Category icon */}
                            <div className="flex items-center justify-center gap-1">
                              <CategoryIcon className={`w-3 h-3 ${categoryColors[badge.category]}`} />
                            </div>

                            {/* Points */}
                            <div className="flex items-center justify-center gap-1 mt-2 px-2 py-1 bg-success-green/20 rounded-full">
                              <Star className="w-3 h-3 text-success-green fill-success-green" />
                              <span className="text-xs font-bold text-success-green">+{badge.points}</span>
                            </div>
                          </LiftCard>
                        </StaggerItem>
                      )
                    })}
                  </StaggerContainer>
                </div>
              )}

              {/* Locked Badges */}
              {lockedBadges.length > 0 && (
                <details className="group" open={unlockedBadges.length === 0}>
                  <summary className="cursor-pointer list-none">
                    <div className="flex items-center justify-between p-4 glass-strong rounded-xl hover:glass-strong transition-all">
                      <div className="flex items-center gap-2">
                        <Lock className="w-5 h-5 text-gray-400" />
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                          Locked ({lockedBadges.length})
                        </h2>
                      </div>
                      <motion.div
                        animate={{ rotate: 0 }}
                        className="group-open:rotate-180 transition-transform"
                      >
                        <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </motion.div>
                    </div>
                  </summary>

                  <div className="mt-3 grid grid-cols-3 md:grid-cols-4 gap-3">
                    {lockedBadges.map(badge => {
                      const CategoryIcon = categoryIcons[badge.category]
                      const progressPercent = (badge.progress / badge.maxProgress) * 100

                      return (
                        <GlassCard
                          key={badge.id}
                          variant="subtle"
                          blur="md"
                          className="p-4 rounded-2xl text-center relative grayscale opacity-70 hover:opacity-90 transition-opacity"
                        >
                          {/* Tier indicator */}
                          <div className={`absolute top-2 right-2 w-2 h-2 rounded-full bg-gradient-to-r ${tierColors[badge.tier]} opacity-50`} />

                          {/* Badge icon */}
                          <div className="text-5xl mb-2 filter grayscale opacity-40">
                            {badge.icon}
                          </div>

                          {/* Badge name */}
                          <h3 className="font-semibold text-xs text-gray-700 dark:text-gray-300 line-clamp-2 mb-2 min-h-[2.5rem] flex items-center justify-center">
                            {badge.name}
                          </h3>

                          {/* Progress ring */}
                          <div className="relative w-12 h-12 mx-auto mb-2">
                            <svg className="transform -rotate-90" width="48" height="48">
                              <circle
                                cx="24"
                                cy="24"
                                r="20"
                                stroke="currentColor"
                                strokeWidth="3"
                                fill="none"
                                className="text-gray-200 dark:text-gray-700"
                              />
                              <circle
                                cx="24"
                                cy="24"
                                r="20"
                                stroke="url(#badge-gradient)"
                                strokeWidth="3"
                                fill="none"
                                strokeDasharray={`${2 * Math.PI * 20}`}
                                strokeDashoffset={`${2 * Math.PI * 20 * (1 - progressPercent / 100)}`}
                                className="transition-all duration-1000"
                                strokeLinecap="round"
                              />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className="text-xs font-bold text-gray-600 dark:text-gray-400">
                                {Math.round(progressPercent)}%
                              </span>
                            </div>
                          </div>

                          {/* Progress text */}
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {badge.progress}/{badge.maxProgress}
                          </p>
                        </GlassCard>
                      )
                    })}
                  </div>
                </details>
              )}

              {filteredBadges.length === 0 && (
                <div className="text-center py-16">
                  <div className="text-6xl mb-4">🏆</div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    No badges in this category
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Try selecting a different category
                  </p>
                </div>
              )}
            </>
          )}
        </div>

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
      </div>
    </PageTransition>
  )
}
