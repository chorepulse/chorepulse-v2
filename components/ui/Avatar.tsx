import { HTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'
import Image from 'next/image'

export interface AvatarProps extends HTMLAttributes<HTMLDivElement> {
  src?: string | null
  alt?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  fallback?: string
}

const Avatar = forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, src, alt = 'Avatar', size = 'md', fallback, ...props }, ref) => {
    const sizes = {
      sm: 'w-8 h-8 text-xs',
      md: 'w-10 h-10 text-sm',
      lg: 'w-12 h-12 text-base',
      xl: 'w-16 h-16 text-lg'
    }

    // Generate initials from alt text as fallback
    const getInitials = (name: string) => {
      const words = name.split(' ')
      if (words.length >= 2) {
        return `${words[0][0]}${words[1][0]}`.toUpperCase()
      }
      return name.substring(0, 2).toUpperCase()
    }

    const displayFallback = fallback || getInitials(alt)

    // Check if src is a valid URL (http/https) or data URL
    const isValidImageUrl = src && (
      src.startsWith('http://') ||
      src.startsWith('https://') ||
      src.startsWith('data:') ||
      src.startsWith('/')
    )

    // If src is provided but not a valid URL (e.g., emoji), use it as fallback text
    const fallbackText = !isValidImageUrl && src ? src : displayFallback

    return (
      <div
        ref={ref}
        className={cn(
          'relative inline-flex items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-purple-500 text-white font-semibold overflow-hidden',
          sizes[size],
          className
        )}
        {...props}
      >
        {isValidImageUrl ? (
          <Image
            src={src!}
            alt={alt}
            fill
            className="object-cover"
          />
        ) : (
          <span>{fallbackText}</span>
        )}
      </div>
    )
  }
)

Avatar.displayName = 'Avatar'

export default Avatar
