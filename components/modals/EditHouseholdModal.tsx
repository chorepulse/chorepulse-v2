'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui'

interface EditHouseholdModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: HouseholdData) => Promise<void>
  initialData?: HouseholdData
}

export interface HouseholdData {
  petTypes: string[]
  homeFeatures: string[]
  specialConsiderations: string[]
  ageGroups: string[]
  numberOfCars: number
  numberOfBikes: number
}

const petOptions = [
  { value: 'dog', label: 'Dog', emoji: '🐶' },
  { value: 'cat', label: 'Cat', emoji: '🐱' },
  { value: 'fish', label: 'Fish', emoji: '🐠' },
  { value: 'bird', label: 'Bird', emoji: '🐦' },
  { value: 'small_animal', label: 'Small Animal', emoji: '🐹' },
  { value: 'reptile', label: 'Reptile', emoji: '🦎' },
  { value: 'other', label: 'Other', emoji: '🐾' }
]

const homeFeatureOptions = [
  { value: 'fireplace', label: 'Fireplace', emoji: '🔥' },
  { value: 'pool', label: 'Pool', emoji: '🏊' },
  { value: 'hot_tub', label: 'Hot Tub', emoji: '🛁' },
  { value: 'pond', label: 'Pond', emoji: '🦆' },
  { value: 'garden', label: 'Garden/Yard', emoji: '🌳' },
  { value: 'indoor_plants', label: 'Indoor Plants', emoji: '🪴' }
]

const specialConsiderationOptions = [
  { value: 'elderly', label: 'Elderly family member', emoji: '👴' },
  { value: 'home_office', label: 'Home office', emoji: '💼' },
  { value: 'basement_attic', label: 'Basement/Attic', emoji: '🏠' }
]

const ageGroupOptions = [
  { value: 'toddler', label: 'Toddler (0-4)', emoji: '👶' },
  { value: 'kid', label: 'Kid (5-12)', emoji: '🧒' },
  { value: 'teen', label: 'Teen (13-17)', emoji: '🧑' },
  { value: 'adult', label: 'Adult (18+)', emoji: '👨' }
]

