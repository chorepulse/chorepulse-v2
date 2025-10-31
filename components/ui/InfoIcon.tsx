'use client'

import { cn } from '@/lib/utils'

interface InfoIconProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export default function InfoIcon({ className, size = 'md' }: InfoIconProps) {
  const sizeClasses = {
    sm: 'w-4 h-4 text-xs',
    md: 'w-5 h-5 text-sm',
    lg: 'w-6 h-6 text-base'
  }

  return (
    <div
      className={cn(
        'inline-flex items-center justify-center rounded-full bg-gray-200 text-gray-600 hover:bg-gray-300 hover:text-gray-800 transition-colors cursor-help',
        sizeClasses[size],
        className
      )}
    >
      <span className="font-semibold">?</span>
    </div>
  )
}
