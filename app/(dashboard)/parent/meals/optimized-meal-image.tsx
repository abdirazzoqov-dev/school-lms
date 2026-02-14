'use client'

import Image from 'next/image'
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
      <div className="relative h-36 w-full overflow-hidden bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 flex items-center justify-center">
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
        <div className="absolute inset-0 animate-pulse bg-muted/50 flex items-center justify-center">
          <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      )}
      
      <Image
        src={src}
        alt={alt}
        fill
        className={cn(
          "object-cover transition-all duration-500",
          isLoading ? "scale-110 blur-md opacity-0" : "scale-100 blur-0 opacity-100 group-hover:scale-105",
          className
        )}
        loading="lazy"
        quality={70}
        placeholder="blur"
        blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iI2YzZjRmNiIvPjwvc3ZnPg=="
        sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 20vw"
        priority={false}
        onLoadingComplete={() => setIsLoading(false)}
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

