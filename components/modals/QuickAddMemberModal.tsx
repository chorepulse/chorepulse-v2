'use client'

import { useState } from 'react'
import { Modal, ModalFooter, Input, Select, Button } from '@/components/ui'

interface QuickAddMemberModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export function QuickAddMemberModal({ isOpen, onClose, onSuccess }: QuickAddMemberModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'kid' as 'adult' | 'teen' | 'kid',
    avatar: '😊',
    color: '#3B82F6',
    pin: '',
    birthday: '',
    parentConsent: false
  })

  const avatarOptions = ['😊', '😎', '🤓', '😺', '🐶', '🦁', '🐼', '🦊', '🐯', '🐸', '🦄', '🌟', '⚡', '🔥', '💎', '🎨', '🎮', '⚽', '🎸', '🚀']
  const colorOptions = [
    { name: 'Blue', value: '#3B82F6' },
    { name: 'Purple', value: '#8B5CF6' },
    { name: 'Pink', value: '#EC4899' },
    { name: 'Red', value: '#EF4444' },
    { name: 'Orange', value: '#F97316' },
    { name: 'Yellow', value: '#EAB308' },
    { name: 'Green', value: '#10B981' },
    { name: 'Teal', value: '#14B8A6' }
  ]

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      return
    }

    // Validate role-specific requirements
    if (formData.role === 'adult' && !formData.email) {
      alert('Email is required for adult members')
      return
    }

    if (formData.role === 'kid' && formData.pin.length !== 4) {
      alert('4-digit PIN is required for kids')
      return
    }

    if (formData.role === 'teen' && !formData.email && formData.pin.length !== 4) {
      alert('Teens must have either an email address or a 4-digit PIN')
      return
    }

    // Validate parental consent for children under 13
    if (formData.birthday) {
      const birthDate = new Date(formData.birthday)
      const today = new Date()
      const age = today.getFullYear() - birthDate.getFullYear()
      const monthDiff = today.getMonth() - birthDate.getMonth()
      const actualAge = (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) ? age - 1 : age

      if (actualAge < 13 && !formData.parentConsent) {
        alert('Parental consent is required for children under 13')
        return
      }
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        // Reset form
        setFormData({
          name: '',
          email: '',
          role: 'kid',
          avatar: '😊',
          color: '#3B82F6',
          pin: '',
          birthday: '',
          parentConsent: false
        })

        onSuccess?.()
        onClose()
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to add family member')
      }
    } catch (error) {
      console.error('Error adding family member:', error)
      alert('Failed to add family member')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Quick Add Family Member"
      description="Add a new member to your family"
      size="lg"
    >
      <div className="space-y-4">
        {/* Name */}
        <div>
          <label htmlFor="member-name" className="block text-sm font-medium text-gray-700 mb-1">
            Name *
          </label>
          <Input
            id="member-name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., Emma"
            required
            aria-required="true"
            aria-label="Family member name"
          />
        </div>

        {/* Role */}
        <div>
          <label htmlFor="member-role" className="block text-sm font-medium text-gray-700 mb-1">
            Role *
          </label>
          <Select
            id="member-role"
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value as 'adult' | 'teen' | 'kid', email: '', pin: '' })}
            options={[
              { label: 'Kid (Ages 5-11)', value: 'kid' },
              { label: 'Teen (Ages 12-17)', value: 'teen' },
              { label: 'Adult', value: 'adult' }
            ]}
            placeholder="Select role"
            required
            aria-required="true"
            aria-label="Family member role"
          />
        </div>

        {/* Email (for adults - required, for teens - optional) */}
        {(formData.role === 'adult' || formData.role === 'teen') && (
          <div>
            <label htmlFor="member-email" className="block text-sm font-medium text-gray-700 mb-1">
              Email {formData.role === 'adult' ? '*' : '(optional)'}
            </label>
            <Input
              id="member-email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="email@example.com"
              required={formData.role === 'adult'}
              aria-required={formData.role === 'adult' ? 'true' : 'false'}
              aria-label={`Email address ${formData.role === 'adult' ? '(required)' : '(optional)'}`}
              aria-describedby="email-description"
            />
            <p id="email-description" className="text-xs text-gray-500 mt-1">
              {formData.role === 'adult'
                ? 'Adult members will receive an email invitation'
                : 'Optional email for notifications and account recovery'}
            </p>
          </div>
        )}

        {/* PIN (for kids/teens) */}
        {(formData.role === 'kid' || formData.role === 'teen') && (
          <div>
            <label htmlFor="member-pin" className="block text-sm font-medium text-gray-700 mb-1">
              4-Digit PIN {formData.role === 'kid' || (formData.role === 'teen' && !formData.email) ? '*' : '(optional)'}
            </label>
            <Input
              id="member-pin"
              type="password"
              value={formData.pin}
              onChange={(e) => setFormData({ ...formData, pin: e.target.value.replace(/\D/g, '').slice(0, 4) })}
              placeholder="1234"
              maxLength={4}
              required={formData.role === 'kid' || (formData.role === 'teen' && !formData.email)}
              aria-required={formData.role === 'kid' || (formData.role === 'teen' && !formData.email) ? 'true' : 'false'}
              aria-label="4-digit PIN for login"
              aria-describedby="pin-description"
              inputMode="numeric"
            />
            <p id="pin-description" className="text-xs text-gray-500 mt-1">
              {formData.role === 'kid'
                ? 'Kids will use this PIN to log in'
                : formData.email
                  ? 'Optional PIN for quick login (or use email/password)'
                  : 'Teens will use this PIN to log in'}
            </p>
          </div>
        )}

        {/* Birthday (Optional) */}
        <div>
          <label htmlFor="member-birthday" className="block text-sm font-medium text-gray-700 mb-1">
            Birthday (optional)
          </label>
          <Input
            id="member-birthday"
            type="date"
            value={formData.birthday}
            onChange={(e) => setFormData({ ...formData, birthday: e.target.value })}
            aria-label="Birthday (optional)"
            aria-describedby="birthday-description"
          />
          <p id="birthday-description" className="text-xs text-gray-500 mt-1">
            Helps us provide age-appropriate content and experiences. Leave blank to skip.
          </p>
        </div>

        {/* Parental Consent for Children (conditionally shown) */}
        {formData.birthday && (() => {
          const birthDate = new Date(formData.birthday)
          const today = new Date()
          const age = today.getFullYear() - birthDate.getFullYear()
          const monthDiff = today.getMonth() - birthDate.getMonth()
          const actualAge = (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) ? age - 1 : age

          return actualAge < 13 ? (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={formData.parentConsent}
                  onChange={(e) => setFormData({ ...formData, parentConsent: e.target.checked })}
                  className="w-4 h-4 mt-1"
                  required
                />
                <div>
                  <p className="text-sm font-semibold text-gray-900">Parental Consent Required</p>
                  <p className="text-xs text-gray-700 mt-1">
                    I am the parent/guardian and give consent to collect and store birthday information for this child under 13 years old, in accordance with COPPA regulations. This information will be used to provide age-appropriate content and experiences.
                  </p>
                  <p className="text-xs text-gray-600 mt-2">
                    By checking this box, you will receive a confirmation email. Read our{' '}
                    <a href="/privacy" target="_blank" className="text-blue-600 hover:underline font-medium">
                      Privacy Policy
                    </a>{' '}
                    for details on how we protect your child's information.
                  </p>
                </div>
              </label>
            </div>
          ) : null
        })()}

        {/* Avatar */}
        <div role="group" aria-labelledby="avatar-label">
          <label id="avatar-label" className="block text-sm font-medium text-gray-700 mb-2">
            Avatar
          </label>
          <div className="grid grid-cols-10 gap-2">
            {avatarOptions.map((avatar) => (
              <button
                key={avatar}
                type="button"
                onClick={() => setFormData({ ...formData, avatar })}
                className={`text-2xl p-2 rounded-lg border-2 transition-all ${
                  formData.avatar === avatar
                    ? 'border-blue-500 bg-blue-50 scale-110'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                aria-label={`Select ${avatar} avatar`}
                aria-pressed={formData.avatar === avatar}
              >
                {avatar}
              </button>
            ))}
          </div>
        </div>

        {/* Color */}
        <div role="group" aria-labelledby="color-label">
          <label id="color-label" className="block text-sm font-medium text-gray-700 mb-2">
            Color
          </label>
          <div className="grid grid-cols-8 gap-2">
            {colorOptions.map((color) => (
              <button
                key={color.value}
                type="button"
                onClick={() => setFormData({ ...formData, color: color.value })}
                className={`w-10 h-10 rounded-lg border-2 transition-all ${
                  formData.color === color.value
                    ? 'border-gray-900 scale-110'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                style={{ backgroundColor: color.value }}
                aria-label={`Select ${color.name} color`}
                aria-pressed={formData.color === color.value}
              />
            ))}
          </div>
        </div>
      </div>

      <ModalFooter
        cancelText="Cancel"
        confirmText={isSubmitting ? 'Adding...' : 'Add Member'}
        onCancel={onClose}
        onConfirm={handleSubmit}
        isLoading={isSubmitting}
      />
    </Modal>
  )
}
