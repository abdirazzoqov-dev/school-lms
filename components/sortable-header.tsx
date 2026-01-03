'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface SortableHeaderProps {
  column: string
  label: string
  className?: string
}

export function SortableHeader({ column, label, className = '' }: SortableHeaderProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  
  const currentSort = searchParams.get('sortBy')
  const currentOrder = searchParams.get('order') || 'asc'
  
  const isActive = currentSort === column
  const isAsc = isActive && currentOrder === 'asc'
  const isDesc = isActive && currentOrder === 'desc'

  const handleSort = () => {
    const params = new URLSearchParams(searchParams.toString())
    
    if (!isActive) {
      // First click: sort ascending
      params.set('sortBy', column)
      params.set('order', 'asc')
    } else if (isAsc) {
      // Second click: sort descending
      params.set('order', 'desc')
    } else {
      // Third click: remove sort (back to default)
      params.delete('sortBy')
      params.delete('order')
    }
    
    // Reset to page 1 when sorting changes
    params.delete('page')
    
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <th className={`p-4 text-left text-sm font-medium ${className}`}>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleSort}
        className="-ml-3 h-8 data-[state=open]:bg-accent"
      >
        {label}
        {!isActive && <ArrowUpDown className="ml-2 h-4 w-4 text-muted-foreground" />}
        {isAsc && <ArrowUp className="ml-2 h-4 w-4" />}
        {isDesc && <ArrowDown className="ml-2 h-4 w-4" />}
      </Button>
    </th>
  )
}

// Non-sortable header (for consistency)
export function TableHeader({ label, className = '' }: { label: string; className?: string }) {
  return (
    <th className={`p-4 text-left text-sm font-medium ${className}`}>
      {label}
    </th>
  )
}

