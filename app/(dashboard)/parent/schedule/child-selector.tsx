'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface Child {
  id: string
  user: {
    fullName: string
  } | null
}

interface ChildSelectorProps {
  childrenList: Child[]
  selectedChildId: string
}

export function ChildSelector({ childrenList, selectedChildId }: ChildSelectorProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleChange = (childId: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('childId', childId)
    router.push(`/parent/schedule?${params.toString()}`)
  }

  if (childrenList.length <= 1) {
    return null
  }

  return (
    <Select value={selectedChildId} onValueChange={handleChange}>
      <SelectTrigger className="w-full sm:w-[250px] bg-gray-50">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {childrenList.map(child => (
          <SelectItem key={child.id} value={child.id}>
            {child.user?.fullName || 'N/A'}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

