import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  DollarSign, TrendingUp, Clock, Calendar, Award
} from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { currentMonth, currentYear, monthNames } from '@/lib/validations/salary'
import { formatNumber } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

export const revalidate = 0
export const dynamic = 'force-dynamic'

export default async function TeacherSalaryPage({
  searchParams
}: {
  searchParams: { month?: string; year?: string }
}) {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'TEACHER') {
    redirect('/unauthorized')
  }

  const tenantId = session.user.tenantId!
  
  // Parse filters
  const selectedMonth = searchParams.month ? parseInt(searchParams.month) : currentMonth
  const selectedYear = searchParams.year ? parseInt(searchParams.year) : currentYear

  // Get teacher
  const teacher = await db.teacher.findUnique({
    where: {
      userId: session.user.id
    },
    select: {
      id: true,
      monthlySalary: true,
      user: {
        select: {
          fullName: true,
          email: true
        }
      }
    }
  })

  if (!teacher) {
    redirect('/unauthorized')
  }

  // Get salary payments for this teacher
  const salaryPayments = await db.salaryPayment.findMany({
    where: {
      tenantId,
      teacherId: teacher.id,
      month: selectedMonth,
      year: selectedYear
    },
    select: {
      id: true,
      type: true,
      status: true,
      amount: true,
      paidAmount: true,
      remainingAmount: true,
      baseSalary: true,
      bonusAmount: true,
      deductionAmount: true,
      month: true,
      year: true,
      paymentDate: true,
      createdAt: true,
      description: true,
      notes: true,
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

  // Calculate statistics
  const monthlySalary = teacher.monthlySalary ? Number(teacher.monthlySalary) : 0
  
  // Check if there's a FULL_SALARY payment (monthly salary was paid)
  const fullSalaryPayment = salaryPayments.find(p => p.type === 'FULL_SALARY')
  
  // For percentage calculation: count base salary paid (not including bonus/deduction adjustments)
  const totalBasePaid = salaryPayments.reduce((sum, p) => {
    if (p.type === 'ADVANCE') {
      return sum + Number(p.paidAmount)
    } else if (p.type === 'FULL_SALARY') {
      // Count baseSalary for percentage (bonus/deduction don't affect "100%" status)
      return sum + Number(p.baseSalary || p.paidAmount)
    }
    return sum
  }, 0)
  
  const totalPaid = salaryPayments.reduce((sum, p) => sum + Number(p.paidAmount), 0)
  const totalAmount = salaryPayments.reduce((sum, p) => sum + Number(p.amount), 0)
  
  // ✅ FIXED: Qolgan summa to'g'ri hisoblanadi
  // Agar FULL_SALARY to'langan bo'lsa va baseSalary >= monthlySalary, qolgan = 0
  const remaining = fullSalaryPayment && Number(fullSalaryPayment.baseSalary || 0) >= monthlySalary
    ? 0  // FULL_SALARY to'langan, qolgan yo'q
    : monthlySalary > 0 
      ? Math.max(0, monthlySalary - totalBasePaid)  // Oddiy hisoblash
      : Math.max(0, totalAmount - totalPaid)  // Fallback
  
  const referenceAmount = monthlySalary > 0 ? monthlySalary : totalAmount
  const percentage = referenceAmount > 0 ? Math.min(Math.round((totalBasePaid / referenceAmount) * 100), 100) : 0

  const totalAdvances = salaryPayments
    .filter(p => p.type === 'ADVANCE')
    .reduce((sum, p) => sum + Number(p.paidAmount), 0)

  // Calculate bonuses and deductions from all payment types
  const totalBonuses = salaryPayments.reduce((sum, p) => {
    // Add BONUS type payments + bonusAmount from FULL_SALARY
    if (p.type === 'BONUS') {
      return sum + Number(p.paidAmount)
    } else if (p.type === 'FULL_SALARY' && p.bonusAmount) {
      return sum + Number(p.bonusAmount)
    }
    return sum
  }, 0)

  const totalDeductions = salaryPayments.reduce((sum, p) => {
    // Add DEDUCTION type payments + deductionAmount from FULL_SALARY
    if (p.type === 'DEDUCTION') {
      return sum + Number(p.paidAmount)
    } else if (p.type === 'FULL_SALARY' && p.deductionAmount) {
      return sum + Number(p.deductionAmount)
    }
    return sum
  }, 0)

  // Get payments for current month only (for payment history)
  const allPayments = await db.salaryPayment.findMany({
    where: {
      tenantId,
      teacherId: teacher.id,
      month: selectedMonth,
      year: selectedYear
    },
    select: {
      id: true,
      type: true,
      status: true,
      amount: true,
      paidAmount: true,
      baseSalary: true,
      bonusAmount: true,
      deductionAmount: true,
      month: true,
      year: true,
      paymentDate: true,
      createdAt: true,
      description: true,
      paidBy: {
        select: {
          fullName: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  })

  const getProgressColor = (percentage: number) => {
    if (percentage === 0) return 'text-red-600'
    if (percentage < 100) return 'text-yellow-600'
    return 'text-green-600'
  }

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
                <h1 className="text-4xl font-bold">Mening Maoshim</h1>
              </div>
              <p className="text-green-50 text-lg">
                {teacher.user.fullName} • Oylik maosh va to'lovlar tarixi
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-end gap-3">
              <div className="text-right">
                <p className="text-sm text-green-100 mb-1">Joriy oy</p>
                <p className="text-3xl font-bold">
                  {monthNames[selectedMonth - 1]} {selectedYear}
                </p>
              </div>
              <Button asChild variant="secondary" className="whitespace-nowrap">
                <Link href="/teacher/salary/overview">
                  📊 Yillik Ko'rinish
                </Link>
              </Button>
            </div>
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10 blur-2xl"></div>
        <div className="absolute -left-8 -bottom-8 h-40 w-40 rounded-full bg-white/10 blur-2xl"></div>
      </div>

      {/* Main Progress Card */}
      {monthlySalary > 0 && (
        <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 via-emerald-50 to-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="h-8 w-1 bg-gradient-to-b from-green-600 to-emerald-600 rounded-full"></div>
              Oylik Maosh - {monthNames[selectedMonth - 1]} {selectedYear}
            </CardTitle>
            <CardDescription>
              Sizning {monthNames[selectedMonth - 1]} oyi uchun maosh to'lovingiz
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Progress Bar */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">To'lov jarayoni</span>
                <span className={`text-2xl font-bold ${getProgressColor(percentage)}`}>
                  {percentage}%
                </span>
              </div>
              <Progress value={percentage} className="h-4 bg-gray-200" />
              
              {/* Amount breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                {/* To'langan */}
                <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-2 bg-green-100 rounded-full">
                      <DollarSign className="h-4 w-4 text-green-600" />
                    </div>
                    <p className="text-sm text-green-600 font-medium">To'langan</p>
                  </div>
                  <p className="text-2xl font-bold text-green-700">
                    {formatNumber(totalPaid)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">so'm</p>
                </div>
                
                {/* Qolgan */}
                <div className={`${percentage < 100 ? 'bg-orange-50 border-orange-200' : 'bg-gray-50 border-gray-200'} border-2 rounded-xl p-4`}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`p-2 ${percentage < 100 ? 'bg-orange-100' : 'bg-gray-100'} rounded-full`}>
                      <Clock className="h-4 w-4 text-orange-600" />
                    </div>
                    <p className={`text-sm ${percentage < 100 ? 'text-orange-600' : 'text-muted-foreground'} font-medium`}>
                      Qolgan
                    </p>
                  </div>
                  <p className={`text-2xl font-bold ${percentage < 100 ? 'text-orange-700' : 'text-gray-600'}`}>
                    {formatNumber(remaining)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">so'm</p>
                </div>
                
                {/* Jami */}
                <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-2 bg-blue-100 rounded-full">
                      <Award className="h-4 w-4 text-blue-600" />
                    </div>
                    <p className="text-sm text-blue-600 font-medium">Jami oylik (100%)</p>
                  </div>
                  <p className="text-2xl font-bold text-blue-700">
                    {formatNumber(referenceAmount)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">so'm</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="relative overflow-hidden border-2 border-purple-200 bg-gradient-to-br from-purple-50 via-pink-50 to-purple-100 hover:shadow-lg transition-all group">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-400/10 to-pink-400/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <CardContent className="pt-6 relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avanslar</p>
                <p className="text-2xl font-bold text-purple-600">
                  {formatNumber(totalAdvances)} so'm
                </p>
                <p className="text-xs text-purple-600/70 mt-1 font-medium">
                  Oldindan olgan
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full group-hover:scale-110 transition-transform">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-2 border-green-200 bg-gradient-to-br from-green-50 via-emerald-50 to-green-100 hover:shadow-lg transition-all group">
          <div className="absolute inset-0 bg-gradient-to-br from-green-400/10 to-emerald-400/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <CardContent className="pt-6 relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Mukofotlar</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatNumber(totalBonuses)} so'm
                </p>
                <p className="text-xs text-green-600/70 mt-1 font-medium">
                  Qo'shimcha
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-full group-hover:scale-110 transition-transform">
                <Award className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-2 border-red-200 bg-gradient-to-br from-red-50 via-orange-50 to-red-100 hover:shadow-lg transition-all group">
          <div className="absolute inset-0 bg-gradient-to-br from-red-400/10 to-orange-400/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <CardContent className="pt-6 relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Ushlab qolish</p>
                <p className="text-2xl font-bold text-red-600">
                  {formatNumber(totalDeductions)} so'm
                </p>
                <p className="text-xs text-red-600/70 mt-1 font-medium">
                  Ayirilgan
                </p>
              </div>
              <div className="p-3 bg-red-100 rounded-full group-hover:scale-110 transition-transform">
                <DollarSign className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment History */}
      <Card className="border-2">
        <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
          <CardTitle className="flex items-center gap-2">
            <div className="h-8 w-1 bg-gradient-to-b from-green-600 to-emerald-600 rounded-full"></div>
            To'lovlar Tarixi
          </CardTitle>
          <CardDescription>
            So'nggi {allPayments.length} ta to'lov
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          {allPayments.length > 0 ? (
            <div className="space-y-3">
              {allPayments.map((payment) => {
                const paidAmount = Number(payment.paidAmount || 0)
                const amount = Number(payment.amount)
                const paymentPercentage = amount > 0 ? Math.round((paidAmount / amount) * 100) : 0
                
                return (
                  <div 
                    key={payment.id} 
                    className="p-4 border-2 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-2">
                          {/* Type badges */}
                          {payment.type === 'FULL_SALARY' && (
                            <Badge className="bg-blue-600">💼 Oylik</Badge>
                          )}
                          {payment.type === 'ADVANCE' && (
                            <Badge className="bg-purple-600">💰 Avans</Badge>
                          )}
                          {payment.type === 'BONUS' && (
                            <Badge className="bg-green-600">🎁 Mukofot</Badge>
                          )}
                          {payment.type === 'DEDUCTION' && (
                            <Badge className="bg-red-600">⛔ Ushlab qolish</Badge>
                          )}
                          
                          {/* Status badges */}
                          {payment.status === 'PAID' && (
                            <Badge className="bg-green-600">✓ To'langan</Badge>
                          )}
                          {payment.status === 'PENDING' && (
                            <Badge className="bg-amber-600">⏳ Kutilmoqda</Badge>
                          )}
                          {payment.status === 'PARTIALLY_PAID' && (
                            <Badge className="bg-orange-600">⚡ Qisman</Badge>
                          )}
                          
                          {/* Month/Year */}
                          {payment.month && payment.year && (
                            <Badge variant="secondary" className="text-xs">
                              <Calendar className="h-3 w-3 mr-1" />
                              {monthNames[payment.month - 1]} {payment.year}
                            </Badge>
                          )}
                        </div>
                        
                        {/* Amounts */}
                        <div className="grid grid-cols-2 gap-2 max-w-sm mb-2">
                          <div className="bg-green-50 border border-green-200 rounded px-3 py-2">
                            <p className="text-xs text-green-600">To'landi</p>
                            <p className="text-sm font-bold text-green-700">
                              {formatNumber(paidAmount)} so'm
                            </p>
                          </div>
                          <div className="bg-gray-50 border border-gray-200 rounded px-3 py-2">
                            <p className="text-xs text-muted-foreground">Jami</p>
                            <p className="text-sm font-bold text-gray-700">
                              {formatNumber(amount)} so'm
                            </p>
                          </div>
                        </div>

                        {/* Bonus & Deduction details for FULL_SALARY */}
                        {payment.type === 'FULL_SALARY' && (payment.bonusAmount || payment.deductionAmount) && (
                          <div className="grid grid-cols-2 gap-2 max-w-sm mb-2">
                            {payment.bonusAmount && Number(payment.bonusAmount) > 0 && (
                              <div className="bg-green-50 border border-green-200 rounded px-3 py-2">
                                <p className="text-xs text-green-600">🎁 Bonus</p>
                                <p className="text-sm font-bold text-green-700">
                                  +{formatNumber(Number(payment.bonusAmount))} so'm
                                </p>
                              </div>
                            )}
                            {payment.deductionAmount && Number(payment.deductionAmount) > 0 && (
                              <div className="bg-red-50 border-2 border-red-300 rounded px-3 py-2">
                                <p className="text-xs text-red-600">⛔ Ushlab qolish</p>
                                <p className="text-sm font-bold text-red-700">
                                  -{formatNumber(Number(payment.deductionAmount))} so'm
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                        
                        {/* Progress bar for individual payment */}
                        {paymentPercentage < 100 && (
                          <div className="max-w-sm">
                            <Progress value={paymentPercentage} className="h-2" />
                          </div>
                        )}
                        
                        {payment.description && (
                          <p className="text-xs text-muted-foreground mt-2">
                            📝 {payment.description}
                          </p>
                        )}
                        
                        {payment.paidBy && (
                          <p className="text-xs text-muted-foreground mt-1">
                            To'lagan: {payment.paidBy.fullName}
                          </p>
                        )}
                      </div>
                      
                      {/* Date */}
                      <div className="text-right">
                        {payment.paymentDate && (
                          <p className="text-sm font-medium">
                            {new Date(payment.paymentDate).toLocaleDateString('uz-UZ', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {new Date(payment.createdAt).toLocaleTimeString('uz-UZ', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="inline-block p-4 bg-gradient-to-br from-gray-100 to-slate-100 rounded-full mb-4">
                <DollarSign className="h-16 w-16 text-muted-foreground opacity-50" />
              </div>
              <p className="text-lg font-semibold text-muted-foreground mb-2">
                To'lovlar topilmadi
              </p>
              <p className="text-sm text-muted-foreground">
                Sizga hali to'lov amalga oshirilmagan
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

