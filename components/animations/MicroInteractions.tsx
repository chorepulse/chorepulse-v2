'use client'

import { motion } from 'framer-motion'
import { ReactNode, useState } from 'react'

/**
 * Premium micro-interactions for delightful UX
 */

interface InteractionProps {
  children: ReactNode
  className?: string
}

/**
 * Button with lift effect on hover
 * Feels premium and responsive
 */
export function LiftButton({ children, className, ...props }: any) {
  return (
    <motion.button
      whileHover={{ y: -2, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
      className={className}
      {...props}
    >
      {children}
    </motion.button>
  )
}

/**
 * Card with hover lift and shadow enhancement
 */
export function LiftCard({ children, className, ...props }: any) {
  return (
    <motion.div
      whileHover={{
        y: -4,
        transition: { duration: 0.2, ease: [0.4, 0, 0.2, 1] },
      }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  )
}

/**
 * Ripple effect for interactive elements
 */
export function RippleButton({ children, className, onClick, ...props }: any) {
  const [ripples, setRipples] = useState<Array<{ x: number; y: number; id: number }>>([])

  const addRipple = (event: React.MouseEvent<HTMLButtonElement>) => {
    const button = event.currentTarget
    const rect = button.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top
    const id = Date.now()

    setRipples((prev) => [...prev, { x, y, id }])
    setTimeout(() => {
      setRipples((prev) => prev.filter((ripple) => ripple.id !== id))
    }, 600)

    onClick?.(event)
  }

  return (
    <button
      className={`relative overflow-hidden ${className || ''}`}
      onClick={addRipple}
      {...props}
    >
      {children}
      {ripples.map((ripple) => (
        <motion.span
          key={ripple.id}
          className="absolute rounded-full bg-white/30 pointer-events-none"
          initial={{
            width: 0,
            height: 0,
            left: ripple.x,
            top: ripple.y,
            opacity: 1,
          }}
          animate={{
            width: 300,
            height: 300,
            left: ripple.x - 150,
            top: ripple.y - 150,
            opacity: 0,
          }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      ))}
    </button>
  )
}

/**
 * Smooth checkbox with checkmark animation
 */
export function AnimatedCheckbox({ checked, onChange, className, id, ...props }: any) {
  return (
    <motion.div className="relative inline-block">
      <input
        type="checkbox"
        id={id}
        checked={checked}
        onChange={onChange}
        className="sr-only peer"
        {...props}
      />
      <motion.label
        htmlFor={id}
        className={`flex items-center justify-center w-6 h-6 border-2 rounded-md cursor-pointer transition-colors ${
          checked
            ? 'bg-deep-purple border-deep-purple'
            : 'bg-white border-gray-300 hover:border-deep-purple'
        } ${className || ''}`}
        whileTap={{ scale: 0.9 }}
      >
        {checked && (
          <motion.svg
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 180 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            className="w-4 h-4 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={3}
              d="M5 13l4 4L19 7"
            />
          </motion.svg>
        )}
      </motion.label>
    </motion.div>
  )
}

/**
 * Floating action button with pulse effect
 */
export function FloatingActionButton({ children, className, ...props }: any) {
  return (
    <motion.button
      className={`fixed bottom-20 right-6 md:bottom-8 md:right-8 z-40 rounded-full shadow-2xl ${className || ''}`}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      animate={{
        boxShadow: [
          '0 10px 40px rgba(108, 99, 255, 0.3)',
          '0 10px 60px rgba(108, 99, 255, 0.5)',
          '0 10px 40px rgba(108, 99, 255, 0.3)',
        ],
      }}
      transition={{
        boxShadow: {
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        },
      }}
      {...props}
    >
      {children}
    </motion.button>
  )
}

/**
 * Success checkmark animation
 */
export function SuccessCheckmark({ className }: { className?: string }) {
  return (
    <motion.div
      className={`flex items-center justify-center ${className || ''}`}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
    >
      <motion.div
        className="w-16 h-16 rounded-full bg-success-green flex items-center justify-center"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.1, type: 'spring', stiffness: 200, damping: 10 }}
      >
        <motion.svg
          className="w-10 h-10 text-white"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ delay: 0.3, duration: 0.5, ease: 'easeInOut' }}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <motion.path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 13l4 4L19 7"
          />
        </motion.svg>
      </motion.div>
    </motion.div>
  )
}

/**
 * Points badge with pop animation
 */
export function PointsBadge({ points, className }: { points: number; className?: string }) {
  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 15 }}
      className={className}
    >
      <motion.span
        key={points}
        initial={{ scale: 1.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="inline-block"
      >
        {points}
      </motion.span>
    </motion.div>
  )
}

/**
 * Shimmer loading skeleton
 */
export function ShimmerSkeleton({ className }: { className?: string }) {
  return (
    <div className={`relative overflow-hidden bg-gray-200 rounded ${className || ''}`}>
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent"
        animate={{
          x: ['-100%', '100%'],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: 'linear',
        }}
      />
    </div>
  )
}
