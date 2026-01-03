'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Calendar } from 'lucide-react'
import { monthNames, currentMonth, currentYear } from '@/lib/validations/salary'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export function SalaryFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const selectedMonth = searchParams.get('month') || currentMonth.toString()
  const selectedYear = searchParams.get('year') || currentYear.toString()
  const selectedType = searchParams.get('type') || 'all'
  const selectedStatus = searchParams.get('status') || 'all'

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value === 'all') {
      params.delete(key)
    } else {
      params.set(key, value)
    }
    router.push(`/admin/salaries?${params.toString()}`)
  }

  return (
    <div className="flex flex-wrap gap-3">
      {/* Month & Year Filter */}
      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4 text-muted-foreground" />
        <select
          value={selectedMonth}
          onChange={(e) => updateFilter('month', e.target.value)}
          className="px-3 py-1.5 border rounded-md text-sm"
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
          className="px-3 py-1.5 border rounded-md text-sm"
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
        className="px-3 py-1.5 border rounded-md text-sm"
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
        className="px-3 py-1.5 border rounded-md text-sm"
      >
        <option value="all">Barcha statuslar</option>
        <option value="PAID">To'langan</option>
        <option value="PENDING">Kutilmoqda</option>
        <option value="PARTIALLY_PAID">Qisman to'langan</option>
        <option value="CANCELLED">Bekor qilingan</option>
      </select>

      {(selectedType !== 'all' || selectedStatus !== 'all') && (
        <Button
          variant="outline"
          size="sm"
          asChild
        >
          <Link href="/admin/salaries">
            Tozalash
          </Link>
        </Button>
      )}
    </div>
  )
}

