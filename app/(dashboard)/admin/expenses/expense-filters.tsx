'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface ExpenseFiltersProps {
  categories: Array<{
    id: string
    name: string
    color: string | null
  }>
}

export function ExpenseFilters({ categories }: ExpenseFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleCategoryChange = (categoryId: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (categoryId) {
      params.set('categoryId', categoryId)
    } else {
      params.delete('categoryId')
    }
    router.push(`/admin/expenses?${params.toString()}`)
  }

  const handleDateChange = (field: 'startDate' | 'endDate', value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set(field, value)
    } else {
      params.delete(field)
    }
    router.push(`/admin/expenses?${params.toString()}`)
  }

  const handleClearFilters = () => {
    router.push('/admin/expenses')
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {/* Category Filter */}
        <div className="sm:col-span-2">
          <Label htmlFor="categoryFilter" className="text-sm font-medium">Xarajat Turi</Label>
          <select
            id="categoryFilter"
            className="w-full mt-1.5 rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary transition-all"
            value={searchParams.get('categoryId') || ''}
            onChange={(e) => handleCategoryChange(e.target.value)}
          >
            <option value="">📋 Barcha turlar</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        {/* Start Date */}
        <div>
          <Label htmlFor="startDate" className="text-sm font-medium">Boshlanish</Label>
          <Input
            id="startDate"
            type="date"
            className="mt-1.5 h-10"
            value={searchParams.get('startDate') || ''}
            onChange={(e) => handleDateChange('startDate', e.target.value)}
          />
        </div>

        {/* End Date */}
        <div>
          <Label htmlFor="endDate" className="text-sm font-medium">Tugash</Label>
          <Input
            id="endDate"
            type="date"
            className="mt-1.5 h-10"
            value={searchParams.get('endDate') || ''}
            onChange={(e) => handleDateChange('endDate', e.target.value)}
          />
        </div>
      </div>

      {/* Clear Filters */}
      {(searchParams.get('categoryId') || searchParams.get('startDate') || searchParams.get('endDate')) && (
        <div className="flex justify-end">
          <Button 
            variant="outline" 
            onClick={handleClearFilters}
            className="text-sm"
          >
            ✕ Filtrni Tozalash
          </Button>
        </div>
      )}
    </div>
  )
}

