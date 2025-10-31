'use client'

import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent, Button, Input, Select, Badge, Avatar, Tabs, TabsList, TabsTrigger, TabsContent, Alert } from '@/components/ui'
import { useToast } from '@/hooks/useToast'
import { ToastContainer } from '@/components/Toast'
import EditHouseholdModal, { HouseholdData } from '@/components/modals/EditHouseholdModal'

export default function SettingsPage() {
  const toast = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showAvatarPicker, setShowAvatarPicker] = useState(false)
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [activeTab, setActiveTab] = useState('profile')
  const [isHouseholdModalOpen, setIsHouseholdModalOpen] = useState(false)

  // Profile settings
  const [profileData, setProfileData] = useState({
    id: '',
    name: '',
    email: '',
    username: '',
    avatar: '',
    color: '#FFA07A',
    role: '',
    points: 0,
    birthday: '',
    age: null as number | null
  })

  // Organization settings
  const [orgSettings, setOrgSettings] = useState({
    organizationId: '',
    organizationName: '',
    familyCode: '',
    timezone: 'America/New_York',
    subscriptionTier: '',
    subscriptionStatus: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'United States',
    latitude: null as number | null,
    longitude: null as number | null,
    // Property data
    bedrooms: null as number | null,
    bathrooms: null as number | null,
    squareFeet: null as number | null,
    lotSizeSqft: null as number | null,
    propertyType: '',
    yearBuilt: null as number | null,
    propertyValue: null as number | null,
    propertyDataFetchedAt: null as string | null
  })

  const [isFetchingProperty, setIsFetchingProperty] = useState(false)

  // Fetch user and organization data
  useEffect(() => {
    fetchUserData()
    fetchCalendarIntegration()

    // Check for tab parameter in URL
    const params = new URLSearchParams(window.location.search)
    const tab = params.get('tab')
    if (tab && ['profile', 'organization', 'integrations', 'notifications', 'tasks', 'privacy'].includes(tab)) {
      setActiveTab(tab)
    }

    // Check for success/error messages
    const success = params.get('success')
    const error = params.get('error')
    if (success === 'calendar_connected') {
      toast.showToast('Google Calendar connected successfully!', 'success')
      // Clean URL
      window.history.replaceState({}, '', '/settings?tab=integrations')
      fetchCalendarIntegration()
    } else if (error) {
      toast.showToast(`Failed to connect calendar: ${error}`, 'error')
      window.history.replaceState({}, '', '/settings?tab=integrations')
    }
  }, [])

  const fetchUserData = async (isRefetch = false) => {
    try {
      if (isRefetch) {
        setIsRefreshing(true)
      } else {
        setIsLoading(true)
      }
      setError(null)

      // Fetch all data in parallel for better performance
      const [userResponse, authResponse, orgResponse] = await Promise.all([
        fetch('/api/users/me'),
        fetch('/api/auth/user'),
        fetch('/api/organizations/current')
      ])

      if (!userResponse.ok) {
        const errorData = await userResponse.json()
        console.error('User fetch error:', errorData)
        throw new Error(errorData.error || 'Failed to fetch user data')
      }

      const userData = await userResponse.json()
      const authData = authResponse.ok ? await authResponse.json() : null
      const orgData = orgResponse.ok ? await orgResponse.json() : null

      // Update profile data
      setProfileData({
        id: userData.user.id,
        name: userData.user.name || '',
        email: authData?.email || '',
        username: userData.user.username || '',
        avatar: userData.user.avatar || '',
        color: userData.user.color || '#FFA07A',
        role: userData.user.role || '',
        points: userData.user.points || 0,
        birthday: userData.user.birthday || '',
        age: userData.user.age || null
      })

      // Update organization data
      if (orgData?.organization) {
        setOrgSettings({
          organizationId: orgData.organization.id || '',
          organizationName: orgData.organization.name || '',
          familyCode: orgData.organization.currentFamilyCode || '',
          timezone: orgData.organization.timezone || 'America/New_York',
          subscriptionTier: orgData.organization.subscriptionTier || 'pulse_starter',
          subscriptionStatus: orgData.organization.subscriptionStatus || 'active',
          addressLine1: orgData.organization.addressLine1 || '',
          addressLine2: orgData.organization.addressLine2 || '',
          city: orgData.organization.city || '',
          state: orgData.organization.state || '',
          zipCode: orgData.organization.zipCode || '',
          country: orgData.organization.country || 'United States',
          latitude: orgData.organization.latitude || null,
          longitude: orgData.organization.longitude || null,
          // Basic property data
          bedrooms: orgData.organization.bedrooms || null,
          bathrooms: orgData.organization.bathrooms || null,
          squareFeet: orgData.organization.squareFeet || null,
          lotSizeSqft: orgData.organization.lotSizeSqft || null,
          propertyType: orgData.organization.propertyType || '',
          yearBuilt: orgData.organization.yearBuilt || null,
          propertyValue: orgData.organization.propertyValue || null,
          propertyDataFetchedAt: orgData.organization.propertyDataFetchedAt || null,
          // Property features
          architectureType: orgData.organization.architectureType || null,
          floorCount: orgData.organization.floorCount || null,
          roomCount: orgData.organization.roomCount || null,
          unitCount: orgData.organization.unitCount || null,
          hasCooling: orgData.organization.hasCooling || null,
          coolingType: orgData.organization.coolingType || null,
          hasHeating: orgData.organization.hasHeating || null,
          heatingType: orgData.organization.heatingType || null,
          hasFireplace: orgData.organization.hasFireplace || null,
          fireplaceType: orgData.organization.fireplaceType || null,
          hasGarage: orgData.organization.hasGarage || null,
          garageType: orgData.organization.garageType || null,
          garageSpaces: orgData.organization.garageSpaces || null,
          hasPool: orgData.organization.hasPool || null,
          poolType: orgData.organization.poolType || null,
          exteriorType: orgData.organization.exteriorType || null,
          roofType: orgData.organization.roofType || null,
          foundationType: orgData.organization.foundationType || null,
          viewType: orgData.organization.viewType || null,
          // Household and pet information
          homeFeatures: orgData.organization.homeFeatures || [],
          specialConsiderations: orgData.organization.specialConsiderations || [],
          hasPets: orgData.organization.hasPets || false,
          petTypes: orgData.organization.petTypes || [],
          ageGroups: orgData.organization.ageGroups || [],
          numberOfCars: orgData.organization.numberOfCars || 0,
          numberOfBikes: orgData.organization.numberOfBikes || 0
        })

        // Auto-sync features if property data exists but home_features might be out of sync
        // This happens for existing users who fetched property data before the sync feature was added
        const hasPropertyData = orgData.organization.hasPool !== null || orgData.organization.hasFireplace !== null
        const homeFeatures = orgData.organization.homeFeatures || []
        const needsSync = hasPropertyData && (
          (orgData.organization.hasPool === true && !homeFeatures.includes('pool')) ||
          (orgData.organization.hasFireplace === true && !homeFeatures.includes('fireplace')) ||
          (orgData.organization.hasPool === false && homeFeatures.includes('pool')) ||
          (orgData.organization.hasFireplace === false && homeFeatures.includes('fireplace'))
        )

        if (needsSync && !isRefetch) {
          // Silently sync features in the background (only on initial load, not on refetch)
          fetch('/api/organizations/sync-features', { method: 'POST' })
            .then(res => res.json())
            .then(() => {
              // Refresh organization data to show synced features
              fetch('/api/organizations/current')
                .then(r => r.json())
                .then(data => {
                  if (data?.organization) {
                    setOrgSettings(prev => ({
                      ...prev,
                      homeFeatures: data.organization.homeFeatures || []
                    }))
                  }
                })
            })
            .catch(err => console.error('Failed to auto-sync features:', err))
        }
      }
    } catch (err: any) {
      console.error('Error fetching settings data:', err)
      setError(err.message || 'Failed to load settings')
    } finally {
      if (isRefetch) {
        setIsRefreshing(false)
      } else {
        setIsLoading(false)
      }
    }
  }

  // Notification settings
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    taskReminders: true,
    rewardRequests: true,
    achievementAlerts: true,
    weeklyDigest: true,
    pushNotifications: true,
    taskAssignments: true,
    familyActivity: false
  })

  // Task settings
  const [taskSettings, setTaskSettings] = useState({
    defaultPoints: '10',
    requirePhotoProof: false,
    autoApproveCompletions: false,
    allowKidsToCreateTasks: false,
    allowTeensToCreateTasks: true
  })

  // Reward settings
  const [rewardSettings, setRewardSettings] = useState({
    requireApproval: true,
    monthlyLimit: '200',
    allowNegativeBalance: false
  })

  // Privacy settings
  const [privacySettings, setPrivacySettings] = useState({
    shareWithChorePulse: false,
    allowAnalytics: true,
    twoFactorAuth: false
  })

  // Integration settings
  const [integrationSettings, setIntegrationSettings] = useState({
    googleCalendarConnected: false,
    googleCalendarEmail: '',
    syncDirection: 'both', // 'to_google', 'from_google', 'both'
    syncTasksToCalendar: true,
    syncCalendarToTasks: false,
    calendarName: 'ChorePulse Tasks',
    lastSyncAt: null as string | null,
    lastSyncStatus: null as string | null
  })
  const [isSyncing, setIsSyncing] = useState(false)

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'account_owner': return 'Account Owner'
      case 'adult': return 'Adult'
      case 'teen': return 'Teen'
      case 'kid': return 'Kid'
      default: return role
    }
  }

  const availableColors = [
    '#FF6B6B', '#FFA07A', '#6C63FF', '#4ECDC4',
    '#2ECC71', '#F39C12', '#3498DB', '#E74C3C',
    '#9B59B6', '#1ABC9C', '#E67E22', '#95A5A6'
  ]

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

  const timezones = [
    { label: 'Eastern Time (ET)', value: 'America/New_York' },
    { label: 'Central Time (CT)', value: 'America/Chicago' },
    { label: 'Mountain Time (MT)', value: 'America/Denver' },
    { label: 'Pacific Time (PT)', value: 'America/Los_Angeles' },
    { label: 'Alaska Time (AKT)', value: 'America/Anchorage' },
    { label: 'Hawaii Time (HT)', value: 'Pacific/Honolulu' }
  ]

  const handleSaveProfile = async () => {
    try {
      setIsSaving(true)
      setError(null)

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
      await fetchUserData(true) // Refresh data without showing loading screen
    } catch (err: any) {
      console.error('Error saving profile:', err)
      toast.showToast(err.message || 'Failed to save profile', 'error')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveOrgSettings = async () => {
    try {
      setIsSaving(true)
      setError(null)

      const response = await fetch(`/api/organizations/${orgSettings.organizationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: orgSettings.organizationName,
          timezone: orgSettings.timezone,
          addressLine1: orgSettings.addressLine1,
          addressLine2: orgSettings.addressLine2,
          city: orgSettings.city,
          state: orgSettings.state,
          zipCode: orgSettings.zipCode,
          country: orgSettings.country,
          latitude: orgSettings.latitude,
          longitude: orgSettings.longitude
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to update organization')
      }

      toast.showToast('Organization settings updated successfully!', 'success')
      await fetchUserData(true) // Refresh data without showing loading screen
    } catch (err: any) {
      console.error('Error saving organization settings:', err)
      toast.showToast(err.message || 'Failed to save organization settings', 'error')
    } finally {
      setIsSaving(false)
    }
  }

  const handleFetchPropertyData = async () => {
    try {
      setIsFetchingProperty(true)
      setError(null)

      // Validate address is complete
      if (!orgSettings.addressLine1 || !orgSettings.city || !orgSettings.state) {
        toast.showToast('Please enter a complete address first', 'error')
        return
      }

      const response = await fetch('/api/property/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          addressLine1: orgSettings.addressLine1,
          city: orgSettings.city,
          state: orgSettings.state,
          zipCode: orgSettings.zipCode
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch property data')
      }

      toast.showToast('Property data fetched successfully!', 'success')

      // Refresh organization data to get updated property info
      await fetchUserData(true)
    } catch (err: any) {
      console.error('Error fetching property data:', err)
      toast.showToast(err.message || 'Failed to fetch property data', 'error')
    } finally {
      setIsFetchingProperty(false)
    }
  }

  const handleResetFamilyCode = () => {
    if (confirm('Are you sure you want to reset your Family Code? All current PIN logins will need to use the new code.')) {
      const newCode = 'XYZ-789-ABC' // TODO: Generate from backend
      setOrgSettings({ ...orgSettings, familyCode: newCode })
    }
  }

  const handleExportData = () => {
    console.log('Exporting data...')
    // TODO: Implement data export
  }

  const handleDeleteAccount = () => {
    if (confirm('⚠️ WARNING: This will permanently delete your account and all family data. This action cannot be undone. Are you absolutely sure?')) {
      if (confirm('Type DELETE to confirm')) {
        console.log('Deleting account...')
        // TODO: Implement account deletion
      }
    }
  }

  const handleSaveHousehold = async (data: HouseholdData) => {
    try {
      const response = await fetch('/api/organizations/household', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          petTypes: data.petTypes,
          homeFeatures: data.homeFeatures,
          specialConsiderations: data.specialConsiderations,
          ageGroups: data.ageGroups,
          numberOfCars: data.numberOfCars,
          numberOfBikes: data.numberOfBikes,
          hasPets: data.petTypes.length > 0
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update household information')
      }

      toast.showToast('Household information updated successfully!', 'success')

      // Refresh organization data to get updated household info
      await fetchUserData(true)
    } catch (err: any) {
      console.error('Error updating household information:', err)
      toast.showToast(err.message || 'Failed to update household information', 'error')
      throw err
    }
  }

  // Fetch calendar integration status
  const fetchCalendarIntegration = async () => {
    try {
      const response = await fetch('/api/integrations/google-calendar')
      if (response.ok) {
        const data = await response.json()
        // Use data.connected which checks both integration existence AND token validity
        if (data.connected && data.integration) {
          setIntegrationSettings({
            googleCalendarConnected: true,
            googleCalendarEmail: data.integration.email || '',
            syncDirection: 'both',
            syncTasksToCalendar: data.integration.syncTasksToCalendar ?? true,
            syncCalendarToTasks: data.integration.syncCalendarToTasks ?? false,
            calendarName: data.integration.calendarName || 'ChorePulse Tasks',
            lastSyncAt: data.integration.lastSyncAt || null,
            lastSyncStatus: data.integration.lastSyncStatus || null
          })
        } else {
          // No valid integration - ensure state reflects disconnected
          setIntegrationSettings({
            googleCalendarConnected: false,
            googleCalendarEmail: '',
            syncDirection: 'both',
            syncTasksToCalendar: true,
            syncCalendarToTasks: false,
            calendarName: 'ChorePulse Tasks',
            lastSyncAt: null,
            lastSyncStatus: null
          })
        }
      }
    } catch (err) {
      console.error('Error fetching calendar integration:', err)
    }
  }

  // Connect Google Calendar
  const handleConnectCalendar = () => {
    window.location.href = '/api/integrations/google-calendar/connect'
  }

  // Sync Google Calendar
  const handleSyncCalendar = async () => {
    try {
      setIsSyncing(true)
      const response = await fetch('/api/integrations/google-calendar/sync', {
        method: 'POST'
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to sync calendar')
      }

      toast.showToast(data.message || `Synced ${data.syncedCount} tasks successfully`, 'success')

      // Refresh integration status to get updated sync time
      await fetchCalendarIntegration()
    } catch (err: any) {
      console.error('Error syncing calendar:', err)
      toast.showToast(err.message || 'Failed to sync calendar', 'error')
    } finally {
      setIsSyncing(false)
    }
  }

  // Disconnect Google Calendar
  const handleDisconnectCalendar = async () => {
    if (!confirm('Are you sure you want to disconnect Google Calendar? Your tasks will no longer sync.')) {
      return
    }

    try {
      setIsSaving(true)
      const response = await fetch('/api/integrations/google-calendar', {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to disconnect calendar')
      }

      setIntegrationSettings({
        googleCalendarConnected: false,
        googleCalendarEmail: '',
        syncDirection: 'both',
        syncTasksToCalendar: true,
        syncCalendarToTasks: false,
        calendarName: 'ChorePulse Tasks',
        lastSyncAt: null,
        lastSyncStatus: null
      })

      toast.showToast('Google Calendar disconnected successfully', 'success')
      // Clear the dismissal flag so banner shows again if needed
      localStorage.removeItem('dismissed-calendar-integration')
    } catch (err: any) {
      console.error('Error disconnecting calendar:', err)
      toast.showToast(err.message || 'Failed to disconnect calendar', 'error')
    } finally {
      setIsSaving(false)
    }
  }

  // Save calendar integration settings
  const handleSaveCalendarSettings = async () => {
    try {
      setIsSaving(true)
      const response = await fetch('/api/integrations/google-calendar', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          syncTasksToCalendar: integrationSettings.syncTasksToCalendar,
          syncCalendarToTasks: integrationSettings.syncCalendarToTasks,
          calendarName: integrationSettings.calendarName
        })
      })

      if (!response.ok) {
        throw new Error('Failed to save calendar settings')
      }

      toast.showToast('Calendar settings saved successfully!', 'success')
    } catch (err: any) {
      console.error('Error saving calendar settings:', err)
      toast.showToast(err.message || 'Failed to save calendar settings', 'error')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 pb-24">
        <div className="max-w-5xl mx-auto">
          {/* Header Skeleton */}
          <div className="mb-6">
            <div className="h-8 w-32 bg-gray-200 rounded animate-pulse mb-2"></div>
            <div className="h-4 w-64 bg-gray-200 rounded animate-pulse"></div>
          </div>

          {/* Tabs Skeleton */}
          <div className="flex gap-2 mb-6 bg-gray-100 p-1 rounded-lg">
            <div className="h-10 w-24 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-10 w-40 bg-gray-200 rounded animate-pulse"></div>
          </div>

          {/* Card Skeleton */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="h-6 w-40 bg-gray-200 rounded animate-pulse mb-4"></div>
            <div className="space-y-4">
              <div className="h-20 bg-gray-100 rounded animate-pulse"></div>
              <div className="h-12 bg-gray-100 rounded animate-pulse"></div>
              <div className="h-12 bg-gray-100 rounded animate-pulse"></div>
              <div className="h-12 bg-gray-100 rounded animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error && !profileData.id) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 pb-24 flex items-center justify-center">
        <ToastContainer toasts={toast.toasts} onRemove={toast.removeToast} />
        <div className="text-center max-w-md">
          <div className="text-4xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Unable to Load Settings</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="space-y-2">
            <Button variant="primary" onClick={() => fetchUserData()}>
              Try Again
            </Button>
            <Button variant="outline" onClick={() => window.location.href = '/dashboard'}>
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 pb-24">
      <ToastContainer toasts={toast.toasts} onRemove={toast.removeToast} />

      {/* Header */}
      <div className="max-w-5xl mx-auto mb-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Settings</h1>
          <p className="text-gray-600">Manage your account, organization, and preferences</p>
        </div>

        {error && (
          <Alert variant="danger" onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
      </div>

      {/* Settings Tabs */}
      <div className="max-w-5xl mx-auto">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="organization">Organization</TabsTrigger>
            <TabsTrigger value="integrations">Integrations</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="tasks">Tasks & Rewards</TabsTrigger>
            <TabsTrigger value="privacy">Privacy & Security</TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <Card variant="default" padding="lg">
              <CardHeader>
                <CardTitle>Profile Settings</CardTitle>
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
                    onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                    helperText="Used for login and notifications"
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
                    {profileData.age !== null && profileData.age !== undefined && (
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
                        className="w-16 h-16 rounded-full flex items-center justify-center text-3xl"
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
                      Your avatar and color are used throughout the app to identify your tasks and activities
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

                  {/* Change Password */}
                  <div className="pt-4 border-t border-gray-200">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Change Password</h3>
                    <div className="space-y-3">
                      <Input
                        label="Current Password"
                        type="password"
                        placeholder="Enter current password"
                      />
                      <Input
                        label="New Password"
                        type="password"
                        placeholder="Enter new password"
                      />
                      <Input
                        label="Confirm New Password"
                        type="password"
                        placeholder="Confirm new password"
                      />
                    </div>
                  </div>

                  {/* Save Button */}
                  <div className="flex items-center gap-3 pt-4">
                    <Button variant="primary" onClick={handleSaveProfile} disabled={isSaving}>
                      {isSaving ? 'Saving...' : 'Save Changes'}
                    </Button>
                    <Button variant="outline" onClick={() => fetchUserData(true)} disabled={isSaving}>
                      Cancel
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Organization Tab */}
          <TabsContent value="organization">
            <div className="space-y-6">
              <Card variant="default" padding="lg">
                <CardHeader>
                  <CardTitle>Organization Settings</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <Input
                      label="Organization Name"
                      value={orgSettings.organizationName}
                      onChange={(e) => setOrgSettings({ ...orgSettings, organizationName: e.target.value })}
                      helperText="Your family or household name"
                    />

                    <Select
                      label="Timezone"
                      options={timezones}
                      value={orgSettings.timezone}
                      onChange={(e) => setOrgSettings({ ...orgSettings, timezone: e.target.value })}
                    />

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Family Code
                      </label>
                      <div className="flex items-center gap-3">
                        <Input
                          value={orgSettings.familyCode}
                          disabled
                          className="flex-1"
                        />
                        <Button variant="outline" onClick={handleResetFamilyCode}>
                          Reset Code
                        </Button>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        Members use this code along with their PIN to log in
                      </p>
                    </div>

                    {/* Address Section */}
                    <div className="pt-4 border-t border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Home Address (Optional)</h3>
                      <p className="text-sm text-gray-600 mb-4">
                        Adding your address enables automatic weather updates and helps us provide personalized chore recommendations based on your location.
                      </p>

                      <div className="space-y-4">
                        <Input
                          label="Street Address"
                          value={orgSettings.addressLine1}
                          onChange={(e) => setOrgSettings({ ...orgSettings, addressLine1: e.target.value })}
                          placeholder="123 Main Street"
                        />

                        <Input
                          label="Apartment, Suite, etc. (Optional)"
                          value={orgSettings.addressLine2}
                          onChange={(e) => setOrgSettings({ ...orgSettings, addressLine2: e.target.value })}
                          placeholder="Apt 4B"
                        />

                        <div className="grid grid-cols-2 gap-4">
                          <Input
                            label="City"
                            value={orgSettings.city}
                            onChange={(e) => setOrgSettings({ ...orgSettings, city: e.target.value })}
                            placeholder="Austin"
                          />

                          <Input
                            label="State"
                            value={orgSettings.state}
                            onChange={(e) => setOrgSettings({ ...orgSettings, state: e.target.value })}
                            placeholder="TX"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <Input
                            label="ZIP Code"
                            value={orgSettings.zipCode}
                            onChange={(e) => setOrgSettings({ ...orgSettings, zipCode: e.target.value })}
                            placeholder="78701"
                            maxLength={10}
                          />

                          <Input
                            label="Country"
                            value={orgSettings.country}
                            onChange={(e) => setOrgSettings({ ...orgSettings, country: e.target.value })}
                          />
                        </div>

                        {(orgSettings.city && orgSettings.state) && (
                          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <p className="text-sm text-blue-900">
                              <strong>✓ Location set:</strong> {orgSettings.city}, {orgSettings.state}
                            </p>
                            <p className="text-xs text-blue-700 mt-1">
                              Weather will update automatically for your location
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Property Details Section */}
                    {(orgSettings.addressLine1 && orgSettings.city && orgSettings.state) && (
                      <div className="pt-4 border-t border-gray-200">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-semibold text-gray-900">Property Details</h3>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleFetchPropertyData}
                            disabled={isFetchingProperty}
                          >
                            {isFetchingProperty ? 'Fetching...' : orgSettings.propertyDataFetchedAt ? 'Refresh Data' : 'Fetch Property Data'}
                          </Button>
                        </div>

                        {orgSettings.propertyDataFetchedAt ? (
                          <div className="space-y-3">
                            <p className="text-sm text-gray-600 mb-3">
                              Property information helps us provide personalized chore suggestions and improve ad targeting.
                            </p>

                            <div className="grid grid-cols-2 gap-4">
                              <div className="p-3 bg-gray-50 rounded-lg">
                                <p className="text-xs text-gray-600 mb-1">Bedrooms</p>
                                <p className="text-lg font-semibold text-gray-900">
                                  {orgSettings.bedrooms || 'N/A'}
                                </p>
                              </div>

                              <div className="p-3 bg-gray-50 rounded-lg">
                                <p className="text-xs text-gray-600 mb-1">Bathrooms</p>
                                <p className="text-lg font-semibold text-gray-900">
                                  {orgSettings.bathrooms || 'N/A'}
                                </p>
                              </div>

                              <div className="p-3 bg-gray-50 rounded-lg">
                                <p className="text-xs text-gray-600 mb-1">Square Feet</p>
                                <p className="text-lg font-semibold text-gray-900">
                                  {orgSettings.squareFeet ? orgSettings.squareFeet.toLocaleString() : 'N/A'}
                                </p>
                              </div>

                              <div className="p-3 bg-gray-50 rounded-lg">
                                <p className="text-xs text-gray-600 mb-1">Property Type</p>
                                <p className="text-lg font-semibold text-gray-900">
                                  {orgSettings.propertyType || 'N/A'}
                                </p>
                              </div>

                              {orgSettings.yearBuilt && (
                                <div className="p-3 bg-gray-50 rounded-lg">
                                  <p className="text-xs text-gray-600 mb-1">Year Built</p>
                                  <p className="text-lg font-semibold text-gray-900">
                                    {orgSettings.yearBuilt}
                                  </p>
                                </div>
                              )}

                              {orgSettings.lotSizeSqft && (
                                <div className="p-3 bg-gray-50 rounded-lg">
                                  <p className="text-xs text-gray-600 mb-1">Lot Size</p>
                                  <p className="text-lg font-semibold text-gray-900">
                                    {orgSettings.lotSizeSqft.toLocaleString()} sqft
                                  </p>
                                </div>
                              )}

                              {/* Property Features */}
                              {orgSettings.hasPool && (
                                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                                  <p className="text-xs text-blue-700 mb-1">🏊 Pool</p>
                                  <p className="text-sm font-semibold text-blue-900">
                                    {orgSettings.poolType || 'Yes'}
                                  </p>
                                </div>
                              )}

                              {orgSettings.hasFireplace && (
                                <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                                  <p className="text-xs text-orange-700 mb-1">🔥 Fireplace</p>
                                  <p className="text-sm font-semibold text-orange-900">
                                    {orgSettings.fireplaceType || 'Yes'}
                                  </p>
                                </div>
                              )}

                              {orgSettings.hasGarage && (
                                <div className="p-3 bg-gray-50 rounded-lg">
                                  <p className="text-xs text-gray-600 mb-1">🚗 Garage</p>
                                  <p className="text-sm font-semibold text-gray-900">
                                    {orgSettings.garageSpaces ? `${orgSettings.garageSpaces} car${orgSettings.garageSpaces > 1 ? 's' : ''}` : orgSettings.garageType || 'Yes'}
                                  </p>
                                </div>
                              )}

                              {orgSettings.hasHeating && (
                                <div className="p-3 bg-gray-50 rounded-lg">
                                  <p className="text-xs text-gray-600 mb-1">🔥 Heating</p>
                                  <p className="text-sm font-semibold text-gray-900">
                                    {orgSettings.heatingType || 'Yes'}
                                  </p>
                                </div>
                              )}

                              {orgSettings.hasCooling && (
                                <div className="p-3 bg-gray-50 rounded-lg">
                                  <p className="text-xs text-gray-600 mb-1">❄️ Cooling</p>
                                  <p className="text-sm font-semibold text-gray-900">
                                    {orgSettings.coolingType || 'Yes'}
                                  </p>
                                </div>
                              )}

                              {orgSettings.architectureType && (
                                <div className="p-3 bg-gray-50 rounded-lg">
                                  <p className="text-xs text-gray-600 mb-1">🏛️ Architecture</p>
                                  <p className="text-sm font-semibold text-gray-900">
                                    {orgSettings.architectureType}
                                  </p>
                                </div>
                              )}

                              {orgSettings.roofType && (
                                <div className="p-3 bg-gray-50 rounded-lg">
                                  <p className="text-xs text-gray-600 mb-1">🏠 Roof</p>
                                  <p className="text-sm font-semibold text-gray-900">
                                    {orgSettings.roofType}
                                  </p>
                                </div>
                              )}

                              {orgSettings.viewType && (
                                <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                                  <p className="text-xs text-green-700 mb-1">👁️ View</p>
                                  <p className="text-sm font-semibold text-green-900">
                                    {orgSettings.viewType}
                                  </p>
                                </div>
                              )}
                            </div>

                            <p className="text-xs text-gray-500 mt-3">
                              Last updated: {new Date(orgSettings.propertyDataFetchedAt).toLocaleDateString()}
                            </p>
                          </div>
                        ) : (
                          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <p className="text-sm text-yellow-900 mb-2">
                              <strong>Get Property Details</strong>
                            </p>
                            <p className="text-xs text-yellow-700">
                              Click "Fetch Property Data" to automatically retrieve your home's details (bedrooms, bathrooms, square footage, etc.) using your address. This helps us provide better chore suggestions!
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Household Information */}
                    <div className="space-y-4 pt-6 border-t border-gray-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">Household Information</h3>
                          <p className="text-xs text-gray-500 mt-1">
                            Property features detected from your address are automatically included here
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setIsHouseholdModalOpen(true)}
                        >
                          {(orgSettings.hasPets || orgSettings.petTypes?.length > 0 || orgSettings.homeFeatures?.length > 0) ? 'Edit' : 'Add'} Household Info
                        </Button>
                      </div>

                      {(orgSettings.hasPets || orgSettings.petTypes?.length > 0 || orgSettings.homeFeatures?.length > 0 || orgSettings.ageGroups?.length > 0 || orgSettings.numberOfCars > 0 || orgSettings.numberOfBikes > 0) ? (

                        <div className="grid grid-cols-2 gap-4">
                          {orgSettings.hasPets && orgSettings.petTypes?.length > 0 && (
                            <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                              <p className="text-xs text-purple-700 mb-1">🐾 Pets</p>
                              <p className="text-sm font-semibold text-purple-900">
                                {orgSettings.petTypes.map((pet: string) => {
                                  const petLabels: Record<string, string> = {
                                    dog: '🐶 Dog',
                                    cat: '🐱 Cat',
                                    fish: '🐠 Fish',
                                    bird: '🐦 Bird',
                                    small_animal: '🐹 Small Animal',
                                    reptile: '🦎 Reptile',
                                    other: 'Other'
                                  }
                                  return petLabels[pet] || pet
                                }).join(', ')}
                              </p>
                            </div>
                          )}

                          {orgSettings.ageGroups?.length > 0 && (
                            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                              <p className="text-xs text-blue-700 mb-1">👨‍👩‍👧‍👦 Age Groups</p>
                              <p className="text-sm font-semibold text-blue-900">
                                {orgSettings.ageGroups.map((group: string) => {
                                  const groupLabels: Record<string, string> = {
                                    toddler: 'Toddler (0-4)',
                                    kid: 'Kid (5-12)',
                                    teen: 'Teen (13-17)',
                                    adult: 'Adult (18+)'
                                  }
                                  return groupLabels[group] || group
                                }).join(', ')}
                              </p>
                            </div>
                          )}

                          {orgSettings.numberOfCars > 0 && (
                            <div className="p-3 bg-gray-50 rounded-lg">
                              <p className="text-xs text-gray-600 mb-1">🚗 Cars</p>
                              <p className="text-lg font-semibold text-gray-900">{orgSettings.numberOfCars}</p>
                            </div>
                          )}

                          {orgSettings.numberOfBikes > 0 && (
                            <div className="p-3 bg-gray-50 rounded-lg">
                              <p className="text-xs text-gray-600 mb-1">🚲 Bikes</p>
                              <p className="text-lg font-semibold text-gray-900">{orgSettings.numberOfBikes}</p>
                            </div>
                          )}

                          {orgSettings.homeFeatures?.length > 0 && (
                            <div className="p-3 bg-green-50 rounded-lg border border-green-200 col-span-2">
                              <p className="text-xs text-green-700 mb-2">🏡 Home Features</p>
                              <div className="flex flex-wrap gap-2">
                                {orgSettings.homeFeatures.map((feature: string) => {
                                  const featureLabels: Record<string, string> = {
                                    fireplace: '🔥 Fireplace',
                                    pool: '🏊 Pool',
                                    hot_tub: '🛁 Hot Tub',
                                    pond: '🦆 Pond',
                                    garden: '🌳 Garden/Yard',
                                    indoor_plants: '🪴 Indoor Plants'
                                  }
                                  return (
                                    <span key={feature} className="px-2 py-1 bg-white rounded text-xs font-medium text-green-900">
                                      {featureLabels[feature] || feature}
                                    </span>
                                  )
                                })}
                              </div>
                            </div>
                          )}

                          {orgSettings.specialConsiderations?.length > 0 && (
                            <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 col-span-2">
                              <p className="text-xs text-amber-700 mb-2">ℹ️ Special Considerations</p>
                              <div className="flex flex-wrap gap-2">
                                {orgSettings.specialConsiderations.map((consideration: string) => {
                                  const considerationLabels: Record<string, string> = {
                                    elderly: '👴 Elderly family member',
                                    home_office: '💼 Home office',
                                    basement_attic: '🏠 Basement/Attic'
                                  }
                                  return (
                                    <span key={consideration} className="px-2 py-1 bg-white rounded text-xs font-medium text-amber-900">
                                      {considerationLabels[consideration] || consideration}
                                    </span>
                                  )
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="p-4 bg-gray-50 rounded-lg text-center">
                          <p className="text-sm text-gray-600">
                            No household information added yet. Click "Add Household Info" to get started.
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-3 pt-4">
                      <Button variant="primary" onClick={handleSaveOrgSettings}>
                        Save Changes
                      </Button>
                      <Button variant="outline">
                        Cancel
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Subscription Info */}
              <Card variant="default" padding="lg">
                <CardHeader>
                  <CardTitle>Subscription</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 rounded-xl">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg font-bold text-gray-900">Pulse Premium</h3>
                          <Badge variant="info">Active</Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">Annual plan • Renews Nov 1, 2026</p>
                        <p className="text-xs text-gray-500">$39.99/year</p>
                      </div>
                      <div className="text-right">
                        <Button variant="outline" size="sm">
                          Manage Plan
                        </Button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">Payment Method</p>
                        <p className="text-sm text-gray-600">•••• •••• •••• 4242</p>
                      </div>
                      <Button variant="ghost" size="sm">
                        Update
                      </Button>
                    </div>

                    <div className="pt-4 border-t border-gray-200">
                      <Button variant="outline" fullWidth>
                        View Billing History
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Integrations Tab */}
          <TabsContent value="integrations">
            <div className="space-y-6">
              {/* Google Calendar Integration */}
              <Card variant="default" padding="lg">
                <CardHeader>
                  <CardTitle>Google Calendar</CardTitle>
                </CardHeader>
                <CardContent>
                  {!integrationSettings.googleCalendarConnected ? (
                    <div className="space-y-4">
                      {/* Connection Prompt */}
                      <div className="flex items-start gap-4 p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border-2 border-blue-200">
                        <div className="text-5xl">📅</div>
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-gray-900 mb-2">Connect Google Calendar</h3>
                          <p className="text-gray-700 mb-4">
                            Automatically sync your ChorePulse tasks with Google Calendar. Keep your family organized across all devices and platforms!
                          </p>
                          <ul className="space-y-2 mb-4">
                            <li className="flex items-start gap-2 text-sm text-gray-700">
                              <span className="text-green-600 mt-0.5">✓</span>
                              <span>Tasks appear on your Google Calendar with reminders</span>
                            </li>
                            <li className="flex items-start gap-2 text-sm text-gray-700">
                              <span className="text-green-600 mt-0.5">✓</span>
                              <span>See family schedules alongside personal events</span>
                            </li>
                            <li className="flex items-start gap-2 text-sm text-gray-700">
                              <span className="text-green-600 mt-0.5">✓</span>
                              <span>Automatic two-way sync keeps everything up-to-date</span>
                            </li>
                          </ul>
                          <Button variant="primary" size="md" onClick={handleConnectCalendar}>
                            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                            </svg>
                            Connect Google Calendar
                          </Button>
                        </div>
                      </div>

                      {/* Privacy Note */}
                      <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="text-2xl">🔒</div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900 mb-1">Your privacy matters</p>
                          <p className="text-xs text-gray-600">
                            ChorePulse only accesses calendar data you explicitly share. You can disconnect anytime, and we never store your Google credentials.
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Connected Status */}
                      <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border-2 border-green-200">
                        <div className="flex items-center gap-3">
                          <div className="text-3xl">✓</div>
                          <div>
                            <p className="font-semibold text-gray-900">Connected to Google Calendar</p>
                            <p className="text-sm text-gray-600">{integrationSettings.googleCalendarEmail}</p>
                          </div>
                        </div>
                        <Button variant="danger" size="sm" onClick={handleDisconnectCalendar} disabled={isSaving}>
                          {isSaving ? 'Disconnecting...' : 'Disconnect'}
                        </Button>
                      </div>

                      {/* Sync Settings */}
                      <div>
                        <h3 className="text-sm font-semibold text-gray-900 mb-3">Sync Options</h3>
                        <div className="space-y-3">
                          <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                            <div>
                              <p className="font-medium text-gray-900">Sync Tasks to Google Calendar</p>
                              <p className="text-sm text-gray-600">ChorePulse tasks appear in your Google Calendar</p>
                            </div>
                            <input
                              type="checkbox"
                              checked={integrationSettings.syncTasksToCalendar}
                              onChange={(e) => setIntegrationSettings({ ...integrationSettings, syncTasksToCalendar: e.target.checked })}
                              className="w-5 h-5"
                            />
                          </label>

                          <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                            <div>
                              <p className="font-medium text-gray-900">Show Google Calendar Events in Pulse</p>
                              <p className="text-sm text-gray-600">Display your Google Calendar events in Pulse Calendar view</p>
                            </div>
                            <input
                              type="checkbox"
                              checked={integrationSettings.syncCalendarToTasks}
                              onChange={(e) => setIntegrationSettings({ ...integrationSettings, syncCalendarToTasks: e.target.checked })}
                              className="w-5 h-5"
                            />
                          </label>
                        </div>
                      </div>

                      {/* Calendar Name */}
                      <Input
                        label="Calendar Name"
                        value={integrationSettings.calendarName}
                        onChange={(e) => setIntegrationSettings({ ...integrationSettings, calendarName: e.target.value })}
                        helperText="The name of the calendar created in your Google account"
                      />

                      {/* Last Sync */}
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <p className="text-sm font-medium text-gray-900">Last Synced</p>
                          <p className="text-sm text-gray-600">
                            {integrationSettings.lastSyncAt
                              ? new Date(integrationSettings.lastSyncAt).toLocaleString()
                              : 'Never'}
                            {integrationSettings.lastSyncStatus === 'error' && (
                              <span className="ml-2 text-red-600">• Failed</span>
                            )}
                            {integrationSettings.lastSyncStatus === 'success' && (
                              <span className="ml-2 text-green-600">• Success</span>
                            )}
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleSyncCalendar}
                          disabled={isSyncing || !integrationSettings.syncTasksToCalendar}
                        >
                          {isSyncing ? 'Syncing...' : 'Sync Now'}
                        </Button>
                      </div>

                      {/* Save Button */}
                      <div className="flex items-center gap-3 pt-4">
                        <Button variant="primary" onClick={handleSaveCalendarSettings} disabled={isSaving}>
                          {isSaving ? 'Saving...' : 'Save Settings'}
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Coming Soon Integrations */}
              <Card variant="default" padding="lg" className="opacity-60">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>More Integrations</CardTitle>
                    <Badge variant="info" size="sm">Coming Soon</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="text-3xl">📧</div>
                      <div>
                        <p className="font-semibold text-gray-900">Email Reminders</p>
                        <p className="text-sm text-gray-600">Automated task notifications</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="text-3xl">📱</div>
                      <div>
                        <p className="font-semibold text-gray-900">Apple Calendar</p>
                        <p className="text-sm text-gray-600">iCloud calendar sync</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="text-3xl">🔔</div>
                      <div>
                        <p className="font-semibold text-gray-900">Slack</p>
                        <p className="text-sm text-gray-600">Team notifications</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="text-3xl">🏠</div>
                      <div>
                        <p className="font-semibold text-gray-900">Smart Home</p>
                        <p className="text-sm text-gray-600">Alexa & Google Home</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications">
            <Card variant="default" padding="lg">
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Master Toggle */}
                  <div className="pb-4 border-b border-gray-200">
                    <label className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border-2 border-blue-200 cursor-pointer">
                      <div>
                        <p className="font-semibold text-gray-900">Email Notifications</p>
                        <p className="text-sm text-gray-600">Turn all email notifications on or off</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={notifications.emailNotifications}
                        onChange={(e) => setNotifications({ ...notifications, emailNotifications: e.target.checked })}
                        className="w-6 h-6"
                      />
                    </label>
                  </div>

                  {/* Email Notifications */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Email Preferences</h3>
                    <div className="space-y-3">
                      <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                        <div>
                          <p className="font-medium text-gray-900">Task Reminders</p>
                          <p className="text-sm text-gray-600">Get reminded about upcoming and overdue tasks</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={notifications.taskReminders}
                          onChange={(e) => setNotifications({ ...notifications, taskReminders: e.target.checked })}
                          className="w-5 h-5"
                        />
                      </label>

                      <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                        <div>
                          <p className="font-medium text-gray-900">Reward Requests</p>
                          <p className="text-sm text-gray-600">Notify when family members request rewards</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={notifications.rewardRequests}
                          onChange={(e) => setNotifications({ ...notifications, rewardRequests: e.target.checked })}
                          className="w-5 h-5"
                        />
                      </label>

                      <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                        <div>
                          <p className="font-medium text-gray-900">Achievement Alerts</p>
                          <p className="text-sm text-gray-600">Celebrate when family members unlock achievements</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={notifications.achievementAlerts}
                          onChange={(e) => setNotifications({ ...notifications, achievementAlerts: e.target.checked })}
                          className="w-5 h-5"
                        />
                      </label>

                      <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                        <div>
                          <p className="font-medium text-gray-900">Weekly Digest</p>
                          <p className="text-sm text-gray-600">Summary of family activity every Sunday</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={notifications.weeklyDigest}
                          onChange={(e) => setNotifications({ ...notifications, weeklyDigest: e.target.checked })}
                          className="w-5 h-5"
                        />
                      </label>
                    </div>
                  </div>

                  {/* Push Notifications */}
                  <div className="pt-4 border-t border-gray-200">
                    <div className="mb-4">
                      <label className="flex items-center justify-between p-4 bg-purple-50 rounded-lg border-2 border-purple-200 cursor-pointer">
                        <div>
                          <p className="font-semibold text-gray-900">Push Notifications</p>
                          <p className="text-sm text-gray-600">Turn all push notifications on or off</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={notifications.pushNotifications}
                          onChange={(e) => setNotifications({ ...notifications, pushNotifications: e.target.checked })}
                          className="w-6 h-6"
                        />
                      </label>
                    </div>

                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Push Preferences</h3>
                    <div className="space-y-3">
                      <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                        <div>
                          <p className="font-medium text-gray-900">Task Assignments</p>
                          <p className="text-sm text-gray-600">Notify when new tasks are assigned to you</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={notifications.taskAssignments}
                          onChange={(e) => setNotifications({ ...notifications, taskAssignments: e.target.checked })}
                          className="w-5 h-5"
                        />
                      </label>

                      <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                        <div>
                          <p className="font-medium text-gray-900">Family Activity</p>
                          <p className="text-sm text-gray-600">Updates when family members complete tasks</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={notifications.familyActivity}
                          onChange={(e) => setNotifications({ ...notifications, familyActivity: e.target.checked })}
                          className="w-5 h-5"
                        />
                      </label>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-4">
                    <Button variant="primary">
                      Save Preferences
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tasks & Rewards Tab */}
          <TabsContent value="tasks">
            <div className="space-y-6">
              {/* Info Alert */}
              <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <span className="text-2xl">ℹ️</span>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-blue-700">
                      These settings apply organization-wide and affect how all family members interact with tasks and rewards. Only account owners and family managers can modify these settings.
                    </p>
                  </div>
                </div>
              </div>

              <Card variant="default" padding="lg">
                <CardHeader>
                  <CardTitle>Task Settings</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Input
                      label="Default Points per Task"
                      type="number"
                      value={taskSettings.defaultPoints}
                      onChange={(e) => setTaskSettings({ ...taskSettings, defaultPoints: e.target.value })}
                      helperText="Default points when creating new tasks"
                    />

                    <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                      <div>
                        <p className="font-medium text-gray-900">Require Photo Proof</p>
                        <p className="text-sm text-gray-600">Tasks require photo verification by default</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={taskSettings.requirePhotoProof}
                        onChange={(e) => setTaskSettings({ ...taskSettings, requirePhotoProof: e.target.checked })}
                        className="w-5 h-5"
                      />
                    </label>

                    <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                      <div>
                        <p className="font-medium text-gray-900">Auto-Approve Completions</p>
                        <p className="text-sm text-gray-600">Automatically approve task completions without review</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={taskSettings.autoApproveCompletions}
                        onChange={(e) => setTaskSettings({ ...taskSettings, autoApproveCompletions: e.target.checked })}
                        className="w-5 h-5"
                      />
                    </label>

                    <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                      <div>
                        <p className="font-medium text-gray-900">Kids Can Create Tasks</p>
                        <p className="text-sm text-gray-600">Allow kids (5-12) to suggest new tasks</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={taskSettings.allowKidsToCreateTasks}
                        onChange={(e) => setTaskSettings({ ...taskSettings, allowKidsToCreateTasks: e.target.checked })}
                        className="w-5 h-5"
                      />
                    </label>

                    <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                      <div>
                        <p className="font-medium text-gray-900">Teens Can Create Tasks</p>
                        <p className="text-sm text-gray-600">Allow teens (13-17) to create and assign tasks</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={taskSettings.allowTeensToCreateTasks}
                        onChange={(e) => setTaskSettings({ ...taskSettings, allowTeensToCreateTasks: e.target.checked })}
                        className="w-5 h-5"
                      />
                    </label>
                  </div>
                </CardContent>
              </Card>

              <Card variant="default" padding="lg">
                <CardHeader>
                  <CardTitle>Reward Settings</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                      <div>
                        <p className="font-medium text-gray-900">Require Approval</p>
                        <p className="text-sm text-gray-600">Adult approval needed for all reward redemptions</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={rewardSettings.requireApproval}
                        onChange={(e) => setRewardSettings({ ...rewardSettings, requireApproval: e.target.checked })}
                        className="w-5 h-5"
                      />
                    </label>

                    <Input
                      label="Monthly Redemption Limit"
                      type="number"
                      value={rewardSettings.monthlyLimit}
                      onChange={(e) => setRewardSettings({ ...rewardSettings, monthlyLimit: e.target.value })}
                      helperText="Maximum points that can be redeemed per month (per member)"
                    />

                    <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                      <div>
                        <p className="font-medium text-gray-900">Allow Negative Balance</p>
                        <p className="text-sm text-gray-600">Members can redeem rewards even with 0 points (creates debt)</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={rewardSettings.allowNegativeBalance}
                        onChange={(e) => setRewardSettings({ ...rewardSettings, allowNegativeBalance: e.target.checked })}
                        className="w-5 h-5"
                      />
                    </label>
                  </div>
                </CardContent>
              </Card>

              <div className="flex items-center gap-3">
                <Button variant="primary">
                  Save Settings
                </Button>
                <Button variant="outline">
                  Reset to Defaults
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* Privacy & Security Tab */}
          <TabsContent value="privacy">
            <div className="space-y-6">
              {/* Cookie Preferences Section */}
              <Card variant="default" padding="lg">
                <CardHeader>
                  <CardTitle>Cookie Preferences</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Alert variant="info">
                      We use cookies to provide personalized advertising through Google AdSense and to understand how you use our service through analytics. These cookies help us improve your experience and keep ChorePulse free.
                    </Alert>

                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-medium text-gray-900">Current Cookie Consent Status</p>
                        <Badge variant={typeof window !== 'undefined' && localStorage.getItem('cookie-consent') ? 'success' : 'warning'}>
                          {typeof window !== 'undefined' && localStorage.getItem('cookie-consent') ? 'Accepted' : 'Not Set'}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">
                        Consent date: {typeof window !== 'undefined' && localStorage.getItem('cookie-consent')
                          ? new Date(parseInt(localStorage.getItem('cookie-consent') || '0')).toLocaleDateString()
                          : 'N/A'}
                      </p>
                    </div>

                    <div className="space-y-3">
                      <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="text-sm font-semibold text-blue-900 mb-1">What cookies do we use?</p>
                        <ul className="text-xs text-blue-800 space-y-1 ml-4">
                          <li className="list-disc">Google AdSense cookies for personalized advertising</li>
                          <li className="list-disc">Analytics cookies to understand usage patterns</li>
                          <li className="list-disc">Essential cookies for authentication and security</li>
                        </ul>
                      </div>

                      <Button
                        variant="outline"
                        fullWidth
                        onClick={() => {
                          if (confirm('Are you sure you want to revoke your cookie consent? This will clear your preferences and reload the page.')) {
                            localStorage.removeItem('cookie-consent')
                            window.location.reload()
                          }
                        }}
                      >
                        Revoke/Change Cookie Consent
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Data Export Section */}
              <Card variant="default" padding="lg">
                <CardHeader>
                  <CardTitle>Data Export</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600">
                      Download all your personal data in JSON format (GDPR compliance). This includes your profile information, tasks, points history, and all associated data.
                    </p>

                    <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xl">✓</span>
                        <p className="text-sm font-semibold text-green-900">GDPR Compliant Data Export</p>
                      </div>
                      <p className="text-xs text-green-800">
                        Your data export will include all personal information we store about you and your household.
                      </p>
                    </div>

                    {typeof window !== 'undefined' && localStorage.getItem('last-data-export') && (
                      <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <p className="text-sm text-gray-700">
                          <strong>Last export:</strong> {new Date(parseInt(localStorage.getItem('last-data-export') || '0')).toLocaleString()}
                        </p>
                      </div>
                    )}

                    <Button
                      variant="primary"
                      fullWidth
                      onClick={() => {
                        // Store the export timestamp
                        localStorage.setItem('last-data-export', Date.now().toString())
                        // Open the export API in a new tab
                        window.open('/api/users/export', '_blank')
                        toast.showToast('Data export started. Check your downloads.', 'success')
                      }}
                    >
                      Download My Data
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Data Deletion Section */}
              <Card variant="default" padding="lg" className="border-2 border-red-200">
                <CardHeader>
                  <CardTitle className="text-red-600">Account Deletion</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Alert variant="warning">
                      To delete your account and all associated data, please contact our support team. This complies with GDPR right to erasure requirements.
                    </Alert>

                    <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                      <p className="text-sm font-semibold text-red-900 mb-2">Account Deletion Request</p>
                      <p className="text-sm text-red-800 mb-3">
                        To ensure the security of your data and verify your identity, account deletion requests must be processed by our support team.
                      </p>
                      <p className="text-sm text-red-800">
                        Please email: <a href="mailto:support@chorepulse.com" className="font-semibold underline">support@chorepulse.com</a>
                      </p>
                    </div>

                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-xs text-gray-600">
                        <strong>What happens when you delete your account?</strong>
                      </p>
                      <ul className="text-xs text-gray-600 space-y-1 ml-4 mt-2">
                        <li className="list-disc">All personal data will be permanently deleted</li>
                        <li className="list-disc">Your household and all member data will be removed</li>
                        <li className="list-disc">Tasks, points, and history will be erased</li>
                        <li className="list-disc">This action cannot be undone</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Privacy Settings Section */}
              <Card variant="default" padding="lg">
                <CardHeader>
                  <CardTitle>Privacy Settings</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                      <div>
                        <p className="font-medium text-gray-900">Share Anonymous Data</p>
                        <p className="text-sm text-gray-600">Help improve ChorePulse by sharing anonymous usage data</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={privacySettings.shareWithChorePulse}
                        onChange={(e) => setPrivacySettings({ ...privacySettings, shareWithChorePulse: e.target.checked })}
                        className="w-5 h-5"
                      />
                    </label>

                    <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                      <div>
                        <p className="font-medium text-gray-900">Analytics</p>
                        <p className="text-sm text-gray-600">Allow analytics cookies for better experience</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={privacySettings.allowAnalytics}
                        onChange={(e) => setPrivacySettings({ ...privacySettings, allowAnalytics: e.target.checked })}
                        className="w-5 h-5"
                      />
                    </label>
                  </div>
                </CardContent>
              </Card>

              {/* Security Section */}
              <Card variant="default" padding="lg">
                <CardHeader>
                  <CardTitle>Security</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                      <div>
                        <p className="font-medium text-gray-900">Two-Factor Authentication</p>
                        <p className="text-sm text-gray-600">Add an extra layer of security to your account</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={privacySettings.twoFactorAuth}
                        onChange={(e) => setPrivacySettings({ ...privacySettings, twoFactorAuth: e.target.checked })}
                        className="w-5 h-5"
                      />
                    </label>

                    <div className="pt-4 border-t border-gray-200">
                      <h3 className="text-sm font-semibold text-gray-900 mb-3">Active Sessions</h3>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg">
                          <div>
                            <p className="font-medium text-gray-900">MacBook Pro - Chrome</p>
                            <p className="text-sm text-gray-600">San Francisco, CA • Current session</p>
                          </div>
                          <Badge variant="success">Active</Badge>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg">
                          <div>
                            <p className="font-medium text-gray-900">iPhone 14 - Safari</p>
                            <p className="text-sm text-gray-600">San Francisco, CA • 2 hours ago</p>
                          </div>
                          <Button variant="ghost" size="sm">
                            Revoke
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex items-center gap-3">
                <Button variant="primary">
                  Save Settings
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <EditHouseholdModal
        isOpen={isHouseholdModalOpen}
        onClose={() => setIsHouseholdModalOpen(false)}
        onSave={handleSaveHousehold}
        initialData={{
          petTypes: orgSettings.petTypes || [],
          homeFeatures: orgSettings.homeFeatures || [],
          specialConsiderations: orgSettings.specialConsiderations || [],
          ageGroups: orgSettings.ageGroups || [],
          numberOfCars: orgSettings.numberOfCars || 0,
          numberOfBikes: orgSettings.numberOfBikes || 0
        }}
      />
    </div>
  )
}
