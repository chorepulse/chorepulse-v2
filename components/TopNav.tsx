'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { useEffect, useState } from 'react'

export default function TopNav() {
  const pathname = usePathname()
  const [isManager, setIsManager] = useState<boolean>(false)
  const [userRole, setUserRole] = useState<'kid' | 'teen' | 'adult'>('adult')
  const [devRoleOverride, setDevRoleOverride] = useState<'kid' | 'teen' | 'adult' | null>(null)

  // Use dev override if set, otherwise use actual role
  const effectiveRole = devRoleOverride || userRole

  // Fetch user role on mount and check for dev override in localStorage
  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const response = await fetch('/api/users/me')
        if (response.ok) {
          const data = await response.json()
          setIsManager(data.user?.isManager || data.user?.role === 'owner' || false)
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

    // Listen for storage changes (when other components update the override)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'devRoleOverride') {
        setDevRoleOverride(e.newValue as 'kid' | 'teen' | 'adult' | null)
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  const navItems = [
    { label: 'Home', href: '/dashboard' },
    // Show Tasks for managers, Badges for non-managers
    isManager
      ? { label: 'Tasks', href: '/tasks' }
      : { label: 'Badges', href: '/badges' },
    { label: 'Rewards', href: '/rewards' },
    // Show Leaderboard for kids, Calendar for teens/adults
    effectiveRole === 'kid'
      ? { label: 'Leaderboard', href: '/leaderboard' }
      : { label: 'Calendar', href: '/calendar' },
    { label: 'More', href: '/more' }
  ]

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard' || pathname.startsWith('/dashboard/')
    }
    return pathname === href || pathname.startsWith(href + '/')
  }

  return (
    <nav
      className="hidden md:block sticky top-0 z-50 glass-strong border-b border-white/10 backdrop-blur-lg shadow-glass"
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link
            href="/dashboard"
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            aria-label="ChorePulse home"
          >
            <div className="w-8 h-8 bg-gradient-ai rounded-lg flex items-center justify-center shadow-elevated" aria-hidden="true">
              <span className="text-white font-bold text-lg">C</span>
            </div>
            <span className="text-xl font-bold bg-gradient-ai bg-clip-text text-transparent">ChorePulse</span>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center gap-1" role="menubar">
            {navItems.map((item) => {
              const active = isActive(item.href)

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  role="menuitem"
                  aria-label={`Navigate to ${item.label}`}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                    active
                      ? 'bg-gradient-ai text-white shadow-elevated'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-white/10 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white hover:-translate-y-0.5'
                  )}
                >
                  {item.label}
                </Link>
              )
            })}
          </div>

          {/* User Menu */}
          <div className="flex items-center gap-2" role="toolbar" aria-label="User menu">
            {/* Help button */}
            <Link
              href="/help"
              className="p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-white/10 dark:hover:bg-white/5 rounded-lg transition-all hover:-translate-y-0.5"
              aria-label="Help Center"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </Link>

            {/* Notifications */}
            <button
              className="relative p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-white/10 dark:hover:bg-white/5 rounded-lg transition-all hover:-translate-y-0.5"
              aria-label="Notifications"
              aria-describedby="notifications-count"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span id="notifications-count" className="sr-only">No new notifications</span>
            </button>

            {/* User profile */}
            <Link
              href="/more"
              className="flex items-center gap-2 p-1.5 hover:bg-white/10 dark:hover:bg-white/5 rounded-lg transition-all hover:-translate-y-0.5"
              aria-label="User profile and settings"
            >
              <div className="w-8 h-8 bg-gradient-ai rounded-full flex items-center justify-center shadow-elevated ring-2 ring-white/20" aria-hidden="true">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                </svg>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}
