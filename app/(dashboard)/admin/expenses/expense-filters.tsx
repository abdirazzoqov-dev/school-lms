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
    <div className="flex gap-4 flex-wrap items-end">
      {/* Category Filter */}
      <div className="flex-1 min-w-[200px]">
        <Label htmlFor="categoryFilter">Xarajat Turi</Label>
        <select
          id="categoryFilter"
          className="w-full mt-1 rounded-md border border-input bg-background px-3 py-2"
          value={searchParams.get('categoryId') || ''}
          onChange={(e) => handleCategoryChange(e.target.value)}
        >
          <option value="">Barcha turlar</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      {/* Start Date */}
      <div>
        <Label htmlFor="startDate">Boshlanish Sanasi</Label>
        <Input
          id="startDate"
          type="date"
          className="mt-1"
          value={searchParams.get('startDate') || ''}
          onChange={(e) => handleDateChange('startDate', e.target.value)}
        />
      </div>

      {/* End Date */}
      <div>
        <Label htmlFor="endDate">Tugash Sanasi</Label>
        <Input
          id="endDate"
          type="date"
          className="mt-1"
          value={searchParams.get('endDate') || ''}
          onChange={(e) => handleDateChange('endDate', e.target.value)}
        />
      </div>

      {/* Clear Filters */}
      {(searchParams.get('categoryId') || searchParams.get('startDate') || searchParams.get('endDate')) && (
        <Button variant="outline" onClick={handleClearFilters}>
          Tozalash
        </Button>
      )}
    </div>
  )
}

