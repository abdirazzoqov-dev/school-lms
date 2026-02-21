import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  DollarSign, 
  Plus, 
  ArrowLeft,
  TrendingDown,
  Calendar,
  ShoppingCart
} from 'lucide-react'
import Link from 'next/link'
import { PermissionGate } from '@/components/admin/permission-gate'
import { formatNumber } from '@/lib/utils'
import { ExpensesTable } from './expenses-table'

export const revalidate = 60
export const dynamic = 'auto' // Optimized for better caching

export default async function KitchenExpensesPage() {
  const session = await getServerSession(authOptions)

  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'MODERATOR')) {
    redirect('/unauthorized')
  }

  const tenantId = session.user.tenantId!

  // Get all expenses
  const expenses = await db.kitchenExpense.findMany({
    where: { tenantId },
    include: {
      category: true,
      createdBy: {
        include: {
          user: {
            select: { fullName: true }
          }
        }
      }
    },
    orderBy: { date: 'desc' }
  })

  // Get categories for filter
  const categories = await db.kitchenExpenseCategory.findMany({
    where: { tenantId, isActive: true },
    orderBy: { name: 'asc' }
  })

  // Get statistics
  const thisMonthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  const today = new Date()
  today.setHours(23, 59, 59, 999)

  const [thisMonthTotal, todayTotal, thisMonthCount] = await Promise.all([
    db.kitchenExpense.aggregate({
      where: {
        tenantId,
        date: { gte: thisMonthStart, lte: today }
      },
      _sum: { amount: true }
    }),
    db.kitchenExpense.aggregate({
      where: {
        tenantId,
        date: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
          lte: today
        }
      },
      _sum: { amount: true }
    }),
    db.kitchenExpense.count({
      where: {
        tenantId,
        date: { gte: thisMonthStart, lte: today }
      }
    })
  ])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/kitchen">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <DollarSign className="h-8 w-8 text-green-500" />
              Oshxona Xarajatlari
            </h1>
            <p className="text-muted-foreground mt-1">
              Oshxona xarajatlarini boshqaring
            </p>
          </div>
        </div>
        <PermissionGate resource="kitchen" action="CREATE">
          <Link href="/admin/kitchen/expenses/create">
            <Button className="bg-green-500 hover:bg-green-600">
              <Plus className="mr-2 h-4 w-4" />
              Xarajat Kiritish
            </Button>
          </Link>
        </PermissionGate>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-200">
                <TrendingDown className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-red-700">
                  {formatNumber(thisMonthTotal._sum.amount?.toNumber() || 0)}
                </p>
                <p className="text-xs text-red-600">Bu oyda sarflangan</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-200">
                <Calendar className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-orange-700">
                  {formatNumber(todayTotal._sum.amount?.toNumber() || 0)}
                </p>
                <p className="text-xs text-orange-600">Bugun sarflangan</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-200">
                <ShoppingCart className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-700">{thisMonthCount}</p>
                <p className="text-xs text-blue-600">Bu oyda xaridlar</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Expenses Table */}
      <Card>
        <CardHeader>
          <CardTitle>Xarajatlar Ro'yxati</CardTitle>
        </CardHeader>
        <CardContent>
          <ExpensesTable expenses={expenses} categories={categories} />
        </CardContent>
      </Card>
    </div>
  )
}

