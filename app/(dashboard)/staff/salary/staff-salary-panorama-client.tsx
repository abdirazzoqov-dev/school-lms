'use client'

import { useState, useEffect } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
  Calendar,
  TrendingUp,
  TrendingDown,
  Gift,
  Info
} from 'lucide-react'
import { formatMoney, getMonthNameUz } from '@/lib/utils/payment-helper'

interface Staff {
  id: string
  staffCode: string | null
  monthlySalary: any
  position: string | null
  user: {
    fullName: string
    email: string | null
  } | null
}

interface StaffSalaryPanoramaClientProps {
  staff: Staff
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

export function StaffSalaryPanoramaClient({ 
  staff,
  currentYear,
  tenantId
}: StaffSalaryPanoramaClientProps) {
  const [selectedYear, setSelectedYear] = useState(currentYear)
  const [monthlyStatuses, setMonthlyStatuses] = useState<MonthSalaryStatus[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Fetch salary statuses
  useEffect(() => {
    const fetchSalaryStatuses = async () => {
      setIsLoading(true)
      try {
        const response = await fetch(
          `/api/salaries/employee-overview?employeeId=${staff.id}&employeeType=staff&year=${selectedYear}`
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
  }, [staff.id, selectedYear])

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
      {/* Year Selector */}
      <div className="grid gap-4">
        <div className="space-y-2 max-w-xs">
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

      {/* Employee Info */}
      <Card className="bg-gradient-to-r from-purple-50 to-pink-50">
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <p className="text-sm text-muted-foreground">Xodim</p>
              <p className="text-lg font-semibold">{staff.user?.fullName}</p>
              <p className="text-xs text-muted-foreground">
                {staff.staffCode || 'Kod yo\'q'}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Lavozim</p>
              <p className="text-lg font-semibold">
                {staff.position || 'Belgilanmagan'}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Oylik maosh</p>
              <p className="text-lg font-semibold">{formatMoney(Number(staff.monthlySalary))} so'm</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Overall Stats */}
      {monthlyStatuses.length > 0 && (
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

      {/* Monthly Salary Grid - Same as Teacher */}
      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Yuklanmoqda...</p>
        </div>
      ) : monthlyStatuses.length > 0 ? (
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
                        <PopoverContent className="w-[550px]" side="top" align="end">
                          {/* Same detailed payment timeline as teacher */}
                          <div className="space-y-4">
                            <div className="flex items-center gap-2 border-b pb-3">
                              <Calendar className="h-5 w-5 text-primary" />
                              <div className="flex-1">
                                <h4 className="font-bold text-base">
                                  {status.monthName} {status.year}
                                </h4>
                                <p className="text-xs text-muted-foreground">
                                  To'lovlar tarixi
                                </p>
                              </div>
                              <Badge variant="secondary" className="font-semibold">
                                {status.payments.length} ta to'lov
                              </Badge>
                            </div>
                            
                            <div className="text-center py-4 text-sm text-muted-foreground">
                              Batafsil ma'lumot uchun admin bilan bog'laning
                            </div>

                            <div className="pt-3 border-t-2 bg-gradient-to-r from-green-50 via-emerald-50 to-teal-50 -mx-4 px-4 py-3 -mb-4 rounded-b-lg border-t-green-200">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-xs text-muted-foreground">Jami to'langan summa:</p>
                                  <p className="text-2xl font-bold text-green-600">
                                    {formatMoney(status.totalPaid)} <span className="text-sm">so'm</span>
                                  </p>
                                </div>
                                {status.requiredAmount > status.totalPaid && (
                                  <div className="text-right">
                                    <p className="text-xs text-muted-foreground">Qolgan:</p>
                                    <p className="text-lg font-bold text-orange-600">
                                      {formatMoney(status.requiredAmount - status.totalPaid)} <span className="text-xs">so'm</span>
                                    </p>
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

                {!status.isFullyPaid && (
                  <div className="flex justify-between text-sm border-t pt-2">
                    <span className="text-orange-600 font-medium">Qoldi:</span>
                    <span className="text-orange-600 font-semibold">
                      {formatMoney(status.requiredAmount - status.totalPaid)} so'm
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Calendar className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <p className="text-lg font-medium text-muted-foreground">
            Ma'lumotlar topilmadi
          </p>
        </div>
      )}
    </div>
  )
}

