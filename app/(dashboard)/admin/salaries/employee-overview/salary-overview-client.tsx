'use client'

import { useState, useEffect } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
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
  Briefcase,
  GraduationCap,
  TrendingUp,
  TrendingDown,
  Gift,
  Info,
  Plane,
  MinusCircle,
  Loader2,
} from 'lucide-react'
import { formatMoney } from '@/lib/utils/payment-helper'

interface Teacher {
  id: string
  teacherCode: string
  monthlySalary: any
  specialization: string | null
  user: { fullName: string } | null
}

interface Staff {
  id: string
  staffCode: string
  monthlySalary: any
  position: string | null
  user: { fullName: string } | null
}

interface SalaryOverviewClientProps {
  teachers: Teacher[]
  staff: Staff[]
  currentYear: number
  tenantId: string
}

interface MonthSalaryStatus {
  month: number
  year: number
  monthName: string
  totalPaid: number
  requiredAmount: number
  percentagePaid: number
  isFullyPaid: boolean
  isPending: boolean
  isOverdue: boolean
  hasSalary: boolean
  salaryId: string | null
  status: 'paid' | 'partially_paid' | 'pending' | 'overdue' | 'not_due'
  isNotApplicable: boolean
  isLeave: boolean
  leaveReason: string | null
  payments: PaymentDetail[]
}

interface PaymentDetail {
  id: string
  type: string
  amount: number
  paidAmount: number
  remainingAmount: number
  status: string
  paymentDate: Date | null
  description: string | null
  bonusAmount: number
  deductionAmount: number
}

