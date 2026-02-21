import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Utensils, 
  Plus, 
  ArrowLeft
} from 'lucide-react'
import Link from 'next/link'
import { formatNumber } from '@/lib/utils'
import { CategoriesTable } from './categories-table'
import { PermissionGate } from '@/components/admin/permission-gate'

export const revalidate = 60
export const dynamic = 'auto' // Optimized for better caching

export default async function KitchenCategoriesPage() {
  const session = await getServerSession(authOptions)

  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'MODERATOR')) {
    redirect('/unauthorized')
  }

  const tenantId = session.user.tenantId!

  // Get all categories with expense count
  const categories = await db.kitchenExpenseCategory.findMany({
    where: { tenantId },
    include: {
      _count: {
        select: { kitchenExpenses: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  // Get this month's expenses for each category
  const thisMonthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  const categoryExpenses = await db.kitchenExpense.groupBy({
    by: ['categoryId'],
    where: {
      tenantId,
      date: { gte: thisMonthStart }
    },
    _sum: { amount: true }
  })

  const categoriesWithExpenses = categories.map(cat => ({
    ...cat,
    thisMonthExpense: categoryExpenses.find(e => e.categoryId === cat.id)?._sum.amount || 0
  }))

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
              <Utensils className="h-8 w-8 text-blue-500" />
              Xarajat Turlari
            </h1>
            <p className="text-muted-foreground mt-1">
              Oshxona xarajat kategoriyalarini boshqaring
            </p>
          </div>
        </div>
        <PermissionGate resource="kitchen" action="CREATE">
          <Link href="/admin/kitchen/categories/create">
            <Button className="bg-blue-500 hover:bg-blue-600">
              <Plus className="mr-2 h-4 w-4" />
              Yangi Tur
            </Button>
          </Link>
        </PermissionGate>
      </div>

      {/* Categories Table */}
      <Card>
        <CardHeader>
          <CardTitle>Kategoriyalar Ro'yxati</CardTitle>
        </CardHeader>
        <CardContent>
          <CategoriesTable categories={categoriesWithExpenses} />
        </CardContent>
      </Card>
    </div>
  )
}

