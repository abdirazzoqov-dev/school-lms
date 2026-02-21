import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { DollarSign, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ExpenseForm } from './expense-form'

export default async function CreateExpensePage() {
  const session = await getServerSession(authOptions)

  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'MODERATOR')) {
    redirect('/unauthorized')
  }

  const tenantId = session.user.tenantId!

  // Get categories for the form
  const categories = await db.kitchenExpenseCategory.findMany({
    where: { tenantId, isActive: true },
    orderBy: { name: 'asc' }
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/kitchen/expenses">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <DollarSign className="h-8 w-8 text-green-500" />
            Xarajat Kiritish
          </h1>
          <p className="text-muted-foreground mt-1">
            Oshxona uchun yangi xarajat kiriting
          </p>
        </div>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Xarajat Ma'lumotlari</CardTitle>
          <CardDescription>
            Xarajat uchun kerakli ma'lumotlarni kiriting
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ExpenseForm categories={categories} />
        </CardContent>
      </Card>
    </div>
  )
}

