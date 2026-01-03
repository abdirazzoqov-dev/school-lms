'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'

export function ClearFilters() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  
  const hasFilters = searchParams.toString().length > 0

  const handleClear = () => {
    router.push(pathname)
  }

  if (!hasFilters) return null

  return (
    <Button variant="ghost" size="sm" onClick={handleClear}>
      <X className="h-4 w-4 mr-2" />
      Tozalash
    </Button>
  )
}

