'use client'

/**
 * Rewards Page V2 - Simplified Mobile-First Design
 *
 * Features:
 * - Compact header with points balance
 * - Affordable rewards first
 * - Compact grid layout (2 columns mobile)
 * - Quick claim with swipe
 * - Category chip filters
 * - Collapsible sections
 */

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { PageTransition, StaggerContainer, StaggerItem, useConfettiCelebration } from '@/components/animations'
import { LiftCard, PointsBadge, FloatingActionButton } from '@/components/animations/MicroInteractions'
import GlassCard from '@/components/ui/GlassCard'
import { Star, Plus, Gift, Check, AlertCircle, X, Sparkles } from 'lucide-react'
import AdSlot from '@/components/AdSlot'
import { useSubscription } from '@/hooks/useSubscription'
import { useAgeBracket } from '@/hooks/useAgeBracket'
import { useLocation } from '@/hooks/useLocation'

interface Reward {
  id: string
  name: string
  description: string
  pointsCost: number
  category: string
  icon: string
  stock: number
  maxPerMonth?: number
  requiresApproval: boolean
}

interface Redemption {
  id: string
  rewardName: string
  rewardIcon: string
  pointsCost: number
  status: 'pending' | 'approved' | 'denied' | 'fulfilled'
  requestedAt: string
}

const categoryIcons: Record<string, string> = {
  'screen_time': '📱',
  'food_treats': '🍕',
  'privileges': '⭐',
  'items': '🎁',
  'social': '👥',
  'digital': '🎮',
  'outings': '🎡',
  'money': '💰',
  'other': '✨'
}

