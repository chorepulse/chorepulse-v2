'use client'

import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export interface FormFieldProps {
  label: string
  htmlFor: string
  error?: string
  hint?: string
  required?: boolean
  children: ReactNode
  className?: string
}

/**
 * Accessible Form Field Component
 *
 * Provides proper ARIA labeling, error announcements, and validation states
 * for form inputs. Uses aria-live regions to announce validation errors
 * to screen readers.
 */
export function FormField({
  label,
  htmlFor,
  error,
  hint,
  required,
  children,
  className,
}: FormFieldProps) {
  const errorId = `${htmlFor}-error`
  const hintId = `${htmlFor}-hint`

  return (
    <div className={cn('space-y-2', className)}>
      {/* Label */}
      <label
        htmlFor={htmlFor}
        className={cn(
          'block text-sm font-medium',
          error ? 'text-red-700' : 'text-gray-700'
        )}
      >
        {label}
        {required && (
          <span className="text-red-500 ml-1" aria-label="required">
            *
          </span>
        )}
      </label>

      {/* Input field (passed as children) */}
      <div className="relative">
        {children}
      </div>

      {/* Hint text */}
      {hint && !error && (
        <p id={hintId} className="text-xs text-gray-500">
          {hint}
        </p>
      )}

      {/* Error message with aria-live announcement */}
      {error && (
        <div
          id={errorId}
          role="alert"
          aria-live="polite"
          aria-atomic="true"
          className="flex items-start gap-2 text-sm text-red-600"
        >
          <svg
            className="w-4 h-4 mt-0.5 flex-shrink-0"
            fill="currentColor"
            viewBox="0 0 20 20"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
          <span>{error}</span>
        </div>
      )}
    </div>
  )
}

/**
 * Enhanced Input with validation state
 */
export interface ValidatedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string
  hint?: string
}

export function ValidatedInput({ error, hint, className, ...props }: ValidatedInputProps) {
  const inputId = props.id || props.name || 'input'
  const errorId = `${inputId}-error`
  const hintId = `${inputId}-hint`

  return (
    <input
      {...props}
      aria-invalid={error ? 'true' : 'false'}
      aria-describedby={cn(
        error ? errorId : undefined,
        hint && !error ? hintId : undefined
      )}
      className={cn(
        'w-full px-3 py-2 border rounded-lg transition-colors',
        'focus:outline-none focus:ring-2 focus:ring-offset-0',
        error
          ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20 bg-red-50'
          : 'border-gray-300 focus:border-deep-purple focus:ring-deep-purple/20',
        'disabled:bg-gray-100 disabled:cursor-not-allowed',
        className
      )}
    />
  )
}

/**
 * Live validation status announcer
 * Use this to announce overall form validation status to screen readers
 */
export interface FormStatusProps {
  status: 'idle' | 'validating' | 'success' | 'error'
  message?: string
}

export function FormStatus({ status, message }: FormStatusProps) {
  if (status === 'idle') return null

  const statusConfig = {
    validating: {
      icon: (
        <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      ),
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      border: 'border-blue-200',
    },
    success: {
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
            clipRule="evenodd"
          />
        </svg>
      ),
      color: 'text-green-600',
      bg: 'bg-green-50',
      border: 'border-green-200',
    },
    error: {
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
            clipRule="evenodd"
          />
        </svg>
      ),
      color: 'text-red-600',
      bg: 'bg-red-50',
      border: 'border-red-200',
    },
  }

  const config = statusConfig[status]

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className={cn(
        'flex items-center gap-3 p-4 rounded-lg border',
        config.bg,
        config.border,
        config.color
      )}
    >
      <div className="flex-shrink-0">{config.icon}</div>
      {message && <p className="text-sm font-medium">{message}</p>}
    </div>
  )
}

/**
 * Example usage:
 *
 * <FormField
 *   label="Email Address"
 *   htmlFor="email"
 *   error={errors.email}
 *   hint="We'll never share your email"
 *   required
 * >
 *   <ValidatedInput
 *     id="email"
 *     type="email"
 *     value={email}
 *     onChange={(e) => setEmail(e.target.value)}
 *     error={errors.email}
 *   />
 * </FormField>
 *
 * <FormStatus
 *   status={formStatus}
 *   message={formMessage}
 * />
 */
