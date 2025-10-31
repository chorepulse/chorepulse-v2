'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent, Checkbox, Badge } from '@/components/ui'

interface Task {
  id: string
  name: string
  description: string
  category: string
  points: number
  frequency: string
  ageAppropriate: string[]
}

// Sample task templates
const taskTemplates: Task[] = [
  {
    id: '1',
    name: 'Make Your Bed',
    description: 'Straighten sheets, fluff pillows, and tidy your bedding',
    category: 'Cleaning',
    points: 5,
    frequency: 'Daily',
    ageAppropriate: ['kid', 'teen']
  },
  {
    id: '2',
    name: 'Wash Dishes',
    description: 'Wash, dry, and put away all dishes after meals',
    category: 'Cleaning',
    points: 10,
    frequency: 'Daily',
    ageAppropriate: ['teen', 'adult']
  },
  {
    id: '3',
    name: 'Take Out Trash',
    description: 'Empty all trash bins and take to curb',
    category: 'Cleaning',
    points: 8,
    frequency: 'Weekly',
    ageAppropriate: ['teen', 'adult']
  },
  {
    id: '4',
    name: 'Feed Pets',
    description: 'Give pets food and fresh water',
    category: 'Pet Care',
    points: 5,
    frequency: 'Daily',
    ageAppropriate: ['kid', 'teen']
  },
  {
    id: '5',
    name: 'Homework',
    description: 'Complete all homework assignments',
    category: 'Homework',
    points: 15,
    frequency: 'Daily',
    ageAppropriate: ['kid', 'teen']
  },
  {
    id: '6',
    name: 'Vacuum Living Room',
    description: 'Vacuum all floors in the living room',
    category: 'Cleaning',
    points: 12,
    frequency: 'Weekly',
    ageAppropriate: ['teen', 'adult']
  }
]

export default function OnboardingTasksPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [selectedTasks, setSelectedTasks] = useState<string[]>([])
  const [showAskPulse, setShowAskPulse] = useState(false)

  useEffect(() => {
    // Verify user has completed previous steps
    const organizationName = sessionStorage.getItem('organizationName')
    const userPin = sessionStorage.getItem('userPin')
    if (!organizationName || !userPin) {
      router.push('/onboarding/organization')
    }
  }, [router])

  const handleToggleTask = (taskId: string) => {
    setSelectedTasks(prev =>
      prev.includes(taskId)
        ? prev.filter(id => id !== taskId)
        : [...prev, taskId]
    )
  }

  const handleSubmit = async () => {
    setIsLoading(true)

    try {
      // TODO: Create selected tasks in database
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Clear all onboarding data from sessionStorage
      sessionStorage.removeItem('signupData')
      sessionStorage.removeItem('organizationName')
      sessionStorage.removeItem('userPin')
      sessionStorage.removeItem('familyProfile')
      sessionStorage.removeItem('familyMembers')

      // Redirect to dashboard
      router.push('/dashboard')
    } catch (err) {
      console.error('Failed to create tasks:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSkip = () => {
    // Clear all onboarding data
    sessionStorage.removeItem('signupData')
    sessionStorage.removeItem('organizationName')
    sessionStorage.removeItem('userPin')
    sessionStorage.removeItem('familyProfile')
    sessionStorage.removeItem('familyMembers')

    router.push('/dashboard')
  }

  const getCategoryColor = (category: string) => {
    const colors: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
      'Cleaning': 'info',
      'Pet Care': 'success',
      'Homework': 'warning',
      'Cooking': 'danger'
    }
    return colors[category] || 'default'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Progress indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-2 h-2 rounded-full bg-blue-600"></div>
            <div className="w-2 h-2 rounded-full bg-blue-600"></div>
            <div className="w-2 h-2 rounded-full bg-blue-600"></div>
            <div className="w-2 h-2 rounded-full bg-blue-600"></div>
            <div className="w-2 h-2 rounded-full bg-blue-600"></div>
          </div>
          <p className="text-center text-sm text-gray-600">Step 5 of 5 (Optional)</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-2xl mb-4">
              <span className="text-3xl">✅</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Set Up Your First Tasks
            </h1>
            <p className="text-gray-600">
              Choose some tasks to get started, or let Pulse help you
            </p>
          </div>

          {/* Ask Pulse Button */}
          <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border-2 border-blue-200">
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0 text-3xl">🤖</div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-1">
                  Let Pulse Suggest Tasks
                </h3>
                <p className="text-sm text-gray-600">
                  Get personalized task recommendations based on your family profile
                </p>
              </div>
              <Button
                variant="primary"
                onClick={() => setShowAskPulse(true)}
              >
                Ask Pulse
              </Button>
            </div>
          </div>

          {/* Task Templates Grid */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Or choose from popular tasks:
            </h2>

            <div className="grid md:grid-cols-2 gap-4">
              {taskTemplates.map((task) => (
                <Card
                  key={task.id}
                  variant={selectedTasks.includes(task.id) ? 'outlined' : 'default'}
                  padding="md"
                  className="cursor-pointer hover:border-blue-300 transition-colors"
                  onClick={() => handleToggleTask(task.id)}
                >
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={selectedTasks.includes(task.id)}
                      onChange={() => handleToggleTask(task.id)}
                    />

                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-gray-900">{task.name}</h3>
                        <Badge variant={getCategoryColor(task.category)} size="sm">
                          {task.category}
                        </Badge>
                      </div>

                      <p className="text-sm text-gray-600 mb-3">
                        {task.description}
                      </p>

                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          ⭐ {task.points} points
                        </span>
                        <span className="flex items-center gap-1">
                          📅 {task.frequency}
                        </span>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Selected count */}
          {selectedTasks.length > 0 && (
            <div className="mb-6 p-3 bg-blue-50 rounded-xl text-center">
              <p className="text-sm text-blue-700">
                <strong>{selectedTasks.length}</strong> {selectedTasks.length === 1 ? 'task' : 'tasks'} selected
              </p>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-col gap-3 pt-4 border-t border-gray-200">
            <Button
              onClick={handleSubmit}
              variant="primary"
              size="lg"
              fullWidth
              isLoading={isLoading}
              disabled={selectedTasks.length === 0}
            >
              {selectedTasks.length > 0 ? `Create ${selectedTasks.length} ${selectedTasks.length === 1 ? 'Task' : 'Tasks'}` : 'Select Tasks to Continue'}
            </Button>

            <Button
              onClick={handleSkip}
              variant="ghost"
              size="lg"
              fullWidth
              disabled={isLoading}
            >
              Skip for Now
            </Button>
          </div>
        </div>

        {/* Help text */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>🎉 Almost done! You can add more tasks anytime</p>
        </div>
      </div>

      {/* TODO: Ask Pulse Modal */}
      {showAskPulse && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md">
            <h3 className="text-xl font-bold mb-2">Ask Pulse (Coming Soon)</h3>
            <p className="text-gray-600 mb-4">
              The AI-powered task suggestion feature will be available soon!
            </p>
            <Button onClick={() => setShowAskPulse(false)}>
              Close
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
