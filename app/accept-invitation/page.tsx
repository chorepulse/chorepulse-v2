'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Input } from '@/components/ui'

export default function AcceptInvitationPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const orgId = searchParams.get('org')

  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [invitationData, setInvitationData] = useState<any>(null)
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  })

  // Verify invitation token on mount
  useEffect(() => {
    const verifyInvitation = async () => {
      if (!token || !orgId) {
        setError('Invalid invitation link')
        setIsLoading(false)
        return
      }

      try {
        const response = await fetch(`/api/invitations/verify?token=${token}&org=${orgId}`)
        const data = await response.json()

        if (!response.ok) {
          setError(data.error || 'Invalid or expired invitation')
          setIsLoading(false)
          return
        }

        setInvitationData(data)
        setIsLoading(false)
      } catch (err) {
        setError('Failed to verify invitation. Please try again.')
        setIsLoading(false)
      }
    }

    verifyInvitation()
  }, [token, orgId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    // Validate password strength
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/invitations/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          orgId,
          password: formData.password
        })
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to accept invitation')
        setIsSubmitting(false)
        return
      }

      // Redirect to dashboard
      router.push('/dashboard')
    } catch (err) {
      setError('An error occurred. Please try again.')
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying invitation...</p>
        </div>
      </div>
    )
  }

  if (error && !invitationData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center justify-center">
              <Image
                src="/logo-transparent.png"
                alt="ChorePulse"
                width={256}
                height={64}
                className="h-16 w-auto"
              />
            </Link>
          </div>

          {/* Error Card */}
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Invalid Invitation</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <Link
              href="/login"
              className="inline-block px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all"
            >
              Go to Login
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center justify-center">
            <Image
              src="/logo-transparent.png"
              alt="ChorePulse"
              width={256}
              height={64}
              className="h-16 w-auto"
            />
          </Link>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">👋</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Welcome to {invitationData?.familyName}!
            </h2>
            <p className="text-gray-600">
              {invitationData?.inviterName} invited you to join their family on ChorePulse
            </p>
          </div>

          {/* User Info */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Your Name:</span>
              <span className="font-semibold text-gray-900">{invitationData?.userName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Role:</span>
              <span className="font-semibold text-gray-900 capitalize">{invitationData?.userRole}</span>
            </div>
          </div>

          {/* Password Setup Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                {error}
              </div>
            )}

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Set Your Password</h3>
              <Input
                label="Password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Enter a secure password"
                required
                autoFocus
              />
              <p className="mt-1 text-sm text-gray-500">Must be at least 8 characters long</p>
            </div>

            <Input
              label="Confirm Password"
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              placeholder="Re-enter your password"
              required
            />

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isSubmitting ? 'Setting up your account...' : 'Accept Invitation & Join'}
            </button>
          </form>

          {/* What Happens Next */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h4 className="font-semibold text-gray-900 mb-3">What happens next?</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-0.5">✓</span>
                <span>You'll join {invitationData?.familyName}'s dashboard</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-0.5">✓</span>
                <span>Start viewing and completing tasks</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-0.5">✓</span>
                <span>Earn points and unlock achievements</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Help text */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>
            Having trouble? <Link href="/help" className="text-blue-600 hover:text-blue-700">Contact support</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
