'use client'

import { useState } from 'react'
import { Select } from './index'

export interface FrequencyConfig {
  frequency: 'one-time' | 'daily' | 'weekly' | 'monthly' | 'custom'
  interval?: number // Every X days/weeks/months
  dayOfWeek?: number // 0=Sunday, 1=Monday, etc.
  weekOfMonth?: number // 1-5 (1st, 2nd, 3rd, 4th, last)
  dayOfMonth?: number // 1-31
  customPattern?: 'weekdays' | 'weekends' | 'specific_days'
  specificDays?: number[] // For custom patterns
}

interface FrequencySelectorProps {
  value: FrequencyConfig
  onChange: (config: FrequencyConfig) => void
  className?: string
}

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' }
]

const WEEK_OF_MONTH = [
  { value: 1, label: 'First' },
  { value: 2, label: 'Second' },
  { value: 3, label: 'Third' },
  { value: 4, label: 'Fourth' },
  { value: 5, label: 'Last' }
]

export default function FrequencySelector({ value, onChange, className }: FrequencySelectorProps) {
  const [showAdvanced, setShowAdvanced] = useState(value.frequency === 'custom' || (value.interval && value.interval > 1))

  const handleFrequencyChange = (freq: string) => {
    const newConfig: FrequencyConfig = {
      frequency: freq as any,
      interval: freq === 'daily' || freq === 'weekly' || freq === 'monthly' ? 1 : undefined
    }
    onChange(newConfig)
    setShowAdvanced(freq === 'custom')
  }

  const handleIntervalChange = (interval: number) => {
    onChange({ ...value, interval })
  }

  const handleDayOfWeekChange = (day: number) => {
    onChange({ ...value, dayOfWeek: day })
  }

  const handleWeekOfMonthChange = (week: number) => {
    onChange({ ...value, weekOfMonth: week })
  }

  const handleDayOfMonthChange = (day: number) => {
    onChange({ ...value, dayOfMonth: day })
  }

  const handleCustomPatternChange = (pattern: string) => {
    onChange({ ...value, frequency: 'custom', customPattern: pattern as any })
  }

  const getFrequencyDescription = () => {
    const { frequency, interval = 1, dayOfWeek, weekOfMonth, dayOfMonth, customPattern } = value

    if (frequency === 'one-time') return 'One time only'

    if (frequency === 'daily') {
      return interval === 1 ? 'Every day' : `Every ${interval} days`
    }

    if (frequency === 'weekly') {
      const dayName = dayOfWeek !== undefined ? DAYS_OF_WEEK[dayOfWeek].label : ''
      const intervalText = interval === 1 ? 'Every week' : `Every ${interval} weeks`
      return dayName ? `${intervalText} on ${dayName}` : intervalText
    }

    if (frequency === 'monthly') {
      const intervalText = interval === 1 ? 'Every month' : `Every ${interval} months`
      if (dayOfMonth) {
        const suffix = dayOfMonth === 1 ? 'st' : dayOfMonth === 2 ? 'nd' : dayOfMonth === 3 ? 'rd' : 'th'
        return `${intervalText} on the ${dayOfMonth}${suffix}`
      }
      if (weekOfMonth !== undefined && dayOfWeek !== undefined) {
        const weekName = WEEK_OF_MONTH.find(w => w.value === weekOfMonth)?.label
        const dayName = DAYS_OF_WEEK[dayOfWeek].label
        return `${intervalText} on the ${weekName} ${dayName}`
      }
      return intervalText
    }

    if (frequency === 'custom') {
      if (customPattern === 'weekdays') return 'Every weekday (Mon-Fri)'
      if (customPattern === 'weekends') return 'Every weekend (Sat-Sun)'
      if (customPattern === 'specific_days' && value.specificDays) {
        const days = value.specificDays.map(d => DAYS_OF_WEEK[d].label.slice(0, 3)).join(', ')
        return `Every ${days}`
      }
    }

    return 'Select frequency'
  }

  return (
    <div className={className}>
      {/* Basic Frequency Select */}
      <div className="space-y-3">
        <Select
          label="Frequency"
          options={[
            { label: 'One-time', value: 'one-time' },
            { label: 'Daily', value: 'daily' },
            { label: 'Weekly', value: 'weekly' },
            { label: 'Monthly', value: 'monthly' },
            { label: 'Custom', value: 'custom' }
          ]}
          value={value.frequency}
          onChange={(e) => handleFrequencyChange(e.target.value)}
          aria-label="Task frequency"
        />

        {/* Frequency Description */}
        <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
          <strong>Repeats:</strong> {getFrequencyDescription()}
        </div>

        {/* Advanced Options Toggle */}
        {(value.frequency === 'daily' || value.frequency === 'weekly' || value.frequency === 'monthly') && (
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-sm text-soft-blue hover:text-deep-purple font-medium focus:outline-none focus:underline"
          >
            {showAdvanced ? '− Hide advanced options' : '+ Show advanced options'}
          </button>
        )}
      </div>

      {/* Advanced Daily Options */}
      {showAdvanced && value.frequency === 'daily' && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg space-y-3">
          <label className="block text-sm font-medium text-gray-700">
            Repeat every
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="1"
              max="365"
              value={value.interval || 1}
              onChange={(e) => handleIntervalChange(parseInt(e.target.value))}
              onFocus={(e) => e.target.select()}
              className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-soft-blue focus:border-soft-blue"
              aria-label="Interval in days"
            />
            <span className="text-sm text-gray-600">day(s)</span>
          </div>
        </div>
      )}

      {/* Advanced Weekly Options */}
      {showAdvanced && value.frequency === 'weekly' && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg space-y-3">
          <label className="block text-sm font-medium text-gray-700">
            Repeat every
          </label>
          <div className="flex items-center gap-2 mb-4">
            <input
              type="number"
              min="1"
              max="52"
              value={value.interval || 1}
              onChange={(e) => handleIntervalChange(parseInt(e.target.value))}
              onFocus={(e) => e.target.select()}
              className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-soft-blue focus:border-soft-blue"
              aria-label="Interval in weeks"
            />
            <span className="text-sm text-gray-600">week(s)</span>
          </div>

          <label className="block text-sm font-medium text-gray-700 mb-2">
            On day
          </label>
          <Select
            options={DAYS_OF_WEEK.map(d => ({ label: d.label, value: d.value.toString() }))}
            value={value.dayOfWeek?.toString() || ''}
            onChange={(e) => handleDayOfWeekChange(parseInt(e.target.value))}
            placeholder="Select day"
            aria-label="Day of week"
          />
        </div>
      )}

      {/* Advanced Monthly Options */}
      {showAdvanced && value.frequency === 'monthly' && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg space-y-3">
          <label className="block text-sm font-medium text-gray-700">
            Repeat every
          </label>
          <div className="flex items-center gap-2 mb-4">
            <input
              type="number"
              min="1"
              max="12"
              value={value.interval || 1}
              onChange={(e) => handleIntervalChange(parseInt(e.target.value))}
              onFocus={(e) => e.target.select()}
              className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-soft-blue focus:border-soft-blue"
              aria-label="Interval in months"
            />
            <span className="text-sm text-gray-600">month(s)</span>
          </div>

          <label className="block text-sm font-medium text-gray-700 mb-2">
            Repeat on
          </label>

          <div className="space-y-2">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="monthly-type"
                checked={value.dayOfMonth !== undefined}
                onChange={() => handleDayOfMonthChange(1)}
                className="text-soft-blue focus:ring-soft-blue"
              />
              <span className="text-sm">Day of month</span>
            </label>

            {value.dayOfMonth !== undefined && (
              <div className="ml-6 flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={value.dayOfMonth}
                  onChange={(e) => handleDayOfMonthChange(parseInt(e.target.value))}
                  onFocus={(e) => e.target.select()}
                  className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-soft-blue focus:border-soft-blue"
                  aria-label="Day of month"
                />
                <span className="text-sm text-gray-600">of the month</span>
              </div>
            )}

            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="monthly-type"
                checked={value.weekOfMonth !== undefined}
                onChange={() => {
                  handleWeekOfMonthChange(1)
                  if (value.dayOfWeek === undefined) handleDayOfWeekChange(1)
                }}
                className="text-soft-blue focus:ring-soft-blue"
              />
              <span className="text-sm">Week of month</span>
            </label>

            {value.weekOfMonth !== undefined && (
              <div className="ml-6 space-y-2">
                <Select
                  options={WEEK_OF_MONTH.map(w => ({ label: w.label, value: w.value.toString() }))}
                  value={value.weekOfMonth?.toString() || '1'}
                  onChange={(e) => handleWeekOfMonthChange(parseInt(e.target.value))}
                  aria-label="Week of month"
                />
                <Select
                  options={DAYS_OF_WEEK.map(d => ({ label: d.label, value: d.value.toString() }))}
                  value={value.dayOfWeek?.toString() || '1'}
                  onChange={(e) => handleDayOfWeekChange(parseInt(e.target.value))}
                  aria-label="Day of week"
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Custom Pattern Options */}
      {value.frequency === 'custom' && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg space-y-3">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Custom pattern
          </label>
          <Select
            options={[
              { label: 'Weekdays only (Mon-Fri)', value: 'weekdays' },
              { label: 'Weekends only (Sat-Sun)', value: 'weekends' },
              { label: 'Specific days of week', value: 'specific_days' }
            ]}
            value={value.customPattern || ''}
            onChange={(e) => handleCustomPatternChange(e.target.value)}
            placeholder="Select pattern"
            aria-label="Custom recurrence pattern"
          />

          {value.customPattern === 'specific_days' && (
            <div className="mt-3">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select days
              </label>
              <div className="space-y-2">
                {DAYS_OF_WEEK.map((day) => (
                  <label key={day.value} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={value.specificDays?.includes(day.value) || false}
                      onChange={(e) => {
                        const days = value.specificDays || []
                        const newDays = e.target.checked
                          ? [...days, day.value]
                          : days.filter(d => d !== day.value)
                        onChange({ ...value, specificDays: newDays })
                      }}
                      className="rounded text-soft-blue focus:ring-soft-blue"
                    />
                    <span className="text-sm">{day.label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
