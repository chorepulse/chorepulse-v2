import { HTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

export interface AlertProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info'
  title?: string
  icon?: React.ReactNode
  onClose?: () => void
}

const Alert = forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant = 'default', title, icon, onClose, children, ...props }, ref) => {
    const variants = {
      default: 'bg-gray-50 border-gray-300 text-gray-800',
      success: 'bg-green-50 border-green-300 text-green-800',
      warning: 'bg-yellow-50 border-yellow-300 text-yellow-800',
      danger: 'bg-red-50 border-red-300 text-red-800',
      info: 'bg-blue-50 border-blue-300 text-blue-800'
    }

    const defaultIcons = {
      default: '💡',
      success: '✅',
      warning: '⚠️',
      danger: '❌',
      info: 'ℹ️'
    }

    return (
      <div
        ref={ref}
        className={cn(
          'border rounded-xl p-4',
          variants[variant],
          className
        )}
        {...props}
      >
        <div className="flex items-start gap-3">
          {(icon || defaultIcons[variant]) && (
            <div className="flex-shrink-0 text-xl">
              {icon || defaultIcons[variant]}
            </div>
          )}

          <div className="flex-1">
            {title && (
              <h4 className="font-semibold mb-1">{title}</h4>
            )}
            {children && (
              <div className="text-sm">{children}</div>
            )}
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>
    )
  }
)

Alert.displayName = 'Alert'

export default Alert
