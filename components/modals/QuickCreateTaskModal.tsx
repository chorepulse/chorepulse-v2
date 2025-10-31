'use client'

import { useState, useEffect } from 'react'
import { Modal, ModalFooter, Input, Select, Button, FrequencySelector } from '@/components/ui'
import type { FrequencyConfig } from '@/components/ui'
import { useAITaskParser } from '@/hooks/useAITaskParser'

interface QuickCreateTaskModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

interface TaskSuggestion {
  name: string
  description: string
  category: string
  emoji: string
  defaultPoints: number
  defaultFrequency: string
  reason: string
  ageAppropriate: string[]
  priority: number
}

export function QuickCreateTaskModal({ isOpen, onClose, onSuccess }: QuickCreateTaskModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [familyMembers, setFamilyMembers] = useState<Array<{ id: string; name: string; role?: string }>>([])
  const [suggestions, setSuggestions] = useState<TaskSuggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(true)
  const [appliedSuggestion, setAppliedSuggestion] = useState<string | null>(null)

  // AI Parser state
  const { parseTask, isParsing, lastParsed } = useAITaskParser()
  const [aiInput, setAiInput] = useState('')
  const [showAIParser, setShowAIParser] = useState(false)
  const [aiFeatureEnabled, setAiFeatureEnabled] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'cleaning',
    frequency: 'daily' as 'one-time' | 'daily' | 'weekly' | 'monthly' | 'custom',
    assignedTo: '' as string,
    points: 10,
    dueTime: '',
    requiresPhoto: false,
    requiresApproval: false
  })

  const [frequencyConfig, setFrequencyConfig] = useState<FrequencyConfig>({
    type: 'daily',
    daysOfWeek: [],
    dayOfMonth: 1,
    customDays: 1
  })

  useEffect(() => {
    if (isOpen) {
      fetchFamilyMembers()
      fetchSuggestions()
      // Check if AI features are enabled
      const aiEnabled = process.env.NEXT_PUBLIC_FEATURE_AI_ENABLED === 'true'
      setAiFeatureEnabled(aiEnabled)
      setShowAIParser(aiEnabled) // Auto-show if enabled
    }
  }, [isOpen])

  const fetchFamilyMembers = async () => {
    try {
      const response = await fetch('/api/users')
      if (response.ok) {
        const data = await response.json()
        setFamilyMembers(data.users || [])
      }
    } catch (error) {
      console.error('Error fetching family members:', error)
    }
  }

  const fetchSuggestions = async () => {
    try {
      const response = await fetch('/api/tasks/suggestions')
      if (response.ok) {
        const data = await response.json()
        setSuggestions(data.suggestions || [])
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error)
    }
  }

  const applySuggestion = (suggestion: TaskSuggestion) => {
    // Intelligently suggest assignee based on age appropriateness
    let suggestedAssignee = ''
    if (suggestion.ageAppropriate && suggestion.ageAppropriate.length > 0) {
      const ageCategories = suggestion.ageAppropriate

      // Try to find a family member matching the age category based on role
      const matchedMember = familyMembers.find(member => {
        if (!member.role) return false

        return ageCategories.some(ageCategory => {
          const category = ageCategory.toLowerCase()
          const role = member.role?.toLowerCase() || ''

          // Match based on role field
          if (category.includes('kid') || category.includes('child')) {
            return role === 'kid'
          }
          if (category.includes('teen')) {
            return role === 'teen'
          }
          if (category.includes('adult') || category.includes('parent')) {
            return role === 'parent' || role === 'admin' || role === 'manager'
          }
          return false
        })
      })

      if (matchedMember) {
        suggestedAssignee = matchedMember.id
      } else if (ageCategories.some(cat => cat.toLowerCase().includes('any') || cat.toLowerCase().includes('all'))) {
        // If suitable for anyone, suggest extra credit
        suggestedAssignee = 'extra-credit'
      }
      // If no specific match, leave empty for user choice
    }

    // Suggest a default time based on task category and frequency
    let suggestedTime = ''
    const category = suggestion.category.toLowerCase()
    const freq = suggestion.defaultFrequency.toLowerCase()

    // Morning tasks (6am-9am)
    if (category === 'personal_care' || suggestion.name.toLowerCase().includes('bed') ||
        suggestion.name.toLowerCase().includes('morning')) {
      suggestedTime = '07:00'
    }
    // Evening tasks (5pm-8pm)
    else if (category === 'cooking' || suggestion.name.toLowerCase().includes('dinner') ||
             suggestion.name.toLowerCase().includes('evening')) {
      suggestedTime = '18:00'
    }
    // Afternoon tasks (3pm-5pm)
    else if (category === 'homework' || suggestion.name.toLowerCase().includes('homework')) {
      suggestedTime = '15:00'
    }
    // Pet care - morning and evening
    else if (category === 'pet_care') {
      suggestedTime = suggestion.name.toLowerCase().includes('walk') ? '07:00' : '18:00'
    }
    // Outdoor/maintenance - afternoon
    else if (category === 'outdoor' || category === 'maintenance') {
      suggestedTime = '16:00'
    }
    // Default to end of day
    else {
      suggestedTime = '20:00'
    }

    // Pre-fill the form with suggestion data, but keep it editable
    setFormData({
      ...formData,
      name: suggestion.name,
      description: suggestion.description,
      category: suggestion.category,
      points: suggestion.defaultPoints,
      frequency: suggestion.defaultFrequency as any,
      assignedTo: suggestedAssignee, // Smart suggestion, still editable
      dueTime: suggestedTime // Smart suggestion based on task type
    })
    setFrequencyConfig({
      ...frequencyConfig,
      type: suggestion.defaultFrequency as any
    })
    // Track that a suggestion was applied
    setAppliedSuggestion(suggestion.name)
    // Hide suggestions panel to make room for form editing
    setShowSuggestions(false)
  }

  const handleAIParse = async () => {
    if (!aiInput.trim()) return

    const result = await parseTask(aiInput)

    if (result.success && result.parsed) {
      const parsed = result.parsed

      // Map recurrence types from AI parser to form values
      const recurrenceMap: Record<string, 'one-time' | 'daily' | 'weekly' | 'monthly' | 'custom'> = {
        'once': 'one-time',
        'daily': 'daily',
        'weekly': 'weekly',
        'monthly': 'monthly',
        'custom': 'custom'
      }

      // Try to match assignedTo suggestion to a family member
      let assignedUserId = ''
      if (parsed.assignedTo) {
        const suggestion = parsed.assignedTo.toLowerCase()

        // Try to find a matching family member by name
        const matchedMember = familyMembers.find(member =>
          member.name.toLowerCase().includes(suggestion) ||
          suggestion.includes(member.name.toLowerCase())
        )

        if (matchedMember) {
          assignedUserId = matchedMember.id
        } else if (suggestion.includes('anyone') || suggestion.includes('extra credit')) {
          assignedUserId = 'extra-credit'
        }
        // If no match, leave empty for user to select
      }

      // Apply parsed data to form
      setFormData({
        ...formData,
        name: parsed.name,
        description: parsed.description || '',
        category: parsed.category || 'other',
        frequency: recurrenceMap[parsed.recurrence || 'daily'] || 'daily',
        points: parsed.pointValue || 10,
        dueTime: parsed.time || '',
        requiresPhoto: parsed.photoRequired || false,
        assignedTo: assignedUserId // Use the matched user ID or empty
      })

      // Update frequency config with proper day selections
      const frequencyType = recurrenceMap[parsed.recurrence || 'daily'] || 'daily'
      const newFreqConfig: FrequencyConfig = {
        type: frequencyType,
        daysOfWeek: [],
        dayOfMonth: parsed.dayOfMonth || 1,
        customDays: 1
      }

      // Set daysOfWeek based on frequency type
      if (frequencyType === 'weekly' && parsed.dayOfWeek !== undefined) {
        // For weekly, set the specific day
        newFreqConfig.daysOfWeek = [parsed.dayOfWeek]
      } else if (frequencyType === 'custom' && parsed.customDays && parsed.customDays.length > 0) {
        // For custom, set multiple days
        newFreqConfig.daysOfWeek = parsed.customDays
      }

      setFrequencyConfig(newFreqConfig)

      // Track that AI was used
      setAppliedSuggestion(`AI: "${parsed.name}"`)
      setShowSuggestions(false)
      setAiInput('') // Clear AI input after successful parse
    }
  }

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      alert('Please enter a task name')
      return
    }

    if (!formData.assignedTo) {
      alert('Please select who to assign this task to')
      return
    }

    if (!formData.dueTime) {
      alert('Please set a due time for this task')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          assignedTo: formData.assignedTo === 'extra-credit' ? [] : [formData.assignedTo],
          frequencyConfig
        })
      })

      if (response.ok) {
        // Reset form
        setFormData({
          name: '',
          description: '',
          category: 'cleaning',
          frequency: 'daily',
          assignedTo: '',
          points: 10,
          dueTime: '',
          requiresPhoto: false,
          requiresApproval: false
        })
        setFrequencyConfig({
          type: 'daily',
          daysOfWeek: [],
          dayOfMonth: 1,
          customDays: 1
        })
        setAppliedSuggestion(null)
        setShowSuggestions(true)

        onSuccess?.()
        onClose()
      }
    } catch (error) {
      console.error('Error creating task:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleFrequencyChange = (frequency: 'one-time' | 'daily' | 'weekly' | 'monthly' | 'custom') => {
    setFormData({ ...formData, frequency })
    setFrequencyConfig({ ...frequencyConfig, type: frequency })
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Quick Create Task"
      description="Create a new task for your family"
      size="lg"
    >
      <div className="space-y-4">
        {/* AI Natural Language Parser */}
        {aiFeatureEnabled && showAIParser && !appliedSuggestion && (
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">🤖</span>
                <h4 className="text-sm font-semibold text-purple-900">Pulse AI - Describe Your Task</h4>
                <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-medium rounded">BETA</span>
              </div>
              <button
                onClick={() => setShowAIParser(false)}
                className="text-purple-600 hover:text-purple-800 text-xs"
              >
                Hide
              </button>
            </div>
            <p className="text-xs text-gray-600 mb-3">
              Just type what you want done, like "Clean the bathroom every Tuesday at 3pm" or "Take out trash on Mondays and Thursdays"
            </p>
            <div className="space-y-2">
              <textarea
                value={aiInput}
                onChange={(e) => setAiInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                    handleAIParse()
                  }
                }}
                placeholder="e.g., Take out the trash every Monday at 7pm worth 20 points"
                className="w-full px-3 py-2 border border-purple-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                rows={2}
                disabled={isParsing}
              />
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-500">
                  {isParsing ? 'Parsing with AI...' : 'Press Cmd/Ctrl + Enter or click Parse'}
                  {lastParsed && lastParsed.confidence !== undefined && (
                    <span className="ml-2 text-purple-600">
                      {lastParsed.success ? `✓ ${Math.round(lastParsed.confidence * 100)}% confident` : ''}
                    </span>
                  )}
                </p>
                <button
                  onClick={handleAIParse}
                  disabled={isParsing || !aiInput.trim()}
                  className="px-4 py-1.5 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isParsing ? 'Parsing...' : 'Parse with AI'}
                </button>
              </div>
              {lastParsed && !lastParsed.success && (
                <div className="bg-red-50 border border-red-200 rounded p-2">
                  <p className="text-xs text-red-700">
                    ⚠️ {lastParsed.error || 'Failed to parse task. Try being more specific.'}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {!showAIParser && aiFeatureEnabled && !appliedSuggestion && (
          <button
            onClick={() => setShowAIParser(true)}
            className="w-full text-left p-3 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg transition-colors"
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">🤖</span>
              <span className="text-sm font-medium text-purple-900">Try Pulse AI - Describe your task in plain English</span>
              <span className="px-2 py-0.5 bg-purple-600 text-white text-xs font-medium rounded">NEW</span>
            </div>
          </button>
        )}

        {/* Applied Suggestion Banner */}
        {appliedSuggestion && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-green-600">✓</span>
              <p className="text-sm text-green-800">
                <span className="font-medium">Template applied: "{appliedSuggestion}"</span>
                <span className="text-green-700"> - Review and customize the details below</span>
              </p>
            </div>
            <button
              onClick={() => {
                setAppliedSuggestion(null)
                setShowSuggestions(true)
              }}
              className="text-xs text-green-600 hover:text-green-800 font-medium"
            >
              Back to suggestions
            </button>
          </div>
        )}

        {/* Personalized Suggestions */}
        {showSuggestions && suggestions.length > 0 && !formData.name && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">💡</span>
                <h4 className="text-sm font-semibold text-blue-900">Suggested Tasks for Your Household</h4>
              </div>
              <button
                onClick={() => setShowSuggestions(false)}
                className="text-blue-600 hover:text-blue-800 text-xs"
              >
                Hide
              </button>
            </div>
            <p className="text-xs text-gray-600 mb-2">Click a suggestion to pre-fill the form, then customize as needed</p>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {suggestions.slice(0, 5).map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => applySuggestion(suggestion)}
                  className="w-full text-left p-3 bg-white rounded-lg border border-blue-100 hover:border-blue-300 hover:bg-blue-50 transition-all group"
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{suggestion.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 text-sm group-hover:text-blue-700">{suggestion.name}</p>
                      <p className="text-xs text-gray-600 mt-0.5">{suggestion.description}</p>
                      <p className="text-xs text-blue-600 mt-1 italic">{suggestion.reason}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-xs font-medium text-gray-700">{suggestion.defaultPoints} pts</span>
                      <span className="text-xs text-gray-500 capitalize">{suggestion.defaultFrequency}</span>
                      <span className="text-xs text-blue-600 font-medium mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        Use Template →
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
            {suggestions.length > 5 && (
              <p className="text-xs text-blue-600 mt-2 text-center">
                +{suggestions.length - 5} more suggestions available
              </p>
            )}
          </div>
        )}

        {/* Task Name */}
        <div>
          <label htmlFor="task-name" className="block text-sm font-medium text-gray-700 mb-1">
            Task Name *
            {!showSuggestions && suggestions.length > 0 && (
              <button
                onClick={() => setShowSuggestions(true)}
                className="ml-2 text-xs text-blue-600 hover:text-blue-800"
              >
                Show suggestions
              </button>
            )}
          </label>
          <Input
            id="task-name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., Take out trash"
            required
            aria-required="true"
            aria-label="Task name"
          />
        </div>

        {/* Category */}
        <div>
          <label htmlFor="task-category" className="block text-sm font-medium text-gray-700 mb-1">
            Category
          </label>
          <Select
            id="task-category"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            options={[
              { label: 'Cleaning', value: 'cleaning' },
              { label: 'Cooking', value: 'cooking' },
              { label: 'Outdoor', value: 'outdoor' },
              { label: 'Pet Care', value: 'pet_care' },
              { label: 'Homework', value: 'homework' },
              { label: 'Organization', value: 'organization' },
              { label: 'Errands', value: 'errands' },
              { label: 'Other', value: 'other' }
            ]}
            placeholder="Select category"
            aria-label="Task category"
          />
        </div>

        {/* Frequency */}
        <div>
          <label id="frequency-label" className="block text-sm font-medium text-gray-700 mb-1">
            Frequency
          </label>
          <FrequencySelector
            value={frequencyConfig}
            onChange={setFrequencyConfig}
            onTypeChange={handleFrequencyChange}
            aria-labelledby="frequency-label"
          />
        </div>

        {/* Assign To */}
        <div>
          <label htmlFor="task-assignedTo" className="block text-sm font-medium text-gray-700 mb-1">
            Assign To *
          </label>
          <Select
            id="task-assignedTo"
            value={formData.assignedTo}
            onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
            options={[
              ...familyMembers.map(member => ({
                label: member.name,
                value: member.id
              })),
              {
                label: 'Extra Credit (Anyone Can Claim)',
                value: 'extra-credit'
              }
            ]}
            placeholder="Select a user"
            required
            aria-required="true"
            aria-label="Assign task to family member"
            aria-describedby="assignedTo-description"
          />
          <p id="assignedTo-description" className="text-xs text-gray-500 mt-1">
            Select a specific person or "Extra Credit" for anyone to claim
          </p>
        </div>

        {/* Points & Due Time */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="task-points" className="block text-sm font-medium text-gray-700 mb-1">
              Points
            </label>
            <Input
              id="task-points"
              type="number"
              value={formData.points}
              onChange={(e) => setFormData({ ...formData, points: parseInt(e.target.value) || 0 })}
              min="0"
              aria-label="Task points value"
              inputMode="numeric"
            />
          </div>
          <div>
            <label htmlFor="task-dueTime" className="block text-sm font-medium text-gray-700 mb-1">
              Due Time *
            </label>
            <Input
              id="task-dueTime"
              type="time"
              value={formData.dueTime}
              onChange={(e) => setFormData({ ...formData, dueTime: e.target.value })}
              required
              aria-required="true"
              aria-label="Task due time"
              aria-describedby="dueTime-description"
            />
            <p id="dueTime-description" className="text-xs text-gray-500 mt-1">
              When must this task be completed by?
            </p>
          </div>
        </div>

        {/* Options */}
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input
              id="task-requiresPhoto"
              type="checkbox"
              checked={formData.requiresPhoto}
              onChange={(e) => setFormData({ ...formData, requiresPhoto: e.target.checked })}
              className="w-4 h-4"
              aria-label="Requires photo proof"
            />
            <span className="text-sm text-gray-700">Requires photo proof</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              id="task-requiresApproval"
              type="checkbox"
              checked={formData.requiresApproval}
              onChange={(e) => setFormData({ ...formData, requiresApproval: e.target.checked })}
              className="w-4 h-4"
              aria-label="Requires approval"
            />
            <span className="text-sm text-gray-700">Requires approval</span>
          </label>
        </div>
      </div>

      <ModalFooter
        cancelText="Cancel"
        confirmText={isSubmitting ? 'Creating...' : 'Create Task'}
        onCancel={onClose}
        onConfirm={handleSubmit}
        isLoading={isSubmitting}
      />
    </Modal>
  )
}
