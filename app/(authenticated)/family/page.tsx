'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardHeader, CardTitle, CardContent, Button, Input, Select, Badge, Avatar, Modal, ModalFooter, EmptyState, ProductTour, Accordion } from '@/components/ui'
import type { TourStep, AccordionItemProps } from '@/components/ui'
import { useTour } from '@/hooks/useTour'
import { useToast } from '@/hooks/useToast'
import { ToastContainer } from '@/components/Toast'
import { QuickAddMemberModal } from '@/components/modals'
import AdSlot from '@/components/AdSlot'
import { useSubscription } from '@/hooks/useSubscription'
import { useAgeBracket } from '@/hooks/useAgeBracket'
import { useLocation } from '@/hooks/useLocation'

interface FamilyMember {
  id: string
  name: string
  email?: string
  role: 'account_owner' | 'adult' | 'teen' | 'kid'
  avatar?: string
  color: string
  joinedDate: string
  tasksCompleted: number
  pointsEarned: number
  currentStreak: number
  isActive: boolean
  canManageTasks: boolean
  canApproveRewards: boolean
  canManageFamily: boolean
  birthday?: string
  age?: number
}

interface FamilyProfile {
  family_type?: string
  household_size?: number
  age_groups?: string[]
  home_type?: string
  has_yard?: boolean
  has_pets?: boolean
  pet_types?: string[]
  dietary_restrictions?: string[]
  food_allergies?: string[]
  meal_preferences?: string[]
}

