import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  DollarSign, 
  Plus,
  TrendingDown,
  Calendar
} from 'lucide-react'
import Link from 'next/link'
import { formatNumber } from '@/lib/utils'

export const revalidate = 60
export const dynamic = 'auto' // Optimized for better caching

export default async function CookExpensesPage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'COOK') {
    redirect('/unauthorized')
  }

  const tenantId = session.user.tenantId!

  // Get cook record
  const cook = await db.cook.findFirst({
    where: { userId: session.user.id }
  })

  if (!cook) {
    redirect('/unauthorized')
  }

  // Get my expenses
  const expenses = await db.kitchenExpense.findMany({
    where: {
      tenantId,
      createdById: cook.id
    },
    include: {
      category: true
    },
    orderBy: { date: 'desc' }
  })

  // Stats
  const thisMonthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  const thisMonthExpenses = expenses.filter(e => new Date(e.date) >= thisMonthStart)
  const thisMonthTotal = thisMonthExpenses.reduce((sum, e) => sum + Number(e.amount), 0)

  const paymentMethodLabels: Record<string, string> = {
    CASH: 'Naqd',
    CLICK: 'Click',
    PAYME: 'Payme',
    UZUM: 'Uzum',
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <DollarSign className="h-8 w-8 text-green-500" />
            Mening Xarajatlarim
          </h1>
          <p className="text-muted-foreground mt-1">
            Siz kiritgan barcha xarajatlar
          </p>
        </div>
        <Link href="/cook/expenses/create">
          <Button className="bg-orange-500 hover:bg-orange-600">
            <Plus className="mr-2 h-4 w-4" />
            Yangi Xarajat
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-200">
                <DollarSign className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-700">{expenses.length}</p>
                <p className="text-xs text-blue-600">Jami xarajatlar</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-200">
                <TrendingDown className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-xl font-bold text-red-700">
                  {formatNumber(thisMonthTotal)}
                </p>
                <p className="text-xs text-red-600">Bu oyda sarflangan</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-200">
                <Calendar className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-700">{thisMonthExpenses.length}</p>
                <p className="text-xs text-green-600">Bu oyda kiritilgan</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Expenses List */}
      <Card>
        <CardHeader>
          <CardTitle>Xarajatlar Ro'yxati</CardTitle>
        </CardHeader>
        <CardContent>
          {expenses.length > 0 ? (
            <div className="space-y-3">
              {expenses.map((expense) => (
                <div
                  key={expense.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div 
                      className="w-2 h-12 rounded-full"
                      style={{ backgroundColor: expense.category.color || '#6B7280' }}
                    />
                    <div>
                      <p className="font-medium">
                        {expense.itemName || expense.category.name}
                      </p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{expense.category.name}</span>
                        <span>•</span>
                        <span>{new Date(expense.date).toLocaleDateString('uz-UZ')}</span>
                        {expense.supplier && (
                          <>
                            <span>•</span>
                            <span>{expense.supplier}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg text-red-600">
                      -{formatNumber(expense.amount)}
                    </p>
                    <Badge variant="outline" className="text-xs">
                      {paymentMethodLabels[expense.paymentMethod] || expense.paymentMethod}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <DollarSign className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">Xarajatlar yo'q</h3>
              <p className="text-muted-foreground mb-4">
                Birinchi xarajatingizni kiriting
              </p>
              <Link href="/cook/expenses/create">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Xarajat Kiritish
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

