'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardHeader, CardTitle, CardContent, Button, Badge } from '@/components/ui'
import { useToast } from '@/hooks/useToast'
import { ToastContainer } from '@/components/Toast'

interface HubSettings {
  showTodayTasks: boolean
  showTomorrowTasks: boolean
  showWeeklyTasks: boolean
  showLeaderboard: boolean
  showFamilyStats: boolean
  showUpcomingEvents: boolean
  showCalendarEvents: boolean
  showMotivationalQuote: boolean
  showWeather: boolean
  weatherZipCode?: string
  autoRefreshInterval: number // in seconds
  theme: 'light' | 'dark' | 'auto'
}

export default function HubSettingsPage() {
  const router = useRouter()
  const toast = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [hasPermission, setHasPermission] = useState(false)

  const [settings, setSettings] = useState<HubSettings>({
    showTodayTasks: true,
    showTomorrowTasks: true,
    showWeeklyTasks: false,
    showLeaderboard: true,
    showFamilyStats: true,
    showUpcomingEvents: false,
    showCalendarEvents: true,
    showMotivationalQuote: true,
    showWeather: false,
    weatherZipCode: '',
    autoRefreshInterval: 60,
    theme: 'light'
  })

  useEffect(() => {
    checkPermissionsAndLoadSettings()
  }, [])

  // Auto-save when weatherZipCode, autoRefreshInterval, or theme changes (debounced)
  useEffect(() => {
    if (!settings) return

    const timeoutId = setTimeout(async () => {
      try {
        const response = await fetch('/api/hub/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(settings)
        })

        if (response.ok) {
          toast.showToast('Settings saved', 'success')
        }
      } catch (error) {
        console.error('Error auto-saving settings:', error)
      }
    }, 1000) // Debounce by 1 second

    return () => clearTimeout(timeoutId)
  }, [settings?.weatherZipCode, settings?.autoRefreshInterval, settings?.theme])

  const checkPermissionsAndLoadSettings = async () => {
    try {
      setIsLoading(true)

      // Check if user has permission to manage hub
      const userResponse = await fetch('/api/users/me')
      if (!userResponse.ok) {
        throw new Error('Failed to fetch user data')
      }

      const userData = await userResponse.json()
      const hasAccess = userData.user.isAccountOwner || userData.user.isFamilyManager

      if (!hasAccess) {
        toast.showToast('You do not have permission to access hub settings', 'error')
        router.push('/dashboard')
        return
      }

      setHasPermission(true)

      // Load hub settings
      const settingsResponse = await fetch('/api/hub/settings')
      if (settingsResponse.ok) {
        const data = await settingsResponse.json()
        if (data.settings) {
          setSettings(data.settings)
        }
      }
    } catch (error) {
      console.error('Error loading hub settings:', error)
      toast.showToast('Failed to load hub settings', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleLaunchHub = () => {
    // Open hub in new window/tab for display
    window.open('/hub/display', '_blank')
  }

  const toggleSetting = async (key: keyof HubSettings) => {
    const newSettings = {
      ...settings,
      [key]: !settings[key]
    }
    setSettings(newSettings)

    // Auto-save
    try {
      const response = await fetch('/api/hub/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings)
      })

      if (response.ok) {
        toast.showToast('Settings saved', 'success')
      }
    } catch (error) {
      console.error('Error auto-saving settings:', error)
      toast.showToast('Failed to save settings', 'error')
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 pb-24">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-2"></div>
            <div className="h-4 w-96 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6 h-96 animate-pulse"></div>
        </div>
      </div>
    )
  }

  if (!hasPermission) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 pb-24">
      <ToastContainer toasts={toast.toasts} onRemove={toast.removeToast} />

      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-2">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Hub Display Settings</h1>
              <p className="text-gray-600 mt-1">
                Configure what information displays on your family's command center
              </p>
            </div>
            <Button
              variant="primary"
              size="lg"
              onClick={handleLaunchHub}
              className="flex items-center gap-2 whitespace-nowrap shadow-lg hover:shadow-xl transition-shadow"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Launch Hub Display
            </Button>
          </div>
        </div>

        {/* Quick Launch Card */}
        <Card variant="elevated" padding="md" className="mb-6 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="text-4xl">🖥️</div>
              <div>
                <h3 className="font-bold text-gray-900 mb-1">Family Command Center</h3>
                <p className="text-sm text-gray-600">
                  Display tasks, leaderboard, and family stats on a shared screen
                </p>
              </div>
            </div>
            <Button variant="primary" size="lg" onClick={handleLaunchHub}>
              Launch Display
            </Button>
          </div>
        </Card>

        {/* Display Options */}
        <Card variant="default" padding="lg" className="mb-6">
          <CardHeader>
            <CardTitle>Display Content</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <SettingToggle
                label="Today's Tasks"
                description="Show tasks due today"
                enabled={settings.showTodayTasks}
                onChange={() => toggleSetting('showTodayTasks')}
                recommended
              />
              <SettingToggle
                label="Tomorrow's Tasks"
                description="Show tasks coming up tomorrow"
                enabled={settings.showTomorrowTasks}
                onChange={() => toggleSetting('showTomorrowTasks')}
              />
              <SettingToggle
                label="Weekly Tasks"
                description="Show all tasks for the week"
                enabled={settings.showWeeklyTasks}
                onChange={() => toggleSetting('showWeeklyTasks')}
              />
              <SettingToggle
                label="Family Leaderboard"
                description="Display points and rankings"
                enabled={settings.showLeaderboard}
                onChange={() => toggleSetting('showLeaderboard')}
                recommended
              />
              <SettingToggle
                label="Family Statistics"
                description="Show completion rates and streaks"
                enabled={settings.showFamilyStats}
                onChange={() => toggleSetting('showFamilyStats')}
              />
              <SettingToggle
                label="Upcoming Events"
                description="Show calendar events and deadlines"
                enabled={settings.showUpcomingEvents}
                onChange={() => toggleSetting('showUpcomingEvents')}
              />
              <SettingToggle
                label="Google Calendar Events"
                description="Show your Google Calendar events alongside tasks"
                enabled={settings.showCalendarEvents}
                onChange={() => toggleSetting('showCalendarEvents')}
              />
              <SettingToggle
                label="Motivational Quote"
                description="Display daily inspiration"
                enabled={settings.showMotivationalQuote}
                onChange={() => toggleSetting('showMotivationalQuote')}
              />
              <SettingToggle
                label="Weather"
                description="Show current weather conditions"
                enabled={settings.showWeather}
                onChange={() => toggleSetting('showWeather')}
              />
              {settings.showWeather && (
                <div className="ml-4 mt-2 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ZIP Code
                  </label>
                  <input
                    type="text"
                    value={settings.weatherZipCode || ''}
                    onChange={(e) => setSettings({ ...settings, weatherZipCode: e.target.value })}
                    placeholder="Enter ZIP code (e.g., 10001)"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    maxLength={5}
                    pattern="[0-9]{5}"
                  />
                  <p className="text-xs text-gray-600 mt-1">
                    Required for weather display
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Display Settings */}
        <Card variant="default" padding="lg" className="mb-6">
          <CardHeader>
            <CardTitle>Display Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Auto Refresh */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Auto Refresh Interval
                </label>
                <select
                  value={settings.autoRefreshInterval}
                  onChange={(e) => setSettings({ ...settings, autoRefreshInterval: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value={30}>Every 30 seconds</option>
                  <option value={60}>Every minute</option>
                  <option value={120}>Every 2 minutes</option>
                  <option value={300}>Every 5 minutes</option>
                  <option value={0}>Never (manual refresh only)</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  How often the display refreshes to show updated information
                </p>
              </div>

              {/* Theme */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Display Theme
                </label>
                <select
                  value={settings.theme}
                  onChange={(e) => setSettings({ ...settings, theme: e.target.value as 'light' | 'dark' | 'auto' })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                  <option value="auto">Auto (based on time of day)</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Choose how the hub display appears
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Auto-save notice */}
        <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <p className="text-sm text-green-800">
              <strong>Settings auto-save</strong> - Changes are saved automatically
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => router.push('/dashboard')}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    </div>
  )
}

interface SettingToggleProps {
  label: string
  description: string
  enabled: boolean
  onChange: () => void
  recommended?: boolean
  comingSoon?: boolean
}

function SettingToggle({ label, description, enabled, onChange, recommended, comingSoon }: SettingToggleProps) {
  return (
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <h4 className="font-semibold text-gray-900">{label}</h4>
          {recommended && (
            <Badge variant="success" size="sm">
              Recommended
            </Badge>
          )}
          {comingSoon && (
            <Badge variant="info" size="sm">
              Coming Soon
            </Badge>
          )}
        </div>
        <p className="text-sm text-gray-600">{description}</p>
      </div>
      <button
        onClick={onChange}
        disabled={comingSoon}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          enabled ? 'bg-blue-600' : 'bg-gray-300'
        } ${comingSoon ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            enabled ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  )
}
