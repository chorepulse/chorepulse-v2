'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

interface FamilyMember {
  id: string
  firstName: string
  lastName: string
  avatar: string
}

export default function PinLoginPage() {
  const router = useRouter()
  const [familyCode, setFamilyCode] = useState('')
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([])
  const [selectedMember, setSelectedMember] = useState<FamilyMember | null>(null)
  const [pin, setPin] = useState(['', '', '', ''])
  const [isLoading, setIsLoading] = useState(false)
  const [isPinLoading, setIsPinLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pinError, setPinError] = useState<string | null>(null)
  const [trustedCode, setTrustedCode] = useState<string | null>(null)

  const pinRefs = useRef<(HTMLInputElement | null)[]>([])

  // Check for trusted family code in localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('trustedFamilyCode')
      setTrustedCode(saved)
    }
  }, [])

  const handleFamilyCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()

      console.log('Looking up family code:', familyCode)

      const { data: familyData, error: lookupError } = await supabase
        .rpc('lookup_family_by_code', { family_code: familyCode })

      console.log('Lookup result:', { familyData, lookupError })

      if (lookupError) {
        console.error('Lookup error:', lookupError)
        setError('Invalid family code. Please check and try again.')
        setIsLoading(false)
        return
      }

      if (!familyData || familyData.length === 0) {
        setError('No family found with this code.')
        setIsLoading(false)
        return
      }

      // Transform the data
      const members: FamilyMember[] = familyData.map((row: any) => ({
        id: row.member_id,
        firstName: row.member_name?.split(' ')[0] || row.member_username,
        lastName: row.member_name?.split(' ').slice(1).join(' ') || '',
        avatar: row.member_avatar || 'smile'
      }))

      setFamilyMembers(members)

      // Save to localStorage as trusted code
      if (typeof window !== 'undefined') {
        localStorage.setItem('trustedFamilyCode', familyCode.toUpperCase())
        setTrustedCode(familyCode.toUpperCase())
      }
    } catch (err) {
      console.error('Error:', err)
      setError('An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleMemberSelect = (member: FamilyMember) => {
    setSelectedMember(member)
    setPinError(null)
    setTimeout(() => {
      pinRefs.current[0]?.focus()
    }, 100)
  }

  const handlePinChange = (index: number, value: string) => {
    setPinError(null)

    // Only allow digits
    if (value && !/^\d$/.test(value)) {
      return
    }

    const newPin = [...pin]
    newPin[index] = value
    setPin(newPin)

    // Auto-focus next input
    if (value && index < 3) {
      pinRefs.current[index + 1]?.focus()
    }

    // Check if all 4 digits are entered
    if (newPin.every(digit => digit !== '')) {
      handlePinLogin(newPin.join(''))
    }
  }

  const handlePinKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace') {
      if (pin[index] === '' && index > 0) {
        pinRefs.current[index - 1]?.focus()
      } else {
        handlePinChange(index, '')
      }
    }
  }

  const handlePinLogin = async (pinValue: string) => {
    console.log('handlePinLogin called with PIN:', pinValue)
    console.log('Selected member:', selectedMember)

    if (!selectedMember) return

    setIsPinLoading(true)
    setPinError(null)

    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()

      console.log('Verifying PIN for user:', selectedMember.id)

      // Get the PIN hash from database
      const { data: verifyResult, error: verifyError } = await supabase
        .rpc('verify_pin_login', {
          user_id_param: selectedMember.id
        })

      console.log('PIN lookup result:', { verifyResult, verifyError })

      if (verifyError || !verifyResult || verifyResult.length === 0) {
        console.error('Verify error:', verifyError)
        setPinError('An error occurred. Please try again.')
        setPin(['', '', '', ''])
        setIsPinLoading(false)
        return
      }

      const result = verifyResult[0]

      if (!result.pin_hash || !result.auth_user_id) {
        setPinError('This account is not set up for PIN login yet.')
        setIsPinLoading(false)
        return
      }

      // Verify PIN using bcrypt
      const bcrypt = await import('bcryptjs')
      const pinValid = await bcrypt.compare(pinValue, result.pin_hash)

      console.log('PIN valid:', pinValid, 'Auth user ID:', result.auth_user_id)

      if (!pinValid) {
        setPinError('Incorrect PIN. Please try again.')
        setPin(['', '', '', ''])
        setTimeout(() => {
          pinRefs.current[0]?.focus()
        }, 100)
        setIsPinLoading(false)
        return
      }

      // PIN is valid, navigate to API endpoint to create session
      console.log('Navigating to PIN login API with user ID:', result.auth_user_id)
      window.location.href = `/api/auth/pin-login?userId=${result.auth_user_id}`
    } catch (err) {
      console.error('PIN login error:', err)
      setPinError('An error occurred. Please try again.')
      setPin(['', '', '', ''])
      setTimeout(() => {
        pinRefs.current[0]?.focus()
      }, 100)
    } finally {
      setIsPinLoading(false)
    }
  }

  const resetFlow = () => {
    setFamilyMembers([])
    setSelectedMember(null)
    setPin(['', '', '', ''])
    setPinError(null)
    setError(null)
  }

  const useSavedCode = async () => {
    if (!trustedCode) return

    setIsLoading(true)
    setError(null)
    setFamilyCode(trustedCode)

    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()

      console.log('Looking up family code:', trustedCode)

      const { data: familyData, error: lookupError } = await supabase
        .rpc('lookup_family_by_code', { family_code: trustedCode })

      console.log('Lookup result:', { familyData, lookupError })

      if (lookupError) {
        console.error('Lookup error:', lookupError)
        setError('Invalid family code. Please check and try again.')
        setIsLoading(false)
        return
      }

      if (!familyData || familyData.length === 0) {
        setError('No family found with this code.')
        setIsLoading(false)
        return
      }

      // Transform the data
      const members: FamilyMember[] = familyData.map((row: any) => ({
        id: row.member_id,
        firstName: row.member_name?.split(' ')[0] || row.member_username,
        lastName: row.member_name?.split(' ').slice(1).join(' ') || '',
        avatar: row.member_avatar || 'smile'
      }))

      setFamilyMembers(members)
    } catch (err) {
      console.error('Error:', err)
      setError('An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const clearSavedCode = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('trustedFamilyCode')
      setTrustedCode(null)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3">
            <Image
              src="/logo.png"
              alt="ChorePulse"
              width={48}
              height={48}
              className="rounded-lg"
            />
            <span className="text-2xl font-bold text-gray-900">ChorePulse</span>
          </Link>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Step 1: Enter Family Code */}
          {!selectedMember && familyMembers.length === 0 && (
            <>
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-2xl mb-4">
                  <span className="text-3xl">🏠</span>
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Quick PIN Login
                </h1>
                <p className="text-gray-600">
                  Enter your family code to get started
                </p>
              </div>

              {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                  {error}
                </div>
              )}

              {trustedCode && (
                <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-900">Saved Family Code</p>
                      <p className="text-xs text-blue-700 font-mono">{trustedCode}</p>
                    </div>
                    <button
                      type="button"
                      onClick={useSavedCode}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
                    >
                      Use This
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={clearSavedCode}
                    className="mt-2 text-xs text-blue-600 hover:text-blue-700"
                  >
                    Use a different code
                  </button>
                </div>
              )}

              <form onSubmit={handleFamilyCodeSubmit} className="space-y-4">
                <div>
                  <label htmlFor="familyCode" className="block text-sm font-medium text-gray-700 mb-2">
                    Family Code
                  </label>
                  <input
                    id="familyCode"
                    type="text"
                    value={familyCode}
                    onChange={(e) => setFamilyCode(e.target.value.toUpperCase())}
                    placeholder="XXX-XXX-XXX"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-center text-lg"
                    maxLength={11}
                    required
                    autoFocus
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading || familyCode.length < 11}
                  className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {isLoading ? 'Looking up...' : 'Continue'}
                </button>
              </form>

              <div className="mt-6 text-center">
                <Link href="/login" className="text-sm text-blue-600 hover:text-blue-700">
                  Sign in with email instead
                </Link>
              </div>
            </>
          )}

          {/* Step 2: Select Family Member */}
          {!selectedMember && familyMembers.length > 0 && (
            <>
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Who's logging in?
                </h2>
                <p className="text-gray-600">
                  Select your profile
                </p>
              </div>

              <div className="space-y-3">
                {familyMembers.map((member) => (
                  <button
                    key={member.id}
                    onClick={() => handleMemberSelect(member)}
                    className="w-full p-4 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all flex items-center gap-4"
                  >
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full flex items-center justify-center text-2xl">
                      {member.avatar === 'smile' ? '😊' : member.avatar}
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-gray-900">
                        {member.firstName} {member.lastName}
                      </p>
                    </div>
                  </button>
                ))}
              </div>

              <button
                onClick={resetFlow}
                className="mt-4 w-full py-2 text-sm text-gray-600 hover:text-gray-800"
              >
                Use different family code
              </button>
            </>
          )}

          {/* Step 3: Enter PIN */}
          {selectedMember && (
            <>
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">
                  {selectedMember.avatar === 'smile' ? '😊' : selectedMember.avatar}
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-1">
                  Hi, {selectedMember.firstName}!
                </h2>
                <p className="text-gray-600">
                  Enter your 4-digit PIN
                </p>
              </div>

              {pinError && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                  {pinError}
                </div>
              )}

              <div className="flex justify-center gap-4 mb-6">
                {pin.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => (pinRefs.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handlePinChange(index, e.target.value)}
                    onKeyDown={(e) => handlePinKeyDown(e, index)}
                    className="w-16 h-16 text-center text-3xl font-bold border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                    disabled={isPinLoading}
                  />
                ))}
              </div>

              {isPinLoading && (
                <div className="text-center text-gray-600">
                  <span className="inline-flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing in...
                  </span>
                </div>
              )}

              <button
                onClick={() => {
                  setSelectedMember(null)
                  setPin(['', '', '', ''])
                  setPinError(null)
                }}
                className="mt-6 w-full py-2 text-sm text-gray-600 hover:text-gray-800"
              >
                Back to member selection
              </button>
            </>
          )}
        </div>

        {/* Help text */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>Don't have a family code? Ask your family organizer!</p>
        </div>
      </div>
    </div>
  )
}
