import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  ChefHat, 
  DollarSign, 
  TrendingDown, 
  Plus,
  Calendar,
  ShoppingCart,
  ArrowRight
} from 'lucide-react'
import Link from 'next/link'
import { formatNumber } from '@/lib/utils'

export const revalidate = 60
export const dynamic = 'auto' // Optimized for better caching

export default async function CookDashboard() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'COOK') {
    redirect('/unauthorized')
  }

  const tenantId = session.user.tenantId!

  // Get cook record
  const cook = await db.cook.findFirst({
    where: { userId: session.user.id },
    include: {
      user: {
        select: { fullName: true }
      }
    }
  })

  if (!cook) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <ChefHat className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">Oshpaz ma'lumotlari topilmadi</h3>
          <p className="text-muted-foreground">Administrator bilan bog'laning</p>
        </div>
      </div>
    )
  }

  // Get statistics
  const thisMonthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  const today = new Date()
  today.setHours(23, 59, 59, 999)

  const [
    myTotalExpenses,
    myThisMonthExpenses,
    myTodayExpenses,
    recentExpenses,
    categories
  ] = await Promise.all([
    db.kitchenExpense.aggregate({
      where: {
        tenantId,
        createdById: cook.id
      },
      _sum: { amount: true },
      _count: true
    }),
    db.kitchenExpense.aggregate({
      where: {
        tenantId,
        createdById: cook.id,
        date: { gte: thisMonthStart, lte: today }
      },
      _sum: { amount: true },
      _count: true
    }),
    db.kitchenExpense.aggregate({
      where: {
        tenantId,
        createdById: cook.id,
        date: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
          lte: today
        }
      },
      _sum: { amount: true },
      _count: true
    }),
    db.kitchenExpense.findMany({
      where: {
        tenantId,
        createdById: cook.id
      },
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        category: true
      }
    }),
    db.kitchenExpenseCategory.findMany({
      where: { tenantId, isActive: true },
      orderBy: { name: 'asc' }
    })
  ])

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <ChefHat className="h-8 w-8 text-orange-500" />
            Salom, {cook.user.fullName}!
          </h1>
          <p className="text-muted-foreground mt-1">
            Oshxona xarajatlarini kiritish va kuzatish
          </p>
        </div>
        <Link href="/cook/expenses/create">
          <Button className="bg-orange-500 hover:bg-orange-600">
            <Plus className="mr-2 h-4 w-4" />
            Xarajat Kiritish
          </Button>
        </Link>
      </div>

      {/* Quick Action */}
      <Link href="/cook/expenses/create">
        <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700 transition-all cursor-pointer">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-white/20">
                  <Plus className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xl font-semibold">Yangi Xarajat Kiritish</p>
                  <p className="text-orange-100">Oshxona xarajatini tezda kiriting</p>
                </div>
              </div>
              <ArrowRight className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
      </Link>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-800">Jami Kiritganim</CardTitle>
            <ShoppingCart className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-700">
              {myTotalExpenses._count}
            </div>
            <p className="text-xs text-blue-600 mt-1">
              ta xarajat
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-red-800">Jami Summa</CardTitle>
            <TrendingDown className="h-5 w-5 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-red-700">
              {formatNumber(myTotalExpenses._sum.amount || 0)}
            </div>
            <p className="text-xs text-red-600 mt-1">
              so'm sarflangan
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-800">Bu Oy</CardTitle>
            <Calendar className="h-5 w-5 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-orange-700">
              {formatNumber(myThisMonthExpenses._sum.amount || 0)}
            </div>
            <p className="text-xs text-orange-600 mt-1">
              {myThisMonthExpenses._count} ta xarajat
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-800">Bugun</CardTitle>
            <DollarSign className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-green-700">
              {formatNumber(myTodayExpenses._sum.amount || 0)}
            </div>
            <p className="text-xs text-green-600 mt-1">
              {myTodayExpenses._count} ta xarajat
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Expenses */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Oxirgi Xarajatlarim</span>
              <Link href="/cook/expenses">
                <Button variant="ghost" size="sm">
                  Barchasi <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentExpenses.length > 0 ? (
                recentExpenses.map((expense) => (
                  <div
                    key={expense.id}
                    className="flex items-center justify-between border-b pb-3 last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-2 h-8 rounded-full"
                        style={{ backgroundColor: expense.category.color || '#6B7280' }}
                      />
                      <div>
                        <p className="font-medium text-sm">
                          {expense.itemName || expense.category.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(expense.date).toLocaleDateString('uz-UZ')}
                        </p>
                      </div>
                    </div>
                    <span className="font-bold text-red-600">
                      -{formatNumber(expense.amount)}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground py-4">
                  Hozircha xarajatlar yo'q
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Categories */}
        <Card>
          <CardHeader>
            <CardTitle>Mavjud Kategoriyalar</CardTitle>
            <CardDescription>
              Xarajat kiritishda foydalanishingiz mumkin
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              {categories.length > 0 ? (
                categories.map((cat) => (
                  <div
                    key={cat.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
                  >
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: cat.color || '#6B7280' }}
                    />
                    <span className="font-medium">{cat.name}</span>
                  </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground py-4">
                  Kategoriyalar yo'q
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

