'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface PageSizeSelectorProps {
  currentPageSize: number
  options?: number[]
}

export function PageSizeSelector({ 
  currentPageSize, 
  options = [10, 25, 50, 100] 
}: PageSizeSelectorProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const handleChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('pageSize', value)
    params.delete('page') // Reset to page 1 when changing page size
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">Sahifada:</span>
      <Select value={currentPageSize.toString()} onValueChange={handleChange}>
        <SelectTrigger className="w-[80px] h-9">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((size) => (
            <SelectItem key={size} value={size.toString()}>
              {size}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

