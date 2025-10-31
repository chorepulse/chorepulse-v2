'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Alert } from '@/components/ui'

export default function OnboardingPinPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [pin, setPin] = useState(['', '', '', ''])
  const [confirmPin, setConfirmPin] = useState(['', '', '', ''])
  const [step, setStep] = useState<'create' | 'confirm'>('create')
  const [error, setError] = useState<string | null>(null)

  const pinRefs = useRef<(HTMLInputElement | null)[]>([])
  const confirmPinRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    // Verify user has completed previous steps
    const organizationName = sessionStorage.getItem('organizationName')
    if (!organizationName) {
      router.push('/onboarding/organization')
    }
  }, [router])

  // Focus first input when step changes to confirm
  useEffect(() => {
    if (step === 'confirm') {
      setTimeout(() => {
        confirmPinRefs.current[0]?.focus()
      }, 100)
    }
  }, [step])

  const handlePinChange = (index: number, value: string, isConfirm: boolean = false) => {
    setError(null)

    // Only allow digits
    if (value && !/^\d$/.test(value)) {
      return
    }

    const newPin = isConfirm ? [...confirmPin] : [...pin]
    newPin[index] = value

    if (isConfirm) {
      setConfirmPin(newPin)
    } else {
      setPin(newPin)
    }

    // Auto-focus next input
    if (value && index < 3) {
      const refs = isConfirm ? confirmPinRefs : pinRefs
      refs.current[index + 1]?.focus()
    }

    // Check if all 4 digits are entered
    if (newPin.every(digit => digit !== '')) {
      if (!isConfirm && step === 'create') {
        // Move to confirm step
        setTimeout(() => {
          setStep('confirm')
          confirmPinRefs.current[0]?.focus()
        }, 300)
      } else if (isConfirm && step === 'confirm') {
        // Validate PIN match
        const pinString = pin.join('')
        const confirmPinString = newPin.join('')

        if (pinString !== confirmPinString) {
          setError('PINs do not match. Please try again.')
          setConfirmPin(['', '', '', ''])
          setTimeout(() => {
            confirmPinRefs.current[0]?.focus()
          }, 100)
        } else {
          handleSubmit(pinString)
        }
      }
    }
  }

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number,
    isConfirm: boolean = false
  ) => {
    if (e.key === 'Backspace') {
      const currentPin = isConfirm ? confirmPin : pin
      const refs = isConfirm ? confirmPinRefs : pinRefs

      if (currentPin[index] === '' && index > 0) {
        // Focus previous input
        refs.current[index - 1]?.focus()
      } else {
        // Clear current input
        handlePinChange(index, '', isConfirm)
      }
    }
  }

  const handleSubmit = async (pinValue: string) => {
    setIsLoading(true)
    setError(null)

    try {
      // Get signup data from session storage
      const signupDataStr = sessionStorage.getItem('signupData')
      if (!signupDataStr) {
        setError('Session expired. Please sign up again.')
        router.push('/signup')
        return
      }

      const signupData = JSON.parse(signupDataStr)

      // Hash the PIN with bcrypt
      const bcrypt = await import('bcryptjs')
      const pinHash = await bcrypt.hash(pinValue, 10)

      // Save hashed PIN to database
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()

      // Get current user
      const { data: { user }, error: authError } = await supabase.auth.getUser()

      if (authError || !user) {
        setError('Authentication error. Please log in again.')
        router.push('/login')
        return
      }

      // Update user's PIN hash in the database
      const { error: updateError } = await supabase
        .from('users')
        .update({ pin_hash: pinHash })
        .eq('auth_user_id', user.id)

      if (updateError) {
        console.error('Error saving PIN:', updateError)
        setError('Failed to save PIN. Please try again.')
        return
      }

      // Store PIN temporarily for verification during onboarding (not the hash)
      sessionStorage.setItem('userPin', pinValue)

      // Redirect to family profile
      router.push('/onboarding/profile')
    } catch (err) {
      setError('Failed to save PIN. Please try again.')
      console.error(err)
      setStep('create')
      setPin(['', '', '', ''])
      setConfirmPin(['', '', '', ''])
    } finally {
      setIsLoading(false)
    }
  }

  const resetPin = () => {
    setStep('create')
    setPin(['', '', '', ''])
    setConfirmPin(['', '', '', ''])
    setError(null)
    setTimeout(() => {
      pinRefs.current[0]?.focus()
    }, 100)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Progress indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-2 h-2 rounded-full bg-blue-600"></div>
            <div className="w-2 h-2 rounded-full bg-blue-600"></div>
            <div className="w-2 h-2 rounded-full bg-gray-300"></div>
            <div className="w-2 h-2 rounded-full bg-gray-300"></div>
            <div className="w-2 h-2 rounded-full bg-gray-300"></div>
          </div>
          <p className="text-center text-sm text-gray-600">Step 2 of 5</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-2xl mb-4">
              <span className="text-3xl">🔐</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {step === 'create' ? 'Create Your PIN' : 'Confirm Your PIN'}
            </h1>
            <p className="text-gray-600">
              {step === 'create'
                ? 'Choose a 4-digit PIN for quick login'
                : 'Re-enter your PIN to confirm'}
            </p>
          </div>

          {error && (
            <Alert variant="danger" className="mb-6" onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          <Alert variant="info" className="mb-8">
            Your PIN allows you to quickly log in without entering your email and password each time.
          </Alert>

          {/* PIN Input */}
          <div className="flex justify-center gap-4 mb-8">
            {(step === 'create' ? pin : confirmPin).map((digit, index) => (
              <input
                key={index}
                ref={(el) => {
                  if (step === 'create') {
                    pinRefs.current[index] = el
                  } else {
                    confirmPinRefs.current[index] = el
                  }
                }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handlePinChange(index, e.target.value, step === 'confirm')}
                onKeyDown={(e) => handleKeyDown(e, index, step === 'confirm')}
                className="w-16 h-16 text-center text-3xl font-bold border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                disabled={isLoading}
                autoFocus={index === 0 && step === 'create'}
              />
            ))}
          </div>

          {step === 'confirm' && (
            <div className="flex flex-col gap-3">
              <Button
                variant="outline"
                size="lg"
                fullWidth
                onClick={resetPin}
                disabled={isLoading}
              >
                Start Over
              </Button>
            </div>
          )}

          {isLoading && (
            <div className="mt-4 text-center text-gray-600">
              <span className="inline-flex items-center gap-2">
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </span>
            </div>
          )}
        </div>

        {/* Help text */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>💡 Choose a PIN that's easy for you to remember but hard for others to guess</p>
        </div>
      </div>
    </div>
  )
}
