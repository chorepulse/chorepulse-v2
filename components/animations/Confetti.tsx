'use client'

import { useCallback, useRef, useEffect } from 'react'
import ReactCanvasConfetti from 'react-canvas-confetti'
import type { CreateTypes } from 'canvas-confetti'

/**
 * Premium confetti celebration system
 * Creates delightful visual feedback for achievements
 */

const canvasStyles = {
  position: 'fixed' as const,
  pointerEvents: 'none' as const,
  width: '100%',
  height: '100%',
  top: 0,
  left: 0,
  zIndex: 9999,
}

interface ConfettiProps {
  autoFire?: boolean
  particleCount?: number
  spread?: number
  origin?: { x: number; y: number }
}

export function useConfetti() {
  const refAnimationInstance = useRef<CreateTypes | null>(null)

  const getInstance = useCallback((instance: CreateTypes | null) => {
    refAnimationInstance.current = instance
  }, [])

  const makeShot = useCallback((particleRatio: number, opts: any) => {
    refAnimationInstance.current &&
      refAnimationInstance.current({
        ...opts,
        particleCount: Math.floor(200 * particleRatio),
      })
  }, [])

  const fire = useCallback(() => {
    makeShot(0.25, {
      spread: 26,
      startVelocity: 55,
    })

    makeShot(0.2, {
      spread: 60,
    })

    makeShot(0.35, {
      spread: 100,
      decay: 0.91,
      scalar: 0.8,
    })

    makeShot(0.1, {
      spread: 120,
      startVelocity: 25,
      decay: 0.92,
      scalar: 1.2,
    })

    makeShot(0.1, {
      spread: 120,
      startVelocity: 45,
    })
  }, [makeShot])

  const fireworksShow = useCallback(() => {
    const duration = 3000
    const animationEnd = Date.now() + duration
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 }

    const interval: any = setInterval(() => {
      const timeLeft = animationEnd - Date.now()

      if (timeLeft <= 0) {
        return clearInterval(interval)
      }

      const particleCount = 50 * (timeLeft / duration)

      refAnimationInstance.current?.({
        ...defaults,
        particleCount,
        origin: { x: Math.random(), y: Math.random() - 0.2 },
      })
    }, 250)
  }, [])

  const celebrate = useCallback(() => {
    fire()
  }, [fire])

  return { getInstance, celebrate, fire, fireworksShow }
}

export function Confetti({ autoFire = false }: ConfettiProps) {
  const { getInstance, fire } = useConfetti()

  useEffect(() => {
    if (autoFire) {
      fire()
    }
  }, [autoFire, fire])

  return (
    <ReactCanvasConfetti
      refConfetti={getInstance}
      style={canvasStyles}
    />
  )
}

/**
 * Global confetti provider
 * Add to your layout to enable confetti anywhere in the app
 */
export function ConfettiProvider({ children }: { children: React.ReactNode }) {
  const { getInstance } = useConfetti()

  return (
    <>
      {children}
      <ReactCanvasConfetti refConfetti={getInstance} style={canvasStyles} />
    </>
  )
}

/**
 * Hook to trigger confetti from anywhere
 */
export function useConfettiCelebration() {
  const confettiInstance = useRef<CreateTypes | null>(null)

  useEffect(() => {
    // Store instance globally
    const canvas = document.querySelector('canvas[style*="position: fixed"]') as any
    if (canvas?.__confetti) {
      confettiInstance.current = canvas.__confetti
    }
  }, [])

  const celebrate = useCallback(() => {
    if (confettiInstance.current) {
      // Multi-burst confetti
      const fire = (particleRatio: number, opts: any) => {
        confettiInstance.current?.({
          ...opts,
          particleCount: Math.floor(200 * particleRatio),
        })
      }

      fire(0.25, { spread: 26, startVelocity: 55 })
      fire(0.2, { spread: 60 })
      fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 })
      fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 })
      fire(0.1, { spread: 120, startVelocity: 45 })
    }
  }, [])

  return { celebrate }
}
