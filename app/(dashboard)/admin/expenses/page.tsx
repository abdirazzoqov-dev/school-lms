import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, DollarSign, Calendar, FileText, Wallet, CreditCard, User, Hash, Receipt } from 'lucide-react'
import Link from 'next/link'
import { formatCurrency, formatDate } from '@/lib/utils'
import { DeleteButton } from '@/components/delete-button'
import { deleteExpense } from '@/app/actions/expense'
import { ExpenseFilters } from './expense-filters'

// Cache for 2 minutes
export const revalidate = 120
export const dynamic = 'auto' // Optimized for better caching

export default async function ExpensesPage({
  searchParams,
}: {
  searchParams: { categoryId?: string; startDate?: string; endDate?: string }
}) {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'ADMIN') {
    redirect('/unauthorized')
  }

  const tenantId = session.user.tenantId!

  // Build filter
  const where: any = { tenantId }

  if (searchParams.categoryId) {
    where.categoryId = searchParams.categoryId
  }

  if (searchParams.startDate || searchParams.endDate) {
    where.date = {}
    if (searchParams.startDate) {
      where.date.gte = new Date(searchParams.startDate)
    }
    if (searchParams.endDate) {
      where.date.lte = new Date(searchParams.endDate)
    }
  }

  // Get expenses
  const expenses = await db.expense.findMany({
    where,
    include: {
      category: true,
      paidBy: {
        select: {
          fullName: true
        }
      }
    },
    orderBy: { date: 'desc' },
    take: 100 // Limit for performance
  })

  // Get categories for filter
  const categories = await db.expenseCategory.findMany({
    where: { tenantId, isActive: true },
    select: {
      id: true,
      name: true,
      color: true
    },
    orderBy: { name: 'asc' }
  })

  // Calculate total
  const totalExpenses = expenses.reduce((sum, exp) => sum + Number(exp.amount), 0)

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Xarajatlar</h1>
          <p className="text-sm md:text-base text-muted-foreground mt-1">
            Barcha xarajatlarni ko'ring va boshqaring
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Link href="/admin/expenses/categories" className="flex-1 sm:flex-none">
            <Button variant="outline" className="w-full sm:w-auto">
              <FileText className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Xarajat Turlari</span>
              <span className="sm:hidden">Turlar</span>
            </Button>
          </Link>
          <Link href="/admin/expenses/create" className="flex-1 sm:flex-none">
            <Button className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Yangi Xarajat
            </Button>
          </Link>
        </div>
      </div>

      {/* Total Summary */}
      <Card className="border-l-4 border-l-red-500 bg-gradient-to-br from-red-50/50 to-white">
        <CardContent className="pt-4 md:pt-6">
          <div className="flex items-center gap-3 md:gap-4">
            <div className="p-2 md:p-3 bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-lg shrink-0">
              <DollarSign className="h-5 w-5 md:h-6 md:w-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs md:text-sm text-muted-foreground">Jami Xarajatlar</p>
              <p className="text-xl md:text-2xl lg:text-3xl font-bold text-red-600 truncate">
                -{formatCurrency(totalExpenses)}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5 md:mt-1">
                {expenses.length} ta xarajat yozuvi
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <ExpenseFilters categories={categories} />
        </CardContent>
      </Card>

      {/* Expenses List */}
      {expenses.length === 0 ? (
        <Card className="border-2 border-dashed">
          <CardContent className="py-12 text-center">
            <div className="p-4 bg-muted rounded-full w-fit mx-auto mb-4">
              <DollarSign className="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">
              Xarajatlar yo'q
            </h3>
            <p className="text-muted-foreground mb-6 text-sm">
              Birinchi xarajatni qo'shing
            </p>
            <Link href="/admin/expenses/create">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Xarajat Qo'shish
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Mobile/Tablet View - Cards */}
          <div className="grid gap-3 md:gap-4 lg:hidden">
            {expenses.map((expense) => (
              <Card key={expense.id} className="border-l-4 hover:shadow-lg transition-all duration-200" style={{ borderLeftColor: expense.category.color || '#3B82F6' }}>
                <CardContent className="p-4">
                  {/* Header Row */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                          style={{ backgroundColor: `${expense.category.color || '#3B82F6'}20` }}
                        >
                          <Receipt className="h-4 w-4" style={{ color: expense.category.color || '#3B82F6' }} />
                        </div>
                        <span className="font-semibold text-sm truncate">{expense.category.name}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>{formatDate(expense.date)}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-red-600">
                        -{formatCurrency(Number(expense.amount))}
                      </div>
                      <Badge 
                        variant={expense.paymentMethod === 'CASH' ? 'default' : 'secondary'}
                        className="mt-1"
                      >
                        {expense.paymentMethod === 'CASH' ? (
                          <><Wallet className="h-3 w-3 mr-1" /> Naqd</>
                        ) : (
                          <><CreditCard className="h-3 w-3 mr-1" /> Plastik</>
                        )}
                      </Badge>
                    </div>
                  </div>

                  {/* Description */}
                  {expense.description && (
                    <div className="mb-3 p-2 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {expense.description}
                      </p>
                    </div>
                  )}

                  {/* Footer Row */}
                  <div className="flex items-center justify-between pt-3 border-t">
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      {expense.receiptNumber && (
                        <div className="flex items-center gap-1">
                          <Hash className="h-3 w-3" />
                          <span className="font-mono">{expense.receiptNumber}</span>
                        </div>
                      )}
                      {expense.paidBy && (
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          <span className="truncate max-w-[120px]">{expense.paidBy.fullName}</span>
                        </div>
                      )}
                    </div>
                    <DeleteButton
                      itemId={expense.id}
                      itemName={expense.category.name}
                      itemType="material"
                      onDelete={deleteExpense}
                      variant="ghost"
                      size="sm"
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Desktop View - Table */}
          <Card className="hidden lg:block">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-muted/80 to-muted/40">
                    <tr className="border-b">
                      <th className="p-3 text-left text-sm font-semibold">Sana</th>
                      <th className="p-3 text-left text-sm font-semibold">Xarajat Turi</th>
                      <th className="p-3 text-left text-sm font-semibold">Izoh</th>
                      <th className="p-3 text-center text-sm font-semibold">To'lov Usuli</th>
                      <th className="p-3 text-right text-sm font-semibold">Miqdor</th>
                      <th className="p-3 text-left text-sm font-semibold">Kim To'ladi</th>
                      <th className="p-3 text-center text-sm font-semibold">Amallar</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expenses.map((expense, index) => (
                      <tr 
                        key={expense.id} 
                        className={`border-b hover:bg-muted/50 transition-colors ${
                          index % 2 === 0 ? 'bg-white' : 'bg-muted/20'
                        }`}
                      >
                        <td className="p-3 text-sm">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                            <span className="whitespace-nowrap">{formatDate(expense.date)}</span>
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                              style={{ backgroundColor: `${expense.category.color || '#3B82F6'}20` }}
                            >
                              <Receipt className="h-5 w-5" style={{ color: expense.category.color || '#3B82F6' }} />
                            </div>
                            <span className="font-medium">{expense.category.name}</span>
                          </div>
                        </td>
                        <td className="p-3 text-sm max-w-xs">
                          <div>
                            <p className="text-muted-foreground line-clamp-2">
                              {expense.description || '-'}
                            </p>
                            {expense.receiptNumber && (
                              <div className="flex items-center gap-1 mt-1">
                                <Hash className="h-3 w-3 text-blue-600" />
                                <span className="text-xs text-blue-600 font-mono">
                                  {expense.receiptNumber}
                                </span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="p-3 text-center">
                          <Badge 
                            variant={expense.paymentMethod === 'CASH' ? 'default' : 'secondary'}
                            className="gap-1"
                          >
                            {expense.paymentMethod === 'CASH' ? (
                              <><Wallet className="h-3 w-3" /> Naqd</>
                            ) : (
                              <><CreditCard className="h-3 w-3" /> Plastik</>
                            )}
                          </Badge>
                        </td>
                        <td className="p-3 text-right">
                          <span className="text-base font-bold text-red-600">
                            -{formatCurrency(Number(expense.amount))}
                          </span>
                        </td>
                        <td className="p-3 text-sm">
                          {expense.paidBy && (
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-muted-foreground shrink-0" />
                              <span className="text-muted-foreground">{expense.paidBy.fullName}</span>
                            </div>
                          )}
                        </td>
                        <td className="p-3 text-center">
                          <DeleteButton
                            itemId={expense.id}
                            itemName={expense.category.name}
                            itemType="material"
                            onDelete={deleteExpense}
                            variant="ghost"
                            size="sm"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gradient-to-r from-red-50 to-red-100/50">
                    <tr className="border-t-2 border-red-200">
                      <td colSpan={4} className="p-4 text-right font-semibold text-sm">
                        Jami Xarajat:
                      </td>
                      <td className="p-4 text-right">
                        <span className="text-xl font-bold text-red-600">
                          -{formatCurrency(totalExpenses)}
                        </span>
                      </td>
                      <td colSpan={2}></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}

