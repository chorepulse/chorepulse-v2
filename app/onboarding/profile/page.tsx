'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Select, Checkbox } from '@/components/ui'

const homeTypes = [
  { label: 'Apartment', value: 'apartment' },
  { label: 'House', value: 'house' },
  { label: 'Townhouse', value: 'townhouse' },
  { label: 'Condo', value: 'condo' },
  { label: 'Other', value: 'other' }
]

const ageGroups = [
  { label: 'Toddler (0-4)', value: 'toddler' },
  { label: 'Kid (5-12)', value: 'kid' },
  { label: 'Teen (13-17)', value: 'teen' },
  { label: 'Adult (18+)', value: 'adult' }
]

const petTypes = [
  { label: 'Dog 🐶', value: 'dog' },
  { label: 'Cat 🐱', value: 'cat' },
  { label: 'Fish 🐠', value: 'fish' },
  { label: 'Bird 🐦', value: 'bird' },
  { label: 'Small Animal (rabbit, hamster, etc.) 🐹', value: 'small_animal' },
  { label: 'Reptile 🦎', value: 'reptile' },
  { label: 'Other', value: 'other' }
]

const homeFeatures = [
  { label: 'Fireplace', value: 'fireplace', emoji: '🔥' },
  { label: 'Pool', value: 'pool', emoji: '🏊' },
  { label: 'Hot Tub', value: 'hot_tub', emoji: '🛁' },
  { label: 'Pond', value: 'pond', emoji: '🦆' },
  { label: 'Garden/Yard', value: 'garden', emoji: '🌳' },
  { label: 'Indoor Plants', value: 'indoor_plants', emoji: '🪴' }
]

const specialConsiderations = [
  { label: 'Elderly family member', value: 'elderly', emoji: '👴' },
  { label: 'Home office', value: 'home_office', emoji: '💼' },
  { label: 'Basement/Attic', value: 'basement_attic', emoji: '🏠' }
]

