'use client'

import { HTMLAttributes, forwardRef, useEffect } from 'react'
import { cn } from '@/lib/utils'
import Button from './Button'

export interface ModalProps extends HTMLAttributes<HTMLDivElement> {
  isOpen: boolean
  onClose: () => void
  title?: string
  description?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showCloseButton?: boolean
}

const Modal = forwardRef<HTMLDivElement, ModalProps>(
  ({
    className,
    isOpen,
    onClose,
    title,
    description,
    size = 'md',
    showCloseButton = true,
    children,
    ...props
  }, ref) => {
    const sizes = {
      sm: 'max-w-md',
      md: 'max-w-lg',
      lg: 'max-w-2xl',
      xl: 'max-w-4xl'
    }

    // Prevent body scroll when modal is open
    useEffect(() => {
      if (isOpen) {
        document.body.style.overflow = 'hidden'
      } else {
        document.body.style.overflow = 'unset'
      }

      return () => {
        document.body.style.overflow = 'unset'
      }
    }, [isOpen])

    // Close on escape key
    useEffect(() => {
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape' && isOpen) {
          onClose()
        }
      }

      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }, [isOpen, onClose])

    if (!isOpen) return null

    return (
      <div className="fixed inset-0 z-[9999] overflow-y-auto">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="flex min-h-full items-center justify-center p-4 pb-24">
          <div
            ref={ref}
            className={cn(
              'relative w-full bg-white rounded-2xl shadow-xl transform transition-all my-8',
              sizes[size],
              className
            )}
            {...props}
          >
            {/* Header */}
            {(title || showCloseButton) && (
              <div className="flex items-start justify-between p-6 border-b border-gray-200">
                <div>
                  {title && (
                    <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
                  )}
                  {description && (
                    <p className="mt-1 text-sm text-gray-600">{description}</p>
                  )}
                </div>

                {showCloseButton && (
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                    aria-label="Close modal"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            )}

            {/* Content */}
            <div className="p-6">
              {children}
            </div>
          </div>
        </div>
      </div>
    )
  }
)

Modal.displayName = 'Modal'

export interface ModalFooterProps extends HTMLAttributes<HTMLDivElement> {
  cancelText?: string
  confirmText?: string
  onCancel?: () => void
  onConfirm?: () => void
  isLoading?: boolean
  confirmDisabled?: boolean
}

export const ModalFooter = forwardRef<HTMLDivElement, ModalFooterProps>(
  ({
    className,
    cancelText = 'Cancel',
    confirmText = 'Confirm',
    onCancel,
    onConfirm,
    isLoading,
    confirmDisabled,
    children,
    ...props
  }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('flex items-center justify-end gap-3 pt-4 border-t border-gray-200 mt-6', className)}
      >
        {children || (
          <>
            {onCancel && (
              <Button variant="outline" onClick={onCancel}>
                {cancelText}
              </Button>
            )}
            {onConfirm && (
              <Button onClick={onConfirm} isLoading={isLoading} disabled={confirmDisabled}>
                {confirmText}
              </Button>
            )}
          </>
        )}
      </div>
    )
  }
)

ModalFooter.displayName = 'ModalFooter'

export default Modal
