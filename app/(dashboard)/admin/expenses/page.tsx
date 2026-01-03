import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, DollarSign, Calendar, FileText } from 'lucide-react'
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
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Xarajatlar</h1>
          <p className="text-muted-foreground mt-2">
            Barcha xarajatlarni ko'ring va boshqaring
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/expenses/categories">
            <Button variant="outline">
              <FileText className="h-4 w-4 mr-2" />
              Xarajat Turlari
            </Button>
          </Link>
          <Link href="/admin/expenses/create">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Yangi Xarajat
            </Button>
          </Link>
        </div>
      </div>

      {/* Total Summary */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-red-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Jami Xarajatlar</p>
                <p className="text-2xl font-bold text-red-600">
                  {formatCurrency(totalExpenses)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {expenses.length} ta xarajat
                </p>
              </div>
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
        <Card>
          <CardContent className="py-12 text-center">
            <DollarSign className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              Xarajatlar yo'q
            </h3>
            <p className="text-muted-foreground mb-6">
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
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr className="border-b">
                    <th className="p-3 text-left text-sm font-medium">Sana</th>
                    <th className="p-3 text-left text-sm font-medium">Xarajat Turi</th>
                    <th className="p-3 text-left text-sm font-medium">Izoh</th>
                    <th className="p-3 text-left text-sm font-medium">To'lov Usuli</th>
                    <th className="p-3 text-right text-sm font-medium">Miqdor</th>
                    <th className="p-3 text-left text-sm font-medium">Kim To'ladi</th>
                    <th className="p-3 text-center text-sm font-medium">Amallar</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map((expense) => (
                    <tr key={expense.id} className="border-b hover:bg-muted/50">
                      <td className="p-3 text-sm">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {formatDate(expense.date)}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: expense.category.color || '#3B82F6' }}
                          />
                          <span className="font-medium">{expense.category.name}</span>
                        </div>
                      </td>
                      <td className="p-3 text-sm max-w-xs">
                        <div>
                          <p className="text-muted-foreground truncate">
                            {expense.description || '-'}
                          </p>
                          {expense.receiptNumber && (
                            <p className="text-xs text-blue-600 font-mono mt-1">
                              #{expense.receiptNumber}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="p-3">
                        <Badge variant="outline">
                          {expense.paymentMethod}
                        </Badge>
                      </td>
                      <td className="p-3 text-right">
                        <span className="font-semibold text-red-600">
                          -{formatCurrency(Number(expense.amount))}
                        </span>
                      </td>
                      <td className="p-3 text-sm text-muted-foreground">
                        {expense.paidBy?.fullName || '-'}
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
                <tfoot className="bg-muted/30">
                  <tr className="border-t-2">
                    <td colSpan={4} className="p-3 text-right font-semibold">
                      Jami Xarajat:
                    </td>
                    <td className="p-3 text-right">
                      <span className="text-lg font-bold text-red-600">
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
      )}
    </div>
  )
}

