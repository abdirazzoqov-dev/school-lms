'use client'

import { useState, useMemo } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ChevronLeft, ChevronRight, Search } from 'lucide-react'

type AttendanceRecord = {
  id: string
  status: 'PRESENT' | 'ABSENT' | 'LATE'
  createdAt: Date
  student: {
    user: { fullName: string } | null
    class: { name: string } | null
  }
}

type Props = {
  attendances: AttendanceRecord[]
}

const ITEMS_PER_PAGE = 20

export function AttendanceTable({ attendances }: Props) {
  const [searchQuery, setSearchQuery] = useState('')
  const [classFilter, setClassFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)

  // Get unique classes
  const classes = useMemo(() => {
    const uniqueClasses = new Set<string>()
    attendances.forEach((att) => {
      if (att.student.class?.name) {
        uniqueClasses.add(att.student.class.name)
      }
    })
    return Array.from(uniqueClasses).sort()
  }, [attendances])

  // Filter attendances
  const filteredAttendances = useMemo(() => {
    return attendances.filter((att) => {
      // Search filter
      const matchesSearch = att.student.user?.fullName
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase())
      if (searchQuery && !matchesSearch) return false

      // Class filter
      if (classFilter !== 'all' && att.student.class?.name !== classFilter) {
        return false
      }

      // Status filter
      if (statusFilter !== 'all' && att.status !== statusFilter) {
        return false
      }

      return true
    })
  }, [attendances, searchQuery, classFilter, statusFilter])

  // Pagination
  const totalPages = Math.ceil(filteredAttendances.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const paginatedAttendances = filteredAttendances.slice(startIndex, endIndex)

  // Reset to page 1 when filters change
  const handleFilterChange = (callback: () => void) => {
    callback()
    setCurrentPage(1)
  }

  const statusMap = {
    PRESENT: { label: 'Kelgan', variant: 'default' as const, className: 'bg-green-600' },
    ABSENT: { label: 'Kelmagan', variant: 'destructive' as const, className: '' },
    LATE: { label: 'Kech kelgan', variant: 'secondary' as const, className: 'bg-orange-600 text-white' }
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="grid gap-4 md:grid-cols-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="O'quvchi qidirish..."
            value={searchQuery}
            onChange={(e) => handleFilterChange(() => setSearchQuery(e.target.value))}
            className="pl-9"
          />
        </div>

        {/* Class Filter */}
        <Select value={classFilter} onValueChange={(value) => handleFilterChange(() => setClassFilter(value))}>
          <SelectTrigger>
            <SelectValue placeholder="Barcha sinflar" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Barcha sinflar</SelectItem>
            {classes.map((cls) => (
              <SelectItem key={cls} value={cls}>
                {cls}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Status Filter */}
        <Select value={statusFilter} onValueChange={(value) => handleFilterChange(() => setStatusFilter(value))}>
          <SelectTrigger>
            <SelectValue placeholder="Barcha statuslar" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Barcha statuslar</SelectItem>
            <SelectItem value="PRESENT">Kelgan</SelectItem>
            <SelectItem value="ABSENT">Kelmagan</SelectItem>
            <SelectItem value="LATE">Kech kelgan</SelectItem>
          </SelectContent>
        </Select>

        {/* Results count */}
        <div className="flex items-center justify-end text-sm text-muted-foreground">
          {filteredAttendances.length} ta natija
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border overflow-x-auto">
        <table className="w-full">
          <thead className="border-b bg-muted/50">
            <tr>
              <th className="p-4 text-left text-sm font-medium">O'quvchi</th>
              <th className="p-4 text-left text-sm font-medium">Sinf</th>
              <th className="p-4 text-left text-sm font-medium">Status</th>
              <th className="p-4 text-left text-sm font-medium">Vaqt</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {paginatedAttendances.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-8 text-center text-muted-foreground">
                  Ma'lumot topilmadi
                </td>
              </tr>
            ) : (
              paginatedAttendances.map((attendance) => (
                <tr key={attendance.id} className="hover:bg-muted/30">
                  <td className="p-4">
                    <p className="font-medium">{attendance.student.user?.fullName || 'N/A'}</p>
                  </td>
                  <td className="p-4">{attendance.student.class?.name || '-'}</td>
                  <td className="p-4">
                    <Badge
                      variant={statusMap[attendance.status].variant}
                      className={statusMap[attendance.status].className}
                    >
                      {statusMap[attendance.status].label}
                    </Badge>
                  </td>
                  <td className="p-4 text-sm text-muted-foreground">
                    {new Date(attendance.createdAt).toLocaleTimeString('uz-UZ', {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                      timeZone: 'Asia/Tashkent'
                    })}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {startIndex + 1}-{Math.min(endIndex, filteredAttendances.length)} / {filteredAttendances.length}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Oldingi
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum
                if (totalPages <= 5) {
                  pageNum = i + 1
                } else if (currentPage <= 3) {
                  pageNum = i + 1
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i
                } else {
                  pageNum = currentPage - 2 + i
                }
                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setCurrentPage(pageNum)}
                    className="w-9 h-9 p-0"
                  >
                    {pageNum}
                  </Button>
                )
              })}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              Keyingi
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

