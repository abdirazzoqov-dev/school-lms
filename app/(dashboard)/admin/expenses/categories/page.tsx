import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, DollarSign, AlertTriangle, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { formatCurrency } from '@/lib/utils'
import { EXPENSE_PERIODS } from '@/lib/validations/expense'
import { getCategoryExpenseTotal, getWarningLevel } from '@/lib/expense-helpers'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'

// Cache for 2 minutes
export const revalidate = 120
export const dynamic = 'auto' // Optimized for better caching

export default async function ExpenseCategoriesPage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'ADMIN') {
    redirect('/unauthorized')
  }

  const tenantId = session.user.tenantId!

  // Get all expense categories with their expenses
  const categories = await db.expenseCategory.findMany({
    where: { tenantId },
    include: {
      _count: {
        select: { expenses: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  // Calculate totals for each category
  const categoriesWithTotals = await Promise.all(
    categories.map(async (category) => {
      const total = await getCategoryExpenseTotal(category.id, tenantId)
      const limit = Number(category.limitAmount)
      const percentage = limit > 0 ? Math.round((total / limit) * 100) : 0
      const remaining = limit - total
      const warningLevel = getWarningLevel(percentage)

      return {
        ...category,
        total,
        percentage,
        remaining,
        warningLevel
      }
    })
  )

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Xarajat Turlari</h1>
          <p className="text-muted-foreground mt-2">
            Xarajat turlarini va limitlarni boshqaring
          </p>
        </div>
        <Link href="/admin/expenses/categories/create">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Yangi Tur
          </Button>
        </Link>
      </div>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Jami Xarajat Turlari
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categories.length}</div>
            <p className="text-xs text-muted-foreground">
              {categories.filter(c => c.isActive).length} ta faol
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Limit Oshdi
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {categoriesWithTotals.filter(c => c.percentage >= 100).length}
            </div>
            <p className="text-xs text-muted-foreground">
              E'tibor talab qiladi
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Warning Holati
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {categoriesWithTotals.filter(c => c.percentage >= 85 && c.percentage < 100).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Diqqat kerak
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Categories Grid */}
      {categoriesWithTotals.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <DollarSign className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              Hech qanday xarajat turi yo'q
            </h3>
            <p className="text-muted-foreground mb-6">
              Birinchi xarajat turini yarating
            </p>
            <Link href="/admin/expenses/categories/create">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Yangi Tur Yaratish
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {categoriesWithTotals.map((category) => (
            <Card key={category.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: category.color || '#3B82F6' }}
                    />
                    <CardTitle className="text-lg">{category.name}</CardTitle>
                  </div>
                  <Badge variant={category.isActive ? 'default' : 'secondary'}>
                    {category.isActive ? 'Faol' : 'Nofaol'}
                  </Badge>
                </div>
                {category.description && (
                  <CardDescription className="line-clamp-2">
                    {category.description}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Limit Info */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Limit:</span>
                    <span className="font-semibold">
                      {formatCurrency(Number(category.limitAmount))}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Muddat:</span>
                    <span>{EXPENSE_PERIODS[category.period]}</span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Sarflangan:</span>
                    <span className="font-semibold">
                      {category.percentage}%
                    </span>
                  </div>
                  <Progress 
                    value={category.percentage} 
                    className={`h-2 ${
                      category.warningLevel === 'danger' ? 'bg-red-100' :
                      category.warningLevel === 'warning' ? 'bg-orange-100' :
                      'bg-green-100'
                    }`}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{formatCurrency(category.total)}</span>
                    <span>{formatCurrency(Number(category.limitAmount))}</span>
                  </div>
                </div>

                {/* Warning Alert */}
                {category.percentage >= 85 && (
                  <Alert variant={category.percentage >= 100 ? 'destructive' : 'default'}>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription className="text-xs">
                      {category.percentage >= 100
                        ? `Limit ${formatCurrency(Math.abs(category.remaining))} oshdi!`
                        : `Diqqat! Limit ${category.percentage}% ishlatilgan`
                      }
                    </AlertDescription>
                  </Alert>
                )}

                {/* Stats & Actions */}
                <div className="pt-2 border-t flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">
                    {category._count.expenses} ta xarajat
                  </span>
                  <div className="flex gap-2">
                    <Link href={`/admin/expenses/categories/${category.id}/edit`}>
                      <Button variant="ghost" size="sm">
                        Tahrirlash
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

