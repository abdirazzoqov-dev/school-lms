'use client'

import { useState, memo } from 'react'
import { cn } from '@/lib/utils'

interface OptimizedMealImageProps {
  src: string
  alt: string
  className?: string
}

export const OptimizedMealImage = memo(function OptimizedMealImage({ 
  src, 
  alt, 
  className 
}: OptimizedMealImageProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  if (hasError) {
    return (
      <div className="relative h-36 w-full overflow-hidden bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-2">🍽️</div>
          <p className="text-xs text-muted-foreground">Rasm yuklanmadi</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative h-36 w-full overflow-hidden bg-gradient-to-br from-muted to-muted/50">
      {isLoading && (
        <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center">
          <div className="h-8 w-8 rounded-full border-2 border-orange-400 border-t-transparent animate-spin" />
        </div>
      )}
      
      {/* Use plain img tag for base64 data URLs - works reliably without Next.js Image optimization */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        className={cn(
          "w-full h-full object-cover transition-all duration-500",
          isLoading ? "opacity-0 scale-105" : "opacity-100 scale-100 group-hover:scale-105",
          className
        )}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setIsLoading(false)
          setHasError(true)
        }}
      />
      
      {!isLoading && (
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
      )}
    </div>
  )
})
