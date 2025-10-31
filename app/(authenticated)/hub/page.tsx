'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function HubPage() {
  const router = useRouter()
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    const checkPermissions = async () => {
      try {
        // Check if user has permission to access hub settings
        const response = await fetch('/api/users/me')
        if (response.ok) {
          const data = await response.json()
          const hasAccess = data.user?.isAccountOwner || data.user?.isFamilyManager

          if (hasAccess) {
            // Manager/Owner: redirect to settings
            router.replace('/hub/settings')
          } else {
            // Non-manager: redirect to display-only view
            router.replace('/hub/display')
          }
        } else {
          // If can't check permissions, go to display
          router.replace('/hub/display')
        }
      } catch (error) {
        console.error('Error checking permissions:', error)
        // On error, redirect to display (safer default)
        router.replace('/hub/display')
      } finally {
        setIsChecking(false)
      }
    }

    checkPermissions()
  }, [router])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="text-4xl mb-4">🖥️</div>
        <p className="text-gray-600">
          {isChecking ? 'Loading Hub...' : 'Redirecting...'}
        </p>
      </div>
    </div>
  )
}
