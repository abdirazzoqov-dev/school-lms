'use client'

import { useState, useEffect } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
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
  Info
} from 'lucide-react'
import Link from 'next/link'
import { formatMoney, getMonthNameUz } from '@/lib/utils/payment-helper'

interface Teacher {
  id: string
  teacherCode: string
  monthlySalary: any
  specialization: string | null
  user: {
    fullName: string
  } | null
}

interface Staff {
  id: string
  staffCode: string
  monthlySalary: any
  position: string | null
  user: {
    fullName: string
  } | null
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
  tenantId
}: SalaryOverviewClientProps) {
  const [employeeType, setEmployeeType] = useState<'teacher' | 'staff'>('teacher')
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedYear, setSelectedYear] = useState(currentYear)
  const [monthlyStatuses, setMonthlyStatuses] = useState<MonthSalaryStatus[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Get current employee list
  const currentEmployees = employeeType === 'teacher' ? teachers : staff

  // Filter employees
  const filteredEmployees = currentEmployees.filter(e => {
    const nameMatch = e.user?.fullName?.toLowerCase().includes(searchQuery.toLowerCase())
    const codeMatch = employeeType === 'teacher' 
      ? (e as Teacher).teacherCode?.toLowerCase().includes(searchQuery.toLowerCase())
      : (e as Staff).staffCode?.toLowerCase().includes(searchQuery.toLowerCase())
    return nameMatch || codeMatch
  })

  const selectedEmployee = currentEmployees.find(e => e.id === selectedEmployeeId)

  // Reset selection when switching tabs
  useEffect(() => {
    setSelectedEmployeeId('')
    setMonthlyStatuses([])
  }, [employeeType])

  // Auto-select employee if only one match found
  useEffect(() => {
    if (searchQuery && filteredEmployees.length === 1) {
      setSelectedEmployeeId(filteredEmployees[0].id)
    } else if (searchQuery && filteredEmployees.length === 0) {
      setSelectedEmployeeId('')
    }
  }, [searchQuery, filteredEmployees])

  // Fetch salary statuses
  useEffect(() => {
    if (!selectedEmployeeId) {
      setMonthlyStatuses([])
      return
    }

    const fetchSalaryStatuses = async () => {
      setIsLoading(true)
      try {
        const response = await fetch(
          `/api/salaries/employee-overview?employeeId=${selectedEmployeeId}&employeeType=${employeeType}&year=${selectedYear}`
        )
        const data = await response.json()
        
        if (data.success) {
          setMonthlyStatuses(data.monthlyStatuses)
        }
      } catch (error) {
        console.error('Error fetching salary statuses:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchSalaryStatuses()
  }, [selectedEmployeeId, employeeType, selectedYear])

  // Calculate totals
  const totalPaid = monthlyStatuses.reduce((sum, m) => sum + m.totalPaid, 0)
  const totalRequired = monthlyStatuses.reduce((sum, m) => sum + m.requiredAmount, 0)
  const totalOverdue = monthlyStatuses.filter(m => m.isOverdue).length
  const totalCompleted = monthlyStatuses.filter(m => m.isFullyPaid).length

  const getStatusColor = (status: MonthSalaryStatus['status']) => {
    switch (status) {
      case 'paid':
        return 'bg-green-50 border-green-200'
      case 'partially_paid':
        return 'bg-yellow-50 border-yellow-200'
      case 'overdue':
        return 'bg-red-50 border-red-200'
      case 'pending':
        return 'bg-orange-50 border-orange-200'
      default:
        return 'bg-gray-50 border-gray-200'
    }
  }

  const getStatusBadge = (status: MonthSalaryStatus) => {
    if (status.isFullyPaid) {
      return <Badge className="bg-green-500"><CheckCircle2 className="h-3 w-3 mr-1" />To'landi</Badge>
    }
    if (status.isOverdue) {
      return <Badge variant="destructive"><AlertCircle className="h-3 w-3 mr-1" />Kechikkan</Badge>
    }
    if (status.totalPaid > 0) {
      return <Badge variant="secondary" className="bg-yellow-500 text-white"><Clock className="h-3 w-3 mr-1" />Qisman</Badge>
    }
    if (status.isPending) {
      return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Kutilmoqda</Badge>
    }
    return <Badge variant="outline" className="text-gray-500">Muddat yo'q</Badge>
  }

  const years = [currentYear - 1, currentYear, currentYear + 1]

  return (
    <div className="space-y-6">
      {/* Employee Type Tabs */}
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
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Employee Dropdown - only show if needed */}
      {(!searchQuery || filteredEmployees.length > 1) && (
        <div className="space-y-2">
          <Label htmlFor="employee">{employeeType === 'teacher' ? 'O\'qituvchini' : 'Xodimni'} tanlang</Label>
          <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
            <SelectTrigger>
              <SelectValue placeholder={`${employeeType === 'teacher' ? 'O\'qituvchini' : 'Xodimni'} tanlang...`} />
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

      {/* Show selected employee info when auto-selected */}
      {searchQuery && filteredEmployees.length === 1 && selectedEmployeeId && (
        <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-green-700">
            <CheckCircle2 className="h-5 w-5" />
            <p className="font-medium">
              Tanlandi: <span className="font-bold">{selectedEmployee?.user?.fullName}</span>
            </p>
          </div>
        </div>
      )}

      {/* Show "not found" message when no results */}
      {searchQuery && filteredEmployees.length === 0 && (
        <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-orange-700">
            <AlertCircle className="h-5 w-5" />
            <p className="font-medium">
              Hech qanday natija topilmadi
            </p>
          </div>
        </div>
      )}

      {/* Employee Info & Stats */}
      {selectedEmployee && (
        <Card className="bg-gradient-to-r from-purple-50 to-pink-50">
          <CardContent className="pt-6">
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <p className="text-sm text-muted-foreground">{employeeType === 'teacher' ? 'O\'qituvchi' : 'Xodim'}</p>
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
            </div>
          </CardContent>
        </Card>
      )}

      {/* Overall Stats */}
      {selectedEmployeeId && monthlyStatuses.length > 0 && (
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

      {/* Monthly Salary Grid */}
      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Yuklanmoqda...</p>
        </div>
      ) : selectedEmployeeId && monthlyStatuses.length > 0 ? (
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
                  <div className="flex items-center gap-1">
                    {getStatusBadge(status)}
                    {status.payments.length > 0 && (
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" size="sm" className="h-6 w-6 p-0">
                            <Info className="h-3 w-3" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[500px]" side="top" align="end">
                          <div className="space-y-3">
                            <div className="flex items-center gap-2 border-b pb-2">
                              <Calendar className="h-4 w-4 text-primary" />
                              <h4 className="font-semibold text-sm">
                                {status.monthName} {status.year} - To'lovlar tarixi
                              </h4>
                              <span className="ml-auto text-xs text-muted-foreground">
                                {status.payments.length} ta to'lov
                              </span>
                            </div>
                            
                            <div className="space-y-3 max-h-[400px] overflow-y-auto">
                              {/* Group payments by type */}
                              {(() => {
                                const grouped = {
                                  FULL_SALARY: status.payments.filter(p => p.type === 'FULL_SALARY'),
                                  ADVANCE: status.payments.filter(p => p.type === 'ADVANCE'),
                                  BONUS: status.payments.filter(p => p.type === 'BONUS'),
                                  DEDUCTION: status.payments.filter(p => p.type === 'DEDUCTION')
                                }

                                const getPaymentTypeInfo = (type: string) => {
                                  switch (type) {
                                    case 'FULL_SALARY':
                                      return { 
                                        label: 'To\'liq Oylik', 
                                        icon: DollarSign, 
                                        color: 'text-blue-600 bg-blue-50 border-blue-200',
                                        headerColor: 'bg-blue-100 text-blue-900'
                                      }
                                    case 'ADVANCE':
                                      return { 
                                        label: 'Avans', 
                                        icon: TrendingUp, 
                                        color: 'text-green-600 bg-green-50 border-green-200',
                                        headerColor: 'bg-green-100 text-green-900'
                                      }
                                    case 'BONUS':
                                      return { 
                                        label: 'Mukofot / Bonus', 
                                        icon: Gift, 
                                        color: 'text-purple-600 bg-purple-50 border-purple-200',
                                        headerColor: 'bg-purple-100 text-purple-900'
                                      }
                                    case 'DEDUCTION':
                                      return { 
                                        label: 'Ushlab Qolish', 
                                        icon: TrendingDown, 
                                        color: 'text-red-600 bg-red-50 border-red-200',
                                        headerColor: 'bg-red-100 text-red-900'
                                      }
                                    default:
                                      return { 
                                        label: type, 
                                        icon: DollarSign, 
                                        color: 'text-gray-600 bg-gray-50 border-gray-200',
                                        headerColor: 'bg-gray-100 text-gray-900'
                                      }
                                  }
                                }

                                return (
                                  <>
                                    {Object.entries(grouped).map(([type, payments]) => {
                                      if (payments.length === 0) return null
                                      
                                      const typeInfo = getPaymentTypeInfo(type)
                                      const TypeIcon = typeInfo.icon
                                      const totalAmount = payments.reduce((sum, p) => sum + p.paidAmount, 0)

                                      return (
                                        <div key={type} className={`rounded-lg border-2 ${typeInfo.color.split(' ').slice(-1)[0].replace('bg-', 'border-')}`}>
                                          {/* Type Header */}
                                          <div className={`flex items-center justify-between px-3 py-2 rounded-t-md ${typeInfo.headerColor}`}>
                                            <div className="flex items-center gap-2">
                                              <TypeIcon className="h-4 w-4" />
                                              <span className="font-semibold text-sm">{typeInfo.label}</span>
                                              <Badge variant="secondary" className="text-[10px]">
                                                {payments.length} ta
                                              </Badge>
                                            </div>
                                            <span className="text-sm font-bold">
                                              {formatMoney(totalAmount)} so'm
                                            </span>
                                          </div>

                                          {/* Payments List */}
                                          <div className="p-2 space-y-2">
                                            {payments.map((payment, idx) => (
                                              <div 
                                                key={payment.id} 
                                                className="p-3 rounded-md bg-white border hover:shadow-sm transition-all"
                                              >
                                                <div className="flex items-start justify-between mb-2">
                                                  <div>
                                                    <p className="text-xs text-muted-foreground">
                                                      To'lov #{idx + 1}
                                                    </p>
                                                    {payment.paymentDate && (
                                                      <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                                                        📅 {new Date(payment.paymentDate).toLocaleDateString('uz-UZ', { 
                                                          day: 'numeric', 
                                                          month: 'short',
                                                          year: 'numeric'
                                                        })}
                                                      </p>
                                                    )}
                                                  </div>
                                                  <Badge 
                                                    variant={payment.status === 'PAID' ? 'default' : 'secondary'}
                                                    className="text-[10px] h-5"
                                                  >
                                                    {payment.status === 'PAID' ? '✓ To\'langan' : 
                                                     payment.status === 'PARTIALLY_PAID' ? 'Qisman' : 'Kutilmoqda'}
                                                  </Badge>
                                                </div>
                                                
                                                <div className="grid grid-cols-2 gap-2 text-xs">
                                                  <div>
                                                    <p className="text-muted-foreground">To'langan:</p>
                                                    <p className="font-semibold text-green-600">
                                                      {formatMoney(payment.paidAmount)} so'm
                                                    </p>
                                                  </div>
                                                  <div>
                                                    <p className="text-muted-foreground">Jami:</p>
                                                    <p className="font-semibold">
                                                      {formatMoney(payment.amount)} so'm
                                                    </p>
                                                  </div>
                                                </div>

                                                {payment.bonusAmount > 0 && (
                                                  <div className="mt-2 pt-2 border-t">
                                                    <div className="flex items-center justify-between text-xs">
                                                      <span className="text-purple-600 flex items-center gap-1">
                                                        <Gift className="h-3 w-3" />
                                                        Bonus:
                                                      </span>
                                                      <span className="font-semibold text-purple-600">
                                                        +{formatMoney(payment.bonusAmount)} so'm
                                                      </span>
                                                    </div>
                                                  </div>
                                                )}

                                                {payment.deductionAmount > 0 && (
                                                  <div className="mt-2 pt-2 border-t">
                                                    <div className="flex items-center justify-between text-xs">
                                                      <span className="text-red-600 flex items-center gap-1">
                                                        <TrendingDown className="h-3 w-3" />
                                                        Ushlab qolish:
                                                      </span>
                                                      <span className="font-semibold text-red-600">
                                                        -{formatMoney(payment.deductionAmount)} so'm
                                                      </span>
                                                    </div>
                                                  </div>
                                                )}

                                                {payment.remainingAmount > 0 && (
                                                  <div className="mt-2 pt-2 border-t">
                                                    <div className="flex items-center justify-between text-xs">
                                                      <span className="text-orange-600">Qolgan:</span>
                                                      <span className="font-semibold text-orange-600">
                                                        {formatMoney(payment.remainingAmount)} so'm
                                                      </span>
                                                    </div>
                                                  </div>
                                                )}

                                                {payment.description && (
                                                  <div className="mt-2 pt-2 border-t">
                                                    <p className="text-[10px] text-muted-foreground italic">
                                                      💬 {payment.description}
                                                    </p>
                                                  </div>
                                                )}
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      )
                                    })}
                                  </>
                                )
                              })()}
                            </div>

                            <div className="pt-2 border-t bg-gradient-to-r from-green-50 to-emerald-50 -mx-4 px-4 py-3 -mb-3 rounded-b-lg">
                              <div className="flex justify-between items-center">
                                <span className="text-sm font-semibold text-green-800">Jami to'langan:</span>
                                <span className="text-lg font-bold text-green-600">{formatMoney(status.totalPaid)} so'm</span>
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
                {/* Progress */}
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">To'langan:</span>
                    <span className="font-semibold">{formatMoney(status.totalPaid)} so'm</span>
                  </div>
                  <Progress 
                    value={status.percentagePaid} 
                    className="h-2"
                  />
                  <div className="flex justify-between text-xs mt-1 text-muted-foreground">
                    <span>{status.percentagePaid}%</span>
                    <span>{formatMoney(status.requiredAmount)} so'm</span>
                  </div>
                </div>

                {/* Remaining Amount */}
                {!status.isFullyPaid && (
                  <div className="flex justify-between text-sm border-t pt-2">
                    <span className="text-orange-600 font-medium">Qoldi:</span>
                    <span className="text-orange-600 font-semibold">
                      {formatMoney(status.requiredAmount - status.totalPaid)} so'm
                    </span>
                  </div>
                )}

                {/* Action Button */}
                {!status.isFullyPaid && (
                  status.hasSalary && status.salaryId ? (
                    <Link href={`/admin/salaries/${status.salaryId}`} className="block">
                      <Button size="sm" className="w-full" variant="default">
                        <DollarSign className="h-4 w-4 mr-2" />
                        Maosh to'lash
                      </Button>
                    </Link>
                  ) : (
                    <Link 
                      href={`/admin/salaries/create?employeeId=${selectedEmployeeId}&employeeType=${employeeType}&month=${status.month}&year=${status.year}`}
                      className="block"
                    >
                      <Button size="sm" className="w-full" variant="outline">
                        <DollarSign className="h-4 w-4 mr-2" />
                        Maosh yaratish
                      </Button>
                    </Link>
                  )
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
            {employeeType === 'teacher' ? 'O\'qituvchini' : 'Xodimni'} tanlang
          </p>
          <p className="text-sm text-muted-foreground">
            Yil bo'yicha maoshlarni ko'rish uchun {employeeType === 'teacher' ? 'o\'qituvchini' : 'xodimni'} tanlang
          </p>
        </div>
      )}
    </div>
  )
}

