'use client'

import { useState, useEffect } from 'react'
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
  TrendingUp,
  TrendingDown
} from 'lucide-react'
import Link from 'next/link'
import { formatMoney, getMonthNameUz } from '@/lib/utils/payment-helper'

interface Student {
  id: string
  studentCode: string
  monthlyTuitionFee: any
  paymentDueDay: number | null
  user: {
    fullName: string
  } | null
  class: {
    name: string
  } | null
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
  const [selectedStudentId, setSelectedStudentId] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedYear, setSelectedYear] = useState(currentYear)
  const [monthlyStatuses, setMonthlyStatuses] = useState<MonthPaymentStatus[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Filter students
  const filteredStudents = students.filter(s =>
    s.user?.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.studentCode?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const selectedStudent = students.find(s => s.id === selectedStudentId)

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
        
        if (data.success) {
          setMonthlyStatuses(data.monthlyStatuses)
        }
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
      case 'completed':
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

  const getStatusBadge = (status: MonthPaymentStatus) => {
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

  // Generate years (current - 1 to current + 1)
  const years = [currentYear - 1, currentYear, currentYear + 1]

  return (
    <div className="space-y-6">
      {/* Student Selection */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="search">O'quvchini qidirish</Label>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="search"
              placeholder="Ism yoki student kod..."
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

      {/* Student Dropdown */}
      <div className="space-y-2">
        <Label htmlFor="student">O'quvchini tanlang</Label>
        <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
          <SelectTrigger>
            <SelectValue placeholder="O'quvchini tanlang..." />
          </SelectTrigger>
          <SelectContent className="max-h-[300px]">
            {filteredStudents.map(student => (
              <SelectItem key={student.id} value={student.id}>
                {student.user?.fullName} ({student.studentCode}) - {student.class?.name || 'N/A'}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Student Info & Stats */}
      {selectedStudent && (
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50">
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

      {/* Overall Stats */}
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

      {/* Monthly Payment Grid */}
      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Yuklanmoqda...</p>
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
                    <span className="text-orange-600 font-medium">Qarz:</span>
                    <span className="text-orange-600 font-semibold">
                      {formatMoney(status.requiredAmount - status.totalPaid)} so'm
                    </span>
                  </div>
                )}

                {/* Action Button */}
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
        <div className="text-center py-12">
          <Calendar className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <p className="text-lg font-medium text-muted-foreground">O'quvchini tanlang</p>
          <p className="text-sm text-muted-foreground">Yil bo'yicha to'lovlarni ko'rish uchun o'quvchini tanlang</p>
        </div>
      )}
    </div>
  )
}

