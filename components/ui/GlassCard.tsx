'use client'

import { HTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'

/**
 * Premium glassmorphism card component
 * Creates a frosted glass effect with blur and transparency
 */

export interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'strong' | 'subtle'
  blur?: 'sm' | 'md' | 'lg' | 'xl'
  border?: boolean
  shadow?: boolean
  animate?: boolean
}

const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  (
    {
      className,
      variant = 'default',
      blur = 'md',
      border = true,
      shadow = true,
      animate = false,
      children,
      ...props
    },
    ref
  ) => {
    const variants = {
      default: 'bg-white/70 dark:bg-gray-900/70',
      strong: 'bg-white/80 dark:bg-gray-900/80',
      subtle: 'bg-white/50 dark:bg-gray-900/50',
    }

    const blurs = {
      sm: 'backdrop-blur-sm',
      md: 'backdrop-blur-md',
      lg: 'backdrop-blur-lg',
      xl: 'backdrop-blur-xl',
    }

    const Component = animate ? motion.div : 'div'

    return (
      <Component
        ref={ref}
        className={cn(
          'rounded-2xl',
          variants[variant],
          blurs[blur],
          border && 'border border-white/20 dark:border-gray-700/30',
          shadow && 'shadow-glass',
          className
        )}
        {...(animate && {
          whileHover: { scale: 1.02, y: -4 },
          transition: { duration: 0.2, ease: [0.4, 0, 0.2, 1] },
        })}
        {...props}
      >
        {children}
      </Component>
    )
  }
)

GlassCard.displayName = 'GlassCard'

/**
 * Glass card header
 */
export const GlassCardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('p-6 pb-4', className)} {...props} />
  )
)

GlassCardHeader.displayName = 'GlassCardHeader'

/**
 * Glass card title
 */
export const GlassCardTitle = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn('text-2xl font-bold tracking-tight', className)}
      {...props}
    />
  )
)

GlassCardTitle.displayName = 'GlassCardTitle'

/**
 * Glass card description
 */
export const GlassCardDescription = forwardRef<
  HTMLParagraphElement,
  HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p ref={ref} className={cn('text-sm text-gray-600 dark:text-gray-400 mt-1', className)} {...props} />
))

GlassCardDescription.displayName = 'GlassCardDescription'

/**
 * Glass card content
 */
export const GlassCardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
  )
)

GlassCardContent.displayName = 'GlassCardContent'

/**
 * Glass card footer
 */
export const GlassCardFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex items-center p-6 pt-0', className)} {...props} />
  )
)

GlassCardFooter.displayName = 'GlassCardFooter'

export default GlassCard
