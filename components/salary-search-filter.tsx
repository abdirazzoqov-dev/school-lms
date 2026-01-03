'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Calendar, Search, X } from 'lucide-react'
import { monthNames, currentMonth, currentYear } from '@/lib/validations/salary'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useState } from 'react'

export function SalarySearchFilter() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '')
  const selectedMonth = searchParams.get('month') || currentMonth.toString()
  const selectedYear = searchParams.get('year') || currentYear.toString()
  const selectedType = searchParams.get('type') || 'all'
  const selectedStatus = searchParams.get('status') || 'all'

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value === 'all' || value === '') {
      params.delete(key)
    } else {
      params.set(key, value)
    }
    router.push(`/admin/salaries?${params.toString()}`)
  }

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    updateFilter('search', query)
  }

  const clearFilters = () => {
    setSearchQuery('')
    router.push('/admin/salaries')
  }

  const hasFilters = searchQuery || selectedType !== 'all' || selectedStatus !== 'all'

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Xodim ismi bo'yicha qidirish..."
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          className="pl-10 pr-10 h-12 text-base"
        />
        {searchQuery && (
          <button
            onClick={() => handleSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Filters Row */}
      <div className="flex flex-wrap gap-3">
        {/* Month & Year Filter */}
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <select
            value={selectedMonth}
            onChange={(e) => updateFilter('month', e.target.value)}
            className="px-3 py-2 border rounded-md text-sm bg-white"
          >
            {monthNames.map((name, index) => (
              <option key={index + 1} value={index + 1}>
                {name}
              </option>
            ))}
          </select>
          <select
            value={selectedYear}
            onChange={(e) => updateFilter('year', e.target.value)}
            className="px-3 py-2 border rounded-md text-sm bg-white"
          >
            {[currentYear - 1, currentYear, currentYear + 1].map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>

        {/* Type Filter */}
        <select
          value={selectedType}
          onChange={(e) => updateFilter('type', e.target.value)}
          className="px-3 py-2 border rounded-md text-sm bg-white"
        >
          <option value="all">Barcha turlar</option>
          <option value="FULL_SALARY">Oylik maosh</option>
          <option value="ADVANCE">Avans</option>
          <option value="BONUS">Mukofot</option>
          <option value="DEDUCTION">Ushlab qolish</option>
        </select>

        {/* Status Filter */}
        <select
          value={selectedStatus}
          onChange={(e) => updateFilter('status', e.target.value)}
          className="px-3 py-2 border rounded-md text-sm bg-white"
        >
          <option value="all">Barcha statuslar</option>
          <option value="PAID">To'langan</option>
          <option value="PENDING">Kutilmoqda</option>
          <option value="PARTIALLY_PAID">Qisman to'langan</option>
          <option value="CANCELLED">Bekor qilingan</option>
        </select>

        {hasFilters && (
          <Button
            variant="outline"
            size="sm"
            onClick={clearFilters}
            className="ml-auto"
          >
            <X className="h-4 w-4 mr-2" />
            Tozalash
          </Button>
        )}
      </div>
    </div>
  )
}

