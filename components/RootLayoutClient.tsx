'use client'

import { useEffect, useState } from 'react'
import Script from 'next/script'
import CookieConsent, { hasConsentedToCookies } from './CookieConsent'
import { ADSENSE_CONFIG } from '@/lib/adsense-config'
import { ThemeProvider } from '@/components/ThemeProvider'
import { ConfettiProvider } from '@/components/animations/Confetti'

/**
 * Client-side layout wrapper
 * Handles GDPR cookie consent, conditional ad loading, theme, and animations
 */
export default function RootLayoutClient({
  children,
}: {
  children: React.ReactNode
}) {
  const [loadAds, setLoadAds] = useState(false)

  useEffect(() => {
    // Check if user has consented to cookies
    setLoadAds(hasConsentedToCookies())
  }, [])

  return (
    <ThemeProvider>
      <ConfettiProvider>
        {/* Google AdSense - only load if user has consented */}
        {ADSENSE_CONFIG.enabled && loadAds && (
          <Script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CONFIG.publisherId}`}
            crossOrigin="anonymous"
            strategy="afterInteractive"
          />
        )}

        {/* Main content */}
        {children}

        {/* Cookie consent banner (GDPR) */}
        <CookieConsent />
      </ConfettiProvider>
    </ThemeProvider>
  )
}