function FamilyManagementContent() {
  const searchParams = useSearchParams()
  const [members, setMembers] = useState<FamilyMember[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedMember, setSelectedMember] = useState<FamilyMember | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Home information state
  const [familyProfile, setFamilyProfile] = useState<FamilyProfile | null>(null)
  const [isEditingProfile, setIsEditingProfile] = useState(false)

  // Family code state
  const [familyCode, setFamilyCode] = useState<string | null>(null)
  const [familyCodeGeneratedAt, setFamilyCodeGeneratedAt] = useState<string | null>(null)
  const [isRegeneratingCode, setIsRegeneratingCode] = useState(false)
  const [showCodeCopied, setShowCodeCopied] = useState(false)

  const toastHook = useToast()
  const { isOpen: isTourOpen, completeTour, skipTour } = useTour('family-tour')
  const { subscriptionTier } = useSubscription()
  const { ageBracket } = useAgeBracket()
  const { getLocationString } = useLocation()
  const [userRole, setUserRole] = useState<'kid' | 'teen' | 'adult'>('adult')


  // Tour steps
  const tourSteps: TourStep[] = [
    {
      target: '[data-tour="add-member-btn"]',
      title: 'Welcome to Family Management! 👨‍👩‍👧‍👦',
      content: (
        <div>
          <p className="mb-2">Manage your family members here.</p>
          <p>Click <strong>Add Member</strong> to add family members. Adults get email invitations, while kids and teens use PIN login.</p>
        </div>
      ),
      placement: 'bottom'
    },
    {
      target: '[data-tour="member-cards"]',
      title: 'Member Cards',
      content: (
        <div>
          <p className="mb-2">Each member card shows their stats, role, and permissions.</p>
          <p>Click <strong>Edit</strong> to update their information or <strong>Remove</strong> to delete them.</p>
        </div>
      ),
      placement: 'top'
    }
  ]


  // PIN management state
  const [isPinModalOpen, setIsPinModalOpen] = useState(false)
  const [pinMember, setPinMember] = useState<FamilyMember | null>(null)
  const [newPin, setNewPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')


  useEffect(() => {
    fetchMembers()
    fetchFamilyProfile()
    fetchFamilyCode()
    fetchUserRole()
  }, [])

  const fetchUserRole = async () => {
    try {
      const response = await fetch('/api/users/me')
      if (response.ok) {
        const data = await response.json()
        const role = data.user.role
        // Map account_owner to adult for ad purposes
        if (role === 'account_owner' || role === 'adult') {
          setUserRole('adult')
        } else if (role === 'teen') {
          setUserRole('teen')
        } else if (role === 'kid') {
          setUserRole('kid')
        }
      }
    } catch (err) {
      console.error('Error fetching user role:', err)
    }
  }

  const fetchMembers = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/users')

      console.log('API Response status:', response.status)

      if (response.ok) {
        const data = await response.json()
        console.log('API Response data:', data)

        // Transform API data to match FamilyMember interface
        const transformedMembers: FamilyMember[] = (data.users || []).map((user: any) => ({
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
          color: user.color,
          joinedDate: user.joinedDate,
          tasksCompleted: user.tasksCompleted,
          pointsEarned: user.pointsEarned,
          currentStreak: user.currentStreak,
          isActive: user.isActive,
          canManageTasks: user.canManageTasks,
          canApproveRewards: user.canApproveRewards,
          canManageFamily: user.canManageFamily
        }))

        setMembers(transformedMembers)
      } else {
        const errorData = await response.json().catch(() => ({}))
        console.error('Failed to load family members. Status:', response.status, 'Error:', errorData)
        toastHook.error('Failed to load family members')
      }
    } catch (err) {
      console.error('Error fetching members:', err)
      toastHook.error('Error loading family members')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchFamilyProfile = async () => {
    try {
      const response = await fetch('/api/organization/family-profile')
      if (response.ok) {
        const data = await response.json()
        if (data.exists) {
          setFamilyProfile(data.profile)
        }
      }
    } catch (err) {
      console.error('Error fetching family profile:', err)
    }
  }

  const fetchFamilyCode = async () => {
    try {
      const response = await fetch('/api/organization/family-code')
      if (response.ok) {
        const data = await response.json()
        setFamilyCode(data.familyCode)
        setFamilyCodeGeneratedAt(data.generatedAt)
      }
    } catch (err) {
      console.error('Error fetching family code:', err)
    }
  }

  const handleCopyCode = async () => {
    if (!familyCode) return

    try {
      await navigator.clipboard.writeText(familyCode)
      setShowCodeCopied(true)
      toastHook.success('Family code copied to clipboard!')
      setTimeout(() => setShowCodeCopied(false), 2000)
    } catch (err) {
      console.error('Error copying code:', err)
      toastHook.error('Failed to copy code')
    }
  }

  const handleRegenerateCode = async () => {
    if (!confirm('Are you sure you want to regenerate the family code? The old code will no longer work for kid login.')) {
      return
    }

    try {
      setIsRegeneratingCode(true)
      const response = await fetch('/api/organization/family-code', {
        method: 'POST'
      })

      if (response.ok) {
        const data = await response.json()
        setFamilyCode(data.familyCode)
        setFamilyCodeGeneratedAt(data.generatedAt)
        toastHook.success('Family code regenerated successfully!')
      } else {
        const error = await response.json()
        toastHook.error(error.error || 'Failed to regenerate family code')
      }
    } catch (error) {
      console.error('Error regenerating family code:', error)
      toastHook.error('Error regenerating family code')
    } finally {
      setIsRegeneratingCode(false)
    }
  }

  const handleSaveProfile = async () => {
    if (!familyProfile) return

    try {
      setIsSaving(true)
      const response = await fetch('/api/organization/family-profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(familyProfile)
      })

      if (response.ok) {
        toastHook.success('Home information updated successfully!')
        setIsEditingProfile(false)
        await fetchFamilyProfile()
      } else {
        const error = await response.json()
        toastHook.error(error.error || 'Failed to update home information')
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      toastHook.error('Error updating home information')
    } finally {
      setIsSaving(false)
    }
  }

  const getRoleBadgeVariant = (role: FamilyMember['role']): "default" | "success" | "warning" | "danger" | "info" => {
    switch (role) {
      case 'account_owner': return 'info'
      case 'adult': return 'success'
      case 'teen': return 'warning'
      case 'kid': return 'default'
      default: return 'default'
    }
  }

  const getRoleDisplayName = (role: FamilyMember['role']) => {
    switch (role) {
      case 'account_owner': return 'Account Owner'
      case 'adult': return 'Adult'
      case 'teen': return 'Teen (13-17)'
      case 'kid': return 'Kid (up to 12)'
      default: return role
    }
  }

  const availableAvatars = [
    '👦', '👧', '👨', '👩', '🧒', '👶',
    '🐶', '🐱', '🐭', '🐹', '🐰', '🦊',
    '🐻', '🐼', '🐨', '🐯', '🦁', '🐮',
    '🐷', '🐸', '🐵', '🐔', '🐧', '🐦',
    '🦄', '🦖', '🦕', '🐉', '🦅', '🦉',
    '⚽', '🏀', '🎮', '🎨', '🎭', '🎪',
    '🎸', '🎹', '🎤', '🎧', '🎬', '📚',
    '🚀', '✈️', '🚗', '🏎️', '🚲', '⛵',
    '🌟', '⭐', '🌈', '🔥', '💎', '👑',
    '🎓', '💼', '🔬', '🔭', '🎯', '🏆'
  ]

  const availableColors = [
    '#FF6B6B', '#FFA07A', '#6C63FF', '#4ECDC4',
    '#2ECC71', '#F39C12', '#3498DB', '#E74C3C',
    '#9B59B6', '#1ABC9C', '#E67E22', '#95A5A6'
  ]

  const handleAddMemberSuccess = async () => {
    toastHook.success('Member added successfully!')
    await fetchMembers()
  }

  const handleEditMember = (member: FamilyMember) => {
    setSelectedMember(member)
    setIsEditModalOpen(true)
  }

  const handleSaveEdit = async () => {
    if (!selectedMember) return

    try {
      setIsSaving(true)
      const response = await fetch(`/api/users/${selectedMember.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: selectedMember.name,
          email: selectedMember.email,
          color: selectedMember.color,
          avatar: selectedMember.avatar,
          role: selectedMember.role,
          canManageTasks: selectedMember.canManageTasks,
          canApproveRewards: selectedMember.canApproveRewards,
          isActive: selectedMember.isActive,
          birthday: selectedMember.birthday
        })
      })

      if (response.ok) {
        toastHook.success('Member updated successfully!')
        await fetchMembers()
        setIsEditModalOpen(false)
        setSelectedMember(null)
      } else {
        const error = await response.json()
        toastHook.error(error.error || 'Failed to update member')
      }
    } catch (error) {
      console.error('Error updating member:', error)
      toastHook.error('Error updating member')
    } finally {
      setIsSaving(false)
    }
  }

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    if (!confirm(`Are you sure you want to remove ${memberName}? This action cannot be undone.`)) {
      return
    }

    try {
      setIsDeleting(true)
      const response = await fetch(`/api/users/${memberId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toastHook.success('Member removed successfully')
        await fetchMembers()
      } else {
        const error = await response.json()
        toastHook.error(error.error || 'Failed to remove member')
      }
    } catch (error) {
      console.error('Error removing member:', error)
      toastHook.error('Error removing member')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleUpdatePin = async () => {
    if (!pinMember) return

    if (newPin.length !== 4) {
      toastHook.error('PIN must be exactly 4 digits')
      return
    }

    if (newPin !== confirmPin) {
      toastHook.error('PINs do not match')
      return
    }

    try {
      setIsSaving(true)
      const response = await fetch(`/api/users/${pinMember.id}/pin`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ pin: newPin })
      })

      if (response.ok) {
        toastHook.success('PIN updated successfully')
        setIsPinModalOpen(false)
        setPinMember(null)
        setNewPin('')
        setConfirmPin('')
      } else {
        const error = await response.json()
        toastHook.error(error.error || 'Failed to update PIN')
      }
    } catch (error) {
      console.error('Error updating PIN:', error)
      toastHook.error('Error updating PIN')
    } finally {
      setIsSaving(false)
    }
  }


  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 pb-24 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <p className="text-gray-600">Loading family members...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 pb-24">
      <ToastContainer toasts={toastHook.toasts} onRemove={toastHook.removeToast} />

      {/* Header */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-1">Family Management</h1>
            <p className="text-gray-600">Manage your family members and their roles</p>
          </div>

          <Button
            data-tour="add-member-btn"
            variant="primary"
            onClick={() => setIsAddModalOpen(true)}
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Member
          </Button>
        </div>

        {/* Organization Info */}
        {members.length > 0 && (
          <Card variant="default" padding="md" className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Your Family</h3>
                <p className="text-sm text-gray-600">{members.filter(m => m.isActive).length} active members</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-deep-purple">{members.reduce((sum, m) => sum + m.tasksCompleted, 0)}</div>
                  <p className="text-xs text-gray-600">Total Tasks</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-success-green">{members.reduce((sum, m) => sum + m.pointsEarned, 0)}</div>
                  <p className="text-xs text-gray-600">Total Points</p>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Top Banner Ad */}
        <AdSlot adUnit="banner"
          userRole={userRole}
          subscriptionTier={subscriptionTier}
          ageBracket={ageBracket}
            location={getLocationString()}
          testMode={true}
          className="mb-6"
        />

        {/* Collapsible Sections */}
        <Accordion
          allowMultiple
          items={[
            // Family Code Section
            {
              id: 'family-code',
              title: 'Family Code',
              subtitle: 'Code for kids and teens to login',
              icon: '🔐',
              defaultOpen: false,
              children: (
                <div>
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-900">
                        🔐 Use this family code along with a kid or teen's 4-digit PIN to log into the app.
                        Kids and teens don't need email addresses - just the family code and their PIN!
                      </p>
                    </div>

                    {familyCode ? (
                      <div className="space-y-4">
                        {/* Family Code Display */}
                        <div className="p-6 bg-gradient-to-br from-deep-purple to-blue-600 rounded-xl text-white text-center">
                          <p className="text-sm opacity-90 mb-2">Your Family Code</p>
                          <div className="text-4xl font-bold tracking-wider font-mono mb-3">
                            {familyCode}
                          </div>
                          {familyCodeGeneratedAt && (
                            <p className="text-xs opacity-75">
                              Generated {new Date(familyCodeGeneratedAt).toLocaleDateString('en-US', {
                                month: 'long',
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </p>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col sm:flex-row gap-3">
                          <Button
                            variant="primary"
                            onClick={handleCopyCode}
                            fullWidth
                          >
                            {showCodeCopied ? (
                              <>
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                Copied!
                              </>
                            ) : (
                              <>
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                                </svg>
                                Copy Code
                              </>
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            onClick={handleRegenerateCode}
                            isLoading={isRegeneratingCode}
                            fullWidth
                          >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Regenerate Code
                          </Button>
                        </div>

                        {/* Info Cards */}
                        <div className="grid md:grid-cols-2 gap-4 mt-6">
                          <div className="p-4 bg-gray-50 rounded-lg">
                            <div className="flex items-start gap-3">
                              <div className="text-2xl">👦👧</div>
                              <div>
                                <p className="font-semibold text-gray-900 mb-1">How Kids Login</p>
                                <p className="text-sm text-gray-600">
                                  Kids enter the family code and their 4-digit PIN to access their account.
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="p-4 bg-gray-50 rounded-lg">
                            <div className="flex items-start gap-3">
                              <div className="text-2xl">🔄</div>
                              <div>
                                <p className="font-semibold text-gray-900 mb-1">When to Regenerate</p>
                                <p className="text-sm text-gray-600">
                                  Regenerate if you need to revoke access or if the code is compromised.
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <div className="text-4xl mb-3">🔐</div>
                        <p className="text-gray-600 mb-4">No family code available</p>
                        <Button
                          variant="primary"
                          onClick={handleRegenerateCode}
                          isLoading={isRegeneratingCode}
                        >
                          Generate Family Code
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              )
            },
            // Home Information Section
            {
              id: 'home-info',
              title: 'Home Information',
              subtitle: 'Details about your home and household',
              icon: '🏡',
              defaultOpen: false,
              children: (
                <div>
          {!isEditingProfile && familyProfile && (
            <div className="flex justify-end mb-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditingProfile(true)}
              >
                Edit
              </Button>
            </div>
          )}

          {isEditingProfile ? (
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <Select
                  label="Home Type"
                  options={[
                    { label: 'Select...', value: '' },
                    { label: 'House', value: 'house' },
                    { label: 'Apartment', value: 'apartment' },
                    { label: 'Townhouse', value: 'townhouse' },
                    { label: 'Condo', value: 'condo' },
                    { label: 'Other', value: 'other' }
                  ]}
                  value={familyProfile?.home_type || ''}
                  onChange={(e) => setFamilyProfile({ ...familyProfile, home_type: e.target.value })}
                />

                <Input
                  label="Household Size"
                  type="number"
                  min="1"
                  placeholder="Number of people"
                  value={familyProfile?.household_size || ''}
                  onChange={(e) => setFamilyProfile({ ...familyProfile, household_size: parseInt(e.target.value) || undefined })}
                />
              </div>

              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={familyProfile?.has_yard || false}
                    onChange={(e) => setFamilyProfile({ ...familyProfile, has_yard: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-gray-700">Has Yard</span>
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={familyProfile?.has_pets || false}
                    onChange={(e) => setFamilyProfile({ ...familyProfile, has_pets: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-gray-700">Has Pets</span>
                </label>
              </div>

              {familyProfile?.has_pets && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pet Types
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {['dog', 'cat', 'fish', 'bird', 'other'].map((pet) => (
                      <label key={pet} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={familyProfile?.pet_types?.includes(pet) || false}
                          onChange={(e) => {
                            const currentPets = familyProfile?.pet_types || []
                            const newPets = e.target.checked
                              ? [...currentPets, pet]
                              : currentPets.filter(p => p !== pet)
                            setFamilyProfile({ ...familyProfile, pet_types: newPets })
                          }}
                          className="w-4 h-4"
                        />
                        <span className="text-sm text-gray-700 capitalize">{pet}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <Button
                  variant="primary"
                  onClick={handleSaveProfile}
                  isLoading={isSaving}
                >
                  Save
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsEditingProfile(false)
                    fetchFamilyProfile()
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div>
              {familyProfile ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {familyProfile.home_type && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="text-2xl">🏠</div>
                      <div>
                        <p className="text-xs text-gray-600">Home Type</p>
                        <p className="font-semibold text-gray-900 capitalize">{familyProfile.home_type}</p>
                      </div>
                    </div>
                  )}

                  {familyProfile.household_size && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="text-2xl">👨‍👩‍👧‍👦</div>
                      <div>
                        <p className="text-xs text-gray-600">Household Size</p>
                        <p className="font-semibold text-gray-900">{familyProfile.household_size} people</p>
                      </div>
                    </div>
                  )}

                  {familyProfile.has_yard && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="text-2xl">🌳</div>
                      <div>
                        <p className="text-xs text-gray-600">Yard</p>
                        <p className="font-semibold text-gray-900">Yes</p>
                      </div>
                    </div>
                  )}

                  {familyProfile.has_pets && familyProfile.pet_types && familyProfile.pet_types.length > 0 && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="text-2xl">🐾</div>
                      <div>
                        <p className="text-xs text-gray-600">Pets</p>
                        <p className="font-semibold text-gray-900 capitalize">
                          {familyProfile.pet_types.join(', ')}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-4xl mb-3">🏡</div>
                  <p className="text-gray-600 mb-4">No home information added yet</p>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      setFamilyProfile({})
                      setIsEditingProfile(true)
                    }}
                  >
                    Add Home Information
                  </Button>
                </div>
              )}
            </div>
          )}
                </div>
              )
            },
            // Family Members Section
            {
              id: 'family-members',
              title: 'Family Members',
              subtitle: `${members.filter(m => m.isActive).length} active ${members.filter(m => m.isActive).length === 1 ? 'member' : 'members'}`,
              icon: '👨‍👩‍👧‍👦',
              defaultOpen: true,
              children: (
                <div>
        {members.length === 0 ? (
          <EmptyState
            icon="👨‍👩‍👧‍👦"
            title="No family members yet"
            description="Add your first family member to get started with ChorePulse!"
            action={
              <Button variant="primary" onClick={() => setIsAddModalOpen(true)}>
                Add Your First Member
              </Button>
            }
          />
        ) : (
          <div data-tour="member-cards" className="grid md:grid-cols-2 gap-4">
            {members.map((member) => (
              <Card key={member.id} variant="elevated" padding="none" className="overflow-hidden">
                {/* Header with color accent */}
                <div className="h-2" style={{ backgroundColor: member.color }} />

                <div className="p-6">
                  {/* Member Info */}
                  <div className="flex items-start gap-4 mb-4">
                    <div
                      className="w-16 h-16 rounded-full flex items-center justify-center text-3xl"
                      style={{ backgroundColor: member.color }}
                    >
                      {member.avatar || '👤'}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="text-xl font-bold text-gray-900">{member.name}</h3>
                        <Badge variant={getRoleBadgeVariant(member.role)} size="sm">
                          {getRoleDisplayName(member.role)}
                        </Badge>
                        {!member.isActive && (
                          <Badge variant="danger" size="sm">Inactive</Badge>
                        )}
                      </div>
                      {member.email && (
                        <p className="text-sm text-gray-600 mb-1">{member.email}</p>
                      )}
                      {member.age !== undefined && member.age !== null && (
                        <p className="text-sm text-gray-600 mb-1">
                          Age: {member.age} years old
                        </p>
                      )}
                      <p className="text-xs text-gray-500">
                        Joined {new Date(member.joinedDate).toLocaleDateString('en-US', {
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-lg font-bold text-gray-900">{member.tasksCompleted}</div>
                      <p className="text-xs text-gray-600">Tasks</p>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-lg font-bold text-deep-purple">{member.pointsEarned}</div>
                      <p className="text-xs text-gray-600">Points</p>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-lg font-bold text-warm-orange">{member.currentStreak}</div>
                      <p className="text-xs text-gray-600">Streak</p>
                    </div>
                  </div>

                  {/* Permissions */}
                  <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-xs font-semibold text-gray-700 mb-2">Permissions</p>
                    <div className="flex flex-wrap gap-2">
                      {member.canManageFamily && (
                        <Badge variant="info" size="sm">Manage Family</Badge>
                      )}
                      {member.canManageTasks && (
                        <Badge variant="success" size="sm">Manage Tasks</Badge>
                      )}
                      {member.canApproveRewards && (
                        <Badge variant="warning" size="sm">Approve Rewards</Badge>
                      )}
                      {!member.canManageFamily && !member.canManageTasks && !member.canApproveRewards && (
                        <span className="text-xs text-gray-600">No admin permissions</span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        fullWidth
                        onClick={() => handleEditMember(member)}
                      >
                        Edit
                      </Button>
                      {member.role !== 'account_owner' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          fullWidth
                          onClick={() => handleRemoveMember(member.id, member.name)}
                          className="text-soft-red hover:text-soft-red hover:bg-red-50"
                          disabled={isDeleting}
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                    {(member.role === 'kid' || member.role === 'teen') && (
                      <Button
                        variant="ghost"
                        size="sm"
                        fullWidth
                        onClick={() => {
                          setPinMember(member)
                          setIsPinModalOpen(true)
                        }}
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      >
                        🔐 Change PIN
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
                </div>
              )
            },
            // Tips Section
            {
              id: 'tips',
              title: 'Family Management Tips',
              subtitle: 'Helpful information about managing your family',
              icon: '💡',
              defaultOpen: false,
              children: (
                <div>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="text-2xl">👨‍👩‍👧‍👦</div>
                <div>
                  <p className="font-semibold text-gray-900 mb-1">Roles & Permissions</p>
                  <p className="text-sm text-gray-600">Adults can manage tasks and approve rewards. Kids and teens focus on completing tasks and earning points.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="text-2xl">🔒</div>
                <div>
                  <p className="font-semibold text-gray-900 mb-1">COPPA Compliance</p>
                  <p className="text-sm text-gray-600">Kids under 13 use PIN login instead of email. This keeps your family safe and compliant.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="text-2xl">🎨</div>
                <div>
                  <p className="font-semibold text-gray-900 mb-1">Color Coding</p>
                  <p className="text-sm text-gray-600">Each member gets a unique color for easy identification on the calendar and task lists.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="text-2xl">📧</div>
                <div>
                  <p className="font-semibold text-gray-900 mb-1">Adding Members</p>
                  <p className="text-sm text-gray-600">Adults automatically receive email invitations when added. Kids and teens use PIN login for a safe, email-free experience.</p>
                </div>
              </div>
            </div>
                </div>
              )
            }
          ]}
        />

        {/* Bottom Banner Ad */}
        <AdSlot adUnit="banner"
          userRole={userRole}
          subscriptionTier={subscriptionTier}
          ageBracket={ageBracket}
            location={getLocationString()}
          testMode={true}
          className="mt-6"
        />
      </div>

      {/* Add Member Modal */}
      <QuickAddMemberModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={handleAddMemberSuccess}
      />

      {/* Edit Member Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Family Member"
        description="Update member information and permissions"
        size="lg"
      >
        {selectedMember && (
          <div className="space-y-4">
            <Input
              label="Name"
              value={selectedMember.name}
              onChange={(e) => setSelectedMember({ ...selectedMember, name: e.target.value })}
            />

            {selectedMember.email && (
              <Input
                label="Email"
                type="email"
                value={selectedMember.email}
                onChange={(e) => setSelectedMember({ ...selectedMember, email: e.target.value })}
              />
            )}

            <div>
              <Input
                label="Birthday (Optional)"
                type="date"
                value={selectedMember.birthday || ''}
                onChange={(e) => setSelectedMember({ ...selectedMember, birthday: e.target.value })}
                helperText="Helps us provide age-appropriate content and experiences"
              />
              {selectedMember.age !== undefined && selectedMember.age !== null && (
                <p className="text-sm text-gray-600 mt-1">
                  Age: {selectedMember.age} years old
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Avatar
              </label>
              <div className="grid grid-cols-10 gap-2 max-h-40 overflow-y-auto p-2 border border-gray-200 rounded-lg">
                {availableAvatars.map((avatar) => (
                  <button
                    key={avatar}
                    type="button"
                    className={`text-2xl p-2 rounded-lg transition-all ${
                      selectedMember.avatar === avatar
                        ? 'ring-2 ring-blue-500 bg-blue-50 scale-110'
                        : 'hover:bg-gray-100 hover:scale-105'
                    }`}
                    onClick={() => setSelectedMember({ ...selectedMember, avatar })}
                  >
                    {avatar}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Color
              </label>
              <div className="grid grid-cols-6 gap-2">
                {availableColors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`w-10 h-10 rounded-full transition-all ${
                      selectedMember.color === color
                        ? 'ring-4 ring-offset-2 ring-blue-500 scale-110'
                        : 'hover:scale-105'
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setSelectedMember({ ...selectedMember, color })}
                  />
                ))}
              </div>
            </div>

            {(selectedMember.role === 'adult' || selectedMember.role === 'account_owner') && (
              <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm font-semibold text-gray-900">Permissions</p>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedMember.canManageTasks}
                    onChange={(e) => setSelectedMember({ ...selectedMember, canManageTasks: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-gray-700">Can manage tasks</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedMember.canApproveRewards}
                    onChange={(e) => setSelectedMember({ ...selectedMember, canApproveRewards: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-gray-700">Can approve rewards</span>
                </label>
              </div>
            )}
          </div>
        )}

        <ModalFooter>
          <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSaveEdit}
            isLoading={isSaving}
            disabled={isSaving}
          >
            Save Changes
          </Button>
        </ModalFooter>
      </Modal>

      {/* Change PIN Modal */}
      <Modal
        isOpen={isPinModalOpen}
        onClose={() => {
          setIsPinModalOpen(false)
          setPinMember(null)
          setNewPin('')
          setConfirmPin('')
        }}
        title={`Change PIN for ${pinMember?.name}`}
        description="Set a new 4-digit PIN for login"
        size="md"
      >
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-900">
              🔐 This PIN will be used to log into the app. Make sure to remember it!
            </p>
          </div>

          <Input
            label="New PIN"
            type="text"
            inputMode="numeric"
            placeholder="Enter 4-digit PIN"
            maxLength={4}
            value={newPin}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, '')
              setNewPin(value)
            }}
          />

          <Input
            label="Confirm PIN"
            type="text"
            inputMode="numeric"
            placeholder="Re-enter 4-digit PIN"
            maxLength={4}
            value={confirmPin}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, '')
              setConfirmPin(value)
            }}
          />

          {newPin && confirmPin && newPin !== confirmPin && (
            <p className="text-sm text-soft-red">PINs do not match</p>
          )}
        </div>

        <ModalFooter>
          <Button
            variant="outline"
            onClick={() => {
              setIsPinModalOpen(false)
              setPinMember(null)
              setNewPin('')
              setConfirmPin('')
            }}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleUpdatePin}
            disabled={newPin.length !== 4 || confirmPin.length !== 4 || newPin !== confirmPin}
            isLoading={isSaving}
          >
            Update PIN
          </Button>
        </ModalFooter>
      </Modal>

      {/* Product Tour */}
      <ProductTour
        steps={tourSteps}
        isOpen={isTourOpen}
        onComplete={completeTour}
        onSkip={skipTour}
        tourId="family-tour"
      />
    </div>
  )
}

export default function FamilyManagementPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 p-4 pb-24 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <p className="text-gray-600">Loading family members...</p>
        </div>
      </div>
    }>
      <FamilyManagementContent />
    </Suspense>
  )
}