export function SalaryOverviewClient({
  teachers,
  staff,
  currentYear,
  tenantId,
}: SalaryOverviewClientProps) {
  const [employeeType, setEmployeeType] = useState<'teacher' | 'staff'>('teacher')
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedYear, setSelectedYear] = useState(currentYear)
  const [monthlyStatuses, setMonthlyStatuses] = useState<MonthSalaryStatus[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [hireDate, setHireDate] = useState<string | null>(null)

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

  const currentEmployees = employeeType === 'teacher' ? teachers : staff

  const filteredEmployees = currentEmployees.filter(e => {
    const nameMatch = e.user?.fullName?.toLowerCase().includes(searchQuery.toLowerCase())
    const codeMatch = employeeType === 'teacher'
      ? (e as Teacher).teacherCode?.toLowerCase().includes(searchQuery.toLowerCase())
      : (e as Staff).staffCode?.toLowerCase().includes(searchQuery.toLowerCase())
    return nameMatch || codeMatch
  })

  const selectedEmployee = currentEmployees.find(e => e.id === selectedEmployeeId)

  useEffect(() => {
    setSelectedEmployeeId('')
    setMonthlyStatuses([])
    setHireDate(null)
  }, [employeeType])

  useEffect(() => {
    if (searchQuery && filteredEmployees.length === 1) {
      setSelectedEmployeeId(filteredEmployees[0].id)
    } else if (searchQuery && filteredEmployees.length === 0) {
      setSelectedEmployeeId('')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery])

  const fetchStatuses = async () => {
    if (!selectedEmployeeId) {
      setMonthlyStatuses([])
      setHireDate(null)
      return
    }
    setIsLoading(true)
    try {
      const response = await fetch(
        `/api/salaries/employee-overview?employeeId=${selectedEmployeeId}&employeeType=${employeeType}&year=${selectedYear}`
      )
      const data = await response.json()
      if (data.success) {
        setMonthlyStatuses(data.monthlyStatuses)
        setHireDate(data.hireDate ?? null)
      }
    } catch (error) {
      console.error('Error fetching salary statuses:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchStatuses()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEmployeeId, employeeType, selectedYear])

  // Leave handlers
  const openLeaveDialog = (status: MonthSalaryStatus) => {
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
    if (!selectedEmployeeId) return
    setLeaveDialog(d => ({ ...d, saving: true }))
    try {
      if (leaveDialog.isRemoving) {
        await fetch(
          `/api/salaries/employee-leave?employeeId=${selectedEmployeeId}&employeeType=${employeeType}&year=${leaveDialog.year}&month=${leaveDialog.month}`,
          { method: 'DELETE' }
        )
      } else {
        await fetch('/api/salaries/employee-leave', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            employeeId: selectedEmployeeId,
            employeeType,
            year: leaveDialog.year,
            month: leaveDialog.month,
            reason: leaveDialog.reason,
          }),
        })
      }
      setLeaveDialog(d => ({ ...d, open: false, saving: false }))
      await fetchStatuses()
    } catch {
      setLeaveDialog(d => ({ ...d, saving: false }))
    }
  }

  // Stats (only applicable months)
  const applicableStatuses = monthlyStatuses.filter(m => !m.isNotApplicable && !m.isLeave)
  const totalPaid = applicableStatuses.reduce((sum, m) => sum + m.totalPaid, 0)
  const totalRequired = applicableStatuses.reduce((sum, m) => sum + m.requiredAmount, 0)
  const totalOverdue = applicableStatuses.filter(m => m.isOverdue).length
  const totalCompleted = applicableStatuses.filter(m => m.isFullyPaid).length
  const leaveCount = monthlyStatuses.filter(m => m.isLeave).length
  const notApplicableCount = monthlyStatuses.filter(m => m.isNotApplicable).length

  const getCardClass = (status: MonthSalaryStatus) => {
    if (status.isNotApplicable)
      return 'bg-gray-50 dark:bg-gray-900/30 border-gray-200 dark:border-gray-700 opacity-60'
    if (status.isLeave)
      return 'bg-sky-50 dark:bg-sky-950/30 border-sky-200 dark:border-sky-800'
    switch (status.status) {
      case 'paid':           return 'bg-green-50 dark:bg-green-950/40 border-green-200 dark:border-green-800'
      case 'partially_paid': return 'bg-yellow-50 dark:bg-yellow-950/40 border-yellow-200 dark:border-yellow-800'
      case 'overdue':        return 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800'
      case 'pending':        return 'bg-orange-50 dark:bg-orange-950/40 border-orange-200 dark:border-orange-800'
      default:               return 'bg-gray-50 dark:bg-gray-900/40 border-gray-200 dark:border-gray-700'
    }
  }

  const getStatusBadge = (status: MonthSalaryStatus) => {
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

      {/* Tabs */}
      <Tabs value={employeeType} onValueChange={(v) => setEmployeeType(v as 'teacher' | 'staff')}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="teacher">
            <GraduationCap className="h-4 w-4 mr-2" />
            O'qituvchilar
          </TabsTrigger>
          <TabsTrigger value="staff">
            <Briefcase className="h-4 w-4 mr-2" />
            Xodimlar
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Legend */}
      {selectedEmployeeId && monthlyStatuses.length > 0 && (
        <div className="flex flex-wrap gap-3 items-center p-3 bg-muted/40 rounded-lg text-xs text-muted-foreground border">
          <Info className="h-3.5 w-3.5 shrink-0" />
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-gray-300 dark:bg-gray-600 inline-block" />Tegishli emas — ishga qabul qilinishidan oldingi oy</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-sky-400 inline-block" />Ta'til — xodim vaqtincha ishlamagan oy (maosh hisoblanmaydi)</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-400 inline-block" />Kechikkan — maosh to'lov muddati o'tgan</span>
        </div>
      )}

      {/* Search and Year */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="search">Qidirish</Label>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="search"
              placeholder="Ism yoki kod..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="year">Yil</Label>
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

      {/* Employee Dropdown */}
      {(!searchQuery || filteredEmployees.length > 1) && (
        <div className="space-y-2">
          <Label htmlFor="employee">{employeeType === 'teacher' ? "O'qituvchini" : 'Xodimni'} tanlang</Label>
          <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
            <SelectTrigger>
              <SelectValue placeholder={`${employeeType === 'teacher' ? "O'qituvchini" : 'Xodimni'} tanlang...`} />
            </SelectTrigger>
            <SelectContent className="max-h-[300px]">
              {filteredEmployees.map(employee => (
                <SelectItem key={employee.id} value={employee.id}>
                  {employee.user?.fullName} ({employeeType === 'teacher' ? (employee as Teacher).teacherCode : (employee as Staff).staffCode})
                  {' - '}
                  {employeeType === 'teacher' ? (employee as Teacher).specialization : (employee as Staff).position}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {searchQuery && filteredEmployees.length === 1 && selectedEmployeeId && (
        <div className="bg-green-50 dark:bg-green-950/40 border-2 border-green-200 dark:border-green-800 rounded-lg p-4">
          <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
            <CheckCircle2 className="h-5 w-5" />
            <p className="font-medium">
              Tanlandi: <span className="font-bold">{selectedEmployee?.user?.fullName}</span>
            </p>
          </div>
        </div>
      )}

      {searchQuery && filteredEmployees.length === 0 && (
        <div className="bg-orange-50 dark:bg-orange-950/40 border-2 border-orange-200 dark:border-orange-800 rounded-lg p-4">
          <div className="flex items-center gap-2 text-orange-700 dark:text-orange-300">
            <AlertCircle className="h-5 w-5" />
            <p className="font-medium">Hech qanday natija topilmadi</p>
          </div>
        </div>
      )}

      {/* Employee Info Card */}
      {selectedEmployee && (
        <Card className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/50 dark:to-pink-950/50 border-purple-200 dark:border-purple-800">
          <CardContent className="pt-6">
            <div className="grid gap-4 md:grid-cols-4">
              <div>
                <p className="text-sm text-muted-foreground">{employeeType === 'teacher' ? "O'qituvchi" : 'Xodim'}</p>
                <p className="text-lg font-semibold">{selectedEmployee.user?.fullName}</p>
                <p className="text-xs text-muted-foreground">
                  {employeeType === 'teacher' ? (selectedEmployee as Teacher).teacherCode : (selectedEmployee as Staff).staffCode}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Lavozim / Mutaxassislik</p>
                <p className="text-lg font-semibold">
                  {employeeType === 'teacher' ? (selectedEmployee as Teacher).specialization : (selectedEmployee as Staff).position}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Oylik maosh</p>
                <p className="text-lg font-semibold">{formatMoney(Number(selectedEmployee.monthlySalary))} so'm</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Ishga qabul sanasi</p>
                <p className="text-lg font-semibold">
                  {hireDate
                    ? new Date(hireDate).toLocaleDateString('uz-UZ', { day: '2-digit', month: 'long', year: 'numeric' })
                    : '—'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      {selectedEmployeeId && monthlyStatuses.length > 0 && (
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

      {/* Monthly Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16 gap-3 text-muted-foreground">
          <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
          Yuklanmoqda...
        </div>
      ) : selectedEmployeeId && monthlyStatuses.length > 0 ? (
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
                  <div className="flex items-center gap-1">
                    {getStatusBadge(status)}
                    {!status.isNotApplicable && !status.isLeave && status.payments.length > 0 && (
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" size="sm" className="h-6 w-6 p-0">
                            <Info className="h-3 w-3" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[550px]" side="top" align="end">
                          <div className="space-y-4">
                            <div className="flex items-center gap-2 border-b pb-3">
                              <Calendar className="h-5 w-5 text-primary" />
                              <div className="flex-1">
                                <h4 className="font-bold text-base">{status.monthName} {status.year}</h4>
                                <p className="text-xs text-muted-foreground">To'lovlar tarixi</p>
                              </div>
                              <Badge variant="secondary" className="font-semibold">
                                {status.payments.length} ta to'lov
                              </Badge>
                            </div>

                            <div className="space-y-3 max-h-[450px] overflow-y-auto pr-2">
                              {status.payments
                                .sort((a, b) => {
                                  const dateA = a.paymentDate ? new Date(a.paymentDate).getTime() : 0
                                  const dateB = b.paymentDate ? new Date(b.paymentDate).getTime() : 0
                                  return dateB - dateA
                                })
                                .map((payment, idx) => {
                                  const getPaymentTypeInfo = (type: string) => {
                                    switch (type) {
                                      case 'FULL_SALARY':
                                        return { label: "To'liq Oylik", icon: DollarSign, bgColor: 'bg-blue-50 dark:bg-blue-950/40', borderColor: 'border-blue-200 dark:border-blue-800', textColor: 'text-blue-700 dark:text-blue-300', badgeColor: 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300' }
                                      case 'ADVANCE':
                                        return { label: 'Avans', icon: TrendingUp, bgColor: 'bg-green-50 dark:bg-green-950/40', borderColor: 'border-green-200 dark:border-green-800', textColor: 'text-green-700 dark:text-green-300', badgeColor: 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300' }
                                      case 'BONUS':
                                        return { label: 'Mukofot', icon: Gift, bgColor: 'bg-purple-50 dark:bg-purple-950/40', borderColor: 'border-purple-200 dark:border-purple-800', textColor: 'text-purple-700 dark:text-purple-300', badgeColor: 'bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300' }
                                      case 'DEDUCTION':
                                        return { label: 'Ushlab Qolish', icon: TrendingDown, bgColor: 'bg-red-50 dark:bg-red-950/40', borderColor: 'border-red-200 dark:border-red-800', textColor: 'text-red-700 dark:text-red-300', badgeColor: 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300' }
                                      default:
                                        return { label: type, icon: DollarSign, bgColor: 'bg-gray-50 dark:bg-gray-900/40', borderColor: 'border-gray-200 dark:border-gray-700', textColor: 'text-gray-700 dark:text-gray-300', badgeColor: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300' }
                                    }
                                  }
                                  const typeInfo = getPaymentTypeInfo(payment.type)
                                  const TypeIcon = typeInfo.icon
                                  return (
                                    <div key={payment.id} className="relative">
                                      {idx < status.payments.length - 1 && (
                                        <div className="absolute left-[21px] top-[45px] w-0.5 h-[calc(100%+12px)] bg-gradient-to-b from-primary/30 to-transparent" />
                                      )}
                                      <div className={`relative rounded-lg border-2 ${typeInfo.borderColor} ${typeInfo.bgColor} p-4 hover:shadow-md transition-all`}>
                                        <div className="flex items-start gap-3 mb-3">
                                          <div className="relative flex-shrink-0">
                                            <div className={`p-2 rounded-full ${typeInfo.badgeColor} ring-4 ring-white dark:ring-card`}>
                                              <TypeIcon className="h-4 w-4" />
                                            </div>
                                          </div>
                                          <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                              <Badge className={`${typeInfo.badgeColor} border-0 font-semibold`}>{typeInfo.label}</Badge>
                                              <Badge variant={payment.status === 'PAID' ? 'default' : 'secondary'} className="text-[10px] h-5">
                                                {payment.status === 'PAID' ? "✓ To'langan" : payment.status === 'PARTIALLY_PAID' ? '⚡ Qisman' : '⏳ Kutilmoqda'}
                                              </Badge>
                                            </div>
                                            {payment.paymentDate && (
                                              <p className="text-xs text-muted-foreground flex items-center gap-1.5 mb-2">
                                                <Calendar className="h-3 w-3" />
                                                {new Date(payment.paymentDate).toLocaleDateString('uz-UZ', { day: 'numeric', month: 'long', year: 'numeric', weekday: 'short' })}
                                              </p>
                                            )}
                                            <div className="bg-white dark:bg-card rounded-md p-3 mb-3 border shadow-sm">
                                              {payment.type === 'FULL_SALARY' && selectedEmployee && (
                                                <div className="flex items-center justify-between mb-2 pb-2 border-b bg-blue-50 dark:bg-blue-950/50 -mx-3 -mt-3 px-3 py-2 rounded-t-md">
                                                  <span className="text-xs font-medium text-blue-700 dark:text-blue-300 flex items-center gap-1">
                                                    <DollarSign className="h-3.5 w-3.5" />Asosiy maosh:
                                                  </span>
                                                  <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                                                    {formatMoney(Number(selectedEmployee.monthlySalary))} so'm
                                                  </span>
                                                </div>
                                              )}
                                              <div className="flex items-center justify-between">
                                                <span className="text-xs font-medium text-muted-foreground">To'langan:</span>
                                                <span className="text-xl font-bold text-green-600 dark:text-green-400">
                                                  {formatMoney(payment.paidAmount)} <span className="text-sm">so'm</span>
                                                </span>
                                              </div>
                                              {payment.amount !== payment.paidAmount && (
                                                <div className="flex items-center justify-between mt-2 pt-2 border-t">
                                                  <span className="text-xs text-muted-foreground">Jami summa:</span>
                                                  <span className="text-sm font-semibold">{formatMoney(payment.amount)} so'm</span>
                                                </div>
                                              )}
                                              {payment.remainingAmount > 0 && (
                                                <div className="flex items-center justify-between mt-2 pt-2 border-t border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-950/50 -mx-3 -mb-3 px-3 py-2 rounded-b-md">
                                                  <span className="text-xs font-medium text-orange-700 dark:text-orange-300">Qoldi:</span>
                                                  <span className="text-sm font-bold text-orange-600 dark:text-orange-400">{formatMoney(payment.remainingAmount)} so'm</span>
                                                </div>
                                              )}
                                            </div>
                                            {(payment.bonusAmount > 0 || payment.deductionAmount > 0) && (
                                              <div className="space-y-2">
                                                {payment.bonusAmount > 0 && (
                                                  <div className="flex items-center justify-between text-xs bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 rounded-md px-3 py-2">
                                                    <span className="flex items-center gap-1.5 text-purple-700 dark:text-purple-300 font-medium"><Gift className="h-3.5 w-3.5" />Bonus:</span>
                                                    <span className="font-bold text-purple-600 dark:text-purple-400">+{formatMoney(payment.bonusAmount)} so'm</span>
                                                  </div>
                                                )}
                                                {payment.deductionAmount > 0 && (
                                                  <div className="flex items-center justify-between text-xs bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-md px-3 py-2">
                                                    <span className="flex items-center gap-1.5 text-red-700 dark:text-red-300 font-medium"><TrendingDown className="h-3.5 w-3.5" />Ushlab qolish:</span>
                                                    <span className="font-bold text-red-600 dark:text-red-400">-{formatMoney(payment.deductionAmount)} so'm</span>
                                                  </div>
                                                )}
                                              </div>
                                            )}
                                            {payment.description && (
                                              <div className="mt-3 pt-3 border-t">
                                                <p className="text-xs text-muted-foreground"><span className="font-medium">💬 Izoh:</span> {payment.description}</p>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  )
                                })}
                            </div>

                            <div className="pt-3 border-t-2 bg-gradient-to-r from-green-50 via-emerald-50 to-teal-50 dark:from-green-950/50 dark:via-emerald-950/50 dark:to-teal-950/50 -mx-4 px-4 py-3 -mb-4 rounded-b-lg border-t-green-200 dark:border-t-green-800">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-xs text-muted-foreground">Jami to'langan summa:</p>
                                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">{formatMoney(status.totalPaid)} <span className="text-sm">so'm</span></p>
                                </div>
                                {status.requiredAmount > status.totalPaid && (
                                  <div className="text-right">
                                    <p className="text-xs text-muted-foreground">Qolgan:</p>
                                    <p className="text-lg font-bold text-orange-600 dark:text-orange-400">{formatMoney(status.requiredAmount - status.totalPaid)} <span className="text-xs">so'm</span></p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {status.isNotApplicable ? (
                  <p className="text-xs text-muted-foreground text-center py-2">
                    Xodim hali ishga qabul qilinmagan edi
                  </p>
                ) : status.isLeave ? (
                  <>
                    <p className="text-xs text-sky-600 dark:text-sky-400 text-center py-1">
                      Xodim ta'tilda — maosh hisoblanmaydi
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
                        <span className="text-orange-600 font-medium">Qoldi:</span>
                        <span className="text-orange-600 font-semibold">
                          {formatMoney(status.requiredAmount - status.totalPaid)} so'm
                        </span>
                      </div>
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
      ) : selectedEmployeeId ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Ma'lumotlar topilmadi</p>
        </div>
      ) : (
        <div className="text-center py-12">
          <Calendar className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <p className="text-lg font-medium text-muted-foreground">
            {employeeType === 'teacher' ? "O'qituvchini" : 'Xodimni'} tanlang
          </p>
          <p className="text-sm text-muted-foreground">
            Yil bo'yicha maoshlarni ko'rish uchun {employeeType === 'teacher' ? "o'qituvchini" : 'xodimni'} tanlang
          </p>
        </div>
      )}

      {/* Leave Dialog */}
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
              Bu oyga maosh hisobi qayta yoqiladi.
            </p>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                <strong>{leaveDialog.monthName} {leaveDialog.year}</strong> oyi uchun ta'til belgilanadi.
                Bu oy maosh hisoblanmaydi va kechikkan deb belgilanmaydi.
              </p>
              <div>
                <Label className="text-xs mb-1 block">Sabab (ixtiyoriy)</Label>
                <Textarea
                  value={leaveDialog.reason}
                  onChange={(e) => setLeaveDialog(d => ({ ...d, reason: e.target.value }))}
                  placeholder="Masalan: kasallik, mehnat ta'tili, majburiy ta'til..."
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
              {leaveDialog.saving
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : leaveDialog.isRemoving ? "Ta'tildan chiqarish" : "Ta'til qilish"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
