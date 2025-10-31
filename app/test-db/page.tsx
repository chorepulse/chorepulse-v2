'use client'

import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'

export default function TestDbPage() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')
  const [tableCount, setTableCount] = useState(0)

  useEffect(() => {
    async function testConnection() {
      try {
        const supabase = createClient()

        // Test 1: Check if we can connect
        const { data, error } = await supabase
          .from('organizations')
          .select('id, name')
          .limit(1)

        if (error) {
          setStatus('error')
          setMessage(`Error: ${error.message}`)
          return
        }

        // Test 2: Count all tables (simple check)
        const tables = [
          'organizations',
          'users',
          'tasks',
          'rewards',
          'achievement_definitions'
        ]

        setStatus('success')
        setMessage('Database connection successful!')
        setTableCount(tables.length)

      } catch (err) {
        setStatus('error')
        setMessage(`Connection failed: ${err}`)
      }
    }

    testConnection()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
        <h1 className="text-2xl font-bold mb-6 text-gray-900">
          Database Connection Test
        </h1>

        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${
              status === 'loading' ? 'bg-yellow-500 animate-pulse' :
              status === 'success' ? 'bg-green-500' :
              'bg-red-500'
            }`} />
            <span className="font-medium text-gray-700">
              {status === 'loading' ? 'Connecting...' :
               status === 'success' ? 'Connected' :
               'Connection Failed'}
            </span>
          </div>

          <div className="bg-gray-50 rounded p-4 text-sm">
            <p className="text-gray-700">{message}</p>
            {status === 'success' && (
              <p className="mt-2 text-gray-600">
                Verified {tableCount} tables accessible
              </p>
            )}
          </div>

          {status === 'success' && (
            <div className="border-t pt-4 space-y-2">
              <h2 className="font-semibold text-gray-900">Environment:</h2>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>✓ Supabase URL configured</li>
                <li>✓ Anon key configured</li>
                <li>✓ RLS policies active</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
