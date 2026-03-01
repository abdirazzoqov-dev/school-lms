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
  Plane,
  MinusCircle,
  Loader2,
  Info,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { formatMoney } from '@/lib/utils/payment-helper'
import { cn } from '@/lib/utils'

interface Student {
  id: string
  studentCode: string
  monthlyTuitionFee: any
  paymentDueDay: number | null
  enrollmentDate?: string | null
  user: { fullName: string } | null
  class: { name: string } | null
}

interface StudentPaymentOverviewClientProps {
  students: Student[]
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
  percentagePaid: number
  isFullyPaid: boolean
  isPending: boolean
  isOverdue: boolean
  hasPayment: boolean
  paymentId: string | null
  status: 'completed' | 'partially_paid' | 'pending' | 'overdue' | 'not_due'
  isNotApplicable: boolean
  isLeave: boolean
  leaveReason: string | null
}

export function StudentPaymentOverviewClient({
  students,
  currentYear,
  tenantId,
  preSelectedStudentId,
}: StudentPaymentOverviewClientProps) {
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
  const [enrollmentDate, setEnrollmentDate] = useState<string | null>(null)

  // Leave dialog
  const [leaveDialog, setLeaveDialog] = useState<{
    open: boolean
    month: number
    year: number
    monthName: string
    isRemoving: boolean
    reason: string
    saving: boolean
  }>({ open: false, month: 0, year: 0, monthName: '', isRemoving: false, reason: '', saving: false })

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
        s.class?.name?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : students

  const selectedStudent = students.find(s => s.id === selectedStudentId)

  const selectStudent = (student: Student) => {
    setSelectedStudentId(student.id)
    setSearchQuery(student.user?.fullName ?? '')
    setIsDropdownOpen(false)
  }

  const clearSelection = () => {
    setSelectedStudentId('')
    setSearchQuery('')
    setMonthlyStatuses([])
    setEnrollmentDate(null)
  }

  useEffect(() => {
    if (!selectedStudentId) {
      setMonthlyStatuses([])
      setEnrollmentDate(null)
      return
    }
    const fetchPaymentStatuses = async () => {
      setIsLoading(true)
      try {
        const response = await fetch(
          `/api/students/${selectedStudentId}/payment-overview?year=${selectedYear}`
        )
        const data = await response.json()
        if (data.success) {
          setMonthlyStatuses(data.monthlyStatuses)
          setEnrollmentDate(data.enrollmentDate ?? null)
        }
      } catch (error) {
        console.error('Error fetching payment statuses:', error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchPaymentStatuses()
  }, [selectedStudentId, selectedYear])

  const refreshStatuses = async () => {
    if (!selectedStudentId) return
    try {
      const response = await fetch(
        `/api/students/${selectedStudentId}/payment-overview?year=${selectedYear}`
      )
      const data = await response.json()
      if (data.success) {
        setMonthlyStatuses(data.monthlyStatuses)
        setEnrollmentDate(data.enrollmentDate ?? null)
      }
    } catch {}
  }

  // Leave dialog helpers
  const openLeaveDialog = (status: MonthPaymentStatus) => {
    setLeaveDialog({
      open: true,
      month: status.month,
      year: status.year,
      monthName: status.monthName,
      isRemoving: status.isLeave,
      reason: status.leaveReason ?? '',
      saving: false,
    })
  }

  const handleLeaveConfirm = async () => {
    if (!selectedStudentId) return
    setLeaveDialog(d => ({ ...d, saving: true }))
    try {
      if (leaveDialog.isRemoving) {
        await fetch(
          `/api/students/${selectedStudentId}/payment-leave?year=${leaveDialog.year}&month=${leaveDialog.month}`,
          { method: 'DELETE' }
        )
      } else {
        await fetch(`/api/students/${selectedStudentId}/payment-leave`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ year: leaveDialog.year, month: leaveDialog.month, reason: leaveDialog.reason }),
        })
      }
      setLeaveDialog(d => ({ ...d, open: false, saving: false }))
      await refreshStatuses()
    } catch {
      setLeaveDialog(d => ({ ...d, saving: false }))
    }
  }

  // Stats
  const applicableStatuses = monthlyStatuses.filter(m => !m.isNotApplicable && !m.isLeave)
  const totalPaid = applicableStatuses.reduce((sum, m) => sum + m.totalPaid, 0)
  const totalRequired = applicableStatuses.reduce((sum, m) => sum + m.requiredAmount, 0)
  const totalOverdue = applicableStatuses.filter(m => m.isOverdue).length
  const totalCompleted = applicableStatuses.filter(m => m.isFullyPaid).length
  const leaveCount = monthlyStatuses.filter(m => m.isLeave).length
  const notApplicableCount = monthlyStatuses.filter(m => m.isNotApplicable).length

  const getCardClass = (status: MonthPaymentStatus) => {
    if (status.isNotApplicable)
      return 'bg-gray-50 dark:bg-gray-900/30 border-gray-200 dark:border-gray-700 opacity-60'
    if (status.isLeave)
      return 'bg-sky-50 dark:bg-sky-950/30 border-sky-200 dark:border-sky-800'
    switch (status.status) {
      case 'completed':      return 'bg-green-50 dark:bg-green-950/40 border-green-200 dark:border-green-800'
      case 'partially_paid': return 'bg-yellow-50 dark:bg-yellow-950/40 border-yellow-200 dark:border-yellow-800'
      case 'overdue':        return 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800'
      case 'pending':        return 'bg-orange-50 dark:bg-orange-950/40 border-orange-200 dark:border-orange-800'
      default:               return 'bg-gray-50 dark:bg-gray-900/40 border-gray-200 dark:border-gray-700'
    }
  }

  const getStatusBadge = (status: MonthPaymentStatus) => {
    if (status.isNotApplicable)
      return <Badge variant="outline" className="text-gray-400 border-gray-300 dark:border-gray-600 text-[10px]">Tegishli emas</Badge>
    if (status.isLeave)
      return <Badge className="bg-sky-500 dark:bg-sky-700 text-[10px]"><Plane className="h-2.5 w-2.5 mr-1" />Ta'til</Badge>
    if (status.isFullyPaid)
      return <Badge className="bg-green-500 dark:bg-green-700"><CheckCircle2 className="h-3 w-3 mr-1" />To'landi</Badge>
    if (status.isOverdue)
      return <Badge variant="destructive"><AlertCircle className="h-3 w-3 mr-1" />Kechikkan</Badge>
    if (status.totalPaid > 0)
      return <Badge variant="secondary" className="bg-yellow-500 dark:bg-yellow-700 text-white"><Clock className="h-3 w-3 mr-1" />Qisman</Badge>
    if (status.isPending)
      return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Kutilmoqda</Badge>
    return <Badge variant="outline" className="text-gray-500 dark:text-gray-400">Muddat yo'q</Badge>
  }

  const years = [currentYear - 1, currentYear, currentYear + 1]

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
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

      {/* ── Legend ── */}
      {selectedStudentId && monthlyStatuses.length > 0 && (
        <div className="flex flex-wrap gap-3 items-center p-3 bg-muted/40 rounded-lg text-xs text-muted-foreground border">
          <Info className="h-3.5 w-3.5 shrink-0" />
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-gray-300 dark:bg-gray-600 inline-block" />Tegishli emas — o'quvchi qabul qilinishidan oldingi oy</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-sky-400 inline-block" />Ta'til — o'quvchi vaqtincha o'qimagan oy (to'lov hisoblanmaydi)</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-400 inline-block" />Kechikkan — to'lov muddati o'tgan</span>
        </div>
      )}

      {/* ── Combobox + Year ── */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="md:col-span-2 space-y-1.5" ref={comboboxRef}>
          <Label>O'quvchini qidiring va tanlang</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Ism, kod yoki sinf bo'yicha qidirish..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setIsDropdownOpen(true)
                if (!e.target.value) clearSelection()
              }}
              onFocus={() => setIsDropdownOpen(true)}
              className={cn(
                'pl-10',
                selectedStudentId && 'pr-9 border-blue-400 bg-blue-50/40 dark:bg-blue-950/30 dark:border-blue-600'
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
                            'w-full text-left flex items-center justify-between px-4 py-2.5 hover:bg-muted/60 transition-colors text-sm',
                            isSelected && 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 font-medium'
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

          {selectedStudent && (
            <p className="text-xs text-blue-600 dark:text-blue-400 font-medium pl-1">
              ✓ Tanlandi: {selectedStudent.user?.fullName} — {selectedStudent.class?.name ?? '—'}
            </p>
          )}
        </div>

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
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/50 dark:to-purple-950/50 border-blue-200 dark:border-blue-800">
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
                <p className="text-sm text-muted-foreground">Qabul sanasi</p>
                <p className="text-lg font-semibold">
                  {enrollmentDate
                    ? new Date(enrollmentDate).toLocaleDateString('uz-UZ', { day: '2-digit', month: 'long', year: 'numeric' })
                    : `Har oyning ${selectedStudent.paymentDueDay || 5}-sanasi`}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Stats ── */}
      {selectedStudentId && monthlyStatuses.length > 0 && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Jami to'langan</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">{formatMoney(totalPaid)} so'm</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">To'langan oylar</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {totalCompleted} / {12 - leaveCount - notApplicableCount}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Kechikkan</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">{totalOverdue}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Ta'til / Tegishli emas</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-sky-600 dark:text-sky-400">
                {leaveCount} <span className="text-muted-foreground text-lg">/ {notApplicableCount}</span>
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Monthly Grid ── */}
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
              className={`transition-all hover:shadow-lg ${getCardClass(status)}`}
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
                {status.isNotApplicable ? (
                  <p className="text-xs text-muted-foreground text-center py-2">
                    O'quvchi hali qabul qilinmagan edi
                  </p>
                ) : status.isLeave ? (
                  <>
                    <p className="text-xs text-sky-600 dark:text-sky-400 text-center py-1">
                      O'quvchi ta'tilda — to'lov hisoblanmaydi
                    </p>
                    {status.leaveReason && (
                      <p className="text-xs text-muted-foreground text-center italic">"{status.leaveReason}"</p>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full text-sky-600 border-sky-300 hover:bg-sky-50 dark:hover:bg-sky-950/40"
                      onClick={() => openLeaveDialog(status)}
                    >
                      <MinusCircle className="h-3.5 w-3.5 mr-1.5" />
                      Ta'tildan chiqarish
                    </Button>
                  </>
                ) : (
                  <>
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

                    {/* Ta'til qilish button */}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="w-full text-xs text-sky-500 hover:text-sky-700 hover:bg-sky-50 dark:hover:bg-sky-950/30"
                      onClick={() => openLeaveDialog(status)}
                    >
                      <Plane className="h-3 w-3 mr-1.5" />
                      Ta'til qilish
                    </Button>
                  </>
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

      {/* ── Leave Dialog ── */}
      <Dialog open={leaveDialog.open} onOpenChange={(open) => !leaveDialog.saving && setLeaveDialog(d => ({ ...d, open }))}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {leaveDialog.isRemoving ? "Ta'tildan chiqarish" : "Ta'til qilish"}
            </DialogTitle>
          </DialogHeader>
          {leaveDialog.isRemoving ? (
            <p className="text-sm text-muted-foreground">
              <strong>{leaveDialog.monthName} {leaveDialog.year}</strong> oyini ta'tildan chiqarasizmi?
              Bu oyga to'lov hisobi qayta yoqiladi.
            </p>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                <strong>{leaveDialog.monthName} {leaveDialog.year}</strong> oyi uchun ta'til belgilanadi.
                Bu oy to'lov hisoblanmaydi va kechikkan deb belgilanmaydi.
              </p>
              <div>
                <Label className="text-xs mb-1 block">Sabab (ixtiyoriy)</Label>
                <Textarea
                  value={leaveDialog.reason}
                  onChange={(e) => setLeaveDialog(d => ({ ...d, reason: e.target.value }))}
                  placeholder="Masalan: kasallik, boshqa shahar, majburiy ta'til..."
                  rows={3}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setLeaveDialog(d => ({ ...d, open: false }))} disabled={leaveDialog.saving}>
              Bekor qilish
            </Button>
            <Button
              onClick={handleLeaveConfirm}
              disabled={leaveDialog.saving}
              className={leaveDialog.isRemoving ? '' : 'bg-sky-600 hover:bg-sky-700'}
            >
              {leaveDialog.saving ? <Loader2 className="h-4 w-4 animate-spin" /> : leaveDialog.isRemoving ? "Ta'tildan chiqarish" : "Ta'til qilish"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
