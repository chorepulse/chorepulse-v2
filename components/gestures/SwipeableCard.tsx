'use client'

import { useState, ReactNode } from 'react'
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion'

interface SwipeableCardProps {
  children: ReactNode
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  leftAction?: {
    icon: ReactNode
    color: string
    label: string
  }
  rightAction?: {
    icon: ReactNode
    color: string
    label: string
  }
  className?: string
}

/**
 * Swipeable card component with actions on left/right swipe
 * Perfect for task lists, notifications, etc.
 */
export function SwipeableCard({
  children,
  onSwipeLeft,
  onSwipeRight,
  leftAction,
  rightAction,
  className = '',
}: SwipeableCardProps) {
  const [exitX, setExitX] = useState(0)
  const x = useMotionValue(0)

  // Background opacity based on swipe distance
  const leftBgOpacity = useTransform(x, [-150, 0], [1, 0])
  const rightBgOpacity = useTransform(x, [0, 150], [0, 1])

  // Icon scale based on swipe distance
  const leftScale = useTransform(x, [-150, 0], [1, 0.5])
  const rightScale = useTransform(x, [0, 150], [0.5, 1])

  const handleDragEnd = (_: any, info: PanInfo) => {
    const swipeThreshold = 100

    if (info.offset.x < -swipeThreshold && onSwipeLeft) {
      setExitX(-300)
      setTimeout(() => onSwipeLeft(), 200)
    } else if (info.offset.x > swipeThreshold && onSwipeRight) {
      setExitX(300)
      setTimeout(() => onSwipeRight(), 200)
    }
  }

  return (
    <div className={`relative ${className}`}>
      {/* Left swipe action background */}
      {leftAction && (
        <motion.div
          className="absolute inset-0 flex items-center justify-end px-6 rounded-lg"
          style={{
            backgroundColor: leftAction.color,
            opacity: leftBgOpacity,
          }}
        >
          <motion.div
            className="flex items-center gap-2 text-white"
            style={{ scale: leftScale }}
          >
            {leftAction.icon}
            <span className="font-semibold">{leftAction.label}</span>
          </motion.div>
        </motion.div>
      )}

      {/* Right swipe action background */}
      {rightAction && (
        <motion.div
          className="absolute inset-0 flex items-center justify-start px-6 rounded-lg"
          style={{
            backgroundColor: rightAction.color,
            opacity: rightBgOpacity,
          }}
        >
          <motion.div
            className="flex items-center gap-2 text-white"
            style={{ scale: rightScale }}
          >
            {rightAction.icon}
            <span className="font-semibold">{rightAction.label}</span>
          </motion.div>
        </motion.div>
      )}

      {/* Card content */}
      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.2}
        onDragEnd={handleDragEnd}
        style={{ x }}
        animate={{ x: exitX }}
        transition={{
          type: 'spring',
          stiffness: 300,
          damping: 30,
        }}
        className="relative bg-white dark:bg-gray-800 rounded-lg shadow-md cursor-grab active:cursor-grabbing"
      >
        {children}
      </motion.div>
    </div>
  )
}

/**
 * Pull to refresh component
 */
interface PullToRefreshProps {
  children: ReactNode
  onRefresh: () => Promise<void>
  threshold?: number
}

export function PullToRefresh({
  children,
  onRefresh,
  threshold = 80,
}: PullToRefreshProps) {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const y = useMotionValue(0)

  const iconRotation = useTransform(y, [0, threshold], [0, 180])
  const iconOpacity = useTransform(y, [0, threshold], [0, 1])

  const handleDragEnd = async (_: any, info: PanInfo) => {
    if (info.offset.y > threshold && !isRefreshing) {
      setIsRefreshing(true)
      await onRefresh()
      setIsRefreshing(false)
    }
  }

  return (
    <motion.div className="relative">
      {/* Pull indicator */}
      <motion.div
        className="absolute top-0 left-0 right-0 flex items-center justify-center h-16 -mt-16"
        style={{ opacity: iconOpacity }}
      >
        <motion.div
          style={{ rotate: iconRotation }}
          className="text-deep-purple"
        >
          {isRefreshing ? (
            <div className="w-6 h-6 border-2 border-deep-purple border-t-transparent rounded-full animate-spin" />
          ) : (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 14l-7 7m0 0l-7-7m7 7V3"
              />
            </svg>
          )}
        </motion.div>
      </motion.div>

      {/* Content */}
      <motion.div
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.2}
        onDragEnd={handleDragEnd}
        style={{ y }}
        className={isRefreshing ? 'pointer-events-none' : ''}
      >
        {children}
      </motion.div>
    </motion.div>
  )
}
