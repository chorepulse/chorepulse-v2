'use client'

import { useState, useEffect } from 'react'

interface SubscriptionData {
  subscriptionTier: string | null
  subscriptionStatus: string | null
  isLoading: boolean
  error: string | null
}

/**
 * Hook to fetch and manage organization subscription information
 * Used to determine if ads should be shown (free tier only)
 */
export function useSubscription(): SubscriptionData {
  const [subscriptionTier, setSubscriptionTier] = useState<string | null>(null)
  const [subscriptionStatus, setSubscriptionStatus] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        setIsLoading(true)
        const response = await fetch('/api/organizations/current')

        if (!response.ok) {
          throw new Error('Failed to fetch subscription')
        }

        const data = await response.json()
        setSubscriptionTier(data.organization?.subscriptionTier || 'free')
        setSubscriptionStatus(data.organization?.subscriptionStatus || null)
      } catch (err) {
        console.error('Error fetching subscription:', err)
        setError(err instanceof Error ? err.message : 'Unknown error')
        // Default to free tier if fetch fails
        setSubscriptionTier('free')
      } finally {
        setIsLoading(false)
      }
    }

    fetchSubscription()
  }, [])

  return {
    subscriptionTier,
    subscriptionStatus,
    isLoading,
    error
  }
}
