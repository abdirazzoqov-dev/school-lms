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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
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
  Plane,
  MinusCircle,
  Loader2,
  Info,
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { formatMoney, getMonthNameUz } from '@/lib/utils/payment-helper'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

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
  isLeave: boolean
  leaveReason: string | null
  isNotApplicable: boolean
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

  // Leave dialog state
  const [leaveDialog, setLeaveDialog] = useState<{
    open: boolean
    month: number
    monthName: string
    currentReason: string | null
    isAdding: boolean // true = add leave, false = remove
  }>({ open: false, month: 0, monthName: '', currentReason: null, isAdding: true })
  const [leaveReason, setLeaveReason] = useState('')
  const [leaveLoading, setLeaveLoading] = useState(false)

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

  const fetchStatuses = async (sid: string, yr: number) => {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/students/${sid}/dormitory-payment-overview?year=${yr}`)
      const data = await res.json()
      if (data.success) setMonthlyStatuses(data.monthlyStatuses)
    } catch {
      toast.error('Ma\'lumot yuklashda xato')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (!selectedStudentId) { setMonthlyStatuses([]); return }
    fetchStatuses(selectedStudentId, selectedYear)
  }, [selectedStudentId, selectedYear]) // eslint-disable-line

  // ── Leave management ────────────────────────────────────────────────────────
  const openLeaveDialog = (ms: MonthPaymentStatus) => {
    setLeaveReason(ms.leaveReason ?? '')
    setLeaveDialog({
      open: true,
      month: ms.month,
      monthName: ms.monthName,
      currentReason: ms.leaveReason,
      isAdding: !ms.isLeave,
    })
  }

  const handleLeaveConfirm = async () => {
    if (!selectedStudentId) return
    setLeaveLoading(true)
    try {
      if (leaveDialog.isAdding) {
        const res = await fetch(`/api/students/${selectedStudentId}/dormitory-leave`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ year: selectedYear, month: leaveDialog.month, reason: leaveReason }),
        })
        if (!res.ok) throw new Error()
        toast.success(`${leaveDialog.monthName} oy ta'til sifatida belgilandi`)
      } else {
        const res = await fetch(
          `/api/students/${selectedStudentId}/dormitory-leave?year=${selectedYear}&month=${leaveDialog.month}`,
          { method: 'DELETE' }
        )
        if (!res.ok) throw new Error()
        toast.success(`${leaveDialog.monthName} oy ta'tildan chiqarildi`)
      }
      setLeaveDialog(d => ({ ...d, open: false }))
      await fetchStatuses(selectedStudentId, selectedYear)
    } catch {
      toast.error('Xato yuz berdi')
    } finally {
      setLeaveLoading(false)
    }
  }

  // ── Summary stats (only applicable months) ─────────────────────────────────
  const applicableMonths = monthlyStatuses.filter(m => !m.isNotApplicable && !m.isLeave)
  const totalPaid = applicableMonths.reduce((s, m) => s + m.totalPaid, 0)
  const totalRequired = applicableMonths.reduce((s, m) => s + m.requiredAmount, 0)
  const totalOverdue = applicableMonths.filter(m => m.isOverdue).length
  const totalCompleted = applicableMonths.filter(m => m.isFullyPaid).length
  const leaveCount = monthlyStatuses.filter(m => m.isLeave).length
  const notApplicableCount = monthlyStatuses.filter(m => m.isNotApplicable).length

  const getCardClass = (ms: MonthPaymentStatus) => {
    if (ms.isNotApplicable) return 'bg-gray-50 border-gray-200 opacity-60'
    if (ms.isLeave)         return 'bg-sky-50 border-sky-200'
    switch (ms.status) {
      case 'completed':      return 'bg-emerald-50 border-emerald-200'
      case 'partially_paid': return 'bg-yellow-50 border-yellow-200'
      case 'overdue':        return 'bg-red-50 border-red-200'
      case 'pending':        return 'bg-orange-50 border-orange-200'
      default:               return 'bg-gray-50 border-gray-200'
    }
  }

  const getStatusBadge = (ms: MonthPaymentStatus) => {
    if (ms.isNotApplicable)
      return (
        <Badge variant="outline" className="text-gray-400 border-gray-300">
          <MinusCircle className="h-3 w-3 mr-1" />
          Tegishli emas
        </Badge>
      )
    if (ms.isLeave)
      return (
        <Badge className="bg-sky-500 text-white">
          <Plane className="h-3 w-3 mr-1" />
          Ta&apos;til
        </Badge>
      )
    if (ms.isFullyPaid)
      return <Badge className="bg-emerald-500 text-white"><CheckCircle2 className="h-3 w-3 mr-1" />To&apos;landi</Badge>
    if (ms.isOverdue)
      return <Badge variant="destructive"><AlertCircle className="h-3 w-3 mr-1" />Kechikkan</Badge>
    if (ms.totalPaid > 0)
      return <Badge className="bg-amber-500 text-white"><Clock className="h-3 w-3 mr-1" />Qisman</Badge>
    if (ms.isPending)
      return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Kutilmoqda</Badge>
    return <Badge variant="outline" className="text-gray-500">Muddat yo&apos;q</Badge>
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
          <h1 className="text-2xl font-bold">Yotoqxona To&apos;lov Panoramasi</h1>
          <p className="text-sm text-muted-foreground">
            Yotoqxonada yashovchi o&apos;quvchilarning oylik to&apos;lovlarini kuzating
          </p>
        </div>
      </div>

      {/* Student combobox + year */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="md:col-span-2 space-y-1.5" ref={comboboxRef}>
          <Label>O&apos;quvchini qidiring va tanlang</Label>
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
              className={cn('pl-10', selectedStudentId && 'pr-9 border-teal-400 bg-teal-50/40')}
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
                    O&apos;quvchi topilmadi
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
                  {filteredStudents.length} ta o&apos;quvchi yotoqxonada
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
            <SelectTrigger><SelectValue /></SelectTrigger>
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
                {assignment.checkInDate && (
                  <p className="text-xs text-teal-600 mt-0.5 flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Kirib kelgan: {new Date(assignment.checkInDate).toLocaleDateString('uz-UZ', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                )}
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
                <p className="text-muted-foreground flex items-center gap-1"><Bed className="h-3.5 w-3.5" /> O&apos;rin</p>
                <p className="font-semibold">{assignment.bed.bedNumber}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Oylik to&apos;lov</p>
                <p className="font-semibold text-teal-700">{formatMoney(Number(assignment.monthlyFee))} so&apos;m</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Legend banner */}
      {selectedStudentId && monthlyStatuses.length > 0 && (
        <div className="flex flex-wrap gap-2 items-center p-3 rounded-xl bg-muted/40 border text-xs text-muted-foreground">
          <Info className="h-3.5 w-3.5 shrink-0" />
          <span className="font-medium text-foreground">Belgilar:</span>
          <span className="flex items-center gap-1"><MinusCircle className="h-3 w-3 text-gray-400" /> Tegishli emas — ro&apos;yxatga olinishdan oldingi oy</span>
          <span className="flex items-center gap-1"><Plane className="h-3 w-3 text-sky-500" /> Ta&apos;til — to&apos;lov hisoblanmaydi</span>
          <span className="flex items-center gap-1"><AlertCircle className="h-3 w-3 text-red-500" /> Kechikkan — muddati o&apos;tgan</span>
          <span className="ml-auto text-xs">Oyni ta&apos;til qilish uchun kartadagi <Plane className="inline h-3 w-3 text-sky-500" /> tugmani bosing</span>
        </div>
      )}

      {/* Overall stats */}
      {selectedStudentId && monthlyStatuses.length > 0 && (
        <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
          <Card>
            <CardContent className="pt-4 pb-3">
              <p className="text-xs text-muted-foreground">Jami to&apos;langan</p>
              <p className="text-xl font-bold text-emerald-600">{formatMoney(totalPaid)} so&apos;m</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <p className="text-xs text-muted-foreground">Kerak</p>
              <p className="text-xl font-bold text-gray-600">{formatMoney(totalRequired)} so&apos;m</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <p className="text-xs text-muted-foreground">To&apos;langan oylar</p>
              <p className="text-xl font-bold text-blue-600">{totalCompleted} ta</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <p className="text-xs text-muted-foreground">Kechikkan</p>
              <p className="text-xl font-bold text-red-600">{totalOverdue} ta</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <p className="text-xs text-muted-foreground flex items-center gap-1"><Plane className="h-3 w-3 text-sky-500" /> Ta&apos;til</p>
              <p className="text-xl font-bold text-sky-600">{leaveCount} ta</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <p className="text-xs text-muted-foreground flex items-center gap-1"><MinusCircle className="h-3 w-3 text-gray-400" /> Tegishli emas</p>
              <p className="text-xl font-bold text-gray-400">{notApplicableCount} ta</p>
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
              className={`transition-all hover:shadow-md border-2 ${getCardClass(ms)}`}
            >
              <CardHeader className="pb-2 pt-4">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    {ms.monthName} {ms.year}
                  </CardTitle>
                  {getStatusBadge(ms)}
                </div>
              </CardHeader>

              <CardContent className="space-y-3 pb-4">
                {/* Not applicable — before enrollment */}
                {ms.isNotApplicable && (
                  <p className="text-xs text-muted-foreground text-center py-2">
                    O&apos;quvchi bu oyda yotoqxonada emas edi
                  </p>
                )}

                {/* Leave month */}
                {ms.isLeave && (
                  <div className="space-y-1">
                    <p className="text-xs text-sky-700 font-medium text-center">
                      Ta&apos;til — to&apos;lov hisoblanmaydi
                    </p>
                    {ms.leaveReason && (
                      <p className="text-xs text-muted-foreground text-center italic">&quot;{ms.leaveReason}&quot;</p>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full h-7 text-xs border-sky-300 text-sky-700 hover:bg-sky-50 gap-1 mt-1"
                      onClick={() => openLeaveDialog(ms)}
                    >
                      <X className="h-3 w-3" />
                      Ta&apos;tildan chiqarish
                    </Button>
                  </div>
                )}

                {/* Normal active month */}
                {!ms.isNotApplicable && !ms.isLeave && (
                  <>
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-muted-foreground">To&apos;langan:</span>
                        <span className="font-semibold">{formatMoney(ms.totalPaid)} so&apos;m</span>
                      </div>
                      <Progress value={ms.percentagePaid} className="h-1.5" />
                      <div className="flex justify-between text-[11px] mt-1 text-muted-foreground">
                        <span>{ms.percentagePaid}%</span>
                        <span>{formatMoney(ms.requiredAmount)} so&apos;m</span>
                      </div>
                    </div>

                    {!ms.isFullyPaid && ms.totalPaid > 0 && (
                      <div className="flex justify-between text-xs border-t pt-2">
                        <span className="text-orange-600 font-medium">Qarz:</span>
                        <span className="text-orange-600 font-semibold">
                          {formatMoney(ms.remainingAmount)} so&apos;m
                        </span>
                      </div>
                    )}

                    <div className="flex gap-1.5 pt-1">
                      {/* Payment button */}
                      {!ms.isFullyPaid && (
                        ms.hasPayment && ms.paymentId ? (
                          <Button size="sm" className="flex-1 h-7 text-xs bg-teal-600 hover:bg-teal-700" asChild>
                            <Link href={`/admin/payments/${ms.paymentId}/edit`}>
                              <DollarSign className="h-3 w-3 mr-1" />
                              To&apos;lov qilish
                            </Link>
                          </Button>
                        ) : (
                          <Button size="sm" variant="outline" className="flex-1 h-7 text-xs border-teal-400 text-teal-700 hover:bg-teal-50" asChild>
                            <Link href={`/admin/payments/create?studentId=${selectedStudentId}&month=${ms.month}&year=${ms.year}&paymentType=DORMITORY&fromDormOverview=1`}>
                              <DollarSign className="h-3 w-3 mr-1" />
                              Yaratish
                            </Link>
                          </Button>
                        )
                      )}

                      {/* Leave toggle button */}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 text-xs text-sky-600 hover:bg-sky-50 hover:text-sky-700 shrink-0"
                        onClick={() => openLeaveDialog(ms)}
                        title="Ta'til deb belgilash"
                      >
                        <Plane className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : selectedStudentId ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Bu yil uchun to&apos;lov ma&apos;lumotlari topilmadi</p>
        </div>
      ) : (
        <div className="text-center py-16">
          <Bed className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
          <p className="text-lg font-medium text-muted-foreground">O&apos;quvchini tanlang</p>
          <p className="text-sm text-muted-foreground mt-1">
            Yotoqxonada yashovchi o&apos;quvchini qidirib tanlang
          </p>
        </div>
      )}

      {/* Leave dialog */}
      <Dialog open={leaveDialog.open} onOpenChange={(o) => setLeaveDialog(d => ({ ...d, open: o }))}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plane className="h-5 w-5 text-sky-500" />
              {leaveDialog.isAdding
                ? `${leaveDialog.monthName} — Ta'til belgilash`
                : `${leaveDialog.monthName} — Ta'tildan chiqarish`}
            </DialogTitle>
          </DialogHeader>

          {leaveDialog.isAdding ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Bu oyni <strong>ta&apos;til</strong> deb belgilasangiz, to&apos;lov hisoblanmaydi
                va kechikkan to&apos;lov sifatida qayd etilmaydi.
              </p>
              <div className="space-y-1.5">
                <Label htmlFor="leaveReason">Sabab (ixtiyoriy)</Label>
                <Textarea
                  id="leaveReason"
                  placeholder="Masalan: kasallik, sayohat, oilaviy sabab..."
                  value={leaveReason}
                  onChange={(e) => setLeaveReason(e.target.value)}
                  className="resize-none"
                  rows={3}
                />
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              <strong>{leaveDialog.monthName}</strong> oyini ta&apos;tildan chiqarmoqchimisiz?
              Bu oyda to&apos;lov yana hisoblanadi va muddati o&apos;tgan bo&apos;lsa kechikkan deb belgilanadi.
            </p>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setLeaveDialog(d => ({ ...d, open: false }))} disabled={leaveLoading}>
              Bekor qilish
            </Button>
            <Button
              onClick={handleLeaveConfirm}
              disabled={leaveLoading}
              className={leaveDialog.isAdding ? 'bg-sky-600 hover:bg-sky-700' : 'bg-red-600 hover:bg-red-700'}
            >
              {leaveLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {leaveDialog.isAdding ? 'Ta\'til qilish' : 'Chiqarish'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