export default function EditHouseholdModal({ isOpen, onClose, onSave, initialData }: EditHouseholdModalProps) {
  const [formData, setFormData] = useState<HouseholdData>({
    petTypes: initialData?.petTypes || [],
    homeFeatures: initialData?.homeFeatures || [],
    specialConsiderations: initialData?.specialConsiderations || [],
    ageGroups: initialData?.ageGroups || [],
    numberOfCars: initialData?.numberOfCars || 0,
    numberOfBikes: initialData?.numberOfBikes || 0
  })
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (initialData) {
      setFormData({
        petTypes: initialData.petTypes || [],
        homeFeatures: initialData.homeFeatures || [],
        specialConsiderations: initialData.specialConsiderations || [],
        ageGroups: initialData.ageGroups || [],
        numberOfCars: initialData.numberOfCars || 0,
        numberOfBikes: initialData.numberOfBikes || 0
      })
    }
  }, [initialData])

  const toggleArrayItem = (array: string[], item: string) => {
    return array.includes(item)
      ? array.filter(i => i !== item)
      : [...array, item]
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await onSave(formData)
      onClose()
    } catch (error) {
      console.error('Error saving household data:', error)
    } finally {
      setIsSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Household Information</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Pets */}
          <div role="group" aria-labelledby="pets-label">
            <label id="pets-label" className="block text-sm font-semibold text-gray-900 mb-3">
              🐾 Pets
            </label>
            <div className="grid grid-cols-2 gap-3">
              {petOptions.map((pet) => (
                <label
                  key={pet.value}
                  className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                    formData.petTypes.includes(pet.value)
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={formData.petTypes.includes(pet.value)}
                    onChange={() => setFormData({
                      ...formData,
                      petTypes: toggleArrayItem(formData.petTypes, pet.value)
                    })}
                    className="w-4 h-4 text-purple-600 rounded"
                    aria-label={`${pet.label} pet type`}
                    aria-pressed={formData.petTypes.includes(pet.value)}
                  />
                  <span className="text-lg">{pet.emoji}</span>
                  <span className="text-sm font-medium text-gray-900">{pet.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Age Groups */}
          <div role="group" aria-labelledby="age-groups-label">
            <label id="age-groups-label" className="block text-sm font-semibold text-gray-900 mb-3">
              👨‍👩‍👧‍👦 Age Groups in Household
            </label>
            <div className="grid grid-cols-2 gap-3">
              {ageGroupOptions.map((group) => (
                <label
                  key={group.value}
                  className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                    formData.ageGroups.includes(group.value)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={formData.ageGroups.includes(group.value)}
                    onChange={() => setFormData({
                      ...formData,
                      ageGroups: toggleArrayItem(formData.ageGroups, group.value)
                    })}
                    className="w-4 h-4 text-blue-600 rounded"
                    aria-label={`${group.label} age group`}
                    aria-pressed={formData.ageGroups.includes(group.value)}
                  />
                  <span className="text-lg">{group.emoji}</span>
                  <span className="text-sm font-medium text-gray-900">{group.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Home Features */}
          <div role="group" aria-labelledby="home-features-label">
            <label id="home-features-label" className="block text-sm font-semibold text-gray-900 mb-3">
              🏡 Home Features
            </label>
            <div className="grid grid-cols-2 gap-3">
              {homeFeatureOptions.map((feature) => (
                <label
                  key={feature.value}
                  className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                    formData.homeFeatures.includes(feature.value)
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={formData.homeFeatures.includes(feature.value)}
                    onChange={() => setFormData({
                      ...formData,
                      homeFeatures: toggleArrayItem(formData.homeFeatures, feature.value)
                    })}
                    className="w-4 h-4 text-green-600 rounded"
                    aria-label={`${feature.label} home feature`}
                    aria-pressed={formData.homeFeatures.includes(feature.value)}
                  />
                  <span className="text-lg">{feature.emoji}</span>
                  <span className="text-sm font-medium text-gray-900">{feature.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Special Considerations */}
          <div role="group" aria-labelledby="special-considerations-label">
            <label id="special-considerations-label" className="block text-sm font-semibold text-gray-900 mb-3">
              ℹ️ Special Considerations
            </label>
            <div className="grid grid-cols-2 gap-3">
              {specialConsiderationOptions.map((consideration) => (
                <label
                  key={consideration.value}
                  className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                    formData.specialConsiderations.includes(consideration.value)
                      ? 'border-amber-500 bg-amber-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={formData.specialConsiderations.includes(consideration.value)}
                    onChange={() => setFormData({
                      ...formData,
                      specialConsiderations: toggleArrayItem(formData.specialConsiderations, consideration.value)
                    })}
                    className="w-4 h-4 text-amber-600 rounded"
                    aria-label={`${consideration.label} special consideration`}
                    aria-pressed={formData.specialConsiderations.includes(consideration.value)}
                  />
                  <span className="text-lg">{consideration.emoji}</span>
                  <span className="text-sm font-medium text-gray-900">{consideration.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Vehicles */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="numberOfCars" className="block text-sm font-semibold text-gray-900 mb-2">
                🚗 Number of Cars
              </label>
              <input
                id="numberOfCars"
                type="number"
                min="0"
                max="10"
                value={formData.numberOfCars}
                onChange={(e) => setFormData({ ...formData, numberOfCars: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                aria-label="Number of cars in household"
                inputMode="numeric"
              />
            </div>
            <div>
              <label htmlFor="numberOfBikes" className="block text-sm font-semibold text-gray-900 mb-2">
                🚲 Number of Bikes
              </label>
              <input
                id="numberOfBikes"
                type="number"
                min="0"
                max="20"
                value={formData.numberOfBikes}
                onChange={(e) => setFormData({ ...formData, numberOfBikes: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                aria-label="Number of bikes in household"
                inputMode="numeric"
              />
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </div>
  )
}
