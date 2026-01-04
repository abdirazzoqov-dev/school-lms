import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { 
  Users, GraduationCap, BookOpen, DollarSign, TrendingUp, TrendingDown,
  AlertCircle, Calendar, ArrowUpRight, ArrowDownRight, CheckCircle2, 
  Clock, XCircle, Activity
} from 'lucide-react'
import { getCurrentAcademicYear, formatNumber } from '@/lib/utils'
import Link from 'next/link'
import { AttendanceChart } from '@/components/charts/attendance-chart'
import { GradeDistributionChart } from '@/components/charts/grade-distribution-chart'
import { PaymentChart } from '@/components/charts/payment-chart'
import { Button } from '@/components/ui/button'
import { PAGE_CACHE_CONFIG } from '@/lib/cache-config'
import { Progress } from '@/components/ui/progress'

// ✅ Advanced caching: Optimized revalidation strategy
export const revalidate = PAGE_CACHE_CONFIG.admin.revalidate
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
    presentToday: 0,
    completedPayments: 0,
    pendingPayments: 0,
    overduePayments: 0,
    income: 0,
    totalExpenses: 0,
    expenseCategories: []
  }
  let recentStudents: any[] = []
  let recentPayments: any[] = []
  let attendanceData: any[] = []
  let gradeDistribution: any[] = []
  let paymentChartData: any[] = []

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
        where: { tenantId, status: 'COMPLETED' },
        take: 5,
        orderBy: { paidDate: 'desc' },
        select: {
          id: true,
          amount: true,
          paidDate: true,
          paymentMethod: true,
          student: {
            select: {
              user: { select: { fullName: true } }
            }
          }
        }
      }),

      // Attendance data (last 7 days)
      getAttendanceData(tenantId, 7),

      // Grade distribution
      getGradeDistribution(tenantId),

      // Payment chart data
      getPaymentChartData(tenantId)
    ])

    stats = results[0] || stats
    recentStudents = results[1] || []
    recentPayments = results[2] || []
    attendanceData = results[3] || []
    gradeDistribution = results[4] || []
    paymentChartData = results[5] || []
  } catch (error) {
    console.error('Error fetching dashboard data:', error)
  }

  const balance = stats.income - stats.totalExpenses
  const attendanceRate = stats.totalStudents > 0 
    ? (stats.presentToday / stats.totalStudents) * 100 
    : 0

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Salom, {session.user.fullName} • {session.user.tenant?.name}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-right">
            <p className="text-sm text-muted-foreground">O'quv yili</p>
            <p className="text-lg font-semibold">{academicYear}</p>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {session.user.tenant?.status === 'GRACE_PERIOD' && (
        <Card className="border-orange-300 bg-orange-50">
          <CardContent className="flex items-center gap-3 pt-6">
            <AlertCircle className="h-5 w-5 text-orange-600 shrink-0" />
            <p className="text-sm font-medium text-orange-800">
              Obuna muddati tugadi. 7 kun ichida to'lov qiling!
            </p>
          </CardContent>
        </Card>
      )}

      {/* Main Stats - 4 Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Students */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              O'quvchilar
            </CardTitle>
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalStudents}</div>
            <div className="flex items-center gap-2 mt-2 text-xs">
              <span className="flex items-center gap-1 text-green-600">
                <CheckCircle2 className="h-3 w-3" />
                {stats.activeStudents} faol
              </span>
              {stats.trialStudents > 0 && (
                <span className="flex items-center gap-1 text-orange-600">
                  <Clock className="h-3 w-3" />
                  {stats.trialStudents} sinov
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Teachers & Classes */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Xodimlar
            </CardTitle>
            <div className="p-2 bg-purple-100 rounded-lg">
              <GraduationCap className="h-4 w-4 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalTeachers}</div>
            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
              <span>{stats.totalClasses} ta sinf</span>
              <span>•</span>
              <span>{stats.totalSubjects} fan</span>
            </div>
          </CardContent>
        </Card>

        {/* Today's Attendance */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Bugungi Davomat
            </CardTitle>
            <div className="p-2 bg-green-100 rounded-lg">
              <Activity className="h-4 w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.presentToday}</div>
            <div className="mt-2 space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Davomat darajasi</span>
                <span className="font-medium">{attendanceRate.toFixed(0)}%</span>
              </div>
              <Progress value={attendanceRate} className="h-1.5" />
            </div>
          </CardContent>
        </Card>

        {/* Payments */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              To'lovlar
            </CardTitle>
            <div className="p-2 bg-amber-100 rounded-lg">
              <DollarSign className="h-4 w-4 text-amber-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.completedPayments}</div>
            <div className="flex items-center gap-2 mt-2 text-xs">
              <span className="flex items-center gap-1 text-orange-600">
                <Clock className="h-3 w-3" />
                {stats.pendingPayments} kutilmoqda
              </span>
              {stats.overduePayments > 0 && (
                <span className="flex items-center gap-1 text-red-600">
                  <XCircle className="h-3 w-3" />
                  {stats.overduePayments} kechikkan
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Financial Overview - 3 Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Income */}
        <Card className="border-l-4 border-l-green-500 hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Kirim (Bu oy)
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              +{formatNumber(stats.income)}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {stats.completedPayments} ta to'lov qabul qilindi
            </p>
          </CardContent>
        </Card>

        {/* Expenses */}
        <Card className="border-l-4 border-l-red-500 hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Xarajatlar (Bu oy)
              </CardTitle>
              <TrendingDown className="h-4 w-4 text-red-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              -{formatNumber(stats.totalExpenses)}
            </div>
            <div className="mt-3 space-y-2">
              {/* Umumiy xarajat breakdown */}
              {stats.expenseCategories && stats.expenseCategories.length > 0 ? (
                stats.expenseCategories.slice(0, 3).map((cat: any) => (
                  <div key={cat.name} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5">
                        <div 
                          className="w-2 h-2 rounded-full" 
                          style={{ backgroundColor: cat.color || '#ef4444' }}
                        />
                        <span className="text-muted-foreground">{cat.name}</span>
                      </span>
                      <span className="font-medium text-red-700">
                        -{formatNumber(cat.amount)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1">
                      <div 
                        className="h-1 rounded-full transition-all"
                        style={{ 
                          width: `${(cat.amount / stats.totalExpenses) * 100}%`,
                          backgroundColor: cat.color || '#ef4444'
                        }}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-muted-foreground">Xarajat yo'q</p>
              )}
              {stats.expenseCategories && stats.expenseCategories.length > 3 && (
                <Link href="/admin/expenses">
                  <p className="text-xs text-blue-600 hover:underline mt-2">
                    +{stats.expenseCategories.length - 3} ta yana...
                  </p>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Balance */}
        <Card className={`border-l-4 ${balance >= 0 ? 'border-l-blue-500' : 'border-l-orange-500'} hover:shadow-md transition-shadow`}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Balans (Bu oy)
              </CardTitle>
              {balance >= 0 ? (
                <ArrowUpRight className="h-4 w-4 text-blue-600" />
              ) : (
                <ArrowDownRight className="h-4 w-4 text-orange-600" />
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${balance >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
              {formatNumber(balance)}
            </div>
            <div className="mt-3 space-y-1.5 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Kirim:</span>
                <span className="font-medium text-green-600">+{formatNumber(stats.income)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Xarajat:</span>
                <span className="font-medium text-red-600">-{formatNumber(stats.totalExpenses)}</span>
              </div>
              <div className="border-t pt-1.5 mt-1.5">
                <div className="flex justify-between items-center font-medium">
                  <span>{balance >= 0 ? 'Foyda' : 'Zarar'}:</span>
                  <span className={balance >= 0 ? 'text-blue-600' : 'text-orange-600'}>
                    {formatNumber(Math.abs(balance))}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts - 2 Column Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        <AttendanceChart data={attendanceData} />
        <PaymentChart data={paymentChartData} />
      </div>

      {/* Grade Distribution - Full Width */}
      <GradeDistributionChart data={gradeDistribution} />

      {/* Recent Activity - 2 Columns */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Recent Students */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Yangi O'quvchilar</CardTitle>
              <Link href="/admin/students">
                <Button variant="ghost" size="sm" className="text-xs">
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
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-sm">
                        {student.user?.fullName || 'Noma\'lum'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {student.class?.name || 'Sinfsiz'} • {student.studentCode}
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      student.status === 'ACTIVE' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {student.status}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-center text-sm text-muted-foreground py-8">
                  Hozircha o'quvchilar yo'q
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Payments */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>So'nggi To'lovlar</CardTitle>
              <Link href="/admin/payments">
                <Button variant="ghost" size="sm" className="text-xs">
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
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-sm">
                        {payment.student.user?.fullName || 'Noma\'lum'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {payment.paidDate ? new Date(payment.paidDate).toLocaleDateString('uz-UZ') : 'N/A'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-sm text-green-600">
                        +{formatNumber(Number(payment.amount))}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {payment.paymentMethod as string}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-sm text-muted-foreground py-8">
                  Hozircha to'lovlar yo'q
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Tezkor Amallar</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-4">
            <Link href="/admin/students/create">
              <Button variant="outline" className="w-full justify-start">
                <Users className="mr-2 h-4 w-4" />
                Yangi o'quvchi
              </Button>
            </Link>
            <Link href="/admin/payments/create">
              <Button variant="outline" className="w-full justify-start">
                <DollarSign className="mr-2 h-4 w-4" />
                To'lov qabul qilish
              </Button>
            </Link>
            <Link href="/admin/attendance">
              <Button variant="outline" className="w-full justify-start">
                <Calendar className="mr-2 h-4 w-4" />
                Davomat belgilash
              </Button>
            </Link>
            <Link href="/admin/reports">
              <Button variant="outline" className="w-full justify-start">
                <BookOpen className="mr-2 h-4 w-4" />
                Hisobotlar
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
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
    presentToday,
    completedPayments,
    pendingPayments,
    overduePayments,
    income,
    generalExpenses,
    kitchenExpenses,
    // ✅ Kategoriyalar bo'yicha xarajatlar
    expensesByCategory,
    kitchenExpensesByCategory
  ] = await Promise.all([
    db.student.count({ where: { tenantId } }),
    db.student.count({ where: { tenantId, status: 'ACTIVE' } }),
    db.student.count({ where: { tenantId, trialEnabled: true, status: 'ACTIVE' } }),
    db.teacher.count({ where: { tenantId } }),
    db.class.count({ where: { tenantId, academicYear } }),
    db.subject.count({ where: { tenantId } }),
    db.attendance.count({
      where: { tenantId, date: today, status: 'PRESENT' }
    }),
    db.payment.count({
      where: {
        tenantId,
        status: 'COMPLETED',
        paidDate: { gte: thisMonthStart }
      }
    }),
    db.payment.count({
      where: {
        tenantId,
        status: 'PENDING',
        dueDate: { gte: thisMonthStart }
      }
    }),
    db.payment.count({
      where: {
        tenantId,
        status: 'PENDING',
        dueDate: { lt: today }
      }
    }),
    db.payment.aggregate({
      where: {
        tenantId,
        status: 'COMPLETED',
        paidDate: { gte: thisMonthStart }
      },
      _sum: { amount: true }
    }),
    db.expense.aggregate({
      where: {
        tenantId,
        date: { gte: thisMonthStart }
      },
      _sum: { amount: true }
    }),
    db.kitchenExpense.aggregate({
      where: {
        tenantId,
        date: { gte: thisMonthStart }
      },
      _sum: { amount: true }
    }),
    // ✅ Umumiy xarajat kategoriyalari
    db.expense.groupBy({
      by: ['categoryId'],
      where: {
        tenantId,
        date: { gte: thisMonthStart }
      },
      _sum: { amount: true }
    }),
    // ✅ Oshxona xarajat kategoriyalari
    db.kitchenExpense.groupBy({
      by: ['categoryId'],
      where: {
        tenantId,
        date: { gte: thisMonthStart }
      },
      _sum: { amount: true }
    })
  ])

  // ✅ Kategoriya nomlarini olish
  const [expenseCategories, kitchenCategories] = await Promise.all([
    db.expenseCategory.findMany({
      where: { tenantId },
      select: { id: true, name: true, color: true }
    }),
    db.kitchenExpenseCategory.findMany({
      where: { tenantId },
      select: { id: true, name: true, color: true }
    })
  ])

  // ✅ Kategoriyalar bilan birlashtirish
  const generalExpenseBreakdown = expensesByCategory.map(exp => {
    const cat = expenseCategories.find(c => c.id === exp.categoryId)
    return {
      name: cat?.name || 'Boshqa',
      amount: Number(exp._sum.amount || 0),
      color: cat?.color || '#ef4444'
    }
  })

  const kitchenExpenseBreakdown = kitchenExpensesByCategory.map(exp => {
    const cat = kitchenCategories.find(c => c.id === exp.categoryId)
    return {
      name: `🍳 ${cat?.name || 'Boshqa'}`,
      amount: Number(exp._sum.amount || 0),
      color: cat?.color || '#f97316'
    }
  })

  // ✅ Barcha xarajatlarni birlashtirish
  const allExpenses = [
    ...generalExpenseBreakdown,
    ...kitchenExpenseBreakdown
  ].sort((a, b) => b.amount - a.amount)

  return {
    totalStudents,
    activeStudents,
    trialStudents,
    totalTeachers,
    totalClasses,
    totalSubjects,
    presentToday,
    completedPayments,
    pendingPayments,
    overduePayments,
    income: Number(income._sum.amount || 0),
    generalExpenses: Number(generalExpenses._sum.amount || 0),
    kitchenExpenses: Number(kitchenExpenses._sum.amount || 0),
    totalExpenses: Number(generalExpenses._sum.amount || 0) + Number(kitchenExpenses._sum.amount || 0),
    expenseCategories: allExpenses // ✅ Kategoriyalar breakdown
  }
}

async function getAttendanceData(tenantId: string, days: number) {
  const dateRange = Array.from({ length: days }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (days - 1 - i))
    d.setHours(0, 0, 0, 0)
    return d
  })

  const data = await Promise.all(
    dateRange.map(async (date) => {
      const attendance = await db.attendance.findMany({
        where: { tenantId, date }
      })

      const present = attendance.filter(a => a.status === 'PRESENT').length
      const absent = attendance.filter(a => a.status === 'ABSENT').length
      const late = attendance.filter(a => a.status === 'LATE').length

      return {
        date: date.toLocaleDateString('uz-UZ', { day: '2-digit', month: '2-digit' }),
        present,
        absent,
        late,
        rate: attendance.length > 0 ? (present / attendance.length) * 100 : 0
      }
    })
  )

  return data
}

async function getGradeDistribution(tenantId: string) {
  const grades = await db.grade.findMany({
    where: { tenantId },
    take: 100,
    select: {
      score: true,
      maxScore: true
    }
  })

  const ranges = [
    { range: '0-39% (F)', min: 0, max: 39 },
    { range: '40-69% (D-C)', min: 40, max: 69 },
    { range: '70-89% (B)', min: 70, max: 89 },
    { range: '90-100% (A)', min: 90, max: 100 }
  ]

  return ranges.map(({ range, min, max }) => {
    const count = grades.filter(g => {
      const percentage = (Number(g.score) / Number(g.maxScore)) * 100
      return percentage >= min && percentage <= max
    }).length

    return {
      range,
      count,
      percentage: grades.length > 0 ? (count / grades.length) * 100 : 0
    }
  })
}

async function getPaymentChartData(tenantId: string) {
  const stats = await db.payment.groupBy({
    by: ['status'],
    where: { tenantId },
    _sum: { amount: true },
    _count: true
  })

  const data = stats.map(stat => ({
    name: stat.status === 'COMPLETED' ? 'To\'langan' :
          stat.status === 'PENDING' ? 'Kutilmoqda' :
          stat.status === 'FAILED' ? 'Muvaffaqiyatsiz' : 'Qaytarilgan',
    value: Number(stat._sum.amount || 0),
    percentage: 0
  }))

  const total = data.reduce((sum, p) => sum + p.value, 0)
  data.forEach(p => {
    p.percentage = total > 0 ? (p.value / total) * 100 : 0
  })

  return data
}
