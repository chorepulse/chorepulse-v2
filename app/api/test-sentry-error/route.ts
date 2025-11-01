import { NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'

export async function GET() {
  try {
    // Simulate a server error
    throw new Error('Test Server Error - This is a test error from the API route')
  } catch (error) {
    // Capture the error in Sentry
    Sentry.captureException(error, {
      tags: {
        test: true,
        route: 'test-sentry-error',
      },
      extra: {
        endpoint: '/api/test-sentry-error',
        timestamp: new Date().toISOString(),
      },
    })

    // Return error response
    return NextResponse.json(
      {
        message: '✅ Server error captured and sent to Sentry!',
        error: (error as Error).message,
      },
      { status: 500 }
    )
  }
}
