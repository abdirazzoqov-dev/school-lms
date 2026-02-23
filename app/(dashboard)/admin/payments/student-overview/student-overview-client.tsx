'use client'

import { useState, useEffect, useRef } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  DollarSign, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Search,
  Calendar,
  ArrowLeft,
  X,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { formatMoney, getMonthNameUz } from '@/lib/utils/payment-helper'
import { cn } from '@/lib/utils'

interface Student {
  id: string
  studentCode: string
  monthlyTuitionFee: any
  paymentDueDay: number | null
  user: { fullName: string } | null
  class: { name: string } | null
}

interface StudentPaymentOverviewClientProps {
  students: Student[]
  currentYear: number
  tenantId: string
}

interface MonthPaymentStatus {
  month: number
  year: number
  monthName: string
  totalPaid: number
  requiredAmount: number
  percentagePaid: number
  isFullyPaid: boolean
  isPending: boolean
  isOverdue: boolean
  hasPayment: boolean
  paymentId: string | null
  status: 'completed' | 'partially_paid' | 'pending' | 'overdue' | 'not_due'
}

export function StudentPaymentOverviewClient({ 
  students, 
  currentYear,
  tenantId
}: StudentPaymentOverviewClientProps) {
  const router = useRouter()
  const [selectedStudentId, setSelectedStudentId] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [selectedYear, setSelectedYear] = useState(currentYear)
  const [monthlyStatuses, setMonthlyStatuses] = useState<MonthPaymentStatus[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const comboboxRef = useRef<HTMLDivElement>(null)

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (comboboxRef.current && !comboboxRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Filter students by search query
  const filteredStudents = searchQuery.trim()
    ? students.filter(s =>
        s.user?.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.studentCode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.class?.name?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : students

  const selectedStudent = students.find(s => s.id === selectedStudentId)

  // Select student from combobox
  const selectStudent = (student: Student) => {
    setSelectedStudentId(student.id)
    setSearchQuery(student.user?.fullName ?? '')
    setIsDropdownOpen(false)
  }

  // Clear selection
  const clearSelection = () => {
    setSelectedStudentId('')
    setSearchQuery('')
    setMonthlyStatuses([])
  }

  // Fetch payment statuses for selected student
  useEffect(() => {
    if (!selectedStudentId) {
      setMonthlyStatuses([])
      return
    }
    const fetchPaymentStatuses = async () => {
      setIsLoading(true)
      try {
        const response = await fetch(
          `/api/students/${selectedStudentId}/payment-overview?year=${selectedYear}`
        )
        const data = await response.json()
        if (data.success) setMonthlyStatuses(data.monthlyStatuses)
      } catch (error) {
        console.error('Error fetching payment statuses:', error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchPaymentStatuses()
  }, [selectedStudentId, selectedYear])

  // Calculate totals
  const totalPaid = monthlyStatuses.reduce((sum, m) => sum + m.totalPaid, 0)
  const totalRequired = monthlyStatuses.reduce((sum, m) => sum + m.requiredAmount, 0)
  const totalOverdue = monthlyStatuses.filter(m => m.isOverdue).length
  const totalCompleted = monthlyStatuses.filter(m => m.isFullyPaid).length

  const getStatusColor = (status: MonthPaymentStatus['status']) => {
    switch (status) {
      case 'completed':     return 'bg-green-50 border-green-200'
      case 'partially_paid':return 'bg-yellow-50 border-yellow-200'
      case 'overdue':       return 'bg-red-50 border-red-200'
      case 'pending':       return 'bg-orange-50 border-orange-200'
      default:              return 'bg-gray-50 border-gray-200'
    }
  }

  const getStatusBadge = (status: MonthPaymentStatus) => {
    if (status.isFullyPaid)
      return <Badge className="bg-green-500"><CheckCircle2 className="h-3 w-3 mr-1" />To'landi</Badge>
    if (status.isOverdue)
      return <Badge variant="destructive"><AlertCircle className="h-3 w-3 mr-1" />Kechikkan</Badge>
    if (status.totalPaid > 0)
      return <Badge variant="secondary" className="bg-yellow-500 text-white"><Clock className="h-3 w-3 mr-1" />Qisman</Badge>
    if (status.isPending)
      return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Kutilmoqda</Badge>
    return <Badge variant="outline" className="text-gray-500">Muddat yo'q</Badge>
  }

  const years = [currentYear - 1, currentYear, currentYear + 1]

  return (
    <div className="space-y-6">

      {/* ── Header with back button ── */}
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.back()}
          className="gap-1.5 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Orqaga
        </Button>
        <div>
          <h1 className="text-2xl font-bold">O'quvchilar To'lov Panoramasi</h1>
          <p className="text-sm text-muted-foreground">
            Har bir o'quvchining yil bo'yicha to'lovlarini ko'ring va to'lov qabul qiling
          </p>
        </div>
      </div>

      {/* ── Student Combobox + Year ── */}
      <div className="grid gap-4 md:grid-cols-3">

        {/* Combobox */}
        <div className="md:col-span-2 space-y-1.5" ref={comboboxRef}>
          <Label>O'quvchini qidiring va tanlang</Label>
          <div className="relative">
            {/* Input */}
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Ism, kod yoki sinf bo'yicha qidirish..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setIsDropdownOpen(true)
                // If input cleared, remove selection
                if (!e.target.value) clearSelection()
              }}
              onFocus={() => setIsDropdownOpen(true)}
              className={cn(
                'pl-10',
                selectedStudentId && 'pr-9 border-blue-400 bg-blue-50/40'
              )}
            />
            {/* Clear button */}
            {selectedStudentId && (
              <button
                onClick={clearSelection}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            )}

            {/* Dropdown */}
            {isDropdownOpen && (
              <div className="absolute z-50 top-full mt-1 w-full bg-background border border-border rounded-xl shadow-xl overflow-hidden">
                {filteredStudents.length === 0 ? (
                  <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                    O'quvchi topilmadi
                  </div>
                ) : (
                  <div className="max-h-72 overflow-y-auto">
                    {filteredStudents.map(student => {
                      const isSelected = student.id === selectedStudentId
                      return (
                        <button
                          key={student.id}
                          onMouseDown={(e) => e.preventDefault()} // prevent blur before click
                          onClick={() => selectStudent(student)}
                          className={cn(
                            'w-full text-left flex items-center justify-between px-4 py-2.5 hover:bg-muted/60 transition-colors text-sm',
                            isSelected && 'bg-blue-50 text-blue-700 font-medium'
                          )}
                        >
                          <span>
                            {student.user?.fullName}
                            <span className="ml-2 text-xs text-muted-foreground font-normal">
                              {student.studentCode}
                            </span>
                          </span>
                          <span className="text-xs text-muted-foreground ml-4 shrink-0">
                            {student.class?.name ?? '—'}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                )}
                <div className="px-4 py-1.5 border-t text-[11px] text-muted-foreground bg-muted/30">
                  {filteredStudents.length} ta o'quvchi
                </div>
              </div>
            )}
          </div>

          {/* Selected student chip */}
          {selectedStudent && (
            <p className="text-xs text-blue-600 font-medium pl-1">
              ✓ Tanlandi: {selectedStudent.user?.fullName} — {selectedStudent.class?.name ?? '—'}
            </p>
          )}
        </div>

        {/* Year selector */}
        <div className="space-y-1.5">
          <Label>Yil</Label>
          <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map(year => (
                <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ── Student Info Card ── */}
      {selectedStudent && (
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="grid gap-4 md:grid-cols-4">
              <div>
                <p className="text-sm text-muted-foreground">O'quvchi</p>
                <p className="text-lg font-semibold">{selectedStudent.user?.fullName}</p>
                <p className="text-xs text-muted-foreground">{selectedStudent.studentCode}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Sinf</p>
                <p className="text-lg font-semibold">{selectedStudent.class?.name || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Oylik to'lov</p>
                <p className="text-lg font-semibold">{formatMoney(Number(selectedStudent.monthlyTuitionFee))} so'm</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Muddat</p>
                <p className="text-lg font-semibold">Har oyning {selectedStudent.paymentDueDay || 5}-sanasi</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Overall Stats ── */}
      {selectedStudentId && monthlyStatuses.length > 0 && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Jami to'langan</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-600">{formatMoney(totalPaid)} so'm</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">To'langan oylar</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-blue-600">{totalCompleted} / 12</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Kechikkan</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-red-600">{totalOverdue}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Jami kerak</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-gray-600">{formatMoney(totalRequired)} so'm</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Monthly Payment Grid ── */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16 gap-3 text-muted-foreground">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          Yuklanmoqda...
        </div>
      ) : selectedStudentId && monthlyStatuses.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {monthlyStatuses.map((status) => (
            <Card
              key={`${status.month}-${status.year}`}
              className={`transition-all hover:shadow-lg ${getStatusColor(status.status)}`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">
                    <Calendar className="inline h-4 w-4 mr-2" />
                    {status.monthName} {status.year}
                  </CardTitle>
                  {getStatusBadge(status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">To'langan:</span>
                    <span className="font-semibold">{formatMoney(status.totalPaid)} so'm</span>
                  </div>
                  <Progress value={status.percentagePaid} className="h-2" />
                  <div className="flex justify-between text-xs mt-1 text-muted-foreground">
                    <span>{status.percentagePaid}%</span>
                    <span>{formatMoney(status.requiredAmount)} so'm</span>
                  </div>
                </div>

                {!status.isFullyPaid && (
                  <div className="flex justify-between text-sm border-t pt-2">
                    <span className="text-orange-600 font-medium">Qarz:</span>
                    <span className="text-orange-600 font-semibold">
                      {formatMoney(status.requiredAmount - status.totalPaid)} so'm
                    </span>
                  </div>
                )}

                {!status.isFullyPaid && (
                  status.hasPayment && status.paymentId ? (
                    <Link href={`/admin/payments/${status.paymentId}/edit`} className="block">
                      <Button size="sm" className="w-full" variant="default">
                        <DollarSign className="h-4 w-4 mr-2" />
                        To'lov qilish
                      </Button>
                    </Link>
                  ) : (
                    <Link
                      href={`/admin/payments/create?studentId=${selectedStudentId}&month=${status.month}&year=${status.year}`}
                      className="block"
                    >
                      <Button size="sm" className="w-full" variant="outline">
                        <DollarSign className="h-4 w-4 mr-2" />
                        To'lov yaratish
                      </Button>
                    </Link>
                  )
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : selectedStudentId ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Ma'lumotlar topilmadi</p>
        </div>
      ) : (
        <div className="text-center py-16">
          <Calendar className="h-16 w-16 mx-auto text-muted-foreground/40 mb-4" />
          <p className="text-lg font-medium text-muted-foreground">O'quvchini tanlang</p>
          <p className="text-sm text-muted-foreground mt-1">
            Yuqoridagi qidiruv maydoniga o'quvchi ismini yozing
          </p>
        </div>
      )}
    </div>
  )
}
