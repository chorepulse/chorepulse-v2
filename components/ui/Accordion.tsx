'use client'

import { useState, ReactNode, HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export interface AccordionItemProps {
  id: string
  title: string
  subtitle?: string
  icon?: ReactNode
  children: ReactNode
  defaultOpen?: boolean
}

export interface AccordionProps extends HTMLAttributes<HTMLDivElement> {
  items: AccordionItemProps[]
  allowMultiple?: boolean
  variant?: 'default' | 'bordered' | 'separated'
}

export default function Accordion({
  items,
  allowMultiple = false,
  variant = 'separated',
  className,
  ...props
}: AccordionProps) {
  const [openItems, setOpenItems] = useState<Set<string>>(
    new Set(items.filter(item => item.defaultOpen).map(item => item.id))
  )

  const toggleItem = (id: string) => {
    setOpenItems(prev => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        if (!allowMultiple) {
          newSet.clear()
        }
        newSet.add(id)
      }
      return newSet
    })
  }

  const variants = {
    default: 'space-y-0',
    bordered: 'border border-gray-200 rounded-lg overflow-hidden',
    separated: 'space-y-4'
  }

  return (
    <div className={cn(variants[variant], className)} {...props}>
      {items.map((item, index) => {
        const isOpen = openItems.has(item.id)
        const isLast = index === items.length - 1

        return (
          <div
            key={item.id}
            className={cn(
              'bg-white rounded-xl shadow-sm overflow-hidden transition-all',
              variant === 'bordered' && 'rounded-none shadow-none',
              variant === 'bordered' && !isLast && 'border-b border-gray-200'
            )}
          >
            {/* Header Button */}
            <button
              onClick={() => toggleItem(item.id)}
              className={cn(
                'w-full flex items-center justify-between p-6 text-left',
                'hover:bg-gray-50 transition-colors',
                'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset'
              )}
            >
              <div className="flex items-center gap-3 flex-1">
                {item.icon && (
                  <div className="text-2xl flex-shrink-0">
                    {item.icon}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {item.title}
                  </h3>
                  {item.subtitle && (
                    <p className="text-sm text-gray-600 mt-0.5">
                      {item.subtitle}
                    </p>
                  )}
                </div>
              </div>

              {/* Chevron Icon */}
              <svg
                className={cn(
                  'w-5 h-5 text-gray-500 transition-transform duration-200 flex-shrink-0',
                  isOpen && 'transform rotate-180'
                )}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            {/* Content */}
            <div
              className={cn(
                'overflow-hidden transition-all duration-200',
                isOpen ? 'max-h-[5000px] opacity-100' : 'max-h-0 opacity-0'
              )}
            >
              <div className="px-6 pb-6 pt-0">
                {item.children}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
