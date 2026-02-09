import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Users, GraduationCap, DollarSign, 
  CheckCircle2, Clock, XCircle, ArrowUpRight
} from 'lucide-react'
import { getCurrentAcademicYear, formatNumber } from '@/lib/utils'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { DashboardIncomeCard } from '@/components/dashboard-income-card'
import { DashboardExpenseCard } from '@/components/dashboard-expense-card'
import { DashboardBalanceCard } from '@/components/dashboard-balance-card'
import { Badge } from '@/components/ui/badge'

// ✅ Advanced caching: Optimized revalidation strategy
export const revalidate = 0 // ✅ No cache for real-time updates
export const dynamic = 'force-dynamic'
export const fetchCache = 'default-no-store'

export default async function AdminDashboard() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'ADMIN') {
    redirect('/unauthorized')
  }

  const tenantId = session.user.tenantId!
  const academicYear = getCurrentAcademicYear()
  
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1)

  // ✅ Optimized parallel queries with error handling
  let stats: any = {
    totalStudents: 0,
    activeStudents: 0,
    trialStudents: 0,
    totalTeachers: 0,
    totalClasses: 0,
    totalSubjects: 0,
    completedPayments: 0,
    pendingPayments: 0,
    overduePayments: 0,
    income: 0,
    completedPaymentsAmount: 0,
    pendingPaymentsAmount: 0,
    totalExpenses: 0,
    expenseCategories: []
  }
  let recentStudents: any[] = []
  let recentPayments: any[] = []

  try {
    const results = await Promise.all([
      // Core statistics
      getDashboardStats(tenantId, thisMonthStart, today, academicYear),

      // Recent students (top 5)
      db.student.findMany({
        where: { tenantId },
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          studentCode: true,
          status: true,
          createdAt: true,
          user: { select: { fullName: true } },
          class: { select: { name: true } }
        }
      }),

      // Recent payments (top 5)
      db.payment.findMany({
        where: { 
          tenantId, 
          paidAmount: { gt: 0 },
          paidDate: { not: null }
        },
        take: 5,
        orderBy: { paidDate: 'desc' },
        select: {
          id: true,
          amount: true,
          paidAmount: true,
          paidDate: true,
          paymentMethod: true,
          student: {
            select: {
              user: { select: { fullName: true } }
            }
          }
        }
      })
    ])

    if (results) {
      stats = results[0] || stats
      recentStudents = results[1] || []
      recentPayments = results[2] || []
    }
  } catch (error) {
    // Log error in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error fetching dashboard data:', error)
    }
  }

  const balance = (stats?.income || 0) - (stats?.totalExpenses || 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Salom, {session.user.fullName} • {session.user.tenant?.name}
          </p>
        </div>
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground">O'quv yili</p>
            <p className="text-lg font-bold text-blue-600">{academicYear}</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Stats - 2 Cards */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
        {/* Students Card */}
        <Link href="/admin/students">
          <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer border-t-4 border-t-blue-500">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  O'quvchilar
                </CardTitle>
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="text-3xl font-bold text-blue-600">
                  {stats.totalStudents}
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200">
                    ✓ {stats.activeStudents} faol
                  </Badge>
                  {stats.trialStudents > 0 && (
                    <Badge variant="secondary" className="bg-orange-50 text-orange-700 border-orange-200">
                      {stats.trialStudents} sinov
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Teachers Card */}
        <Link href="/admin/teachers">
          <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer border-t-4 border-t-purple-500">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Xodimlar va O'quv Jarayoni
                </CardTitle>
                <div className="p-2 bg-purple-100 rounded-lg">
                  <GraduationCap className="h-5 w-5 text-purple-600" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="text-3xl font-bold text-purple-600">
                  {stats.totalTeachers}
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 border-indigo-200">
                    {stats.totalClasses} sinf
                  </Badge>
                  <Badge variant="secondary" className="bg-violet-50 text-violet-700 border-violet-200">
                    {stats.totalSubjects} fan
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Payment Stats - 2 Cards */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
        {/* Completed Payments */}
        <Link href="/admin/payments?status=COMPLETED">
          <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer border-t-4 border-t-green-500">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  To'langan (Bu oy)
                </CardTitle>
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="text-3xl font-bold text-green-600">
                  {stats.completedPayments}
                </div>
                <div className="pt-3 border-t">
                  <p className="text-xs text-muted-foreground mb-1">Jami summa:</p>
                  <p className="text-xl font-bold text-green-600">
                    +{formatNumber(stats.completedPaymentsAmount || 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Pending Payments */}
        <Link href="/admin/payments?status=PENDING">
          <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer border-t-4 border-t-orange-500">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Kutilmoqda (Bu oy)
                </CardTitle>
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Clock className="h-5 w-5 text-orange-600" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="text-3xl font-bold text-orange-600">
                  {stats.pendingPayments}
                </div>
                <div className="pt-3 border-t">
                  <p className="text-xs text-muted-foreground mb-1">Kutilayotgan summa:</p>
                  <p className="text-xl font-bold text-orange-600">
                    {formatNumber(stats.pendingPaymentsAmount || 0)}
                  </p>
                </div>
                {stats.overduePayments > 0 && (
                  <Badge variant="secondary" className="bg-red-50 text-red-700 border-red-200">
                    <XCircle className="h-3 w-3 mr-1" />
                    {stats.overduePayments} kechikkan
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Financial Overview - 3 Cards */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
        <DashboardIncomeCard
          income={stats.income}
          cashIncome={stats.cashIncome || 0}
          cardIncome={stats.cardIncome || 0}
          completedPayments={stats.completedPayments}
          paymentMethods={stats.paymentMethods || []}
        />

        <DashboardExpenseCard
          totalExpenses={stats.totalExpenses || 0}
          expenseCash={stats.expenseCash || 0}
          expenseCard={stats.expenseCard || 0}
          expensePaymentMethods={stats.expensePaymentMethods || []}
          expenseCategories={stats.expenseCategories || []}
        />

        <DashboardBalanceCard
          balance={balance}
          cashIncome={stats.cashIncome || 0}
          cashExpense={stats.expenseCash || 0}
          cardIncome={stats.cardIncome || 0}
          cardExpense={stats.expenseCard || 0}
        />
      </div>

      {/* Recent Activity - 2 Columns */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        {/* Recent Students */}
        <Card className="border-t-4 border-t-blue-500">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-base">Yangi O'quvchilar</CardTitle>
                  <p className="text-xs text-muted-foreground">So'nggi 5 ta</p>
                </div>
              </div>
              <Link href="/admin/students">
                <Button variant="outline" size="sm" className="text-xs">
                  Barchasi <ArrowUpRight className="ml-1 h-3 w-3" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentStudents.length > 0 ? (
                recentStudents.map((student: any) => (
                  <div
                    key={student.id}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-blue-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
                        {student.user?.fullName?.charAt(0) || '?'}
                      </div>
                      <div>
                        <p className="font-medium text-sm">
                          {student.user?.fullName || 'Noma\'lum'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {student.class?.name || 'Sinfsiz'} • {student.studentCode}
                        </p>
                      </div>
                    </div>
                    <Badge 
                      variant="secondary" 
                      className={student.status === 'ACTIVE' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-700'}
                    >
                      {student.status === 'ACTIVE' ? 'Faol' : student.status}
                    </Badge>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-2 opacity-20" />
                  <p className="text-sm">Hozircha o'quvchilar yo'q</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Payments */}
        <Card className="border-t-4 border-t-green-500">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-green-100 rounded-lg">
                  <DollarSign className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <CardTitle className="text-base">So'nggi To'lovlar</CardTitle>
                  <p className="text-xs text-muted-foreground">Oxirgi 5 ta</p>
                </div>
              </div>
              <Link href="/admin/payments">
                <Button variant="outline" size="sm" className="text-xs">
                  Barchasi <ArrowUpRight className="ml-1 h-3 w-3" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentPayments.length > 0 ? (
                recentPayments.map((payment: any) => (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-green-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center text-white">
                        <DollarSign className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">
                          {payment.student?.user?.fullName || 'Noma\'lum'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {payment.paidDate ? new Date(payment.paidDate).toLocaleDateString('uz-UZ') : 'N/A'} • {payment.paymentMethod}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600">
                        +{formatNumber(Number(payment.paidAmount))}
                      </p>
                      <p className="text-xs text-muted-foreground">so'm</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <DollarSign className="h-12 w-12 mx-auto mb-2 opacity-20" />
                  <p className="text-sm">Hozircha to'lovlar yo'q</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// ===== HELPER FUNCTIONS =====

async function getDashboardStats(
  tenantId: string,
  thisMonthStart: Date,
  today: Date,
  academicYear: string
) {
  const [
    totalStudents,
    activeStudents,
    trialStudents,
    totalTeachers,
    totalClasses,
    totalSubjects,
    completedPayments,
    pendingPayments,
    overduePayments,
    income,
    completedPaymentsAmount,
    generalExpenses,
    kitchenExpenses,
    expensesByCategory
  ] = await Promise.all([
    db.student.count({ where: { tenantId } }),
    db.student.count({ where: { tenantId, status: 'ACTIVE' } }),
    db.student.count({ where: { tenantId, trialEnabled: true, status: 'ACTIVE' } }),
    db.teacher.count({ where: { tenantId } }),
    db.class.count({ where: { tenantId, academicYear } }),
    db.subject.count({ where: { tenantId } }),
    // ✅ TOPSHIRIQ 2: To'langan to'lovlar (Bu oy ichida to'langan)
    db.payment.count({
      where: {
        tenantId,
        status: 'COMPLETED',
        paidDate: { gte: thisMonthStart } // ✅ Bu oy ichida to'langan
      }
    }),
    // ✅ TOPSHIRIQ 1: Kutilayotgan to'lovlar (PENDING + PARTIALLY_PAID)
    db.payment.count({
      where: {
        tenantId,
        status: { in: ['PENDING', 'PARTIALLY_PAID'] } // ✅ Ikkalasi ham
      }
    }),
    // Kechikkan to'lovlar
    db.payment.count({
      where: {
        tenantId,
        status: { in: ['PENDING', 'PARTIALLY_PAID'] }, // ✅ Ikkalasi ham
        dueDate: { lt: today }
      }
    }),
    // ✅ TOPSHIRIQ 2: Kirim - Bu oy ichida to'langan barcha to'lovlar summasi
    db.payment.aggregate({
      where: {
        tenantId,
        paidAmount: { gt: 0 },
        paidDate: { gte: thisMonthStart, not: null } // ✅ Bu oy ichida to'langan
      },
      _sum: { paidAmount: true }
    }),
    // ✅ TOPSHIRIQ 2: To'langan to'lovlar umumiy summasi (faqat COMPLETED)
    db.payment.aggregate({
      where: {
        tenantId,
        status: 'COMPLETED',
        paidDate: { gte: thisMonthStart, not: null } // ✅ Bu oy ichida to'langan
      },
      _sum: { amount: true } // ✅ To'liq to'langan to'lovlarning umumiy miqdori
    }),
    // ✅ TOPSHIRIQ 3: Xarajatlar - Faqat Expense (kitchen yo'q)
    db.expense.aggregate({
      where: {
        tenantId,
        date: { gte: thisMonthStart }
      },
      _sum: { amount: true }
    }),
    // Kitchen expenses - hisobda faqat, lekin totalExpenses'ga qo'shilmaydi
    db.kitchenExpense.aggregate({
      where: {
        tenantId,
        date: { gte: thisMonthStart }
      },
      _sum: { amount: true }
    }),
    // ✅ TOPSHIRIQ 3: Xarajat kategoriyalari (faqat Expense)
    db.expense.groupBy({
      by: ['categoryId'],
      where: {
        tenantId,
        date: { gte: thisMonthStart }
      },
      _sum: { amount: true }
    }),
  ])

  // ✅ TOPSHIRIQ 1: PENDING va PARTIALLY_PAID to'lovlarning qolgan summasini hisoblash
  const pendingPaymentsList = await db.payment.findMany({
    where: {
      tenantId,
      status: { in: ['PENDING', 'PARTIALLY_PAID'] } // ✅ Ikkalasi ham
    },
    select: {
      amount: true,
      paidAmount: true
    }
  })

  // ✅ Qolgan summa = umumiy - to'langan
  const pendingPaymentsAmount = pendingPaymentsList.reduce((sum, p) => {
    const remaining = Number(p.amount) - Number(p.paidAmount || 0)
    return sum + remaining
  }, 0)
  
  // ✅ To'lov usullari analitikasi
  const paymentTransactionsByMethod = await db.paymentTransaction.groupBy({
    by: ['paymentMethod'],
    where: {
      payment: {
        tenantId: tenantId
      },
      transactionDate: { gte: thisMonthStart }
    },
    _sum: { amount: true }
  })

  // ✅ TOPSHIRIQ 3: Xarajat to'lov usullari (faqat Expense)
  const expensesByPaymentMethod = await db.expense.groupBy({
    by: ['paymentMethod'],
    where: {
      tenantId,
      date: { gte: thisMonthStart }
    },
    _sum: { amount: true }
  })

  // ✅ Kategoriyalar
  const expenseCategories = await db.expenseCategory.findMany({
    where: { tenantId },
    select: { id: true, name: true, color: true }
  })

  // ✅ TOPSHIRIQ 3: Xarajat kategoriyalari bilan birlashtirish
  const generalExpenseBreakdown = expensesByCategory.map(exp => {
    const cat = expenseCategories.find(c => c.id === exp.categoryId)
    return {
      name: cat?.name || 'Boshqa',
      amount: Number(exp._sum.amount || 0),
      color: cat?.color || '#ef4444'
    }
  })

  const allExpenses = generalExpenseBreakdown.sort((a, b) => b.amount - a.amount)

  // ✅ To'lov usullari breakdown (kirim)
  const paymentMethodsBreakdown = paymentTransactionsByMethod.map(pm => ({
    method: pm.paymentMethod,
    amount: Number(pm._sum.amount || 0)
  }))

  const cashAmount = paymentMethodsBreakdown
    .filter(pm => pm.method === 'CASH')
    .reduce((sum, pm) => sum + pm.amount, 0)
  
  const cardAmount = paymentMethodsBreakdown
    .filter(pm => pm.method === 'CLICK')
    .reduce((sum, pm) => sum + pm.amount, 0)

  // ✅ TOPSHIRIQ 3: Xarajat to'lov usullari breakdown
  const allExpensesByMethod = expensesByPaymentMethod.map(e => ({ 
    method: e.paymentMethod, 
    amount: Number(e._sum.amount || 0) 
  }))
  
  const expenseCashAmount = allExpensesByMethod
    .filter(pm => pm.method === 'CASH')
    .reduce((sum, pm) => sum + pm.amount, 0)
  
  const expenseCardAmount = allExpensesByMethod
    .filter(pm => pm.method === 'CLICK')
    .reduce((sum, pm) => sum + pm.amount, 0)

  return {
    totalStudents,
    activeStudents,
    trialStudents,
    totalTeachers,
    totalClasses,
    totalSubjects,
    completedPayments, // ✅ TOPSHIRIQ 2: Bu oy ichida COMPLETED bo'lgan to'lovlar soni
    pendingPayments, // ✅ TOPSHIRIQ 1: PENDING + PARTIALLY_PAID to'lovlar soni
    overduePayments,
    income: Number(income._sum.paidAmount || 0), // ✅ Bu oy ichida to'langan barcha to'lovlar
    completedPaymentsAmount: Number(completedPaymentsAmount._sum.amount || 0), // ✅ TOPSHIRIQ 2: To'liq to'langan to'lovlar summasi
    pendingPaymentsAmount: pendingPaymentsAmount, // ✅ TOPSHIRIQ 1: Kutilayotgan qolgan summa (PENDING + PARTIALLY_PAID)
    generalExpenses: Number(generalExpenses._sum.amount || 0),
    kitchenExpenses: Number(kitchenExpenses._sum.amount || 0),
    totalExpenses: Number(generalExpenses._sum.amount || 0), // ✅ TOPSHIRIQ 3: Faqat Expense (kitchen yo'q)
    expenseCategories: allExpenses, // ✅ TOPSHIRIQ 3: Faqat Expense kategoriyalari
    paymentMethods: paymentMethodsBreakdown,
    cashIncome: cashAmount,
    cardIncome: cardAmount,
    expensePaymentMethods: allExpensesByMethod, // ✅ TOPSHIRIQ 3: Faqat Expense to'lov usullari
    expenseCash: expenseCashAmount, // ✅ TOPSHIRIQ 3: Faqat Expense naqd
    expenseCard: expenseCardAmount // ✅ TOPSHIRIQ 3: Faqat Expense plastik
  }
}
