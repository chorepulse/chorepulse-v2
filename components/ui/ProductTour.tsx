'use client'

import { useState, useEffect, useRef, ReactNode } from 'react'
import { Button } from '@/components/ui'
import { cn } from '@/lib/utils'

export interface TourStep {
  target: string // CSS selector for the element to highlight
  title: string
  content: ReactNode
  placement?: 'top' | 'bottom' | 'left' | 'right'
  action?: {
    label: string
    onClick: () => void
  }
}

interface ProductTourProps {
  steps: TourStep[]
  isOpen: boolean
  onComplete: () => void
  onSkip: () => void
  tourId: string // Unique ID for this tour (e.g., 'tasks-tour', 'rewards-tour')
}

export default function ProductTour({
  steps,
  isOpen,
  onComplete,
  onSkip,
  tourId
}: ProductTourProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null)
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 })
  const tooltipRef = useRef<HTMLDivElement>(null)

  const step = steps[currentStep]

  // Find and scroll to target element
  useEffect(() => {
    if (!isOpen || !step) return

    const element = document.querySelector(step.target) as HTMLElement
    if (element) {
      setTargetElement(element)

      // Scroll element into view
      element.scrollIntoView({ behavior: 'smooth', block: 'center' })

      // Calculate tooltip position
      setTimeout(() => {
        const rect = element.getBoundingClientRect()
        const tooltipRect = tooltipRef.current?.getBoundingClientRect()
        const isMobile = window.innerWidth < 768
        const padding = 16
        const gap = 24 // Gap between element and tooltip

        let top = 0
        let left = 0
        let placement = step.placement || 'bottom'

        // On mobile, we need to be more careful about overlap
        if (isMobile) {
          const tooltipHeight = tooltipRect?.height || 0
          const tooltipWidth = tooltipRect?.width || 0
          const spaceAbove = rect.top
          const spaceBelow = window.innerHeight - rect.bottom

          // Determine best placement based on available space
          if (placement === 'bottom' || placement === 'top') {
            // If there's not enough space in the preferred direction, flip it
            if (placement === 'bottom' && spaceBelow < tooltipHeight + gap) {
              if (spaceAbove > spaceBelow) {
                placement = 'top'
              }
            } else if (placement === 'top' && spaceAbove < tooltipHeight + gap) {
              if (spaceBelow > spaceAbove) {
                placement = 'bottom'
              }
            }
          }

          // For mobile, always center horizontally and position vertically
          left = (window.innerWidth - tooltipWidth) / 2

          if (placement === 'top') {
            // Position above the element
            top = rect.top - tooltipHeight - gap
            // If it goes off top, push it down but keep it above the element
            if (top < padding) {
              top = padding
            }
          } else {
            // Position below the element (default for mobile)
            top = rect.bottom + gap
            // If it goes off bottom, push it up but keep it below the element if possible
            if (top + tooltipHeight > window.innerHeight - padding) {
              // Try to fit it above instead
              const topPlacement = rect.top - tooltipHeight - gap
              if (topPlacement > padding) {
                top = topPlacement
              } else {
                // Last resort: position at bottom of screen
                top = window.innerHeight - tooltipHeight - padding
              }
            }
          }
        } else {
          // Desktop positioning logic (original)
          switch (placement) {
            case 'top':
              top = rect.top - (tooltipRect?.height || 0) - gap
              left = rect.left + rect.width / 2 - (tooltipRect?.width || 0) / 2
              break
            case 'bottom':
              top = rect.bottom + gap
              left = rect.left + rect.width / 2 - (tooltipRect?.width || 0) / 2
              break
            case 'left':
              top = rect.top + rect.height / 2 - (tooltipRect?.height || 0) / 2
              left = rect.left - (tooltipRect?.width || 0) - gap
              break
            case 'right':
              top = rect.top + rect.height / 2 - (tooltipRect?.height || 0) / 2
              left = rect.right + gap
              break
          }

          // Keep tooltip within viewport (desktop)
          if (left < padding) left = padding
          if (left + (tooltipRect?.width || 0) > window.innerWidth - padding) {
            left = window.innerWidth - (tooltipRect?.width || 0) - padding
          }
          if (top < padding) top = padding
          if (top + (tooltipRect?.height || 0) > window.innerHeight - padding) {
            top = window.innerHeight - (tooltipRect?.height || 0) - padding
          }
        }

        setTooltipPosition({ top, left })
      }, 100)
    }
  }, [isOpen, currentStep, step])

  // Add highlight to target element
  useEffect(() => {
    if (!targetElement) return

    targetElement.style.position = 'relative'
    targetElement.style.zIndex = '1001'
    targetElement.classList.add('tour-highlight')

    return () => {
      targetElement.style.zIndex = ''
      targetElement.classList.remove('tour-highlight')
    }
  }, [targetElement])

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      onComplete()
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSkip = () => {
    onSkip()
  }

  if (!isOpen || !step) return null

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 z-[1000] transition-opacity"
        onClick={handleSkip}
      />

      {/* Tour Tooltip */}
      <div
        ref={tooltipRef}
        className="fixed z-[1002] w-96 max-w-[calc(100vw-2rem)] bg-white rounded-xl shadow-2xl"
        style={{
          top: `${tooltipPosition.top}px`,
          left: `${tooltipPosition.left}px`,
        }}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-bold text-gray-900">{step.title}</h3>
            <button
              onClick={handleSkip}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Close tour"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="flex items-center gap-1">
            {steps.map((_, index) => (
              <div
                key={index}
                className={cn(
                  'h-1 flex-1 rounded-full transition-colors',
                  index === currentStep
                    ? 'bg-gradient-to-r from-chorepulse-700 to-chorepulse-800'
                    : index < currentStep
                    ? 'bg-success-green'
                    : 'bg-gray-200'
                )}
              />
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          <div className="text-gray-700 text-sm leading-relaxed mb-4">
            {step.content}
          </div>

          {/* Optional Action */}
          {step.action && (
            <div className="mb-4">
              <Button
                variant="outline"
                size="sm"
                onClick={step.action.onClick}
                className="w-full"
              >
                {step.action.label}
              </Button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 rounded-b-xl flex items-center justify-between">
          <div className="text-xs text-gray-500">
            Step {currentStep + 1} of {steps.length}
          </div>
          <div className="flex items-center gap-2">
            {currentStep > 0 && (
              <Button variant="outline" size="sm" onClick={handleBack}>
                Back
              </Button>
            )}
            <Button
              variant="primary"
              size="sm"
              onClick={handleNext}
              className="bg-gradient-to-r from-chorepulse-700 to-chorepulse-800"
            >
              {currentStep < steps.length - 1 ? 'Next' : 'Finish'}
            </Button>
          </div>
        </div>
      </div>

      {/* Global styles for highlight effect */}
      <style jsx global>{`
        .tour-highlight {
          box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.4), 0 0 0 9999px rgba(0, 0, 0, 0.5) !important;
          border-radius: 8px;
        }
      `}</style>
    </>
  )
}
