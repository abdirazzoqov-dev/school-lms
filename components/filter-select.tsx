'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface FilterOption {
  label: string
  value: string
}

interface FilterSelectProps {
  paramName: string
  options: FilterOption[]
  placeholder?: string
  className?: string
}

export function FilterSelect({ paramName, options, placeholder = "Hammasi", className }: FilterSelectProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const currentValue = searchParams.get(paramName) || ''

  const handleChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    
    if (value && value !== 'all') {
      params.set(paramName, value)
    } else {
      params.delete(paramName)
    }
    
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <Select value={currentValue || 'all'} onValueChange={handleChange}>
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">{placeholder}</SelectItem>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

