import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DollarSign, Users, TrendingUp, AlertCircle, Plus,
  CreditCard, CheckCircle2, Clock, Download, XCircle, User
} from 'lucide-react'
import Link from 'next/link'
import { Progress } from '@/components/ui/progress'
import { currentMonth, currentYear, monthNames } from '@/lib/validations/salary'
import { SalarySearchFilter } from '@/components/salary-search-filter'
import { PermissionGate } from '@/components/admin/permission-gate'
import { SalariesTableClient } from './salaries-table-client'
import { formatNumber } from '@/lib/utils'

export const revalidate = 0
export const dynamic = 'force-dynamic'

// Helper: Employee Summary Component (Inline Server Component)
async function EmployeeSalarySummary({ tenantId, currentYear }: { tenantId: string; currentYear: number }) {
  const teachers = await db.teacher.findMany({
    where: { tenantId },
    include: {
      user: { select: { fullName: true, email: true } },
      salaryPayments: {
        where: { year: currentYear },
        select: { month: true, type: true, status: true, paidAmount: true, remainingAmount: true }
      }
    }
  })

  const staff = await db.staff.findMany({
    where: { tenantId },
    include: {
      user: { select: { fullName: true, email: true } },
      salaryPayments: {
        where: { year: currentYear },
        select: { month: true, type: true, status: true, paidAmount: true, remainingAmount: true }
      }
    }
  })

  const allEmployees = [
    ...teachers.map(t => ({
      name: t.user.fullName,
      email: t.user.email,
      salary: Number(t.monthlySalary) || 0,
      payments: t.salaryPayments
    })),
    ...staff.map(s => ({
      name: s.user.fullName,
      email: s.user.email,
      salary: Number(s.monthlySalary) || 0,
      payments: s.salaryPayments
    }))
  ]

  return (
    <div className="space-y-3">
      {allEmployees.map((emp, idx) => {
        const totalPaid = emp.payments.filter(p => p.status === 'PAID').reduce((s, p) => s + Number(p.paidAmount), 0)
        const totalDebt = emp.payments.filter(p => p.status !== 'PAID').reduce((s, p) => s + Number(p.remainingAmount), 0)
        const monthsPaid = emp.payments.filter(p => p.type === 'FULL_SALARY' && p.status === 'PAID').length
        
        return (
          <div key={idx} className="p-4 bg-white rounded-lg border-2 hover:shadow-lg transition-all">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold shrink-0">
                  {emp.name.charAt(0)}
                </div>
                <div>
                  <h4 className="font-semibold">{emp.name}</h4>
                  <p className="text-xs text-muted-foreground">{emp.email}</p>
                </div>
              </div>
              {totalDebt > 0 && (
                <Badge variant="destructive">
                  Qarz: {totalDebt.toLocaleString('uz-UZ')} so'm
                </Badge>
              )}
            </div>

            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="p-2 bg-blue-50 rounded border border-blue-200">
                <p className="text-xs text-muted-foreground">Oylik</p>
                <p className="font-bold text-blue-600">{(emp.salary / 1000000).toFixed(1)}M</p>
              </div>
              <div className="p-2 bg-green-50 rounded border border-green-200">
                <p className="text-xs text-muted-foreground">To'langan</p>
                <p className="font-bold text-green-600">{(totalPaid / 1000000).toFixed(1)}M</p>
              </div>
              <div className="p-2 bg-orange-50 rounded border border-orange-200">
                <p className="text-xs text-muted-foreground">Qolgan</p>
                <p className="font-bold text-orange-600">{(totalDebt / 1000000).toFixed(1)}M</p>
              </div>
              <div className="p-2 bg-purple-50 rounded border border-purple-200">
                <p className="text-xs text-muted-foreground">Oylar</p>
                <p className="font-bold text-purple-600">{monthsPaid}/12</p>
              </div>
            </div>

            <div className="mt-3 flex gap-2 text-xs">
              {monthNames.slice(0, 12).map((month, i) => {
                const monthPayment = emp.payments.find(p => p.month === i + 1 && p.type === 'FULL_SALARY')
                const status = monthPayment?.status === 'PAID' ? 'paid' : 
                              monthPayment?.status === 'PARTIALLY_PAID' ? 'partial' :
                              monthPayment ? 'pending' : 'none'
                
                return (
                  <div
                    key={i}
                    className={`flex-1 p-1 rounded text-center ${
                      status === 'paid' ? 'bg-green-500 text-white' :
                      status === 'partial' ? 'bg-yellow-500 text-white' :
                      status === 'pending' ? 'bg-orange-500 text-white' :
                      'bg-gray-200 text-gray-500'
                    }`}
                    title={`${month}: ${status === 'paid' ? 'To\'langan' : status === 'partial' ? 'Qisman' : status === 'pending' ? 'Kutilmoqda' : 'Berilmagan'}`}
                  >
                    {i + 1}
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
      {allEmployees.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <User className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>Xodimlar topilmadi</p>
        </div>
      )}
    </div>
  )
}

export default async function SalariesPage({
  searchParams
}: {
  searchParams: { month?: string; year?: string; type?: string; status?: string; search?: string }
}) {
  const session = await getServerSession(authOptions)

  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'MODERATOR')) {
    redirect('/unauthorized')
  }

  const tenantId = session.user.tenantId!
  
  // Parse filters
  const selectedMonth = searchParams.month ? parseInt(searchParams.month) : currentMonth
  const selectedYear = searchParams.year ? parseInt(searchParams.year) : currentYear
  const selectedType = searchParams.type
  const selectedStatus = searchParams.status
  const searchQuery = searchParams.search

  // Build where clause
  const where: any = { tenantId }
  if (selectedMonth && selectedYear) {
    where.month = selectedMonth
    where.year = selectedYear
  }
  if (selectedType) where.type = selectedType
  if (selectedStatus) where.status = selectedStatus
  
  // Search by employee name
  if (searchQuery) {
    where.OR = [
      {
        teacher: {
          user: {
            fullName: {
              contains: searchQuery,
              mode: 'insensitive'
            }
          }
        }
      },
      {
        staff: {
          user: {
            fullName: {
              contains: searchQuery,
              mode: 'insensitive'
            }
          }
        }
      }
    ]
  }

  // Get salary payments with notes for payment history
  const salaryPayments = await db.salaryPayment.findMany({
    where,
    select: {
      id: true,
      amount: true,
      paidAmount: true,
      remainingAmount: true,
      baseSalary: true,
      bonusAmount: true,
      deductionAmount: true,
      type: true,
      status: true,
      month: true,
      year: true,
      description: true,
      notes: true,
      paymentDate: true,
      createdAt: true,
      teacher: {
        select: {
          id: true,
          monthlySalary: true,
          user: {
            select: {
              fullName: true,
              avatar: true,
              email: true,
              phone: true
            }
          }
        }
      },
      staff: {
        select: {
          id: true,
          staffCode: true,
          position: true,
          monthlySalary: true,
          user: {
            select: {
              fullName: true,
              avatar: true,
              email: true,
              phone: true
            }
          }
        }
      },
      paidBy: {
        select: {
          fullName: true
        }
      }
    },
    orderBy: [
      { status: 'asc' },
      { createdAt: 'desc' }
    ]
  })

  // Calculate statistics based on filtered data
  // 1. Total salary amount that should be paid (FULL_SALARY amount)
  const totalSalaryAmount = salaryPayments
    .filter(p => p.type === 'FULL_SALARY')
    .reduce((sum, p) => sum + Number(p.amount), 0)

  // 2. Unpaid salary amount - CORRECT CALCULATION
  // For each employee/month, calculate: requiredAmount - totalPaid
  // Group by employee + month + year
  const employeeMonthMap = new Map<string, {
    requiredAmount: number
    totalPaid: number
    employeeId: string
    month: number
    year: number
  }>()

  salaryPayments.forEach(payment => {
    const employeeId = payment.teacher?.id || payment.staff?.id || ''
    const month = payment.month || 0
    const year = payment.year || 0
    const key = `${employeeId}-${month}-${year}`

    if (!employeeMonthMap.has(key)) {
      employeeMonthMap.set(key, {
        requiredAmount: 0,
        totalPaid: 0,
        employeeId,
        month,
        year
      })
    }

    const record = employeeMonthMap.get(key)!

    // Set requiredAmount from FULL_SALARY
    if (payment.type === 'FULL_SALARY') {
      record.requiredAmount = Number(payment.amount)
    }

    // Add all paid amounts (FULL_SALARY, ADVANCE, BONUS, etc.)
    // For DEDUCTION, we don't add to totalPaid (it's already subtracted from FULL_SALARY.amount)
    if (payment.type !== 'DEDUCTION') {
      record.totalPaid += Number(payment.paidAmount || 0)
    }
  })

  // Calculate total unpaid amount across all employees/months
  let unpaidSalaryAmount = 0
  employeeMonthMap.forEach(record => {
    const unpaid = Math.max(0, record.requiredAmount - record.totalPaid)
    unpaidSalaryAmount += unpaid
  })

  // 3. Total deductions - include both DEDUCTION type and deductionAmount from FULL_SALARY
  const totalDeductions = salaryPayments
    .reduce((sum, p) => {
      if (p.type === 'DEDUCTION') {
        return sum + Number(p.paidAmount)
      } else if (p.type === 'FULL_SALARY' && p.deductionAmount) {
        return sum + Number(p.deductionAmount)
      }
      return sum
    }, 0)
  
  // 4. Total advances
  const totalAdvances = salaryPayments
    .filter(p => p.type === 'ADVANCE')
    .reduce((sum, p) => sum + Number(p.paidAmount), 0)

  // 5. Total bonuses - include both BONUS type and bonusAmount from FULL_SALARY
  const totalBonuses = salaryPayments
    .reduce((sum, p) => {
      if (p.type === 'BONUS') {
        return sum + Number(p.paidAmount)
      } else if (p.type === 'FULL_SALARY' && p.bonusAmount) {
        return sum + Number(p.bonusAmount)
      }
      return sum
    }, 0)

  const paidCount = salaryPayments.filter(p => p.status === 'PAID').length
  const pendingCount = salaryPayments.filter(p => p.status === 'PENDING' || p.status === 'PARTIALLY_PAID').length
  

  return (
    <div className="space-y-6 p-6">
      {/* Header - Modern Gradient */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-600 via-emerald-600 to-teal-600 p-8 text-white shadow-2xl">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                  <DollarSign className="h-8 w-8" />
                </div>
                <h1 className="text-4xl font-bold">Xodimlar Maoshi</h1>
              </div>
              <p className="text-green-50 text-lg">
                O'qituvchilar va xodimlar oylik maoshi, avans va mukofotlarni boshqarish
              </p>
            </div>
            <div className="flex gap-3">
              <Button 
                asChild 
                size="lg" 
                variant="secondary"
                className="bg-white/20 hover:bg-white/30 backdrop-blur-sm border-2 border-white/40"
              >
                <Link href="/admin/salaries/employee-overview">
                  <Users className="mr-2 h-5 w-5" />
                  Maosh Panoramasi
                </Link>
              </Button>
              <PermissionGate resource="salaries" action="CREATE">
                <Button 
                  asChild 
                  size="lg" 
                  className="bg-white text-green-600 hover:bg-green-50 shadow-lg hover:shadow-xl transition-all"
                >
                  <Link href="/admin/salaries/create">
                    <Plus className="mr-2 h-5 w-5" />
                    Maosh To'lash
                  </Link>
                </Button>
              </PermissionGate>
            </div>
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10 blur-2xl"></div>
        <div className="absolute -left-8 -bottom-8 h-40 w-40 rounded-full bg-white/10 blur-2xl"></div>
      </div>

      {/* Statistics Cards - Professional LMS Grid Layout */}
      {/* First Row - Primary Metrics (3 cards) */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* 1. Total Salary Amount - Primary */}
        <Card className="relative overflow-hidden border-2 border-blue-200 bg-gradient-to-br from-blue-50 via-blue-100 to-blue-50 hover:shadow-xl transition-all group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-400/10 rounded-full -mr-16 -mt-16" />
          <CardContent className="pt-6 relative z-10">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-blue-500 rounded-xl shadow-lg group-hover:scale-110 transition-transform">
                <DollarSign className="h-6 w-6 text-white" />
              </div>
              <Badge className="bg-blue-100 text-blue-700 border-0 text-xs font-semibold">
                Bu oy
              </Badge>
            </div>
            <div>
              <p className="text-sm font-medium text-blue-600 mb-1">Jami Oylik Maosh</p>
              <p className="text-3xl font-bold text-blue-700 mb-1">
                {formatNumber(totalSalaryAmount)}
              </p>
              <p className="text-xs text-blue-600/70">
                so'm • Berilishi kerak
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 2. Unpaid Salary - Warning */}
        <Card className="relative overflow-hidden border-2 border-orange-200 bg-gradient-to-br from-orange-50 via-orange-100 to-orange-50 hover:shadow-xl transition-all group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-orange-400/10 rounded-full -mr-16 -mt-16" />
          <CardContent className="pt-6 relative z-10">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-orange-500 rounded-xl shadow-lg group-hover:scale-110 transition-transform">
                <Clock className="h-6 w-6 text-white" />
              </div>
              <Badge className="bg-orange-100 text-orange-700 border-0 text-xs font-semibold">
                Qolgan
              </Badge>
            </div>
            <div>
              <p className="text-sm font-medium text-orange-600 mb-1">Berilmagan Maosh</p>
              <p className="text-3xl font-bold text-orange-700 mb-1">
                {formatNumber(unpaidSalaryAmount)}
              </p>
              <p className="text-xs text-orange-600/70">
                so'm • To'lanishi kerak
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 3. Total Deductions */}
        <Card className="relative overflow-hidden border-2 border-red-200 bg-gradient-to-br from-red-50 via-red-100 to-red-50 hover:shadow-xl transition-all group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-400/10 rounded-full -mr-16 -mt-16" />
          <CardContent className="pt-6 relative z-10">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-red-500 rounded-xl shadow-lg group-hover:scale-110 transition-transform">
                <XCircle className="h-6 w-6 text-white" />
              </div>
              <Badge className="bg-red-100 text-red-700 border-0 text-xs font-semibold">
                Ushlab qolish
              </Badge>
            </div>
            <div>
              <p className="text-sm font-medium text-red-600 mb-1">Ushlab Qolish</p>
              <p className="text-3xl font-bold text-red-700 mb-1">
                {formatNumber(totalDeductions)}
              </p>
              <p className="text-xs text-red-600/70">
                so'm • Jami kamayish
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Second Row - Secondary Metrics (2 cards) */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* 4. Total Advances */}
        <Card className="relative overflow-hidden border-2 border-green-200 bg-gradient-to-br from-green-50 via-green-100 to-green-50 hover:shadow-xl transition-all group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-green-400/10 rounded-full -mr-16 -mt-16" />
          <CardContent className="pt-6 relative z-10">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-green-500 rounded-xl shadow-lg group-hover:scale-110 transition-transform">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <Badge className="bg-green-100 text-green-700 border-0 text-xs font-semibold">
                Avans
              </Badge>
            </div>
            <div>
              <p className="text-sm font-medium text-green-600 mb-1">Avanslar</p>
              <p className="text-3xl font-bold text-green-700 mb-1">
                {formatNumber(totalAdvances)}
              </p>
              <p className="text-xs text-green-600/70">
                so'm • Oldindan berilgan
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 5. Total Bonuses */}
        <Card className="relative overflow-hidden border-2 border-purple-200 bg-gradient-to-br from-purple-50 via-purple-100 to-purple-50 hover:shadow-xl transition-all group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-400/10 rounded-full -mr-16 -mt-16" />
          <CardContent className="pt-6 relative z-10">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-purple-500 rounded-xl shadow-lg group-hover:scale-110 transition-transform">
                <CreditCard className="h-6 w-6 text-white" />
              </div>
              <Badge className="bg-purple-100 text-purple-700 border-0 text-xs font-semibold">
                Bonus
              </Badge>
            </div>
            <div>
              <p className="text-sm font-medium text-purple-600 mb-1">Bonuslar</p>
              <p className="text-3xl font-bold text-purple-700 mb-1">
                {formatNumber(totalBonuses)}
              </p>
              <p className="text-xs text-purple-600/70">
                so'm • Qo'shimcha to'lov
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search & Filters - Modern Design */}
      <Card className="border-2 bg-gradient-to-br from-slate-50 to-gray-50">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <div className="h-8 w-1 bg-gradient-to-b from-green-600 to-emerald-600 rounded-full"></div>
            Qidiruv va Filtrlar
          </CardTitle>
          <CardDescription>Xodimlarni ism-familiya bo'yicha qidiring va oylar kesimida ko'ring</CardDescription>
        </CardHeader>
        <CardContent>
          <SalarySearchFilter />
        </CardContent>
      </Card>

      {/* Employee Summary View - New Feature */}
      {!selectedMonth && !searchQuery && (
        <Card className="border-2 bg-gradient-to-br from-blue-50 to-indigo-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Xodimlar Umumiy Ko'rinish ({currentYear} yil)
            </CardTitle>
            <CardDescription>
              Har bir xodim uchun yillik to'lovlar va qarzlar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <EmployeeSalarySummary tenantId={tenantId} currentYear={currentYear} />
          </CardContent>
        </Card>
      )}

      {/* Payments List - Modern Design */}
      <Card className="border-2">
        <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
          <div>
            <CardTitle className="flex items-center gap-2">
              <div className="h-8 w-1 bg-gradient-to-b from-green-600 to-emerald-600 rounded-full"></div>
              To'lovlar Ro'yxati
            </CardTitle>
            <CardDescription className="mt-1">
              {salaryPayments.length} ta to'lov topildi • Avans va qolgan summalar bilan
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {salaryPayments.length > 0 ? (
            <SalariesTableClient 
              salaryPayments={salaryPayments as any} 
              groupedByEmployee={true}
            />
          ) : (
            <div className="text-center py-12">
              <div className="inline-block p-4 bg-gradient-to-br from-gray-100 to-slate-100 rounded-full mb-4">
                <AlertCircle className="h-16 w-16 text-muted-foreground opacity-50" />
              </div>
              <p className="text-lg font-semibold text-muted-foreground mb-2">
                To'lovlar topilmadi
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                Tanlangan filtrlar bo'yicha hech qanday to'lov topilmadi
              </p>
              <PermissionGate resource="salaries" action="CREATE">
                <Button asChild className="bg-green-600 hover:bg-green-700">
                  <Link href="/admin/salaries/create">
                    <Plus className="mr-2 h-4 w-4" />
                    Yangi to'lov qo'shish
                  </Link>
                </Button>
              </PermissionGate>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

