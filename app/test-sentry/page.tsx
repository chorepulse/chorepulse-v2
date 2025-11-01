'use client'

import { useState } from 'react'
import * as Sentry from '@sentry/nextjs'

export default function TestSentryPage() {
  const [message, setMessage] = useState('')

  const testClientError = () => {
    setMessage('Triggering client error...')
    setTimeout(() => {
      throw new Error('Test Client Error - This is a test error from ChorePulse')
    }, 100)
  }

  const testCaptureError = () => {
    setMessage('Sending error to Sentry...')
    try {
      throw new Error('Test Captured Error - Manual capture test')
    } catch (error) {
      Sentry.captureException(error, {
        tags: {
          test: true,
          page: 'test-sentry',
        },
        extra: {
          userAction: 'Clicked test button',
          timestamp: new Date().toISOString(),
        },
      })
      setMessage('✅ Error sent to Sentry! Check your dashboard.')
    }
  }

  const testServerError = async () => {
    setMessage('Triggering server error...')
    try {
      const response = await fetch('/api/test-sentry-error')
      const data = await response.json()
      setMessage(data.message || 'Server error triggered')
    } catch (error) {
      setMessage('❌ Failed to call server endpoint')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Sentry Error Tracking Test
          </h1>
          <p className="text-gray-600 mb-8">
            Use these buttons to test if Sentry is properly capturing errors.
            After clicking, check your Sentry dashboard at{' '}
            <a
              href="https://sentry.io"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              sentry.io
            </a>
          </p>

          <div className="space-y-4">
            {/* Test 1: Client Error */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">
                Test 1: Client-Side Error (Unhandled)
              </h3>
              <p className="text-sm text-gray-600 mb-3">
                Throws an unhandled error in the browser. You should see an error boundary.
              </p>
              <button
                onClick={testClientError}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Throw Client Error
              </button>
            </div>

            {/* Test 2: Captured Error */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">
                Test 2: Manually Captured Error (Recommended)
              </h3>
              <p className="text-sm text-gray-600 mb-3">
                Sends an error directly to Sentry without breaking the page.
              </p>
              <button
                onClick={testCaptureError}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Send Test Error to Sentry
              </button>
            </div>

            {/* Test 3: Server Error */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">
                Test 3: Server-Side Error (API Route)
              </h3>
              <p className="text-sm text-gray-600 mb-3">
                Triggers an error in a server-side API route.
              </p>
              <button
                onClick={testServerError}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Trigger Server Error
              </button>
            </div>
          </div>

          {message && (
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">{message}</p>
            </div>
          )}

          <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-semibold text-gray-900 mb-2">What to expect:</h4>
            <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
              <li>Errors appear in Sentry within 5-10 seconds</li>
              <li>You'll see the error message, stack trace, and user context</li>
              <li>Session replay will show what led to the error</li>
              <li>You'll receive an email alert (if configured)</li>
            </ul>
          </div>

          <div className="mt-6 text-center">
            <a
              href="/"
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              ← Back to Home
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