export default function OnboardingProfilePage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    homeType: '',
    selectedAgeGroups: [] as string[],
    selectedPets: [] as string[],
    selectedHomeFeatures: [] as string[],
    selectedSpecialConsiderations: [] as string[],
    numberOfCars: 0,
    numberOfBikes: 0
  })

  useEffect(() => {
    // Verify user has completed previous steps
    const organizationName = sessionStorage.getItem('organizationName')
    const userPin = sessionStorage.getItem('userPin')
    if (!organizationName || !userPin) {
      router.push('/onboarding/organization')
    }
  }, [router])

  const handleAgeGroupToggle = (value: string) => {
    setFormData(prev => ({
      ...prev,
      selectedAgeGroups: prev.selectedAgeGroups.includes(value)
        ? prev.selectedAgeGroups.filter(g => g !== value)
        : [...prev.selectedAgeGroups, value]
    }))
  }

  const handlePetToggle = (value: string) => {
    setFormData(prev => ({
      ...prev,
      selectedPets: prev.selectedPets.includes(value)
        ? prev.selectedPets.filter(p => p !== value)
        : [...prev.selectedPets, value]
    }))
  }

  const handleHomeFeatureToggle = (value: string) => {
    setFormData(prev => ({
      ...prev,
      selectedHomeFeatures: prev.selectedHomeFeatures.includes(value)
        ? prev.selectedHomeFeatures.filter(f => f !== value)
        : [...prev.selectedHomeFeatures, value]
    }))
  }

  const handleSpecialConsiderationToggle = (value: string) => {
    setFormData(prev => ({
      ...prev,
      selectedSpecialConsiderations: prev.selectedSpecialConsiderations.includes(value)
        ? prev.selectedSpecialConsiderations.filter(s => s !== value)
        : [...prev.selectedSpecialConsiderations, value]
    }))
  }

  const handleSubmit = async () => {
    setIsLoading(true)

    try {
      // Save household profile to database
      const response = await fetch('/api/organizations/household', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          homeFeatures: formData.selectedHomeFeatures,
          specialConsiderations: formData.selectedSpecialConsiderations,
          hasPets: formData.selectedPets.length > 0,
          petTypes: formData.selectedPets,
          ageGroups: formData.selectedAgeGroups,
          numberOfCars: formData.numberOfCars,
          numberOfBikes: formData.numberOfBikes
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save household profile')
      }

      // Store profile data in session for reference
      sessionStorage.setItem('familyProfile', JSON.stringify(formData))

      // Redirect to add family members
      router.push('/onboarding/members')
    } catch (err) {
      console.error('Failed to save profile:', err)
      alert('Failed to save household profile. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSkip = () => {
    router.push('/onboarding/members')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Progress indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-2 h-2 rounded-full bg-blue-600"></div>
            <div className="w-2 h-2 rounded-full bg-blue-600"></div>
            <div className="w-2 h-2 rounded-full bg-blue-600"></div>
            <div className="w-2 h-2 rounded-full bg-gray-300"></div>
            <div className="w-2 h-2 rounded-full bg-gray-300"></div>
          </div>
          <p className="text-center text-sm text-gray-600">Step 3 of 5 (Optional)</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-2xl mb-4">
              <span className="text-3xl">🏠</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Tell Us About Your Home
            </h1>
            <p className="text-gray-600">
              This helps Pulse suggest relevant tasks and rewards
            </p>
          </div>

          <div className="space-y-6">
            <Select
              label="Home Type"
              options={homeTypes}
              value={formData.homeType}
              onChange={(e) => setFormData(prev => ({ ...prev, homeType: e.target.value }))}
              placeholder="Select your home type"
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Age Groups in Your Family
              </label>
              <div className="space-y-2">
                {ageGroups.map((ageGroup) => (
                  <Checkbox
                    key={ageGroup.value}
                    label={ageGroup.label}
                    checked={formData.selectedAgeGroups.includes(ageGroup.value)}
                    onChange={() => handleAgeGroupToggle(ageGroup.value)}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Pets (Select all that apply)
              </label>
              <div className="space-y-2">
                {petTypes.map((pet) => (
                  <Checkbox
                    key={pet.value}
                    label={pet.label}
                    checked={formData.selectedPets.includes(pet.value)}
                    onChange={() => handlePetToggle(pet.value)}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Home Features (Select all that apply)
              </label>
              <div className="space-y-2">
                {homeFeatures.map((feature) => (
                  <Checkbox
                    key={feature.value}
                    label={`${feature.emoji} ${feature.label}`}
                    checked={formData.selectedHomeFeatures.includes(feature.value)}
                    onChange={() => handleHomeFeatureToggle(feature.value)}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Vehicles
              </label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">
                    Cars 🚗
                  </label>
                  <Select
                    options={[
                      { label: '0', value: '0' },
                      { label: '1', value: '1' },
                      { label: '2', value: '2' },
                      { label: '3+', value: '3' }
                    ]}
                    value={formData.numberOfCars.toString()}
                    onChange={(e) => setFormData(prev => ({ ...prev, numberOfCars: parseInt(e.target.value) }))}
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">
                    Bikes 🚲
                  </label>
                  <Select
                    options={[
                      { label: '0', value: '0' },
                      { label: '1', value: '1' },
                      { label: '2', value: '2' },
                      { label: '3', value: '3' },
                      { label: '4+', value: '4' }
                    ]}
                    value={formData.numberOfBikes.toString()}
                    onChange={(e) => setFormData(prev => ({ ...prev, numberOfBikes: parseInt(e.target.value) }))}
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Special Considerations (Optional)
              </label>
              <div className="space-y-2">
                {specialConsiderations.map((consideration) => (
                  <Checkbox
                    key={consideration.value}
                    label={`${consideration.emoji} ${consideration.label}`}
                    checked={formData.selectedSpecialConsiderations.includes(consideration.value)}
                    onChange={() => handleSpecialConsiderationToggle(consideration.value)}
                  />
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-3 pt-4">
              <Button
                onClick={handleSubmit}
                variant="primary"
                size="lg"
                fullWidth
                isLoading={isLoading}
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
        </div>

        {/* Help text */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>💡 You can update this information later in settings</p>
        </div>
      </div>
    </div>
  )
}
