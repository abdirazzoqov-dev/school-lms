'use client'

import { Button } from '@/components/ui/button'
import { RefreshCw } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useState } from 'react'

export function ClearCacheButton() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleClearCache = async () => {
    setIsLoading(true)
    try {
      // Call API to clear server cache
      await fetch('/api/clear-cache', { method: 'POST' })
      
      // Refresh router cache
      router.refresh()
      
      toast.success('Cache tozalandi! Sahifa yangilanmoqda...')
      
      // Force reload page
      setTimeout(() => {
        window.location.reload()
      }, 500)
    } catch (error) {
      toast.error('Cache tozalashda xatolik')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button 
      onClick={handleClearCache} 
      variant="outline" 
      size="sm"
      disabled={isLoading}
    >
      <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
      Cache Tozalash
    </Button>
  )
}

