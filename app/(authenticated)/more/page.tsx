'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, Avatar, Modal, ModalFooter } from '@/components/ui'
import { useToast } from '@/hooks/useToast'
import { ToastContainer } from '@/components/Toast'

interface UserData {
  id: string
  name: string
  email?: string
  role: string
  avatar: string
  color: string
  points: number
  isAccountOwner: boolean
  isFamilyManager: boolean
}

interface FamilyMember {
  id: string
  name: string
  points: number
}

export default function MorePage() {
  const [userData, setUserData] = useState<UserData | null>(null)
  const [familyRank, setFamilyRank] = useState<number>(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [showSignOutModal, setShowSignOutModal] = useState(false)
  const [devRoleOverride, setDevRoleOverride] = useState<'kid' | 'teen' | 'adult' | null>(null)
  const router = useRouter()
  const toastHook = useToast()

  useEffect(() => {
    fetchUserData()

    // Check for dev role override in localStorage
    const storedRole = localStorage.getItem('devRoleOverride') as 'kid' | 'teen' | 'adult' | null
    if (storedRole) {
      setDevRoleOverride(storedRole)
    }

    // Listen for storage changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'devRoleOverride') {
        setDevRoleOverride(e.newValue as 'kid' | 'teen' | 'adult' | null)
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  const fetchUserData = async () => {
    try {
      setIsLoading(true)

      // Fetch both user data and family members in parallel
      const [userResponse, familyResponse] = await Promise.all([
        fetch('/api/user/current'),
        fetch('/api/users')
      ])

      if (!userResponse.ok) {
        throw new Error('Failed to fetch user data')
      }

      const userData = await userResponse.json()
      setUserData(userData.user)

      // Calculate rank from family members if available
      if (familyResponse.ok) {
        const familyData = await familyResponse.json()
        const sortedMembers = [...familyData.users].sort((a, b) => b.pointsEarned - a.pointsEarned)
        const rank = sortedMembers.findIndex(m => m.id === userData.user.id) + 1
        setFamilyRank(rank)
      }
    } catch (error) {
      console.error('Error fetching user data:', error)
      toastHook.error('Failed to load profile data')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true)
      const response = await fetch('/api/auth/signout', {
        method: 'POST'
      })

      if (response.ok) {
        router.push('/login')
      } else {
        toastHook.error('Failed to sign out')
        setShowSignOutModal(false)
      }
    } catch (error) {
      console.error('Error signing out:', error)
      toastHook.error('Error signing out')
      setShowSignOutModal(false)
    } finally {
      setIsSigningOut(false)
    }
  }

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'account_owner': return 'Account Owner'
      case 'adult': return 'Adult'
      case 'teen': return 'Teen'
      case 'kid': return 'Kid'
      default: return role
    }
  }

  const getMenuItems = () => {
    const effectiveRole = devRoleOverride || userData?.role || 'adult'
    const isOwnerOrManager = userData?.isAccountOwner || userData?.isFamilyManager
    const isKid = effectiveRole === 'kid'
    const isTeen = effectiveRole === 'teen'
    const isAdult = effectiveRole === 'adult' || effectiveRole === 'account_owner'

    // Manager/Owner specific items
    if (isOwnerOrManager && !devRoleOverride) {
      return [
        {
          label: 'Account Settings',
          href: '/settings',
          icon: '👤',
          description: 'Your account preferences'
        },
        {
          label: 'Family Management',
          href: '/family',
          icon: '👨‍👩‍👧‍👦',
          description: 'Manage family members'
        },
        {
          label: 'Analytics',
          href: '/analytics',
          icon: '📊',
          description: 'View family statistics'
        },
        {
          label: 'Badges',
          href: '/badges',
          icon: '🏆',
          description: 'View badges and milestones'
        },
        {
          label: 'Hub Display',
          href: '/hub',
          icon: '🖥️',
          description: 'Family command center'
        },
        {
          label: 'Help Center',
          href: '/help',
          icon: '❓',
          description: 'Get help and find answers'
        }
      ]
    }

    // Kid specific items
    if (isKid) {
      return [
        {
          label: 'My Profile',
          href: '/profile',
          icon: '👤',
          description: 'Change your avatar and settings'
        },
        {
          label: 'My Tasks',
          href: '/dashboard',
          icon: '✅',
          description: 'See all your tasks'
        },
        {
          label: 'Rewards Store',
          href: '/rewards',
          icon: '🎁',
          description: 'Browse and redeem rewards'
        },
        {
          label: 'My Badges',
          href: '/badges',
          icon: '🏆',
          description: 'View your awesome badges'
        },
        {
          label: 'Help',
          href: '/help',
          icon: '❓',
          description: 'Get help if you need it'
        }
      ]
    }

    // Teen specific items
    if (isTeen) {
      return [
        {
          label: 'Profile',
          href: '/profile',
          icon: '👤',
          description: 'Your profile settings'
        },
        {
          label: 'My Progress',
          href: '/dashboard',
          icon: '📈',
          description: 'Track your performance'
        },
        {
          label: 'Rewards',
          href: '/rewards',
          icon: '🎁',
          description: 'Browse rewards store'
        },
        {
          label: 'Badges',
          href: '/badges',
          icon: '🏆',
          description: 'View badges and achievements'
        },
        {
          label: 'Hub Display',
          href: '/hub/display',
          icon: '🖥️',
          description: 'Family command center'
        },
        {
          label: 'Help Center',
          href: '/help',
          icon: '❓',
          description: 'Get help and find answers'
        }
      ]
    }

    // Adult (non-manager) specific items
    return [
      {
        label: 'Profile',
        href: '/profile',
        icon: '👤',
        description: 'Your profile settings'
      },
      {
        label: 'Task History',
        href: '/dashboard',
        icon: '📋',
        description: 'View your completed tasks'
      },
      {
        label: 'Rewards',
        href: '/rewards',
        icon: '🎁',
        description: 'Browse rewards'
      },
      {
        label: 'Badges',
        href: '/badges',
        icon: '🏆',
        description: 'View badges and milestones'
      },
      {
        label: 'Hub Display',
        href: '/hub/display',
        icon: '🖥️',
        description: 'Family command center'
      },
      {
        label: 'Help Center',
        href: '/help',
        icon: '❓',
        description: 'Get help and find answers'
      }
    ]
  }

  const menuItems = getMenuItems()
  const effectiveRole = devRoleOverride || userData?.role || 'adult'
  const isKid = effectiveRole === 'kid'
  const isTeen = effectiveRole === 'teen'

  if (isLoading) {
    return (
      <div className={`min-h-screen p-4 pb-24 ${
        isKid
          ? 'bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100'
          : isTeen
          ? 'bg-gradient-to-br from-slate-50 via-purple-50 to-blue-50'
          : 'bg-gray-50'
      }`}>
        <div className="max-w-2xl mx-auto">
          {/* Profile Header Skeleton */}
          <div className="mb-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-20 h-20 rounded-full bg-gray-200 animate-pulse"></div>
              <div>
                <div className="h-7 w-32 bg-gray-200 rounded animate-pulse mb-2"></div>
                <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4 h-24 animate-pulse"></div>
          </div>

          {/* Menu Items Skeleton */}
          <div className="space-y-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 h-20 animate-pulse"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen p-4 pb-24 ${
      isKid
        ? 'bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100'
        : isTeen
        ? 'bg-gradient-to-br from-slate-50 via-purple-50 to-blue-50'
        : 'bg-gray-50'
    }`}>
      <ToastContainer toasts={toastHook.toasts} onRemove={toastHook.removeToast} />

      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-6">
            <div
              className={`${isKid ? 'w-24 h-24' : 'w-20 h-20'} rounded-full flex items-center justify-center ${
                isKid ? 'text-5xl' : 'text-4xl'
              } ${isKid ? 'ring-4 ring-purple-400' : ''}`}
              style={{ backgroundColor: userData?.color || '#3B82F6' }}
            >
              {userData?.avatar || '👤'}
            </div>
            <div>
              <h1 className={`${isKid ? 'text-3xl' : isTeen ? 'text-2xl' : 'text-2xl'} font-bold ${
                isKid ? 'text-purple-900' : 'text-gray-900'
              }`}>
                {userData?.name || 'User'}
              </h1>
              <p className={`${isKid ? 'text-lg font-semibold text-purple-600' : 'text-gray-600'}`}>
                {userData ? getRoleDisplayName(effectiveRole) : 'Loading...'}
              </p>
            </div>
          </div>

          <Card
            variant="elevated"
            padding="md"
            className={
              isKid
                ? 'bg-gradient-to-r from-yellow-100 to-pink-100 border-3 border-purple-300'
                : isTeen
                ? 'bg-gradient-to-r from-blue-50 to-indigo-100'
                : 'bg-gradient-to-r from-blue-50 to-purple-50'
            }
          >
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${isKid ? 'text-purple-700 font-bold' : 'text-gray-600'}`}>
                  {isKid ? 'My Points ⭐' : 'Your Points'}
                </p>
                <p className={`${isKid ? 'text-4xl' : 'text-3xl'} font-bold ${
                  isKid ? 'text-purple-600' : 'text-purple-600'
                }`}>
                  {userData?.points || 0}
                </p>
              </div>
              <div>
                <p className={`text-sm ${isKid ? 'text-blue-700 font-bold' : 'text-gray-600'}`}>
                  {isKid ? 'My Rank 🏆' : 'Family Rank'}
                </p>
                <p className={`${isKid ? 'text-4xl' : 'text-3xl'} font-bold ${
                  isKid ? 'text-blue-600' : 'text-blue-600'
                }`}>
                  #{familyRank || '-'}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Launch Hub Display (Hidden for kids) */}
        {!isKid && (
          <div className="mb-6">
          <button
            onClick={() => window.open('/hub/display', '_blank')}
            className="w-full"
          >
            <Card
              variant="elevated"
              padding="lg"
              className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 hover:border-blue-300 transition-all shadow-lg hover:shadow-xl cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-1">Launch Hub Display</h3>
                    <p className="text-sm text-gray-600">Open family command center</p>
                  </div>
                </div>
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </div>
            </Card>
          </button>
        </div>
        )}

        {/* Menu Items */}
        <div className="space-y-3">
          {menuItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <Card
                variant={isKid ? 'elevated' : 'default'}
                padding="md"
                className={`${
                  isKid
                    ? 'hover:border-purple-400 border-2 border-purple-200 shadow-md hover:shadow-lg'
                    : isTeen
                    ? 'hover:border-indigo-300 border-2 border-gray-200'
                    : 'hover:border-gray-300'
                } transition-all cursor-pointer`}
              >
                <div className="flex items-center gap-4">
                  <div className={`${isKid ? 'text-4xl' : 'text-3xl'}`}>{item.icon}</div>
                  <div className="flex-1">
                    <h3 className={`${isKid ? 'text-lg' : ''} font-semibold ${
                      isKid ? 'text-purple-900' : 'text-gray-900'
                    }`}>
                      {item.label}
                    </h3>
                    <p className={`text-sm ${isKid ? 'text-purple-600 font-medium' : 'text-gray-600'}`}>
                      {item.description}
                    </p>
                  </div>
                  <svg
                    className={`w-5 h-5 ${isKid ? 'text-purple-400' : 'text-gray-400'}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Card>
            </Link>
          ))}
        </div>

        {/* Logout */}
        <div className="mt-8">
          <button
            onClick={() => setShowSignOutModal(true)}
            disabled={isSigningOut}
            className="w-full"
          >
            <Card variant="default" padding="md" className="hover:border-red-300 transition-colors cursor-pointer">
              <div className="flex items-center gap-4 text-red-600">
                <div className="text-2xl">🚪</div>
                <div className="flex-1">
                  <h3 className="font-semibold">Sign Out</h3>
                </div>
              </div>
            </Card>
          </button>
        </div>
      </div>

      {/* Sign Out Confirmation Modal */}
      <Modal
        isOpen={showSignOutModal}
        onClose={() => setShowSignOutModal(false)}
        title="Sign Out"
        description="Are you sure you want to sign out of ChorePulse?"
        size="sm"
      >
        <div className="text-gray-600">
          You'll need to log back in to access your account and tasks.
        </div>
        <ModalFooter
          cancelText="Cancel"
          confirmText={isSigningOut ? 'Signing Out...' : 'Sign Out'}
          onCancel={() => setShowSignOutModal(false)}
          onConfirm={handleSignOut}
          isLoading={isSigningOut}
        />
      </Modal>
    </div>
  )
}
