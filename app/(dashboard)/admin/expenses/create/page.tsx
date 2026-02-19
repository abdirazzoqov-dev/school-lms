import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { ExpenseForm } from './expense-form'

export default async function CreateExpensePage() {
  const session = await getServerSession(authOptions)

  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'MODERATOR')) {
    redirect('/unauthorized')
  }

  const tenantId = session.user.tenantId!

  // Get active expense categories
  const categories = await db.expenseCategory.findMany({
    where: { tenantId, isActive: true },
    orderBy: { name: 'asc' }
  })

  // Generate receipt number
  const { generateExpenseReceiptNumber } = await import('@/lib/expense-utils')
  const receiptNumber = await generateExpenseReceiptNumber(tenantId)

  if (categories.length === 0) {
    return (
      <div className="space-y-6">
        <Link href="/admin/expenses">
          <Button variant="ghost">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Orqaga
          </Button>
        </Link>

        <Card>
          <CardContent className="py-12 text-center">
            <h3 className="text-lg font-semibold mb-2">
              Xarajat turlari mavjud emas
            </h3>
            <p className="text-muted-foreground mb-6">
              Avval xarajat turini yaratishingiz kerak
            </p>
            <Link href="/admin/expenses/categories/create">
              <Button>
                Xarajat Turi Yaratish
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Link href="/admin/expenses">
        <Button variant="ghost">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Orqaga
        </Button>
      </Link>

      {/* Form Card */}
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Yangi Xarajat</CardTitle>
          <CardDescription>
            Yangi xarajatni ro'yxatdan o'tkazing
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ExpenseForm categories={categories} generatedReceiptNumber={receiptNumber} />
        </CardContent>
      </Card>
    </div>
  )
}

