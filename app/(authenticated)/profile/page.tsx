'use client'

import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent, Button, Input } from '@/components/ui'
import { useToast } from '@/hooks/useToast'
import { ToastContainer } from '@/components/Toast'
import AdSlot from '@/components/AdSlot'
import { useSubscription } from '@/hooks/useSubscription'
import { useAgeBracket } from '@/hooks/useAgeBracket'
import { useLocation } from '@/hooks/useLocation'

export default function ProfilePage() {
  const toast = useToast()
  const { subscriptionTier } = useSubscription()
  const { ageBracket } = useAgeBracket()
  const { getLocationString } = useLocation()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [showAvatarPicker, setShowAvatarPicker] = useState(false)
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [userRole, setUserRole] = useState<'kid' | 'teen' | 'adult'>('adult')

  const [profileData, setProfileData] = useState({
    id: '',
    name: '',
    email: '',
    username: '',
    avatar: '',
    color: '#FFA07A',
    points: 0,
    role: '',
    birthday: '',
    age: null as number | null
  })

  const availableAvatars = [
    '👦', '👧', '👨', '👩', '🧒', '👶',
    '🐶', '🐱', '🐭', '🐹', '🐰', '🦊',
    '🐻', '🐼', '🐨', '🐯', '🦁', '🐮',
    '🐷', '🐸', '🐵', '🐔', '🐧', '🐦',
    '🦄', '🦖', '🦕', '🐉', '🦅', '🦉',
    '⚽', '🏀', '🎮', '🎨', '🎭', '🎪',
    '🎸', '🎹', '🎤', '🎧', '🎬', '📚',
    '🚀', '✈️', '🚗', '🏎️', '🚲', '⛵',
    '🌟', '⭐', '🌈', '🔥', '💎', '👑',
    '🎓', '💼', '🔬', '🔭', '🎯', '🏆'
  ]

  const availableColors = [
    '#FF6B6B', '#FFA07A', '#6C63FF', '#4ECDC4',
    '#2ECC71', '#F39C12', '#3498DB', '#E74C3C',
    '#9B59B6', '#1ABC9C', '#E67E22', '#95A5A6'
  ]

  useEffect(() => {
    fetchUserData()
  }, [])

  const fetchUserData = async () => {
    try {
      setIsLoading(true)

      const [userResponse, authResponse] = await Promise.all([
        fetch('/api/users/me'),
        fetch('/api/auth/user')
      ])

      if (!userResponse.ok) {
        const errorData = await userResponse.json()
        throw new Error(errorData.error || 'Failed to fetch user data')
      }

      const userData = await userResponse.json()
      const authData = authResponse.ok ? await authResponse.json() : null

      setProfileData({
        id: userData.user.id,
        name: userData.user.name || '',
        email: authData?.email || '',
        username: userData.user.username || '',
        avatar: userData.user.avatar || '',
        color: userData.user.color || '#FFA07A',
        points: userData.user.points || 0,
        role: userData.user.role || '',
        birthday: userData.user.birthday || '',
        age: userData.user.age || null
      })

      // Set userRole for AdSlot component
      const role = userData.user.role || 'adult'
      if (role === 'kid' || role === 'teen' || role === 'adult') {
        setUserRole(role)
      } else if (role === 'account_owner') {
        setUserRole('adult')
      }
    } catch (err: any) {
      console.error('Error fetching user data:', err)
      toast.showToast(err.message || 'Failed to load profile', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setIsSaving(true)

      const response = await fetch(`/api/users/${profileData.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: profileData.name,
          username: profileData.username,
          color: profileData.color,
          avatar: profileData.avatar,
          birthday: profileData.birthday
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to update profile')
      }

      toast.showToast('Profile updated successfully!', 'success')
      await fetchUserData()
    } catch (err: any) {
      console.error('Error saving profile:', err)
      toast.showToast(err.message || 'Failed to save profile', 'error')
    } finally {
      setIsSaving(false)
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 pb-24">
        <div className="max-w-2xl mx-auto">
          <div className="mb-6">
            <div className="h-8 w-32 bg-gray-200 rounded animate-pulse mb-2"></div>
            <div className="h-4 w-48 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="space-y-4">
              <div className="h-20 bg-gray-100 rounded animate-pulse"></div>
              <div className="h-12 bg-gray-100 rounded animate-pulse"></div>
              <div className="h-12 bg-gray-100 rounded animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 pb-24">
      <ToastContainer toasts={toast.toasts} onRemove={toast.removeToast} />

      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-1">My Profile</h1>
          <p className="text-gray-600">Manage your personal information and appearance</p>
        </div>

        {/* Banner Ad - Top */}
        <div className="mb-6">
          <AdSlot
            adUnit="banner"
            userRole={userRole}
            subscriptionTier={subscriptionTier}
            ageBracket={ageBracket}
            location={getLocationString()}
            testMode={true}
          />
        </div>

        {/* Profile Card */}
        <Card variant="default" padding="lg">
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Stats Bar */}
              <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-100">
                <div className="flex-1">
                  <p className="text-sm text-gray-600">Total Points</p>
                  <p className="text-2xl font-bold text-purple-600">{profileData.points}</p>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-600">Role</p>
                  <p className="text-lg font-semibold text-gray-900">{getRoleDisplayName(profileData.role)}</p>
                </div>
              </div>

              {/* Name */}
              <Input
                label="Full Name"
                value={profileData.name}
                onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
              />

              {/* Email */}
              <Input
                label="Email Address"
                type="email"
                value={profileData.email}
                disabled
                helperText="Email cannot be changed here"
              />

              {/* Birthday */}
              <div>
                <Input
                  label="Birthday (Optional)"
                  type="date"
                  value={profileData.birthday}
                  onChange={(e) => setProfileData({ ...profileData, birthday: e.target.value })}
                  helperText="Helps us provide age-appropriate content and experiences"
                />
                {profileData.age !== null && (
                  <p className="text-sm text-gray-600 mt-1">
                    Age: {profileData.age} years old
                  </p>
                )}
              </div>

              {/* Avatar & Color */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Profile Avatar & Color
                </label>
                <div className="flex items-center gap-4">
                  <div
                    className="w-20 h-20 rounded-full flex items-center justify-center text-4xl shadow-lg"
                    style={{ backgroundColor: profileData.color }}
                  >
                    {profileData.avatar || profileData.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setShowAvatarPicker(!showAvatarPicker)
                        setShowColorPicker(false)
                      }}
                    >
                      {showAvatarPicker ? 'Hide Avatars' : 'Change Avatar'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setShowColorPicker(!showColorPicker)
                        setShowAvatarPicker(false)
                      }}
                    >
                      {showColorPicker ? 'Hide Colors' : 'Change Color'}
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Your avatar and color help identify you throughout the app
                </p>

                {showAvatarPicker && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="grid grid-cols-12 gap-2">
                      {availableAvatars.map((avatar) => (
                        <button
                          key={avatar}
                          type="button"
                          className={`w-10 h-10 flex items-center justify-center text-2xl rounded-lg transition-all ${
                            profileData.avatar === avatar
                              ? 'ring-2 ring-offset-1 ring-blue-500 bg-blue-50 scale-110'
                              : 'hover:bg-gray-100 hover:scale-105'
                          }`}
                          onClick={() => {
                            setProfileData({ ...profileData, avatar })
                            setShowAvatarPicker(false)
                          }}
                          title={avatar}
                        >
                          {avatar}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {showColorPicker && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="grid grid-cols-6 gap-3">
                      {availableColors.map((color) => (
                        <button
                          key={color}
                          type="button"
                          className={`w-12 h-12 rounded-full transition-all ${
                            profileData.color === color
                              ? 'ring-4 ring-offset-2 ring-blue-500 scale-110'
                              : 'hover:scale-105'
                          }`}
                          style={{ backgroundColor: color }}
                          onClick={() => {
                            setProfileData({ ...profileData, color })
                            setShowColorPicker(false)
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Save Button */}
              <div className="flex items-center gap-3 pt-4">
                <Button variant="primary" onClick={handleSave} disabled={isSaving}>
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
                <Button variant="outline" onClick={fetchUserData} disabled={isSaving}>
                  Cancel
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Banner Ad - Bottom */}
        <div className="mt-6">
          <AdSlot
            adUnit="banner"
            userRole={userRole}
            subscriptionTier={subscriptionTier}
            ageBracket={ageBracket}
            location={getLocationString()}
            testMode={true}
          />
        </div>
      </div>
    </div>
  )
}
