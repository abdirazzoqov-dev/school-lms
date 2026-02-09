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
  DollarSign, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Search,
  Calendar,
  Briefcase,
  GraduationCap
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
  const filteredEmployees = currentEmployees.filter(e =>
    e.user?.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (employeeType === 'teacher' ? e.teacherCode : e.staffCode)?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const selectedEmployee = currentEmployees.find(e => e.id === selectedEmployeeId)

  // Reset selection when switching tabs
  useEffect(() => {
    setSelectedEmployeeId('')
    setMonthlyStatuses([])
  }, [employeeType])

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

      {/* Employee Dropdown */}
      <div className="space-y-2">
        <Label htmlFor="employee">{employeeType === 'teacher' ? 'O\'qituvchini' : 'Xodimni'} tanlang</Label>
        <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
          <SelectTrigger>
            <SelectValue placeholder={`${employeeType === 'teacher' ? 'O\'qituvchini' : 'Xodimni'} tanlang...`} />
          </SelectTrigger>
          <SelectContent className="max-h-[300px]">
            {filteredEmployees.map(employee => (
              <SelectItem key={employee.id} value={employee.id}>
                {employee.user?.fullName} ({employeeType === 'teacher' ? employee.teacherCode : (employee as any).staffCode}) 
                {' - '} 
                {employeeType === 'teacher' ? (employee as Teacher).specialization : (employee as Staff).position}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Employee Info & Stats */}
      {selectedEmployee && (
        <Card className="bg-gradient-to-r from-purple-50 to-pink-50">
          <CardContent className="pt-6">
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <p className="text-sm text-muted-foreground">{employeeType === 'teacher' ? 'O\'qituvchi' : 'Xodim'}</p>
                <p className="text-lg font-semibold">{selectedEmployee.user?.fullName}</p>
                <p className="text-xs text-muted-foreground">
                  {employeeType === 'teacher' ? selectedEmployee.teacherCode : (selectedEmployee as any).staffCode}
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
                  {getStatusBadge(status)}
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
                    <Link href={`/admin/salaries/${status.salaryId}/edit`} className="block">
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