export default function RewardsPageV2() {
  const router = useRouter()
  const { celebrate } = useConfettiCelebration()

  const [userPoints, setUserPoints] = useState(0)
  const [userRole, setUserRole] = useState<'kid' | 'teen' | 'adult'>('adult')
  const [rewards, setRewards] = useState<Reward[]>([])
  const [myRedemptions, setMyRedemptions] = useState<Redemption[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState<string>('all')
  const [showClaimModal, setShowClaimModal] = useState(false)
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null)
  const [claimNotes, setClaimNotes] = useState('')

  // For ads (COPPA compliant)
  const { subscriptionTier } = useSubscription()
  const { ageBracket } = useAgeBracket()
  const { getLocationString } = useLocation()

  const categories = [
    { id: 'all', label: 'All', icon: '✨' },
    { id: 'screen_time', label: 'Screen Time', icon: '📱' },
    { id: 'food_treats', label: 'Food', icon: '🍕' },
    { id: 'privileges', label: 'Privileges', icon: '⭐' },
    { id: 'items', label: 'Items', icon: '🎁' },
    { id: 'outings', label: 'Outings', icon: '🎡' },
    { id: 'money', label: 'Money', icon: '💰' }
  ]

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setIsLoading(true)
    try {
      // Fetch user points
      const userRes = await fetch('/api/users/me')
      if (userRes.ok) {
        const userData = await userRes.json()
        setUserPoints(userData.user?.points || 0)
      }

      // Fetch rewards
      const rewardsRes = await fetch('/api/rewards')
      if (rewardsRes.ok) {
        const rewardsData = await rewardsRes.json()
        setRewards(rewardsData.rewards || [])
      }

      // Fetch my redemptions
      const redemptionsRes = await fetch('/api/rewards/redemptions?status=all')
      if (redemptionsRes.ok) {
        const redemptionsData = await redemptionsRes.json()
        setMyRedemptions(redemptionsData.redemptions || [])
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleClaimReward = async () => {
    if (!selectedReward) return

    try {
      const response = await fetch(`/api/rewards/${selectedReward.id}/redeem`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: claimNotes })
      })

      if (response.ok) {
        celebrate()
        setShowClaimModal(false)
        setSelectedReward(null)
        setClaimNotes('')
        await fetchData()
      }
    } catch (error) {
      console.error('Error claiming reward:', error)
    }
  }

  // Filter rewards by category
  const filteredRewards = rewards.filter(reward => {
    if (activeCategory === 'all') return true
    return reward.category === activeCategory
  })

  // Sort: affordable first, then by points
  const affordableRewards = filteredRewards
    .filter(r => r.pointsCost <= userPoints && r.stock > 0)
    .sort((a, b) => a.pointsCost - b.pointsCost)

  const unaffordableRewards = filteredRewards
    .filter(r => r.pointsCost > userPoints || r.stock === 0)
    .sort((a, b) => a.pointsCost - b.pointsCost)

  const pendingRedemptions = myRedemptions.filter(r => r.status === 'pending')

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
        {/* Compact Sticky Header */}
        <div className="sticky top-0 z-10 glass-strong px-4 py-3 border-b border-white/10">
          <div className="flex items-center justify-between max-w-3xl mx-auto">
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Gift className="w-5 h-5 text-heartbeat-red" />
                Rewards
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {affordableRewards.length} you can afford
              </p>
            </div>

            {/* Points Balance */}
            <div className="flex items-center gap-2 px-4 py-2 bg-gradient-cta rounded-xl shadow-elevated">
              <Star className="w-5 h-5 text-white fill-white" />
              <span className="text-xl font-black text-white">{userPoints}</span>
            </div>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
          {/* Category Filters */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full font-semibold whitespace-nowrap transition-all ${
                  activeCategory === cat.id
                    ? 'bg-heartbeat-red text-white shadow-elevated'
                    : 'glass text-gray-700 dark:text-gray-300'
                }`}
              >
                <span>{cat.icon}</span>
                <span className="text-sm">{cat.label}</span>
              </button>
            ))}
          </div>

          {/* Pending Requests Alert */}
          {pendingRedemptions.length > 0 && (
            <GlassCard variant="strong" className="p-4 border-2 border-warning-yellow/50 bg-warning-yellow/5">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-warning-yellow flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 dark:text-white">
                    {pendingRedemptions.length} Request{pendingRedemptions.length > 1 ? 's' : ''} Pending
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Waiting for approval from your family manager
                  </p>
                </div>
              </div>
            </GlassCard>
          )}

          {/* Affordable Rewards - Priority Section */}
          {affordableRewards.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-success-green" />
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  You Can Afford ({affordableRewards.length})
                </h2>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {affordableRewards.map(reward => (
                  <LiftCard
                    key={reward.id}
                    className="glass-strong p-4 rounded-2xl cursor-pointer"
                    onClick={() => {
                      setSelectedReward(reward)
                      setShowClaimModal(true)
                    }}
                  >
                    <div className="text-center">
                      <div className="text-4xl mb-2">{reward.icon || '🎁'}</div>
                      <h3 className="font-semibold text-sm text-gray-900 dark:text-white line-clamp-2 mb-2">
                        {reward.name}
                      </h3>
                      <div className="flex items-center justify-center gap-1 px-3 py-1.5 bg-success-green/20 rounded-full">
                        <Star className="w-4 h-4 text-success-green fill-success-green" />
                        <span className="text-sm font-bold text-success-green">{reward.pointsCost}</span>
                      </div>
                      {reward.stock < 5 && reward.stock > 0 && (
                        <p className="text-xs text-warning-yellow mt-2">
                          Only {reward.stock} left!
                        </p>
                      )}
                    </div>
                  </LiftCard>
                ))}
              </div>
            </div>
          )}

          {/* Keep Saving For - Collapsed by Default */}
          {unaffordableRewards.length > 0 && (
            <details className="group">
              <summary className="cursor-pointer list-none">
                <GlassCard variant="subtle" className="p-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      <Gift className="w-4 h-4 text-gray-500" />
                      Keep Saving For ({unaffordableRewards.length})
                    </h2>
                    <span className="text-sm text-gray-500 group-open:rotate-180 transition-transform">
                      ▼
                    </span>
                  </div>
                </GlassCard>
              </summary>

              <div className="mt-3 grid grid-cols-2 gap-3">
                {unaffordableRewards.map(reward => (
                  <div
                    key={reward.id}
                    className="glass-subtle p-4 rounded-2xl opacity-60"
                  >
                    <div className="text-center">
                      <div className="text-4xl mb-2 grayscale">{reward.icon || '🎁'}</div>
                      <h3 className="font-semibold text-sm text-gray-900 dark:text-white line-clamp-2 mb-2">
                        {reward.name}
                      </h3>
                      <div className="flex items-center justify-center gap-1 px-3 py-1.5 bg-gray-200 dark:bg-gray-700 rounded-full">
                        <Star className="w-4 h-4 text-gray-500" />
                        <span className="text-sm font-bold text-gray-600 dark:text-gray-400">
                          {reward.pointsCost}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        Need {reward.pointsCost - userPoints} more
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </details>
          )}

          {/* My Requests - Collapsed */}
          {myRedemptions.length > 0 && (
            <details className="group">
              <summary className="cursor-pointer list-none">
                <GlassCard variant="subtle" className="p-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      <Check className="w-4 h-4 text-soft-blue" />
                      My Requests ({myRedemptions.length})
                    </h2>
                    <span className="text-sm text-gray-500 group-open:rotate-180 transition-transform">
                      ▼
                    </span>
                  </div>
                </GlassCard>
              </summary>

              <div className="mt-3 space-y-2">
                {myRedemptions.slice(0, 10).map(redemption => {
                  const statusColor = {
                    pending: 'text-warning-yellow bg-warning-yellow/10',
                    approved: 'text-success-green bg-success-green/10',
                    denied: 'text-heartbeat-red bg-heartbeat-red/10',
                    fulfilled: 'text-soft-blue bg-soft-blue/10'
                  }[redemption.status]

                  return (
                    <GlassCard key={redemption.id} variant="subtle" className="p-3">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{redemption.rewardIcon || '🎁'}</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-gray-900 dark:text-white truncate">
                            {redemption.rewardName}
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            {new Date(redemption.requestedAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${statusColor}`}>
                            {redemption.status}
                          </span>
                          <span className="text-xs text-gray-500">
                            -{redemption.pointsCost}
                          </span>
                        </div>
                      </div>
                    </GlassCard>
                  )
                })}
              </div>
            </details>
          )}

          {/* Empty State */}
          {filteredRewards.length === 0 && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🎁</div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                No Rewards Yet
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Ask your family manager to add some rewards!
              </p>
            </div>
          )}
        </div>

        {/* Claim Modal */}
        {showClaimModal && selectedReward && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <GlassCard variant="strong" blur="xl" className="max-w-md w-full p-6 relative">
              <button
                onClick={() => {
                  setShowClaimModal(false)
                  setSelectedReward(null)
                  setClaimNotes('')
                }}
                className="absolute top-4 right-4 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>

              <div className="text-center mb-6">
                <div className="text-6xl mb-4">{selectedReward.icon || '🎁'}</div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {selectedReward.name}
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  {selectedReward.description}
                </p>
                <div className="flex items-center justify-center gap-2 px-4 py-2 bg-heartbeat-red/10 rounded-xl">
                  <Star className="w-5 h-5 text-heartbeat-red fill-heartbeat-red" />
                  <span className="text-xl font-bold text-heartbeat-red">
                    {selectedReward.pointsCost} points
                  </span>
                </div>
              </div>

              {selectedReward.requiresApproval && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Notes (optional)
                  </label>
                  <textarea
                    value={claimNotes}
                    onChange={(e) => setClaimNotes(e.target.value)}
                    placeholder="Add any notes for your request..."
                    className="w-full px-4 py-2 glass rounded-lg text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-heartbeat-red"
                    rows={3}
                  />
                </div>
              )}

              <div className="space-y-3">
                <button
                  onClick={handleClaimReward}
                  className="w-full py-3 bg-gradient-cta text-white rounded-xl font-bold shadow-elevated hover:scale-105 transition-transform"
                >
                  {selectedReward.requiresApproval ? 'Request Approval' : 'Claim Now'}
                </button>
                <button
                  onClick={() => {
                    setShowClaimModal(false)
                    setSelectedReward(null)
                    setClaimNotes('')
                  }}
                  className="w-full py-3 glass text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  Cancel
                </button>
              </div>

              {selectedReward.requiresApproval && (
                <p className="text-xs text-center text-gray-500 mt-4">
                  This reward requires approval from your family manager
                </p>
              )}
            </GlassCard>
          </div>
        )}

        {/* FAB - Create Reward (for managers) */}
        {/* Google AdSense - Only show to teens/adults (COPPA compliant) */}
        {ageBracket !== 'child' && (
          <AdSlot
            adUnit="native"
            userRole={userRole}
            subscriptionTier={subscriptionTier}
            ageBracket={ageBracket}
            location={getLocationString()}
            className="mt-6"
            testMode={true}
          />
        )}

        <FloatingActionButton
          onClick={() => router.push('/rewards/create')}
          className="bg-gradient-ai text-white w-14 h-14"
        >
          <Plus className="w-6 h-6" />
        </FloatingActionButton>
      </div>
    </PageTransition>
  )
}
