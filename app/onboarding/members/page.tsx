'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Input, Select, Modal, ModalFooter, Avatar, Badge } from '@/components/ui'

interface FamilyMember {
  id: string
  firstName: string
  lastName: string
  role: 'adult' | 'teen' | 'kid'
  email?: string
  pin: string
  avatar?: string
}

const roleOptions = [
  { label: 'Adult', value: 'adult' },
  { label: 'Teen (13-17)', value: 'teen' },
  { label: 'Kid (Under 13)', value: 'kid' }
]

export default function OnboardingMembersPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [members, setMembers] = useState<FamilyMember[]>([])
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    role: '' as 'adult' | 'teen' | 'kid' | '',
    email: '',
    pin: ''
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    // Verify user has completed previous steps
    const organizationName = sessionStorage.getItem('organizationName')
    const userPin = sessionStorage.getItem('userPin')
    if (!organizationName || !userPin) {
      router.push('/onboarding/organization')
    }
  }, [router])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required'
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required'
    }

    if (!formData.role) {
      newErrors.role = 'Role is required'
    }

    if (formData.role === 'adult' || formData.role === 'teen') {
      if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = 'Invalid email address'
      }
    }

    if (!formData.pin) {
      newErrors.pin = 'PIN is required'
    } else if (!/^\d{4}$/.test(formData.pin)) {
      newErrors.pin = 'PIN must be 4 digits'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleAddMember = () => {
    if (!validateForm()) {
      return
    }

    const newMember: FamilyMember = {
      id: Math.random().toString(36).substr(2, 9),
      firstName: formData.firstName,
      lastName: formData.lastName,
      role: formData.role as 'adult' | 'teen' | 'kid',
      email: formData.email || undefined,
      pin: formData.pin
    }

    setMembers(prev => [...prev, newMember])
    setShowAddModal(false)
    resetForm()
  }

  const handleRemoveMember = (id: string) => {
    setMembers(prev => prev.filter(m => m.id !== id))
  }

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      role: '',
      email: '',
      pin: ''
    })
    setErrors({})
  }

  const handleSubmit = async () => {
    setIsLoading(true)

    try {
      // TODO: Save family members to database
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Store members data
      sessionStorage.setItem('familyMembers', JSON.stringify(members))

      // Redirect to tasks setup
      router.push('/onboarding/tasks')
    } catch (err) {
      console.error('Failed to save members:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSkip = () => {
    router.push('/onboarding/tasks')
  }

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'adult':
        return 'info'
      case 'teen':
        return 'success'
      case 'kid':
        return 'warning'
      default:
        return 'default'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Progress indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-2 h-2 rounded-full bg-blue-600"></div>
            <div className="w-2 h-2 rounded-full bg-blue-600"></div>
            <div className="w-2 h-2 rounded-full bg-blue-600"></div>
            <div className="w-2 h-2 rounded-full bg-blue-600"></div>
            <div className="w-2 h-2 rounded-full bg-gray-300"></div>
          </div>
          <p className="text-center text-sm text-gray-600">Step 4 of 5 (Optional)</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-2xl mb-4">
              <span className="text-3xl">👨‍👩‍👧‍👦</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Add Family Members
            </h1>
            <p className="text-gray-600">
              Add everyone who will use ChorePulse
            </p>
          </div>

          {/* Members list */}
          {members.length > 0 ? (
            <div className="space-y-3 mb-6">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center gap-4 p-4 border border-gray-200 rounded-xl hover:border-gray-300 transition-colors"
                >
                  <Avatar
                    alt={`${member.firstName} ${member.lastName}`}
                    size="lg"
                  />

                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">
                      {member.firstName} {member.lastName}
                    </h3>
                    {member.email && (
                      <p className="text-sm text-gray-600">{member.email}</p>
                    )}
                  </div>

                  <Badge variant={getRoleBadgeVariant(member.role)}>
                    {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                  </Badge>

                  <button
                    onClick={() => handleRemoveMember(member.id)}
                    className="text-red-600 hover:text-red-700 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 mb-6 border-2 border-dashed border-gray-300 rounded-xl">
              <p className="text-gray-600">No family members added yet</p>
              <p className="text-sm text-gray-500 mt-1">Click the button below to add your first member</p>
            </div>
          )}

          <Button
            onClick={() => setShowAddModal(true)}
            variant="outline"
            size="lg"
            fullWidth
            className="mb-6"
          >
            + Add Family Member
          </Button>

          <div className="flex flex-col gap-3 pt-4 border-t border-gray-200">
            <Button
              onClick={handleSubmit}
              variant="primary"
              size="lg"
              fullWidth
              isLoading={isLoading}
              disabled={members.length === 0}
            >
              Continue
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
          <p>💡 You can add more family members later in settings</p>
        </div>
      </div>

      {/* Add Member Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false)
          resetForm()
        }}
        title="Add Family Member"
        size="md"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="First Name"
              type="text"
              value={formData.firstName}
              onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
              error={errors.firstName}
              placeholder="John"
              required
            />

            <Input
              label="Last Name"
              type="text"
              value={formData.lastName}
              onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
              error={errors.lastName}
              placeholder="Doe"
              required
            />
          </div>

          <Select
            label="Role"
            options={roleOptions}
            value={formData.role}
            onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value as any }))}
            error={errors.role}
            required
          />

          {(formData.role === 'adult' || formData.role === 'teen') && (
            <Input
              label="Email Address"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              error={errors.email}
              placeholder="email@example.com"
              helperText={formData.role === 'teen' ? 'Optional for teens' : 'Optional'}
            />
          )}

          {formData.role === 'kid' && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-xl text-sm text-yellow-800">
              <strong>Note:</strong> Kids under 13 cannot have email addresses (COPPA compliance)
            </div>
          )}

          <Input
            label="PIN (4 digits)"
            type="text"
            inputMode="numeric"
            maxLength={4}
            value={formData.pin}
            onChange={(e) => setFormData(prev => ({ ...prev, pin: e.target.value.replace(/\D/g, '') }))}
            error={errors.pin}
            placeholder="1234"
            helperText="Used for quick login"
            required
          />
        </div>

        <ModalFooter
          onCancel={() => {
            setShowAddModal(false)
            resetForm()
          }}
          onConfirm={handleAddMember}
          confirmText="Add Member"
        />
      </Modal>
    </div>
  )
}
