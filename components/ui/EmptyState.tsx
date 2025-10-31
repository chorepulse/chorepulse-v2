'use client'

import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  icon?: string | ReactNode
  title: string
  description: string
  action?: ReactNode
  helpLink?: string
  className?: string
  variant?: 'default' | 'compact'
}

export default function EmptyState({
  icon,
  title,
  description,
  action,
  helpLink,
  className,
  variant = 'default'
}: EmptyStateProps) {
  const isCompact = variant === 'compact'

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center',
        isCompact ? 'py-8' : 'py-16',
        className
      )}
    >
      {/* Icon */}
      {icon && (
        <div className={cn(
          'mb-4',
          isCompact ? 'text-4xl' : 'text-6xl'
        )}>
          {typeof icon === 'string' ? icon : icon}
        </div>
      )}

      {/* Title */}
      <h3 className={cn(
        'font-bold text-gray-900 mb-2',
        isCompact ? 'text-lg' : 'text-2xl'
      )}>
        {title}
      </h3>

      {/* Description */}
      <p className={cn(
        'text-gray-600 mb-6 max-w-md',
        isCompact ? 'text-sm' : 'text-base'
      )}>
        {description}
      </p>

      {/* Action Button */}
      {action && (
        <div className="mb-4">
          {action}
        </div>
      )}

      {/* Help Link */}
      {helpLink && (
        <a
          href={helpLink}
          className="text-sm text-blue-600 hover:text-blue-800 underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn more →
        </a>
      )}
    </div>
  )
}
