import { useState, useEffect } from 'react'

export interface LocationData {
  addressLine1?: string
  addressLine2?: string
  city?: string
  state?: string
  zipCode?: string
  country?: string
  latitude?: number
  longitude?: number
  addressFormatted?: string
  googlePlaceId?: string
}

export function useLocation() {
  const [location, setLocation] = useState<LocationData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchLocation()
  }, [])

  const fetchLocation = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch('/api/organizations/current')

      if (!response.ok) {
        throw new Error('Failed to fetch organization data')
      }

      const data = await response.json()
      const org = data.organization

      // Extract location data
      setLocation({
        addressLine1: org.addressLine1,
        addressLine2: org.addressLine2,
        city: org.city,
        state: org.state,
        zipCode: org.zipCode,
        country: org.country,
        latitude: org.latitude,
        longitude: org.longitude,
        addressFormatted: org.addressFormatted,
        googlePlaceId: org.googlePlaceId
      })
    } catch (err) {
      console.error('Error fetching location:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch location')
    } finally {
      setIsLoading(false)
    }
  }

  // Helper: Check if we have a complete address
  const hasAddress = !!(location?.addressLine1 && location?.city && location?.state)

  // Helper: Check if we have coordinates for weather
  const hasCoordinates = !!(location?.latitude && location?.longitude)

  // Helper: Get location string for ads (city, state)
  const getLocationString = (): string | null => {
    if (!location) return null
    if (location.city && location.state) {
      return `${location.city}, ${location.state}`
    }
    if (location.state) {
      return location.state
    }
    return null
  }

  return {
    location,
    isLoading,
    error,
    hasAddress,
    hasCoordinates,
    getLocationString,
    refetch: fetchLocation
  }
}
