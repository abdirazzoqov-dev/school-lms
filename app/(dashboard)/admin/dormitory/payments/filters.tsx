'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface FiltersProps {
  selectedMonth: number
  selectedYear: number
  selectedBuilding: string | undefined
  selectedStatus: string | undefined
  buildings: Array<{ id: string; name: string }>
}

export function DormitoryPaymentsFilters({
  selectedMonth,
  selectedYear,
  selectedBuilding,
  selectedStatus,
  buildings,
}: FiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value === 'all') {
      params.delete(key)
    } else {
      params.set(key, value)
    }
    router.push(`?${params.toString()}`)
  }

  const months = [
    { value: '1', label: 'Yanvar' },
    { value: '2', label: 'Fevral' },
    { value: '3', label: 'Mart' },
    { value: '4', label: 'Aprel' },
    { value: '5', label: 'May' },
    { value: '6', label: 'Iyun' },
    { value: '7', label: 'Iyul' },
    { value: '8', label: 'Avgust' },
    { value: '9', label: 'Sentyabr' },
    { value: '10', label: 'Oktyabr' },
    { value: '11', label: 'Noyabr' },
    { value: '12', label: 'Dekabr' },
  ]

  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Filtrlash</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Oy</label>
            <Select
              value={selectedMonth.toString()}
              onValueChange={(value) => updateFilter('month', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {months.map((month) => (
                  <SelectItem key={month.value} value={month.value}>
                    {month.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Yil</label>
            <Select
              value={selectedYear.toString()}
              onValueChange={(value) => updateFilter('year', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {years.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Bino</label>
            <Select
              value={selectedBuilding || 'all'}
              onValueChange={(value) => updateFilter('building', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Barcha binolar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Barcha binolar</SelectItem>
                {buildings.map((building) => (
                  <SelectItem key={building.id} value={building.id}>
                    {building.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Status</label>
            <Select
              value={selectedStatus || 'all'}
              onValueChange={(value) => updateFilter('status', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Barcha statuslar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Barcha statuslar</SelectItem>
                <SelectItem value="PENDING">Kutilmoqda</SelectItem>
                <SelectItem value="PARTIALLY_PAID">Qisman to&apos;langan</SelectItem>
                <SelectItem value="COMPLETED">To&apos;langan</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

