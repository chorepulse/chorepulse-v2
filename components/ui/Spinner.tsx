import { HTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

export interface SpinnerProps extends HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg'
  variant?: 'primary' | 'secondary'
}

const Spinner = forwardRef<HTMLDivElement, SpinnerProps>(
  ({ className, size = 'md', variant = 'primary', ...props }, ref) => {
    const sizes = {
      sm: 'w-4 h-4 border-2',
      md: 'w-8 h-8 border-3',
      lg: 'w-12 h-12 border-4'
    }

    const variants = {
      primary: 'border-blue-200 border-t-blue-600',
      secondary: 'border-gray-200 border-t-gray-600'
    }

    return (
      <div
        ref={ref}
        className={cn('flex items-center justify-center', className)}
        {...props}
      >
        <div
          className={cn(
            'animate-spin rounded-full',
            sizes[size],
            variants[variant]
          )}
        />
      </div>
    )
  }
)

Spinner.displayName = 'Spinner'

export default Spinner
