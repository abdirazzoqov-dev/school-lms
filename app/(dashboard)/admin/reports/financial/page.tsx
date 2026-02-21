import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DollarSign, Download, ArrowLeft, TrendingUp, TrendingDown, Wallet, CreditCard
} from 'lucide-react'
import Link from 'next/link'
import { formatNumber } from '@/lib/utils'

export const revalidate = 0
export const dynamic = 'force-dynamic'

export default async function FinancialReportPage({
  searchParams
}: {
  searchParams: { month?: string; year?: string }
}) {
  const session = await getServerSession(authOptions)

  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'MODERATOR')) {
    redirect('/unauthorized')
  }

  const tenantId = session.user.tenantId!
  
  const currentDate = new Date()
  const selectedMonth = searchParams.month ? parseInt(searchParams.month) : currentDate.getMonth() + 1
  const selectedYear = searchParams.year ? parseInt(searchParams.year) : currentDate.getFullYear()

  // Date range for selected month
  const startDate = new Date(selectedYear, selectedMonth - 1, 1)
  const endDate = new Date(selectedYear, selectedMonth, 0, 23, 59, 59)

  // Get payments
  const payments = await db.payment.findMany({
    where: {
      tenantId,
      paidDate: {
        gte: startDate,
        lte: endDate
      }
    },
    include: {
      student: {
        include: {
          user: {
            select: {
              fullName: true
            }
          }
        }
      }
    }
  })

  // Get expenses
  const expenses = await db.expense.findMany({
    where: {
      tenantId,
      date: {
        gte: startDate,
        lte: endDate
      }
    },
    include: {
      category: {
        select: {
          name: true
        }
      }
    }
  })

  // Get salary payments
  const salaries = await db.salaryPayment.findMany({
    where: {
      tenantId,
      paymentDate: {
        gte: startDate,
        lte: endDate
      },
      status: 'PAID'
    }
  })

  // Calculate statistics
  const totalIncome = payments.reduce((sum, p) => sum + Number(p.paidAmount || 0), 0)
  const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0)
  const totalSalaries = salaries.reduce((sum, s) => sum + Number(s.paidAmount), 0)
  const netProfit = totalIncome - totalExpenses - totalSalaries

  // Payment by type
  const tuitionIncome = payments.filter(p => p.paymentType === 'TUITION').reduce((sum, p) => sum + Number(p.paidAmount || 0), 0)
  const booksIncome = payments.filter(p => p.paymentType === 'BOOKS').reduce((sum, p) => sum + Number(p.paidAmount || 0), 0)
  const uniformIncome = payments.filter(p => p.paymentType === 'UNIFORM').reduce((sum, p) => sum + Number(p.paidAmount || 0), 0)
  const otherIncome = payments.filter(p => p.paymentType === 'OTHER').reduce((sum, p) => sum + Number(p.paidAmount || 0), 0)

  // Expense by category
  const expenseByCategory = new Map<string, number>()
  expenses.forEach(expense => {
    const category = expense.category.name
    const current = expenseByCategory.get(category) || 0
    expenseByCategory.set(category, current + Number(expense.amount))
  })

  const categoryStats = Array.from(expenseByCategory.entries()).map(([name, amount]) => ({
    name,
    amount
  })).sort((a, b) => b.amount - a.amount)

  const monthNames = [
    'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun',
    'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'
  ]

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/reports">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">Moliyaviy Hisobot</h1>
          <p className="text-muted-foreground">
            {monthNames[selectedMonth - 1]} {selectedYear} - To'lovlar va xarajatlar statistikasi
          </p>
        </div>
        <Button asChild className="bg-orange-600 hover:bg-orange-700">
          <Link href={`/api/admin/reports/financial/export?month=${selectedMonth}&year=${selectedYear}`}>
            <Download className="mr-2 h-4 w-4" />
            Excel
          </Link>
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-green-100">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Jami Kirim</p>
                <p className="text-2xl font-bold text-green-600">{formatNumber(totalIncome)}</p>
                <p className="text-xs text-muted-foreground mt-1">so'm</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-red-200 bg-gradient-to-br from-red-50 to-red-100">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Xarajatlar</p>
                <p className="text-2xl font-bold text-red-600">{formatNumber(totalExpenses)}</p>
                <p className="text-xs text-muted-foreground mt-1">so'm</p>
              </div>
              <div className="p-3 bg-red-100 rounded-full">
                <TrendingDown className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Maoshlar</p>
                <p className="text-2xl font-bold text-purple-600">{formatNumber(totalSalaries)}</p>
                <p className="text-xs text-muted-foreground mt-1">so'm</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <Wallet className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={`border-2 ${netProfit >= 0 ? 'border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100' : 'border-orange-200 bg-gradient-to-br from-orange-50 to-orange-100'}`}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Sof Foyda</p>
                <p className={`text-2xl font-bold ${netProfit >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                  {formatNumber(netProfit)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">so'm</p>
              </div>
              <div className={`p-3 rounded-full ${netProfit >= 0 ? 'bg-blue-100' : 'bg-orange-100'}`}>
                <DollarSign className={`h-6 w-6 ${netProfit >= 0 ? 'text-blue-600' : 'text-orange-600'}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Income Breakdown */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Kirim bo'yicha taqsimot</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-medium">O'qish haqi</span>
                <div className="flex items-center gap-2">
                  <Badge>{formatNumber(tuitionIncome)} so'm</Badge>
                  <Badge variant="outline">{totalIncome > 0 ? ((tuitionIncome/totalIncome)*100).toFixed(0) : 0}%</Badge>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium">Darsliklar</span>
                <div className="flex items-center gap-2">
                  <Badge>{formatNumber(booksIncome)} so'm</Badge>
                  <Badge variant="outline">{totalIncome > 0 ? ((booksIncome/totalIncome)*100).toFixed(0) : 0}%</Badge>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium">Forma</span>
                <div className="flex items-center gap-2">
                  <Badge>{formatNumber(uniformIncome)} so'm</Badge>
                  <Badge variant="outline">{totalIncome > 0 ? ((uniformIncome/totalIncome)*100).toFixed(0) : 0}%</Badge>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium">Boshqa</span>
                <div className="flex items-center gap-2">
                  <Badge>{formatNumber(otherIncome)} so'm</Badge>
                  <Badge variant="outline">{totalIncome > 0 ? ((otherIncome/totalIncome)*100).toFixed(0) : 0}%</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Xarajatlar kategoriyasi</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {categoryStats.map(stat => (
                <div key={stat.name} className="flex items-center justify-between">
                  <span className="font-medium">{stat.name}</span>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-red-600">{formatNumber(stat.amount)} so'm</Badge>
                    <Badge variant="outline">{totalExpenses > 0 ? ((stat.amount/totalExpenses)*100).toFixed(0) : 0}%</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment Details */}
      <Card>
        <CardHeader>
          <CardTitle>To'lovlar ({payments.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {payments.slice(0, 10).map(payment => (
              <div key={payment.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">{payment.student.user?.fullName || 'N/A'}</p>
                  <p className="text-sm text-muted-foreground">
                    {payment.paymentType === 'TUITION' ? 'O\'qish haqi' :
                     payment.paymentType === 'BOOKS' ? 'Darsliklar' :
                     payment.paymentType === 'UNIFORM' ? 'Forma' : 'Boshqa'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-green-600">{formatNumber(Number(payment.paidAmount || 0))} so'm</p>
                  <p className="text-xs text-muted-foreground">
                    {payment.paidDate ? new Date(payment.paidDate).toLocaleDateString('uz-UZ') : 'N/A'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
