/**
 * Google AdSense Configuration
 *
 * COPPA Compliance:
 * - Kids (under 13): Only contextual ads, no personalized targeting
 * - Teens/Adults: Standard personalized ads allowed
 *
 * To enable ads:
 * 1. Sign up for Google AdSense at https://www.google.com/adsense
 * 2. Get your Publisher ID (ca-pub-XXXXXXXXXXXXXXXX)
 * 3. Create ad units for each placement type
 * 4. Add the IDs below
 */

export const ADSENSE_CONFIG = {
  // Your AdSense Publisher ID (replace with your actual ID)
  publisherId: process.env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID || 'ca-pub-XXXXXXXXXXXXXXXX',

  // Enable/disable ads globally
  enabled: process.env.NEXT_PUBLIC_ADSENSE_ENABLED === 'true',

  // Ad unit IDs (replace with your actual ad unit IDs from AdSense)
  adUnits: {
    // Banner ads (728x90 desktop, 320x50 mobile)
    banner: process.env.NEXT_PUBLIC_ADSENSE_BANNER_SLOT || '0000000000',

    // Rectangle ads (300x250)
    rectangle: process.env.NEXT_PUBLIC_ADSENSE_RECTANGLE_SLOT || '1111111111',

    // Native ads (responsive, blends with content)
    native: process.env.NEXT_PUBLIC_ADSENSE_NATIVE_SLOT || '2222222222',

    // Interstitial (full-page overlay)
    interstitial: process.env.NEXT_PUBLIC_ADSENSE_INTERSTITIAL_SLOT || '3333333333',

    // Leaderboard (728x90)
    leaderboard: process.env.NEXT_PUBLIC_ADSENSE_LEADERBOARD_SLOT || '4444444444',
  },

  // COPPA-compliant settings
  coppa: {
    // For kids under 13 - force non-personalized ads
    nonPersonalizedAds: true,
    tagForChildDirectedTreatment: true,
  },
}

/**
 * Subscription tiers that disable ads
 */
const AD_FREE_TIERS = ['premium', 'unlimited']

/**
 * Check if ads should be shown based on user role and subscription tier
 * @param userRole - The user's role (kid, teen, adult)
 * @param subscriptionTier - The organization's subscription tier (free, premium, unlimited)
 */
export function shouldShowAds(
  userRole: 'kid' | 'teen' | 'adult' | null,
  subscriptionTier?: string | null
): boolean {
  if (!ADSENSE_CONFIG.enabled) return false
  if (!userRole) return false

  // Hide ads for paid subscription tiers
  if (subscriptionTier && AD_FREE_TIERS.includes(subscriptionTier.toLowerCase())) {
    return false
  }

  return true // Show ads for free tier
}

/**
 * Check if personalized ads are allowed for this role
 */
export function allowPersonalizedAds(userRole: 'kid' | 'teen' | 'adult' | null): boolean {
  if (userRole === 'kid') return false // COPPA compliance
  return true
}

/**
 * Get ad placement recommendations by page
 */
export const AD_PLACEMENTS = {
  rewards: {
    showAds: true,
    placements: ['native', 'banner'] as const,
    frequency: 'every-6-items', // Show ad every 6 reward items
  },
  dashboard: {
    showAds: true,
    placements: ['interstitial'] as const,
    frequency: 'after-5-completions', // Show after 5 task completions
  },
  leaderboard: {
    showAds: true,
    placements: ['banner'] as const,
    roles: ['teen', 'adult'] as const, // Don't show to kids (too frequent)
  },
  badges: {
    showAds: true,
    placements: ['banner'] as const,
  },
  calendar: {
    showAds: true,
    placements: ['banner'] as const,
    roles: ['teen', 'adult'] as const,
  },
  tasks: {
    showAds: false, // Skip - primary workflow page
  },
  more: {
    showAds: false, // Skip - settings/account management
  },
  hub: {
    showAds: false, // Skip - shared family display
  },
} as const
