'use client'

import { useState, useEffect } from 'react'

export function useTour(tourId: string) {
  const [isOpen, setIsOpen] = useState(false)
  const [hasCompletedTour, setHasCompletedTour] = useState(true) // Default to true, will update after mount

  // Check if user has completed this tour
  useEffect(() => {
    const completed = localStorage.getItem(`tour-completed-${tourId}`)
    setHasCompletedTour(completed === 'true')

    // If not completed, show tour after a brief delay
    if (completed !== 'true') {
      const timer = setTimeout(() => {
        setIsOpen(true)
      }, 1000) // 1 second delay to let page load

      return () => clearTimeout(timer)
    }
  }, [tourId])

  const completeTour = () => {
    localStorage.setItem(`tour-completed-${tourId}`, 'true')
    setHasCompletedTour(true)
    setIsOpen(false)
  }

  const skipTour = () => {
    localStorage.setItem(`tour-completed-${tourId}`, 'true')
    setHasCompletedTour(true)
    setIsOpen(false)
  }

  const restartTour = () => {
    setIsOpen(true)
  }

  const resetTour = () => {
    localStorage.removeItem(`tour-completed-${tourId}`)
    setHasCompletedTour(false)
    setIsOpen(true)
  }

  return {
    isOpen,
    hasCompletedTour,
    completeTour,
    skipTour,
    restartTour,
    resetTour
  }
}
