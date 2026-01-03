import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { DollarSign, Download, FileText, TrendingUp, CreditCard, Clock } from 'lucide-react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { RevenueChart } from '@/components/charts/revenue-chart'
import { formatCurrency } from '@/lib/utils'

// Cache for 5 minutes ⚡
export const revalidate = 300

export default async function FinancialReportPage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'ADMIN') {
    redirect('/unauthorized')
  }

  const tenantId = session.user.tenantId!

  // Get payments data
  const payments = await db.payment.findMany({
    where: { tenantId },
    include: {
      student: {
        include: {
          user: { select: { fullName: true } },
          class: { select: { name: true } }
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  // Statistics
  const totalRevenue = payments
    .filter(p => p.status === 'COMPLETED')
    .reduce((sum, p) => sum + Number(p.amount), 0)

  const pendingAmount = payments
    .filter(p => p.status === 'PENDING')
    .reduce((sum, p) => sum + Number(p.amount), 0)

  const overdueAmount = payments
    .filter(p => p.status === 'OVERDUE')
    .reduce((sum, p) => sum + Number(p.amount), 0)

  const completedCount = payments.filter(p => p.status === 'COMPLETED').length
  const pendingCount = payments.filter(p => p.status === 'PENDING').length
  const overdueCount = payments.filter(p => p.status === 'OVERDUE').length

  // By payment type
  const byType = payments.reduce((acc, payment) => {
    if (payment.status === 'COMPLETED') {
      if (!acc[payment.type]) {
        acc[payment.type] = 0
      }
      acc[payment.type] += Number(payment.amount)
    }
    return acc
  }, {} as Record<string, number>)

  // By month (last 6 months)
  const last6Months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date()
    d.setMonth(d.getMonth() - (5 - i))
    return d
  })

  const chartData = last6Months.map(date => {
    const monthPayments = payments.filter(p => {
      const pDate = new Date(p.createdAt)
      return pDate.getMonth() === date.getMonth() && 
             pDate.getFullYear() === date.getFullYear() &&
             p.status === 'COMPLETED'
    })

    return {
      month: date.toLocaleDateString('uz-UZ', { month: 'short' }),
      amount: monthPayments.reduce((sum, p) => sum + Number(p.amount), 0)
    }
  })

  const typeLabels: Record<string, string> = {
    TUITION: 'O\'quv to\'lovi',
    REGISTRATION: 'Ro\'yxatga olish',
    EXAM: 'Imtihon',
    LIBRARY: 'Kutubxona',
    TRANSPORT: 'Transport',
    OTHER: 'Boshqa'
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Moliyaviy Hisobot</h1>
          <p className="text-muted-foreground">
            To'liq moliyaviy statistika
          </p>
        </div>
        <Link href="/admin/reports">
          <Button variant="outline">
            <FileText className="h-4 w-4 mr-2" />
            Orqaga
          </Button>
        </Link>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
                <p className="text-sm text-muted-foreground">Jami tushum</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{formatCurrency(pendingAmount)}</div>
                <p className="text-sm text-muted-foreground">Kutilmoqda</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-red-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{formatCurrency(overdueAmount)}</div>
                <p className="text-sm text-muted-foreground">Muddati o'tgan</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <CreditCard className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{payments.length}</div>
                <p className="text-sm text-muted-foreground">Jami to'lovlar</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      <RevenueChart data={chartData} />

      {/* By Payment Type */}
      <Card>
        <CardHeader>
          <CardTitle>To'lov turlari bo'yicha</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(byType)
              .sort(([, a], [, b]) => b - a)
              .map(([type, amount]) => (
                <div key={type} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <DollarSign className="h-5 w-5 text-muted-foreground" />
                    <span className="font-medium">{typeLabels[type] || type}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold">{formatCurrency(amount)}</div>
                    <p className="text-sm text-muted-foreground">
                      {((amount / totalRevenue) * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* Status Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Holat bo'yicha taqsimot</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 border rounded-lg bg-green-50">
              <div className="text-2xl font-bold text-green-600 mb-1">
                {formatCurrency(totalRevenue)}
              </div>
              <p className="text-sm text-green-800 mb-2">To'langan</p>
              <Badge className="bg-green-600">{completedCount} ta</Badge>
            </div>
            <div className="p-4 border rounded-lg bg-yellow-50">
              <div className="text-2xl font-bold text-yellow-600 mb-1">
                {formatCurrency(pendingAmount)}
              </div>
              <p className="text-sm text-yellow-800 mb-2">Kutilmoqda</p>
              <Badge className="bg-yellow-600">{pendingCount} ta</Badge>
            </div>
            <div className="p-4 border rounded-lg bg-red-50">
              <div className="text-2xl font-bold text-red-600 mb-1">
                {formatCurrency(overdueAmount)}
              </div>
              <p className="text-sm text-red-800 mb-2">Muddati o'tgan</p>
              <Badge className="bg-red-600">{overdueCount} ta</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Eksport qilish</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Button>
              <Download className="h-4 w-4 mr-2" />
              PDF yuklab olish
            </Button>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Excel yuklab olish
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-3">
            Moliyaviy hisobotni PDF yoki Excel formatida yuklab oling
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

