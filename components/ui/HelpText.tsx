'use client'

import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface HelpTextProps {
  children: ReactNode
  className?: string
  variant?: 'default' | 'warning' | 'info' | 'success'
}

export default function HelpText({ children, className, variant = 'default' }: HelpTextProps) {
  const variantClasses = {
    default: 'text-gray-600',
    warning: 'text-yellow-700 bg-yellow-50 border border-yellow-200 rounded px-2 py-1',
    info: 'text-blue-700 bg-blue-50 border border-blue-200 rounded px-2 py-1',
    success: 'text-green-700 bg-green-50 border border-green-200 rounded px-2 py-1'
  }

  return (
    <p
      className={cn(
        'text-sm mt-1',
        variantClasses[variant],
        className
      )}
    >
      {children}
    </p>
  )
}
