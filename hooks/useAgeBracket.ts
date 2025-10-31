import { useState, useEffect } from 'react'

/**
 * Hook to fetch user's age bracket for ad targeting
 * Returns: under_13, 13_17, 18_24, 25_34, 35_44, 45_plus, or null
 */
export function useAgeBracket() {
  const [ageBracket, setAgeBracket] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchAgeBracket = async () => {
      try {
        const response = await fetch('/api/users/me')
        if (response.ok) {
          const data = await response.json()
          setAgeBracket(data.user?.ageBracket || null)
        }
      } catch (error) {
        console.error('Error fetching age bracket:', error)
        setAgeBracket(null)
      } finally {
        setIsLoading(false)
      }
    }

    fetchAgeBracket()
  }, [])

  return { ageBracket, isLoading }
}
