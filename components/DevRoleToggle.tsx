'use client'

import { useState, useEffect } from 'react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'

export default function DevRoleToggle() {
  const [userRole, setUserRole] = useState<'kid' | 'teen' | 'adult'>('adult')
  const [devRoleOverride, setDevRoleOverride] = useState<'kid' | 'teen' | 'adult' | null>(null)
  const [isMinimized, setIsMinimized] = useState(false)

  useEffect(() => {
    // Fetch actual user role
    const fetchUserRole = async () => {
      try {
        const response = await fetch('/api/users/me')
        if (response.ok) {
          const data = await response.json()
          setUserRole(data.user?.role || 'adult')
        }
      } catch (error) {
        console.error('Error fetching user role:', error)
      }
    }

    fetchUserRole()

    // Check for dev role override in localStorage
    const storedRole = localStorage.getItem('devRoleOverride') as 'kid' | 'teen' | 'adult' | null
    if (storedRole) {
      setDevRoleOverride(storedRole)
    }

    // Check if minimized state is stored
    const minimized = localStorage.getItem('devToggleMinimized') === 'true'
    setIsMinimized(minimized)

    // Listen for storage changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'devRoleOverride') {
        setDevRoleOverride(e.newValue as 'kid' | 'teen' | 'adult' | null)
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  const handleRoleChange = (role: 'kid' | 'teen' | 'adult' | null) => {
    setDevRoleOverride(role)
    if (role === null) {
      localStorage.removeItem('devRoleOverride')
    } else {
      localStorage.setItem('devRoleOverride', role)
    }
    window.dispatchEvent(new Event('storage'))
  }

  const toggleMinimize = () => {
    const newMinimized = !isMinimized
    setIsMinimized(newMinimized)
    localStorage.setItem('devToggleMinimized', String(newMinimized))
  }

  const effectiveRole = devRoleOverride || userRole

  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-[100]">
        <button
          onClick={toggleMinimize}
          className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold px-4 py-2 rounded-lg shadow-lg border-2 border-yellow-600 transition-all"
        >
          🔧 Dev: {effectiveRole}
        </button>
      </div>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 z-[100] max-w-sm">
      <Card variant="default" padding="sm" className="bg-yellow-50 border-2 border-yellow-400 shadow-xl">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-yellow-800">🔧 DEV MODE - Role Testing</span>
            <button
              onClick={toggleMinimize}
              className="text-yellow-700 hover:text-yellow-900 font-bold text-lg"
              title="Minimize"
            >
              ─
            </button>
          </div>

          {/* Role Buttons */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant={devRoleOverride === 'kid' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => handleRoleChange('kid')}
            >
              👶 Kid
            </Button>
            <Button
              variant={devRoleOverride === 'teen' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => handleRoleChange('teen')}
            >
              🎸 Teen
            </Button>
            <Button
              variant={devRoleOverride === 'adult' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => handleRoleChange('adult')}
            >
              👨‍💼 Adult
            </Button>
            <Button
              variant={devRoleOverride === null ? 'primary' : 'outline'}
              size="sm"
              onClick={() => handleRoleChange(null)}
            >
              🔄 Default
            </Button>
          </div>

          {/* Status */}
          <div className="text-xs text-yellow-700 border-t border-yellow-300 pt-2">
            <div><strong>Actual Role:</strong> {userRole}</div>
            <div><strong>Viewing As:</strong> {effectiveRole}</div>
          </div>
        </div>
      </Card>
    </div>
  )
}
