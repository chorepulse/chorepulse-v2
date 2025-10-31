'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Button, Input } from '@/components/ui'

export default function OnboardingOrganizationPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [organizationName, setOrganizationName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [userInfo, setUserInfo] = useState<{ firstName: string; email: string } | null>(null)

  useEffect(() => {
    // Get signup data from sessionStorage
    const signupDataStr = sessionStorage.getItem('signupData')
    if (!signupDataStr) {
      router.push('/signup')
      return
    }

    const signupData = JSON.parse(signupDataStr)
    setUserInfo(signupData)
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!organizationName.trim()) {
      setError('Organization name is required')
      return
    }

    setIsLoading(true)

    try {
      // TODO: Create organization in database
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Store organization name for next step
      sessionStorage.setItem('organizationName', organizationName)

      // Redirect to PIN setup
      router.push('/onboarding/pin')
    } catch (err) {
      setError('Failed to create organization. Please try again.')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  if (!userInfo) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Progress indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-2 h-2 rounded-full bg-blue-600"></div>
            <div className="w-2 h-2 rounded-full bg-gray-300"></div>
            <div className="w-2 h-2 rounded-full bg-gray-300"></div>
            <div className="w-2 h-2 rounded-full bg-gray-300"></div>
            <div className="w-2 h-2 rounded-full bg-gray-300"></div>
          </div>
          <p className="text-center text-sm text-gray-600">Step 1 of 5</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-2xl mb-4">
              <span className="text-3xl">👋</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome, {userInfo.firstName}!
            </h1>
            <p className="text-gray-600">
              Let's set up your family organization
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label="Organization Name"
              type="text"
              value={organizationName}
              onChange={(e) => setOrganizationName(e.target.value)}
              placeholder="e.g., The Smith Family, Johnson Household"
              helperText="This is the name your family will see throughout the app"
              required
              autoFocus
            />

            <div className="flex gap-3">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                isLoading={isLoading}
              >
                Continue
              </Button>
            </div>
          </form>
        </div>

        {/* Help text */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>You can change this name later in settings</p>
        </div>
      </div>
    </div>
  )
}
