'use client'

import { useState } from 'react'
import { Modal, ModalFooter, Input, Select, Button, Textarea } from '@/components/ui'

interface QuickCreateRewardModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export function QuickCreateRewardModal({ isOpen, onClose, onSuccess }: QuickCreateRewardModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    points: 50,
    category: 'Privileges',
    icon: '🎁',
    requiresApproval: true
  })

  const categories = ['Screen Time', 'Food & Treats', 'Privileges', 'Items', 'Social', 'Digital', 'Outings', 'Money']

  const iconOptions = [
    '🎁', '🏆', '⭐', '💎', '🌟', '✨', '💫', '🎀',
    '🎬', '🎮', '🎵', '🎧', '🎨', '📸',
    '🍕', '🍔', '🍟', '🌭', '🍿', '🍩', '🍪', '🍦', '🎂',
    '💰', '💵', '🪙', '💳',
    '📱', '💻', '🖥️', '⌚', '🎧',
    '🚗', '🚲', '⛺', '🏕️', '🎡', '🎢', '🎪'
  ]

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      return
    }

    if (formData.points <= 0) {
      alert('Points must be greater than 0')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/rewards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        // Reset form
        setFormData({
          name: '',
          description: '',
          points: 50,
          category: 'Privileges',
          icon: '🎁',
          requiresApproval: true
        })

        onSuccess?.()
        onClose()
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to create reward')
      }
    } catch (error) {
      console.error('Error creating reward:', error)
      alert('Failed to create reward')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Quick Create Reward"
      description="Create a new reward for your family"
      size="lg"
    >
      <div className="space-y-4">
        {/* Reward Name */}
        <div>
          <label htmlFor="reward-name" className="block text-sm font-medium text-gray-700 mb-1">
            Reward Name *
          </label>
          <Input
            id="reward-name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., 30 minutes screen time"
            required
            aria-required="true"
            aria-label="Reward name"
          />
        </div>

        {/* Description */}
        <div>
          <label htmlFor="reward-description" className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <Textarea
            id="reward-description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="What does this reward include?"
            rows={2}
            aria-label="Reward description"
          />
        </div>

        {/* Category */}
        <div>
          <label htmlFor="reward-category" className="block text-sm font-medium text-gray-700 mb-1">
            Category
          </label>
          <Select
            id="reward-category"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            options={categories.map(cat => ({
              label: cat,
              value: cat
            }))}
            placeholder="Select category"
            aria-label="Reward category"
          />
        </div>

        {/* Points */}
        <div>
          <label htmlFor="reward-points" className="block text-sm font-medium text-gray-700 mb-1">
            Points Cost *
          </label>
          <Input
            id="reward-points"
            type="number"
            value={formData.points}
            onChange={(e) => setFormData({ ...formData, points: parseInt(e.target.value) || 0 })}
            min="1"
            required
            aria-required="true"
            aria-label="Reward points cost"
            aria-describedby="points-description"
            inputMode="numeric"
          />
          <p id="points-description" className="text-xs text-gray-500 mt-1">
            How many points does this reward cost?
          </p>
        </div>

        {/* Icon */}
        <div role="group" aria-labelledby="icon-label">
          <label id="icon-label" className="block text-sm font-medium text-gray-700 mb-2">
            Icon
          </label>
          <div className="grid grid-cols-12 gap-2 max-h-48 overflow-y-auto p-2 border border-gray-200 rounded-lg">
            {iconOptions.map((icon) => (
              <button
                key={icon}
                type="button"
                onClick={() => setFormData({ ...formData, icon })}
                className={`text-2xl p-2 rounded-lg border-2 transition-all ${
                  formData.icon === icon
                    ? 'border-blue-500 bg-blue-50 scale-110'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                aria-label={`Select ${icon} icon`}
                aria-pressed={formData.icon === icon}
              >
                {icon}
              </button>
            ))}
          </div>
        </div>

        {/* Options */}
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input
              id="reward-requiresApproval"
              type="checkbox"
              checked={formData.requiresApproval}
              onChange={(e) => setFormData({ ...formData, requiresApproval: e.target.checked })}
              className="w-4 h-4"
              aria-label="Requires approval from a parent or manager"
            />
            <span className="text-sm text-gray-700">
              Requires approval from a parent/manager
            </span>
          </label>
        </div>
      </div>

      <ModalFooter
        cancelText="Cancel"
        confirmText={isSubmitting ? 'Creating...' : 'Create Reward'}
        onCancel={onClose}
        onConfirm={handleSubmit}
        isLoading={isSubmitting}
      />
    </Modal>
  )
}
