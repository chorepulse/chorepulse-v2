'use client'

import { useEffect, useState } from 'react'
import { Modal, Button, Badge } from '@/components/ui'

interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  tier: 'bronze' | 'silver' | 'gold' | 'platinum'
  points: number
}

interface AchievementCelebrationProps {
  onClose?: () => void
}

export default function AchievementCelebration({ onClose }: AchievementCelebrationProps) {
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isVisible, setIsVisible] = useState(false)

  // Check for unlocked achievements
  const checkUnlockedAchievements = async () => {
    try {
      const response = await fetch('/api/achievements/check-unlocked')
      if (response.ok) {
        const data = await response.json()
        if (data.achievements && data.achievements.length > 0) {
          setAchievements(data.achievements)
          setIsVisible(true)
        }
      } else if (response.status === 401) {
        // User not authenticated, silently ignore
        return
      } else {
        console.warn('Failed to check achievements:', response.status)
      }
    } catch (err) {
      // Network error or other issue, silently ignore to not break the page
      console.error('Error checking unlocked achievements:', err)
    }
  }

  // Mark achievements as notified
  const markAsNotified = async (achievementIds: string[]) => {
    try {
      await fetch('/api/achievements/check-unlocked', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ achievementIds })
      })
    } catch (err) {
      console.error('Error marking achievements as notified:', err)
    }
  }

  // Check on mount and set interval
  useEffect(() => {
    checkUnlockedAchievements()

    // Check every 30 seconds for new achievements
    const interval = setInterval(checkUnlockedAchievements, 30000)

    return () => clearInterval(interval)
  }, [])

  const handleNext = () => {
    if (currentIndex < achievements.length - 1) {
      setCurrentIndex(currentIndex + 1)
    } else {
      handleClose()
    }
  }

  const handleClose = async () => {
    // Mark all as notified
    const achievementIds = achievements.map(a => a.id)
    await markAsNotified(achievementIds)

    setIsVisible(false)
    setAchievements([])
    setCurrentIndex(0)
    onClose?.()
  }

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'bronze': return 'from-amber-600 to-amber-700'
      case 'silver': return 'from-gray-400 to-gray-500'
      case 'gold': return 'from-yellow-400 to-yellow-500'
      case 'platinum': return 'from-purple-400 to-purple-500'
      default: return 'from-gray-400 to-gray-500'
    }
  }

  const getTierBadgeVariant = (tier: string): "default" | "success" | "warning" | "danger" | "info" => {
    switch (tier) {
      case 'bronze': return 'warning'
      case 'silver': return 'default'
      case 'gold': return 'warning'
      case 'platinum': return 'info'
      default: return 'default'
    }
  }

  if (!isVisible || achievements.length === 0) {
    return null
  }

  const currentAchievement = achievements[currentIndex]

  return (
    <Modal
      isOpen={isVisible}
      onClose={handleClose}
      title=""
      size="md"
    >
      <div className="text-center py-6">
        {/* Celebration Header */}
        <div className="mb-6">
          <div className="text-6xl mb-4 animate-bounce">🎉</div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Achievement Unlocked!
          </h2>
          <p className="text-gray-600">
            {currentIndex + 1} of {achievements.length} new achievement{achievements.length > 1 ? 's' : ''}
          </p>
        </div>

        {/* Achievement Card */}
        <div className="relative p-8 bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl border-4 border-purple-200 mb-6">
          {/* Tier Badge */}
          <div className="absolute top-4 right-4">
            <Badge variant={getTierBadgeVariant(currentAchievement.tier)} size="lg">
              {currentAchievement.tier}
            </Badge>
          </div>

          {/* Achievement Icon */}
          <div className="text-8xl mb-4 filter drop-shadow-lg">
            {currentAchievement.icon}
          </div>

          {/* Tier Glow */}
          <div className={`w-24 h-2 mx-auto rounded-full bg-gradient-to-r ${getTierColor(currentAchievement.tier)} mb-4 shadow-lg`} />

          {/* Achievement Info */}
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            {currentAchievement.name}
          </h3>
          <p className="text-gray-600 mb-4">
            {currentAchievement.description}
          </p>

          {/* Points Reward */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 border-2 border-green-300 rounded-full">
            <span className="text-2xl">💰</span>
            <span className="text-lg font-bold text-green-700">
              +{currentAchievement.points} points
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          {currentIndex < achievements.length - 1 ? (
            <>
              <Button
                variant="outline"
                fullWidth
                onClick={handleClose}
              >
                Skip All
              </Button>
              <Button
                variant="primary"
                fullWidth
                onClick={handleNext}
              >
                Next Achievement →
              </Button>
            </>
          ) : (
            <Button
              variant="primary"
              fullWidth
              onClick={handleClose}
            >
              Awesome! 🎊
            </Button>
          )}
        </div>
      </div>
    </Modal>
  )
}
