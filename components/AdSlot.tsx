'use client'

import { useEffect, useRef, useState } from 'react'
import { ADSENSE_CONFIG, shouldShowAds, allowPersonalizedAds } from '@/lib/adsense-config'

interface AdSlotProps {
  /**
   * Type of ad unit to display
   */
  adUnit: 'banner' | 'rectangle' | 'native' | 'interstitial' | 'leaderboard'

  /**
   * User role for COPPA compliance
   */
  userRole: 'kid' | 'teen' | 'adult' | null

  /**
   * Organization subscription tier (ads are hidden for premium/unlimited)
   */
  subscriptionTier?: string | null

  /**
   * Age bracket for improved ad targeting
   * under_13, 13_17, 18_24, 25_34, 35_44, 45_plus
   */
  ageBracket?: string | null

  /**
   * Geographic location for improved ad targeting
   * Format: "City, State" (e.g., "Austin, TX")
   */
  location?: string | null

  /**
   * Optional custom styling
   */
  className?: string

  /**
   * Ad format (default: auto)
   */
  format?: 'auto' | 'rectangle' | 'horizontal' | 'vertical'

  /**
   * Responsive ad (default: true)
   */
  responsive?: boolean

  /**
   * Test mode - shows placeholder instead of real ad
   */
  testMode?: boolean
}

/**
 * AdSlot Component
 *
 * Displays Google AdSense ads with COPPA compliance
 * - Kids: Non-personalized, contextual ads only
 * - Teens/Adults: Personalized ads allowed
 */
export default function AdSlot({
  adUnit,
  userRole,
  subscriptionTier,
  ageBracket,
  location,
  className = '',
  format = 'auto',
  responsive = true,
  testMode = false,
}: AdSlotProps) {
  const adRef = useRef<HTMLModElement>(null)
  const [adLoaded, setAdLoaded] = useState(false)
  const [adError, setAdError] = useState(false)

  // Check if we should show ads (considers subscription tier)
  const showAds = shouldShowAds(userRole, subscriptionTier) && ADSENSE_CONFIG.enabled

  // Determine if personalized ads are allowed
  const personalizedAds = allowPersonalizedAds(userRole)

  // Get ad slot ID
  const slotId = ADSENSE_CONFIG.adUnits[adUnit]

  useEffect(() => {
    if (!showAds || testMode || adLoaded) return

    // Push ad to AdSense queue
    try {
      if (typeof window !== 'undefined' && window.adsbygoogle) {
        ;(window.adsbygoogle = window.adsbygoogle || []).push({})
        setAdLoaded(true)
      }
    } catch (error) {
      console.error('AdSense error:', error)
      setAdError(true)
    }
  }, [showAds, testMode, adLoaded])

  // Don't render if ads are disabled or role doesn't allow
  if (!showAds) {
    return null
  }

  // Test mode - show placeholder
  if (testMode) {
    return (
      <div className={`bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg p-4 text-center ${className}`}>
        <div className="text-gray-500 text-sm font-medium mb-1">
          Ad Placeholder ({adUnit})
        </div>
        <div className="text-xs text-gray-400">
          {personalizedAds ? 'Personalized ads' : 'Non-personalized ads (COPPA)'}
        </div>
        <div className="text-xs text-gray-400 mt-1">
          Role: {userRole} | Tier: {subscriptionTier || 'free'}
        </div>
        <div className="text-xs text-gray-400">
          Age: {ageBracket || 'unknown'} | Location: {location || 'unknown'}
        </div>
      </div>
    )
  }

  // Show error state if ad failed to load
  if (adError) {
    return null // Silently fail - don't show anything if ads don't load
  }

  return (
    <div
      className={`ad-container ${className}`}
      data-age-bracket={ageBracket || 'unknown'}
      data-location={location || 'unknown'}
    >
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ display: 'block', textAlign: 'center' }}
        data-ad-client={ADSENSE_CONFIG.publisherId}
        data-ad-slot={slotId}
        data-ad-format={format}
        data-full-width-responsive={responsive ? 'true' : 'false'}
        data-npa={personalizedAds ? '0' : '1'} // Non-personalized ads for kids
        data-tag-for-child-directed-treatment={userRole === 'kid' ? '1' : '0'}
      />
    </div>
  )
}

/**
 * Declare AdSense global for TypeScript
 */
declare global {
  interface Window {
    adsbygoogle: any[]
  }
}
