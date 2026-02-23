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
  Building2,
  Bed,
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { formatMoney, getMonthNameUz } from '@/lib/utils/payment-helper'
import { cn } from '@/lib/utils'

interface DormitoryStudent {
  id: string
  studentCode: string
  paymentDueDay: number | null
  user: { fullName: string; avatar: string | null } | null
  class: { name: string } | null
  dormitoryAssignment: {
    monthlyFee: any
    checkInDate: Date | string
    room: {
      roomNumber: string
      building: { name: string }
    }
    bed: { bedNumber: string }
  } | null
}

interface DormitoryOverviewClientProps {
  students: DormitoryStudent[]
  currentYear: number
  tenantId: string
  preSelectedStudentId?: string
}

interface MonthPaymentStatus {
  month: number
  year: number
  monthName: string
  totalPaid: number
  requiredAmount: number
  remainingAmount: number
  percentagePaid: number
  isFullyPaid: boolean
  isPending: boolean
  isOverdue: boolean
  hasPayment: boolean
  paymentId: string | null
  status: 'completed' | 'partially_paid' | 'pending' | 'overdue' | 'not_due'
}

export function DormitoryOverviewClient({
  students,
  currentYear,
  tenantId,
  preSelectedStudentId,
}: DormitoryOverviewClientProps) {
  const router = useRouter()

  const preStudent = preSelectedStudentId
    ? students.find(s => s.id === preSelectedStudentId) ?? null
    : null

  const [selectedStudentId, setSelectedStudentId] = useState(preSelectedStudentId ?? '')
  const [searchQuery, setSearchQuery] = useState(preStudent?.user?.fullName ?? '')
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [selectedYear, setSelectedYear] = useState(currentYear)
  const [monthlyStatuses, setMonthlyStatuses] = useState<MonthPaymentStatus[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const comboboxRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (comboboxRef.current && !comboboxRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const filteredStudents = searchQuery.trim()
    ? students.filter(s =>
        s.user?.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.studentCode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.class?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.dormitoryAssignment?.room?.roomNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.dormitoryAssignment?.room?.building?.name?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : students

  const selectedStudent = students.find(s => s.id === selectedStudentId)

  const selectStudent = (student: DormitoryStudent) => {
    setSelectedStudentId(student.id)
    setSearchQuery(student.user?.fullName ?? '')
    setIsDropdownOpen(false)
  }

  const clearSelection = () => {
    setSelectedStudentId('')
    setSearchQuery('')
    setMonthlyStatuses([])
  }

  // Fetch monthly dormitory payment statuses
  useEffect(() => {
    if (!selectedStudentId) {
      setMonthlyStatuses([])
      return
    }
    const fetch_ = async () => {
      setIsLoading(true)
      try {
        const res = await fetch(
          `/api/students/${selectedStudentId}/dormitory-payment-overview?year=${selectedYear}`
        )
        const data = await res.json()
        if (data.success) setMonthlyStatuses(data.monthlyStatuses)
      } catch (err) {
        console.error('Error fetching dormitory payment overview:', err)
      } finally {
        setIsLoading(false)
      }
    }
    fetch_()
  }, [selectedStudentId, selectedYear])

  const totalPaid = monthlyStatuses.reduce((s, m) => s + m.totalPaid, 0)
  const totalRequired = monthlyStatuses.reduce((s, m) => s + m.requiredAmount, 0)
  const totalOverdue = monthlyStatuses.filter(m => m.isOverdue).length
  const totalCompleted = monthlyStatuses.filter(m => m.isFullyPaid).length

  const getStatusColor = (status: MonthPaymentStatus['status']) => {
    switch (status) {
      case 'completed':      return 'bg-emerald-50 border-emerald-200'
      case 'partially_paid': return 'bg-yellow-50 border-yellow-200'
      case 'overdue':        return 'bg-red-50 border-red-200'
      case 'pending':        return 'bg-orange-50 border-orange-200'
      default:               return 'bg-gray-50 border-gray-200'
    }
  }

  const getStatusBadge = (s: MonthPaymentStatus) => {
    if (s.isFullyPaid)
      return <Badge className="bg-emerald-500 text-white"><CheckCircle2 className="h-3 w-3 mr-1" />To'landi</Badge>
    if (s.isOverdue)
      return <Badge variant="destructive"><AlertCircle className="h-3 w-3 mr-1" />Kechikkan</Badge>
    if (s.totalPaid > 0)
      return <Badge className="bg-amber-500 text-white"><Clock className="h-3 w-3 mr-1" />Qisman</Badge>
    if (s.isPending)
      return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Kutilmoqda</Badge>
    return <Badge variant="outline" className="text-gray-500">Muddat yo'q</Badge>
  }

  const years = [currentYear - 1, currentYear, currentYear + 1]

  const assignment = selectedStudent?.dormitoryAssignment

  return (
    <div className="space-y-6">

      {/* Header */}
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
          <h1 className="text-2xl font-bold">Yotoqxona To'lov Panoramasi</h1>
          <p className="text-sm text-muted-foreground">
            Yotoqxonada yashovchi o'quvchilarning oylik to'lovlarini kuzating
          </p>
        </div>
      </div>

      {/* Student combobox + year */}
      <div className="grid gap-4 md:grid-cols-3">

        <div className="md:col-span-2 space-y-1.5" ref={comboboxRef}>
          <Label>O'quvchini qidiring va tanlang</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Ism, kod, xona yoki bino bo'yicha qidirish..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setIsDropdownOpen(true)
                if (!e.target.value) clearSelection()
              }}
              onFocus={() => setIsDropdownOpen(true)}
              className={cn(
                'pl-10',
                selectedStudentId && 'pr-9 border-teal-400 bg-teal-50/40'
              )}
            />
            {selectedStudentId && (
              <button
                onClick={clearSelection}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            )}

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
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => selectStudent(student)}
                          className={cn(
                            'w-full text-left flex items-center gap-3 px-3 py-2.5 hover:bg-muted/60 transition-colors text-sm',
                            isSelected && 'bg-teal-50 text-teal-700 font-medium'
                          )}
                        >
                          {/* Avatar */}
                          <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 bg-teal-100 flex items-center justify-center">
                            {student.user?.avatar ? (
                              <Image src={student.user.avatar} alt="" width={32} height={32} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-teal-700 font-bold text-xs">
                                {student.user?.fullName?.charAt(0) ?? '?'}
                              </span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="truncate">{student.user?.fullName}</p>
                            <p className="text-xs text-muted-foreground font-normal truncate">
                              {student.dormitoryAssignment?.room?.building?.name} · Xona {student.dormitoryAssignment?.room?.roomNumber}
                            </p>
                          </div>
                          <span className="text-xs text-muted-foreground shrink-0">
                            {student.class?.name ?? '—'}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                )}
                <div className="px-4 py-1.5 border-t text-[11px] text-muted-foreground bg-muted/30">
                  {filteredStudents.length} ta o'quvchi yotoqxonada
                </div>
              </div>
            )}
          </div>

          {selectedStudent && (
            <p className="text-xs text-teal-600 font-medium pl-1">
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

      {/* Student / Room info card */}
      {selectedStudent && assignment && (
        <Card className="bg-gradient-to-r from-teal-50 to-emerald-50 border-teal-200">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-4 mb-4">
              {/* Avatar */}
              <div className="w-12 h-12 rounded-full overflow-hidden shrink-0 ring-2 ring-teal-300 shadow">
                {selectedStudent.user?.avatar ? (
                  <Image src={selectedStudent.user.avatar} alt="" width={48} height={48} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-teal-500 flex items-center justify-center text-white font-bold text-lg">
                    {selectedStudent.user?.fullName?.charAt(0) ?? '?'}
                  </div>
                )}
              </div>
              <div>
                <p className="text-lg font-bold text-teal-900">{selectedStudent.user?.fullName}</p>
                <p className="text-sm text-teal-700">{selectedStudent.studentCode} · {selectedStudent.class?.name ?? '—'}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground flex items-center gap-1"><Building2 className="h-3.5 w-3.5" /> Bino</p>
                <p className="font-semibold">{assignment.room.building.name}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Xona</p>
                <p className="font-semibold">{assignment.room.roomNumber}</p>
              </div>
              <div>
                <p className="text-muted-foreground flex items-center gap-1"><Bed className="h-3.5 w-3.5" /> O'rin</p>
                <p className="font-semibold">{assignment.bed.bedNumber}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Oylik to'lov</p>
                <p className="font-semibold text-teal-700">{formatMoney(Number(assignment.monthlyFee))} so'm</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Overall stats */}
      {selectedStudentId && monthlyStatuses.length > 0 && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Jami to'langan</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-emerald-600">{formatMoney(totalPaid)} so'm</p>
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

      {/* Monthly payment grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16 gap-3 text-muted-foreground">
          <div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
          Yuklanmoqda...
        </div>
      ) : selectedStudentId && monthlyStatuses.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {monthlyStatuses.map((ms) => (
            <Card
              key={`${ms.month}-${ms.year}`}
              className={`transition-all hover:shadow-lg border-2 ${getStatusColor(ms.status)}`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">
                    <Calendar className="inline h-4 w-4 mr-1.5" />
                    {ms.monthName} {ms.year}
                  </CardTitle>
                  {getStatusBadge(ms)}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">To'langan:</span>
                    <span className="font-semibold">{formatMoney(ms.totalPaid)} so'm</span>
                  </div>
                  <Progress value={ms.percentagePaid} className="h-2" />
                  <div className="flex justify-between text-xs mt-1 text-muted-foreground">
                    <span>{ms.percentagePaid}%</span>
                    <span>{formatMoney(ms.requiredAmount)} so'm</span>
                  </div>
                </div>

                {!ms.isFullyPaid && ms.totalPaid > 0 && (
                  <div className="flex justify-between text-sm border-t pt-2">
                    <span className="text-orange-600 font-medium">Qarz:</span>
                    <span className="text-orange-600 font-semibold">
                      {formatMoney(ms.remainingAmount)} so'm
                    </span>
                  </div>
                )}

                {!ms.isFullyPaid && (
                  ms.hasPayment && ms.paymentId ? (
                    <Button
                      size="sm"
                      className="w-full bg-teal-600 hover:bg-teal-700"
                      asChild
                    >
                      <Link href={`/admin/payments/${ms.paymentId}/edit`}>
                        <DollarSign className="h-4 w-4 mr-2" />
                        To'lov qilish
                      </Link>
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full border-teal-400 text-teal-700 hover:bg-teal-50"
                      asChild
                    >
                      <Link
                        href={`/admin/payments/create?studentId=${selectedStudentId}&month=${ms.month}&year=${ms.year}&paymentType=DORMITORY&fromDormOverview=1`}
                      >
                        <DollarSign className="h-4 w-4 mr-2" />
                        To'lov yaratish
                      </Link>
                    </Button>
                  )
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : selectedStudentId ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Bu yil uchun to'lov ma'lumotlari topilmadi</p>
        </div>
      ) : (
        <div className="text-center py-16">
          <Bed className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
          <p className="text-lg font-medium text-muted-foreground">O'quvchini tanlang</p>
          <p className="text-sm text-muted-foreground mt-1">
            Yotoqxonada yashovchi o'quvchini qidirib tanlang
          </p>
        </div>
      )}
    </div>
  )
}
