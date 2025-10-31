'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

/**
 * GDPR Cookie Consent Banner
 *
 * Shows before any tracking cookies (Google AdSense) are loaded.
 * Stores consent preference in localStorage.
 */
export default function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Check if user has already made a choice
    const consent = localStorage.getItem('cookie-consent')
    if (!consent) {
      // Small delay for better UX
      setTimeout(() => {
        setShowBanner(true)
        setTimeout(() => setIsVisible(true), 100)
      }, 1000)
    }
  }, [])

  const handleAccept = () => {
    localStorage.setItem('cookie-consent', 'accepted')
    localStorage.setItem('cookie-consent-date', new Date().toISOString())
    setIsVisible(false)
    setTimeout(() => {
      setShowBanner(false)
      // Reload to activate ads
      window.location.reload()
    }, 300)
  }

  const handleDecline = () => {
    localStorage.setItem('cookie-consent', 'declined')
    localStorage.setItem('cookie-consent-date', new Date().toISOString())
    setIsVisible(false)
    setTimeout(() => setShowBanner(false), 300)
  }

  if (!showBanner) return null

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-50 transition-all duration-300 ${
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
      }`}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" />

      {/* Banner */}
      <div className="relative bg-white border-t-2 border-gray-200 shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            {/* Content */}
            <div className="flex-1">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
                🍪 Cookie Preferences
              </h3>
              <p className="text-sm text-gray-700 leading-relaxed">
                We use cookies to improve your experience and show relevant ads.
                By clicking "Accept All", you consent to our use of cookies for analytics
                and advertising. You can manage your preferences anytime in Settings.
              </p>
              <a
                href="/privacy"
                className="text-sm text-deep-purple hover:underline font-medium mt-1 inline-block"
              >
                Learn more in our Privacy Policy →
              </a>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <button
                onClick={handleDecline}
                className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Decline
              </button>
              <button
                onClick={handleAccept}
                className="px-6 py-2.5 text-sm font-medium text-white bg-deep-purple hover:bg-deep-purple/90 rounded-lg transition-colors shadow-md"
              >
                Accept All
              </button>
            </div>
          </div>
        </div>

        {/* Close button (optional) */}
        <button
          onClick={handleDecline}
          className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Close cookie banner"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}

/**
 * Check if user has consented to cookies
 * Use this before loading analytics/ads
 */
export function hasConsentedToCookies(): boolean {
  if (typeof window === 'undefined') return false
  return localStorage.getItem('cookie-consent') === 'accepted'
}

/**
 * Get consent status
 */
export function getCookieConsentStatus(): 'accepted' | 'declined' | 'unknown' {
  if (typeof window === 'undefined') return 'unknown'
  const consent = localStorage.getItem('cookie-consent')
  if (consent === 'accepted') return 'accepted'
  if (consent === 'declined') return 'declined'
  return 'unknown'
}
