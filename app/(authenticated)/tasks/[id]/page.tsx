'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardHeader, CardTitle, CardContent, Badge, Button, Alert } from '@/components/ui'
import { useToast } from '@/hooks/useToast'
import { ToastContainer } from '@/components/Toast'

interface Task {
  id: string
  name: string
  description: string
  category: string
  frequency: string
  pointValue: number
  dueTime?: string
  requiresPhoto: boolean
  requiresApproval: boolean
  status: 'active' | 'completed' | 'overdue'
  assignedToNames: string[]
  completedToday?: boolean
  isClaimed?: boolean
  claimExpiresAt?: string | null
}

export default function TaskDetailPage() {
  const router = useRouter()
  const params = useParams()
  const taskId = params.id as string
  const toast = useToast()

  const [task, setTask] = useState<Task | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notes, setNotes] = useState('')
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)

  // Fetch current user
  useEffect(() => {
    fetchCurrentUser()
  }, [])

  // Fetch task details
  useEffect(() => {
    if (taskId) {
      fetchTaskDetails()
    }
  }, [taskId])

  const fetchCurrentUser = async () => {
    try {
      const response = await fetch('/api/users/me')
      if (response.ok) {
        const data = await response.json()
        setCurrentUser(data.user)
      }
    } catch (err) {
      console.error('Error fetching user:', err)
    }
  }

  const fetchTaskDetails = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch(`/api/tasks/${taskId}`)

      if (!response.ok) {
        throw new Error('Failed to load task')
      }

      const data = await response.json()
      setTask(data.task)
    } catch (err: any) {
      console.error('Error fetching task:', err)
      setError(err.message || 'Failed to load task')
    } finally {
      setIsLoading(false)
    }
  }

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error('Photo must be less than 5MB')
        return
      }

      setPhotoFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async () => {
    if (!task) return

    try {
      setIsSubmitting(true)
      setError(null)

      // Validate photo requirement
      if (task.requiresPhoto && !photoFile) {
        setError('This task requires a photo!')
        toast.error('Please upload a photo to complete this task')
        return
      }

      let photoUrl = null

      // Upload photo if provided
      if (photoFile) {
        // TODO: Implement actual photo upload to storage (e.g., Supabase Storage)
        // For now, we'll use a placeholder
        photoUrl = 'https://placeholder.com/photo.jpg'
      }

      // Complete the task
      const response = await fetch(`/api/tasks/${task.id}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          photoUrl,
          notes: notes || null
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to complete task')
      }

      const data = await response.json()

      // Show success animation
      setShowSuccess(true)

      // Show toast
      if (data.pointsAwarded > 0) {
        toast.success(`🎉 ${data.message}`)
      } else {
        toast.info(`⏳ ${data.message}`)
      }

      // Redirect after 2 seconds
      setTimeout(() => {
        // Determine dashboard route based on user role
        const dashboardRoute = currentUser?.role === 'kid'
          ? '/dashboard/kid'
          : currentUser?.role === 'teen'
          ? '/dashboard/teen'
          : '/dashboard/adult'
        router.push(dashboardRoute)
      }, 2000)
    } catch (err: any) {
      console.error('Error completing task:', err)
      setError(err.message || 'Failed to complete task')
      toast.error(err.message || 'Failed to complete task')
    } finally {
      setIsSubmitting(false)
    }
  }

  const getTaskEmoji = (taskName: string, category: string) => {
    const name = taskName.toLowerCase()
    if (name.includes('bed')) return '🛏️'
    if (name.includes('homework') || name.includes('study')) return '📚'
    if (name.includes('dog') || name.includes('pet')) return '🐕'
    if (name.includes('cat')) return '🐱'
    if (name.includes('toy') || name.includes('clean')) return '🧸'
    if (name.includes('dish')) return '🍽️'
    if (name.includes('trash') || name.includes('garbage')) return '🗑️'
    if (name.includes('room')) return '🧹'
    if (name.includes('laundry')) return '👕'
    if (name.includes('plant') || name.includes('water')) return '🌱'
    if (name.includes('cook') || name.includes('meal')) return '🍳'
    if (name.includes('read')) return '📖'
    if (name.includes('exercise') || name.includes('play')) return '⚽'

    // Fallback to category
    const cat = category.toLowerCase()
    if (cat.includes('clean')) return '🧹'
    if (cat.includes('cook')) return '🍳'
    if (cat.includes('outdoor')) return '🌳'
    if (cat.includes('pet')) return '🐾'
    if (cat.includes('homework')) return '📚'

    return '✨'
  }

  const getTimeOfDay = (dueTime: string) => {
    if (!dueTime) return 'Anytime'
    const hour = parseInt(dueTime.split(':')[0])
    if (hour < 12) return 'Morning'
    if (hour < 17) return 'Afternoon'
    return 'Evening'
  }

  const isKid = currentUser?.role === 'kid'

  if (isLoading) {
    return (
      <div className={`min-h-screen ${isKid ? 'bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100' : 'bg-gray-50'} p-4 flex items-center justify-center`}>
        <div className="text-center">
          <div className={`text-6xl mb-4 ${isKid ? 'animate-bounce' : 'animate-spin'}`}>
            {isKid ? '🎨' : '⏳'}
          </div>
          <p className={`text-2xl font-bold ${isKid ? 'bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent' : 'text-gray-700'}`}>
            Loading task...
          </p>
        </div>
      </div>
    )
  }

  if (error || !task) {
    return (
      <div className={`min-h-screen ${isKid ? 'bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100' : 'bg-gray-50'} p-4 flex items-center justify-center`}>
        <Card variant="elevated" padding="lg" className="max-w-md">
          <div className="text-center">
            <div className="text-6xl mb-4">😢</div>
            <p className={`text-2xl font-bold mb-2 ${isKid ? 'text-gray-900' : 'text-gray-700'}`}>
              {isKid ? 'Oops!' : 'Error'}
            </p>
            <p className="text-gray-600 mb-4">{error || 'Task not found'}</p>
            <Button variant="primary" onClick={() => router.back()}>
              Go Back
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  // Success animation screen
  if (showSuccess) {
    return (
      <div className={`min-h-screen ${isKid ? 'bg-gradient-to-br from-green-100 via-blue-100 to-purple-100' : 'bg-gray-50'} p-4 flex items-center justify-center`}>
        <Card variant="elevated" padding="lg" className="max-w-2xl">
          <div className="text-center py-8">
            <div className="text-9xl mb-6 animate-bounce">🎉</div>
            <h1 className={`${isKid ? 'text-6xl' : 'text-5xl'} font-black mb-4 ${isKid ? 'bg-gradient-to-r from-green-600 via-blue-600 to-purple-600 bg-clip-text text-transparent' : 'text-green-600'}`}>
              {isKid ? 'AWESOME JOB!' : 'Task Complete!'}
            </h1>
            <p className={`${isKid ? 'text-3xl' : 'text-2xl'} font-bold text-gray-700 mb-6`}>
              {task.requiresApproval
                ? (isKid ? "Wait for approval to get your points! 🌟" : "Waiting for approval")
                : `You earned ${task.pointValue} points! 🌟`}
            </p>
            <div className="text-7xl mb-4">✨</div>
            <p className="text-gray-600">Redirecting you back...</p>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className={`min-h-screen ${isKid ? 'bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100' : 'bg-gray-50'} p-4 pb-24`}>
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className={`mb-6 flex items-center gap-2 ${isKid ? 'text-purple-600 hover:text-purple-700 text-xl font-bold' : 'text-gray-600 hover:text-gray-900'} transition-colors`}
        >
          <svg className={`${isKid ? 'w-8 h-8' : 'w-5 h-5'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          {isKid ? 'Back' : 'Back to Tasks'}
        </button>

        {error && (
          <Alert variant="danger" className="mb-6" onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Task Header */}
        <Card
          variant="elevated"
          padding="lg"
          className={`mb-6 ${isKid ? 'border-4 border-blue-300 bg-gradient-to-br from-white to-blue-50' : ''}`}
        >
          <div className="flex items-start gap-4">
            <div className={`${isKid ? 'text-8xl animate-bounce' : 'text-6xl'} flex-shrink-0`}>
              {getTaskEmoji(task.name, task.category)}
            </div>
            <div className="flex-1">
              <h1 className={`${isKid ? 'text-5xl font-black bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent' : 'text-4xl font-bold text-gray-900'} mb-3`}>
                {task.name}
              </h1>

              {task.description && (
                <p className={`${isKid ? 'text-2xl font-bold' : 'text-lg'} text-gray-700 mb-4`}>
                  {task.description}
                </p>
              )}

              <div className="flex items-center gap-3 flex-wrap mb-4">
                <Badge variant="info" size={isKid ? "lg" : "md"} className={isKid ? "text-lg px-4 py-2 font-bold" : ""}>
                  ⏰ {getTimeOfDay(task.dueTime || '')}
                </Badge>
                <Badge variant="success" size={isKid ? "lg" : "md"} className={isKid ? "text-lg px-4 py-2 font-bold" : ""}>
                  {task.frequency}
                </Badge>
              </div>

              {/* Points Display */}
              <div className={`inline-flex items-center gap-2 ${isKid ? 'bg-gradient-to-r from-yellow-400 to-orange-400 border-4 border-yellow-300 px-8 py-4 rounded-3xl' : 'bg-gradient-to-r from-warm-orange to-heartbeat-red px-4 py-2 rounded-lg'} shadow-lg`}>
                <span className={`${isKid ? 'text-5xl' : 'text-2xl'} font-black text-white`}>
                  +{task.pointValue}
                </span>
                <span className={`${isKid ? 'text-2xl' : 'text-sm'} text-white font-bold ${isKid ? '' : 'uppercase tracking-wide'}`}>
                  {isKid ? 'Points!' : 'pts'}
                </span>
              </div>
            </div>
          </div>

          {/* Requirements */}
          {(task.requiresPhoto || task.requiresApproval) && (
            <div className={`mt-6 pt-6 border-t ${isKid ? 'border-blue-200' : 'border-gray-200'} flex flex-col gap-3`}>
              {task.requiresPhoto && (
                <div className={`flex items-center gap-3 ${isKid ? 'text-xl font-bold' : 'text-base'} text-gray-700`}>
                  <span className={isKid ? "text-4xl" : "text-2xl"}>📸</span>
                  <span>{isKid ? "You need to take a photo!" : "Photo required for completion"}</span>
                </div>
              )}
              {task.requiresApproval && (
                <div className={`flex items-center gap-3 ${isKid ? 'text-xl font-bold' : 'text-base'} text-gray-700`}>
                  <span className={isKid ? "text-4xl" : "text-2xl"}>✓</span>
                  <span>{isKid ? "A grown-up will check your work!" : "Requires approval before points are awarded"}</span>
                </div>
              )}
            </div>
          )}
        </Card>

        {/* Completion Form */}
        <Card
          variant="elevated"
          padding="lg"
          className={isKid ? 'border-4 border-purple-300' : ''}
        >
          <CardHeader>
            <CardTitle className={isKid ? 'text-4xl font-black text-gray-900' : 'text-2xl'}>
              {isKid ? "Let's Do This! 🚀" : "Complete This Task"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Photo Upload */}
              <div>
                <label className={`block ${isKid ? 'text-2xl font-black' : 'text-sm font-medium'} text-gray-700 mb-3`}>
                  {task.requiresPhoto ? (
                    isKid ? "📸 Take a Photo! (Required)" : "Photo (Required)"
                  ) : (
                    isKid ? "📸 Take a Photo! (Optional)" : "Photo (Optional)"
                  )}
                </label>

                {photoPreview ? (
                  <div className="relative">
                    <img
                      src={photoPreview}
                      alt="Task completion"
                      className={`w-full ${isKid ? 'h-80' : 'h-64'} object-cover rounded-xl border-4 ${isKid ? 'border-blue-300' : 'border-gray-200'}`}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setPhotoFile(null)
                        setPhotoPreview(null)
                      }}
                      className={`absolute ${isKid ? 'top-4 right-4 p-4' : 'top-2 right-2 p-2'} bg-red-500 text-white rounded-full hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 shadow-lg`}
                      aria-label="Remove photo"
                    >
                      <svg className={`${isKid ? 'w-8 h-8' : 'w-5 h-5'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Take Photo Button */}
                    <label className={`flex flex-col items-center justify-center w-full ${isKid ? 'h-40 border-4 border-blue-400 rounded-3xl bg-gradient-to-r from-blue-500 to-purple-500' : 'h-32 border-2 border-blue-500 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600'} cursor-pointer hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-102`}>
                      <div className="flex flex-col items-center justify-center">
                        <svg className={`${isKid ? 'w-16 h-16' : 'w-10 h-10'} text-white mb-2`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <p className={`${isKid ? 'text-3xl font-black' : 'text-lg font-bold'} text-white mb-1`}>
                          {isKid ? "📷 Take a Photo Now!" : "📷 Take Photo"}
                        </p>
                        <p className={`${isKid ? 'text-lg' : 'text-sm'} text-white/90`}>
                          {isKid ? "Use your camera" : "Open camera"}
                        </p>
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        capture="environment"
                        onChange={handlePhotoChange}
                        aria-label="Take photo with camera"
                      />
                    </label>

                    {/* Or Divider */}
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-300"></div>
                      </div>
                      <div className="relative flex justify-center">
                        <span className={`px-3 ${isKid ? 'text-xl font-bold' : 'text-sm'} bg-white text-gray-500`}>
                          or
                        </span>
                      </div>
                    </div>

                    {/* Choose from Device Button */}
                    <label className={`flex flex-col items-center justify-center w-full ${isKid ? 'h-32 border-4 border-dashed border-gray-400 rounded-3xl bg-gray-50' : 'h-24 border-2 border-dashed border-gray-300 rounded-xl bg-white'} cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors`}>
                      <div className="flex flex-col items-center justify-center">
                        <svg className={`${isKid ? 'w-12 h-12' : 'w-8 h-8'} text-gray-400 mb-2`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p className={`${isKid ? 'text-2xl font-bold' : 'text-sm'} text-gray-600`}>
                          {isKid ? "📁 Choose from Device" : "Choose from device"}
                        </p>
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handlePhotoChange}
                        aria-label="Choose photo from device"
                      />
                    </label>
                  </div>
                )}
              </div>

              {/* Notes */}
              <div>
                <label htmlFor="completion-notes" className={`block ${isKid ? 'text-2xl font-black' : 'text-sm font-medium'} text-gray-700 mb-3`}>
                  {isKid ? "📝 Anything to say? (Optional)" : "Notes (Optional)"}
                </label>
                <textarea
                  id="completion-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={isKid ? "Tell us about it..." : "Add any notes about completing this task..."}
                  className={`w-full ${isKid ? 'px-6 py-4 text-xl border-4 border-blue-300 rounded-3xl' : 'px-4 py-3 border border-gray-300 rounded-xl'} focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none`}
                  rows={isKid ? 4 : 3}
                  aria-label="Task completion notes"
                />
              </div>

              {/* Submit Button */}
              <div className="pt-4">
                <Button
                  variant="primary"
                  size={isKid ? "lg" : "md"}
                  fullWidth
                  onClick={handleSubmit}
                  disabled={isSubmitting || (task.requiresPhoto && !photoFile)}
                  className={isKid
                    ? "text-4xl py-8 font-black bg-gradient-to-r from-green-500 via-blue-500 to-purple-500 hover:from-green-600 hover:via-blue-600 hover:to-purple-600 transform hover:scale-105 transition-all shadow-2xl"
                    : "text-lg py-4 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
                  }
                >
                  {isSubmitting ? (
                    isKid ? "⏳ Finishing..." : "Completing..."
                  ) : (
                    isKid ? "✅ I'M DONE!" : "✓ Complete Task"
                  )}
                </Button>

                {task.requiresPhoto && !photoFile && (
                  <p className={`mt-3 text-center ${isKid ? 'text-xl font-bold' : 'text-sm'} text-red-600`}>
                    {isKid ? "📸 Don't forget to take a photo!" : "Photo is required to complete this task"}
                  </p>
                )}
              </div>

              {/* Info Box */}
              {task.requiresApproval && (
                <div className={`p-4 ${isKid ? 'bg-blue-100 border-4 border-blue-300 rounded-3xl' : 'bg-blue-50 border border-blue-200 rounded-lg'} ${isKid ? 'text-xl font-bold' : 'text-sm'} text-blue-800`}>
                  {isKid ? (
                    <>
                      <span className="text-3xl mr-2">👀</span>
                      A grown-up will check your work before you get your points!
                    </>
                  ) : (
                    <>
                      <strong>Note:</strong> This task requires approval from a family manager. Your points will be awarded after approval.
                    </>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Toast Notifications */}
      <ToastContainer toasts={toast.toasts} onRemove={toast.removeToast} />
    </div>
  )
}
