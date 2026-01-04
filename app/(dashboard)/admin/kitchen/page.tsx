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
  Users, 
  ShoppingCart,
  Utensils,
  Plus,
  ArrowRight
} from 'lucide-react'
import Link from 'next/link'
import { formatNumber } from '@/lib/utils'

export const revalidate = 60
export const dynamic = 'auto' // Optimized for better caching

export default async function KitchenDashboardPage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'ADMIN') {
    redirect('/unauthorized')
  }

  const tenantId = session.user.tenantId!

  // Get statistics
  const thisMonthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  const today = new Date()
  today.setHours(23, 59, 59, 999)

  const [
    totalCooks,
    activeCooks,
    totalCategories,
    thisMonthExpenses,
    recentExpenses,
    categoryStats
  ] = await Promise.all([
    db.cook.count({ where: { tenantId } }),
    db.cook.count({ 
      where: { 
        tenantId,
        user: { isActive: true }
      } 
    }),
    db.kitchenExpenseCategory.count({ 
      where: { tenantId, isActive: true } 
    }),
    db.kitchenExpense.aggregate({
      where: {
        tenantId,
        date: {
          gte: thisMonthStart,
          lte: today
        }
      },
      _sum: { amount: true },
      _count: true
    }),
    db.kitchenExpense.findMany({
      where: { tenantId },
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        category: true,
        createdBy: {
          include: {
            user: {
              select: { fullName: true }
            }
          }
        }
      }
    }),
    db.kitchenExpense.groupBy({
      by: ['categoryId'],
      where: {
        tenantId,
        date: {
          gte: thisMonthStart,
          lte: today
        }
      },
      _sum: { amount: true }
    })
  ])

  // Get category names for stats
  const categories = await db.kitchenExpenseCategory.findMany({
    where: { tenantId }
  })

  const categoryStatsWithNames = categoryStats.map(stat => {
    const category = categories.find(c => c.id === stat.categoryId)
    return {
      name: category?.name || 'Noma\'lum',
      color: category?.color || '#6B7280',
      amount: Number(stat._sum.amount || 0)
    }
  }).sort((a, b) => b.amount - a.amount)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <ChefHat className="h-8 w-8 text-orange-500" />
            Oshxona Boshqaruvi
          </h1>
          <p className="text-muted-foreground mt-1">
            Oshxona xodimlari va xarajatlarini boshqaring
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <Link href="/admin/kitchen/cooks/create">
          <Card className="hover:shadow-md transition-shadow cursor-pointer border-dashed border-2 hover:border-orange-300">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="p-3 rounded-full bg-orange-100">
                <Plus className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="font-semibold">Oshpaz Qo'shish</p>
                <p className="text-sm text-muted-foreground">Yangi xodim yaratish</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/kitchen/categories/create">
          <Card className="hover:shadow-md transition-shadow cursor-pointer border-dashed border-2 hover:border-blue-300">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="p-3 rounded-full bg-blue-100">
                <Plus className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="font-semibold">Xarajat Turi</p>
                <p className="text-sm text-muted-foreground">Yangi kategoriya</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/kitchen/expenses/create">
          <Card className="hover:shadow-md transition-shadow cursor-pointer border-dashed border-2 hover:border-green-300">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="p-3 rounded-full bg-green-100">
                <Plus className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="font-semibold">Xarajat Kiritish</p>
                <p className="text-sm text-muted-foreground">Yangi xarajat</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-800">Oshpazlar</CardTitle>
            <ChefHat className="h-5 w-5 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-700">{totalCooks}</div>
            <p className="text-xs text-orange-600 mt-1">
              {activeCooks} ta faol
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-800">Xarajat Turlari</CardTitle>
            <Utensils className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-700">{totalCategories}</div>
            <p className="text-xs text-blue-600 mt-1">
              Faol kategoriyalar
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-red-800">Bu Oylik Xarajat</CardTitle>
            <TrendingDown className="h-5 w-5 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-700">
              {formatNumber(Number(thisMonthExpenses._sum.amount || 0))}
            </div>
            <p className="text-xs text-red-600 mt-1">
              {thisMonthExpenses._count} ta xarajat
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-800">Xaridlar</CardTitle>
            <ShoppingCart className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-700">{thisMonthExpenses._count}</div>
            <p className="text-xs text-green-600 mt-1">
              Bu oyda
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Category Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Xarajatlar Taqsimoti</span>
              <Link href="/admin/kitchen/categories">
                <Button variant="ghost" size="sm">
                  Barchasi <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </CardTitle>
            <CardDescription>Bu oylik kategoriyalar bo'yicha</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {categoryStatsWithNames.length > 0 ? (
                categoryStatsWithNames.slice(0, 5).map((stat, index) => (
                  <div key={index} className="flex items-center gap-4">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: stat.color }}
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{stat.name}</span>
                        <span className="text-sm font-bold">
                          {formatNumber(stat.amount)} so'm
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                        <div 
                          className="h-2 rounded-full transition-all duration-300"
                          style={{ 
                            width: `${(stat.amount / (Number(thisMonthExpenses._sum.amount || 0) || 1)) * 100}%`,
                            backgroundColor: stat.color
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  Bu oyda xarajatlar yo'q
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Expenses */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Oxirgi Xarajatlar</span>
              <Link href="/admin/kitchen/expenses">
                <Button variant="ghost" size="sm">
                  Barchasi <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </CardTitle>
            <CardDescription>So'nggi kiritilgan xarajatlar</CardDescription>
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
                          {expense.createdBy?.user?.fullName || 'Admin'} • {new Date(expense.date).toLocaleDateString('uz-UZ')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-red-600">
                        -{formatNumber(Number(expense.amount))}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {expense.paymentMethod}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  Hozircha xarajatlar yo'q
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Navigation Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Link href="/admin/kitchen/cooks">
          <Card className="hover:shadow-lg transition-all cursor-pointer group">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-orange-100 group-hover:bg-orange-200 transition-colors">
                    <Users className="h-6 w-6 text-orange-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-lg">Oshpazlar</p>
                    <p className="text-sm text-muted-foreground">Xodimlarni boshqaring</p>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/kitchen/categories">
          <Card className="hover:shadow-lg transition-all cursor-pointer group">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-blue-100 group-hover:bg-blue-200 transition-colors">
                    <Utensils className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-lg">Xarajat Turlari</p>
                    <p className="text-sm text-muted-foreground">Kategoriyalarni boshqaring</p>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/kitchen/expenses">
          <Card className="hover:shadow-lg transition-all cursor-pointer group">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-green-100 group-hover:bg-green-200 transition-colors">
                    <DollarSign className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-lg">Xarajatlar</p>
                    <p className="text-sm text-muted-foreground">Moliyani boshqaring</p>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  )
}
