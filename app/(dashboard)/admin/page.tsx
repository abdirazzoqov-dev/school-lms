import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { 
  Users, GraduationCap, BookOpen, DollarSign, TrendingUp, TrendingDown,
  AlertCircle, Calendar, ArrowUpRight, ArrowDownRight, CheckCircle2, 
  Clock, XCircle, Activity, Target, Award, Sparkles, Bell, ChevronRight
} from 'lucide-react'
import { getCurrentAcademicYear, formatNumber } from '@/lib/utils'
import Link from 'next/link'
import { AttendanceChart } from '@/components/charts/attendance-chart'
import { GradeDistributionChart } from '@/components/charts/grade-distribution-chart'
import { PaymentChart } from '@/components/charts/payment-chart'
import { Button } from '@/components/ui/button'
import { PAGE_CACHE_CONFIG } from '@/lib/cache-config'
import { Progress } from '@/components/ui/progress'
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
    presentToday: 0,
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

      // Recent payments (top 5) - includes partial payments
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
      }),

      // Attendance data (last 7 days)
      getAttendanceData(tenantId, 7),

      // Grade distribution
      getGradeDistribution(tenantId),

      // Payment chart data
      getPaymentChartData(tenantId)
    ])

    if (results) {
      stats = results[0] || stats
      recentStudents = results[1] || []
      recentPayments = results[2] || []
      attendanceData = results[3] || []
      gradeDistribution = results[4] || []
      paymentChartData = results[5] || []
    }
  } catch (error) {
    // Log error in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error fetching dashboard data:', error)
    }
    // In production, continue with default values (already set above)
    // This prevents the page from crashing
  }

  const balance = (stats?.income || 0) - (stats?.totalExpenses || 0)
  const attendanceRate = (stats?.totalStudents || 0) > 0 
    ? ((stats?.presentToday || 0) / stats.totalStudents) * 100 
    : 0

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Enhanced Header with Welcome Message */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Dashboard
            </h1>
            <Sparkles className="h-5 w-5 text-yellow-500 animate-pulse" />
          </div>
          <p className="text-muted-foreground text-sm md:text-base flex items-center gap-2">
            <span className="font-medium text-foreground">Salom, {session.user.fullName}!</span>
            <span className="text-xs bg-gradient-to-r from-blue-500 to-purple-500 text-white px-2 py-0.5 rounded-full">
              {session.user.tenant?.name}
            </span>
          </p>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {new Date().toLocaleDateString('uz-UZ', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
            <CardContent className="p-3">
              <p className="text-xs text-muted-foreground mb-1">O'quv yili</p>
              <p className="text-lg font-bold text-blue-600">{academicYear}</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Enhanced Alerts with Bell Icon */}
      {session.user.tenant?.status === 'GRACE_PERIOD' && (
        <Card className="border-l-4 border-l-orange-500 bg-gradient-to-r from-orange-50 to-red-50 shadow-md">
          <CardContent className="flex items-center gap-3 pt-6">
            <div className="p-2 bg-orange-100 rounded-full">
              <Bell className="h-5 w-5 text-orange-600 animate-bounce" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-orange-800">
                ⚠️ Obuna muddati tugadi!
              </p>
              <p className="text-xs text-orange-700">
                7 kun ichida to'lov qiling, aks holda hizmatlar to'xtatiladi.
              </p>
            </div>
            <Button size="sm" className="bg-orange-600 hover:bg-orange-700">
              To'lash
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Enhanced Main Stats - 3 Cards (First Row) */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {/* Students - Enhanced Design */}
        <Link href="/admin/students">
          <Card className="group hover:shadow-xl transition-all duration-300 border-l-4 border-l-blue-500 hover:-translate-y-1 cursor-pointer bg-gradient-to-br from-white to-blue-50">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
                O'quvchilar
              </CardTitle>
              <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-md group-hover:scale-110 transition-transform">
                <Users className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <div className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                  {stats.totalStudents}
                </div>
                <Badge variant="secondary" className="bg-blue-100 text-blue-700 text-xs">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  Jami
                </Badge>
              </div>
              <div className="flex flex-wrap items-center gap-2 mt-3 text-xs">
                <span className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full font-medium">
                  <CheckCircle2 className="h-3 w-3" />
                  {stats.activeStudents} faol
                </span>
                {stats.trialStudents > 0 && (
                  <span className="flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-700 rounded-full font-medium">
                    <Clock className="h-3 w-3" />
                    {stats.trialStudents} sinov
                  </span>
                )}
              </div>
              <div className="mt-3 text-xs text-blue-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                Batafsil <ChevronRight className="h-3 w-3" />
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Teachers & Classes - Enhanced */}
        <Link href="/admin/teachers">
          <Card className="group hover:shadow-xl transition-all duration-300 border-l-4 border-l-purple-500 hover:-translate-y-1 cursor-pointer bg-gradient-to-br from-white to-purple-50">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
                Xodimlar
              </CardTitle>
              <div className="p-2 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-md group-hover:scale-110 transition-transform">
                <GraduationCap className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <div className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-purple-600 to-purple-800 bg-clip-text text-transparent">
                  {stats.totalTeachers}
                </div>
                <Badge variant="secondary" className="bg-purple-100 text-purple-700 text-xs">
                  <Award className="h-3 w-3 mr-1" />
                  Ustoz
                </Badge>
              </div>
              <div className="flex items-center gap-3 mt-3 text-xs">
                <span className="flex items-center gap-1 px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full font-medium">
                  <BookOpen className="h-3 w-3" />
                  {stats.totalClasses} sinf
                </span>
                <span className="flex items-center gap-1 px-2 py-1 bg-violet-100 text-violet-700 rounded-full font-medium">
                  <Target className="h-3 w-3" />
                  {stats.totalSubjects} fan
                </span>
              </div>
              <div className="mt-3 text-xs text-purple-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                Batafsil <ChevronRight className="h-3 w-3" />
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Today's Attendance - Enhanced */}
        <Link href="/admin/attendance">
          <Card className="group hover:shadow-xl transition-all duration-300 border-l-4 border-l-green-500 hover:-translate-y-1 cursor-pointer bg-gradient-to-br from-white to-green-50">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
                Bugungi Davomat
              </CardTitle>
              <div className="p-2 bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-md group-hover:scale-110 transition-transform">
                <Activity className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <div className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-green-600 to-green-800 bg-clip-text text-transparent">
                  {stats.presentToday}
                </div>
                <Badge 
                  variant="secondary" 
                  className={`text-xs ${
                    attendanceRate >= 90 ? 'bg-green-100 text-green-700' : 
                    attendanceRate >= 75 ? 'bg-yellow-100 text-yellow-700' : 
                    'bg-red-100 text-red-700'
                  }`}
                >
                  {attendanceRate.toFixed(0)}%
                </Badge>
              </div>
              <div className="mt-3 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground font-medium">Davomat darajasi</span>
                  <span className="font-bold text-green-600">{attendanceRate.toFixed(1)}%</span>
                </div>
                <Progress 
                  value={attendanceRate} 
                  className="h-2 bg-green-100" 
                />
              </div>
              <div className="mt-3 text-xs text-green-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                Batafsil <ChevronRight className="h-3 w-3" />
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Payment Stats - 2 Cards (Second Row) */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">

        {/* Payments - To'langan (Completed) */}
        <Link href="/admin/payments?status=COMPLETED">
          <Card className="group hover:shadow-xl transition-all duration-300 border-l-4 border-l-green-500 hover:-translate-y-1 cursor-pointer bg-gradient-to-br from-white to-green-50">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
                To'langan
              </CardTitle>
              <div className="p-2 bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-md group-hover:scale-110 transition-transform">
                <CheckCircle2 className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2 mb-2">
                <div className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-green-600 to-green-800 bg-clip-text text-transparent">
                  {stats.completedPayments}
                </div>
                <Badge variant="secondary" className="bg-green-100 text-green-700 text-xs">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  Soni
                </Badge>
              </div>
              <div className="mt-3 pt-3 border-t border-green-100">
                <p className="text-xs text-muted-foreground mb-1">Jami summa:</p>
                <p className="text-lg font-bold text-green-600">
                  +{formatNumber(stats.completedPaymentsAmount || 0)}
                </p>
              </div>
              <div className="mt-3 text-xs text-green-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                Batafsil <ChevronRight className="h-3 w-3" />
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Payments - Kutilmoqda (Pending) */}
        <Link href="/admin/payments?status=PENDING">
          <Card className="group hover:shadow-xl transition-all duration-300 border-l-4 border-l-orange-500 hover:-translate-y-1 cursor-pointer bg-gradient-to-br from-white to-orange-50">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
                Kutilmoqda
              </CardTitle>
              <div className="p-2 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-md group-hover:scale-110 transition-transform">
                <Clock className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2 mb-2">
                <div className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-orange-600 to-orange-800 bg-clip-text text-transparent">
                  {stats.pendingPayments}
                </div>
                <Badge variant="secondary" className="bg-orange-100 text-orange-700 text-xs">
                  <Clock className="h-3 w-3 mr-1" />
                  Soni
                </Badge>
              </div>
              <div className="mt-3 pt-3 border-t border-orange-100">
                <p className="text-xs text-muted-foreground mb-1">Kutilayotgan summa:</p>
                <p className="text-lg font-bold text-orange-600">
                  {formatNumber(stats.pendingPaymentsAmount || 0)}
                </p>
              </div>
              {stats.overduePayments > 0 && (
                <div className="mt-2 text-xs">
                  <Badge variant="secondary" className="bg-red-100 text-red-700">
                    <XCircle className="h-3 w-3 mr-1" />
                    {stats.overduePayments} kechikkan
                  </Badge>
                </div>
              )}
              <div className="mt-3 text-xs text-orange-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                Batafsil <ChevronRight className="h-3 w-3" />
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Financial Overview - 3 Cards */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-3">
        {/* Income - Client Component with Modal */}
        <DashboardIncomeCard
          income={stats.income}
          cashIncome={stats.cashIncome || 0}
          cardIncome={stats.cardIncome || 0}
          completedPayments={stats.completedPayments}
          paymentMethods={stats.paymentMethods || []}
        />

        {/* Expenses - Client Component with Modal */}
        <DashboardExpenseCard
          totalExpenses={stats.totalExpenses}
          expenseCash={stats.expenseCash || 0}
          expenseCard={stats.expenseCard || 0}
          expensePaymentMethods={stats.expensePaymentMethods || []}
          expenseCategories={stats.expenseCategories || []}
        />

        {/* Balance - Client Component with Modal */}
        <DashboardBalanceCard
          balance={balance}
          cashIncome={stats.cashIncome || 0}
          cashExpense={stats.expenseCash || 0}
          cardIncome={stats.cardIncome || 0}
          cardExpense={stats.expenseCard || 0}
        />
      </div>

      {/* Quick Actions & Insights */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        <Card className="group hover:shadow-lg transition-all cursor-pointer bg-gradient-to-br from-blue-50 to-white border-blue-100">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-500 rounded-xl shadow-md group-hover:scale-110 transition-transform">
                <Users className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">To'lov kutilmoqda</p>
                <p className="text-xl font-bold text-blue-600">{stats.pendingPayments}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-lg transition-all cursor-pointer bg-gradient-to-br from-red-50 to-white border-red-100">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-red-500 rounded-xl shadow-md group-hover:scale-110 transition-transform">
                <AlertCircle className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Kechikkan to'lovlar</p>
                <p className="text-xl font-bold text-red-600">{stats.overduePayments}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-lg transition-all cursor-pointer bg-gradient-to-br from-purple-50 to-white border-purple-100">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-500 rounded-xl shadow-md group-hover:scale-110 transition-transform">
                <BookOpen className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Sinflar</p>
                <p className="text-xl font-bold text-purple-600">{stats.totalClasses}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-lg transition-all cursor-pointer bg-gradient-to-br from-green-50 to-white border-green-100">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-500 rounded-xl shadow-md group-hover:scale-110 transition-transform">
                <Target className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Fanlar</p>
                <p className="text-xl font-bold text-green-600">{stats.totalSubjects}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts - 2 Column Grid */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 lg:grid-cols-2">
        <AttendanceChart data={attendanceData} />
        <PaymentChart data={paymentChartData} />
      </div>

      {/* Grade Distribution - Full Width */}
      <GradeDistributionChart data={gradeDistribution} />

      {/* Enhanced Recent Activity - 2 Columns */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 lg:grid-cols-2">
        {/* Recent Students - Enhanced */}
        <Card className="border-t-4 border-t-blue-500">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-transparent">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-base sm:text-lg">Yangi O'quvchilar</CardTitle>
                  <p className="text-xs text-muted-foreground">So'nggi 5 ta qo'shilgan</p>
                </div>
              </div>
              <Link href="/admin/students">
                <Button variant="outline" size="sm" className="text-xs hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 transition-colors">
                  Barchasi 
                  <ArrowUpRight className="ml-1 h-3 w-3" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            <div className="space-y-3">
              {recentStudents.length > 0 ? (
                recentStudents.map((student: any, index: number) => (
                  <div
                    key={student.id}
                    className="group flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50/50 transition-all duration-200 cursor-pointer hover:shadow-md"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold shadow-md">
                        {student.user?.fullName?.charAt(0) || '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                          {student.user?.fullName || 'Noma\'lum'}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <BookOpen className="h-3 w-3" />
                            {student.class?.name || 'Sinfsiz'}
                          </p>
                          <span className="text-xs text-gray-400">•</span>
                          <p className="text-xs text-blue-600 font-mono">
                            {student.studentCode}
                          </p>
                        </div>
                      </div>
                    </div>
                    <Badge 
                      variant="secondary" 
                      className={`text-xs font-medium ${
                        student.status === 'ACTIVE' 
                          ? 'bg-green-100 text-green-700 border-green-200' 
                          : 'bg-gray-100 text-gray-700 border-gray-200'
                      }`}
                    >
                      {student.status === 'ACTIVE' ? '✓ Faol' : student.status}
                    </Badge>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">
                    Hozircha o'quvchilar yo'q
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Payments - Enhanced */}
        <Card className="border-t-4 border-t-green-500">
          <CardHeader className="bg-gradient-to-r from-green-50 to-transparent">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-green-100 rounded-lg">
                  <DollarSign className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <CardTitle className="text-base sm:text-lg">So'nggi To'lovlar</CardTitle>
                  <p className="text-xs text-muted-foreground">Oxirgi 5 ta tranzaksiya</p>
                </div>
              </div>
              <Link href="/admin/payments">
                <Button variant="outline" size="sm" className="text-xs hover:bg-green-50 hover:text-green-600 hover:border-green-300 transition-colors">
                  Barchasi 
                  <ArrowUpRight className="ml-1 h-3 w-3" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            <div className="space-y-3">
              {recentPayments.length > 0 ? (
                recentPayments.map((payment: any) => (
                  <div
                    key={payment.id}
                    className="group flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:border-green-200 hover:bg-green-50/50 transition-all duration-200 cursor-pointer hover:shadow-md"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white shadow-md">
                        <DollarSign className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-gray-900 truncate group-hover:text-green-600 transition-colors">
                          {payment.student?.user?.fullName || 'Noma\'lum'}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {payment.paidDate ? new Date(payment.paidDate).toLocaleDateString('uz-UZ') : 'N/A'}
                          </p>
                          <span className="text-xs text-gray-400">•</span>
                          <Badge variant="outline" className="text-xs">
                            {payment.paymentMethod as string}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-sm text-green-600 flex items-center gap-1">
                        <TrendingUp className="h-4 w-4" />
                        +{formatNumber(Number(payment.paidAmount))}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        so'm
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <DollarSign className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">
                    Hozircha to'lovlar yo'q
                  </p>
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
    presentToday,
    completedPayments,
    pendingPayments,
    overduePayments,
    income,
    generalExpenses,
    kitchenExpenses,
    // ✅ To'lovlar summalari
    completedPaymentsAmount,
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
        paidAmount: { gt: 0 },
        paidDate: { gte: thisMonthStart }
      },
      _sum: { paidAmount: true }
    }),
    // ✅ To'langan to'lovlar summasi
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

  // ✅ PENDING to'lovlarning qolgan summasini hisoblash uchun findMany (alohida)
  const pendingPaymentsList = await db.payment.findMany({
    where: {
      tenantId,
      status: 'PENDING'
    },
    select: {
      amount: true,
      paidAmount: true
    }
  })
  
  // ✅ To'lov usuli bo'yicha analitika - Payment orqali filter
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

  // ✅ Xarajatlar bo'yicha to'lov usullari analitikasi
  const [expensesByPaymentMethod, kitchenExpensesByPaymentMethod] = await Promise.all([
    db.expense.groupBy({
      by: ['paymentMethod'],
      where: {
        tenantId,
        date: { gte: thisMonthStart }
      },
      _sum: { amount: true }
    }),
    db.kitchenExpense.groupBy({
      by: ['paymentMethod'],
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

  // ✅ Faqat jami xarajatlar kategoriyalari (Xarajatlar sahifasiga mos)
  const allExpenses = generalExpenseBreakdown.sort((a, b) => b.amount - a.amount)

  // ✅ To'lov usullari breakdown'ni formatlash
  const paymentMethodsBreakdown = paymentTransactionsByMethod.map(pm => ({
    method: pm.paymentMethod,
    amount: Number(pm._sum.amount || 0)
  }))

  // ✅ Naqd va plastik bo'yicha guruhlash (KIRIM)
  const cashAmount = paymentMethodsBreakdown
    .filter(pm => pm.method === 'CASH')
    .reduce((sum, pm) => sum + pm.amount, 0)
  
  // CLICK = Plastik karta (terminal orqali)
  const cardAmount = paymentMethodsBreakdown
    .filter(pm => pm.method === 'CLICK')
    .reduce((sum, pm) => sum + pm.amount, 0)

  // ✅ Faqat jami xarajatlar to'lov usullari breakdown (Xarajatlar sahifasiga mos)
  const allExpensesByMethod = expensesByPaymentMethod.map(e => ({ 
    method: e.paymentMethod, 
    amount: Number(e._sum.amount || 0) 
  }))
  
  // ✅ Naqd va plastik bo'yicha guruhlash (FAQAT JAMI XARAJAT)
  const expenseCashAmount = allExpensesByMethod
    .filter(pm => pm.method === 'CASH')
    .reduce((sum, pm) => sum + pm.amount, 0)
  
  const expenseCardAmount = allExpensesByMethod
    .filter(pm => pm.method === 'CLICK')
    .reduce((sum, pm) => sum + pm.amount, 0)

  // ✅ Kutilayotgan to'lovlar summasi - manual calculation
  const pendingPaymentsAmount = pendingPaymentsList.reduce((sum, p) => {
    const remaining = Number(p.amount) - Number(p.paidAmount || 0)
    return sum + remaining
  }, 0)

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
    income: Number(income._sum.paidAmount || 0),
    // ✅ To'lovlar summalari
    completedPaymentsAmount: Number(completedPaymentsAmount._sum.amount || 0),
    pendingPaymentsAmount: pendingPaymentsAmount, // ✅ Calculated qolgan summa
    generalExpenses: Number(generalExpenses._sum.amount || 0),
    kitchenExpenses: Number(kitchenExpenses._sum.amount || 0),
    totalExpenses: Number(generalExpenses._sum.amount || 0), // ✅ Faqat jami xarajatlar (Xarajatlar sahifasiga mos)
    expenseCategories: allExpenses, // ✅ Kategoriyalar breakdown
    paymentMethods: paymentMethodsBreakdown, // ✅ Barcha to'lov usullari (kirim)
    cashIncome: cashAmount, // ✅ Naqd to'lovlar (kirim)
    cardIncome: cardAmount, // ✅ Plastik to'lovlar (kirim)
    expensePaymentMethods: allExpensesByMethod, // ✅ Xarajat to'lov usullari
    expenseCash: expenseCashAmount, // ✅ Naqd xarajatlar
    expenseCard: expenseCardAmount // ✅ Plastik xarajatlar
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
    _sum: { paidAmount: true },
    _count: true
  })

  const data = stats.map(stat => ({
    name: stat.status === 'COMPLETED' ? 'To\'langan' :
          stat.status === 'PENDING' ? 'Kutilmoqda' :
          stat.status === 'FAILED' ? 'Muvaffaqiyatsiz' : 'Qaytarilgan',
    value: Number(stat._sum.paidAmount || 0),
    percentage: 0
  }))

  const total = data.reduce((sum, p) => sum + p.value, 0)
  data.forEach(p => {
    p.percentage = total > 0 ? (p.value / total) * 100 : 0
  })

  return data
}
