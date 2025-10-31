'use client'

import { motion } from 'framer-motion'
import { ReactNode } from 'react'

/**
 * Stagger animation for list items
 * Creates a cascading entrance effect
 */

interface StaggerContainerProps {
  children: ReactNode
  className?: string
  staggerDelay?: number
}

interface StaggerItemProps {
  children: ReactNode
  className?: string
}

export function StaggerContainer({
  children,
  className = '',
  staggerDelay = 0.1
}: StaggerContainerProps) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="visible"
      variants={{
        visible: {
          transition: {
            staggerChildren: staggerDelay,
          },
        },
      }}
    >
      {children}
    </motion.div>
  )
}

export function StaggerItem({ children, className = '' }: StaggerItemProps) {
  return (
    <motion.div
      className={className}
      variants={{
        hidden: {
          opacity: 0,
          y: 20,
        },
        visible: {
          opacity: 1,
          y: 0,
          transition: {
            duration: 0.4,
            ease: [0.4, 0, 0.2, 1],
          },
        },
      }}
    >
      {children}
    </motion.div>
  )
}
