import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { EditExpenseCategoryForm } from './edit-expense-category-form'

export default async function EditExpenseCategoryPage({
  params
}: {
  params: { id: string }
}) {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'ADMIN') {
    redirect('/unauthorized')
  }

  const tenantId = session.user.tenantId!

  // Get category
  const category = await db.expenseCategory.findFirst({
    where: {
      id: params.id,
      tenantId
    }
  })

  if (!category) {
    notFound()
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Link href="/admin/expenses/categories">
        <Button variant="ghost">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Orqaga
        </Button>
      </Link>

      {/* Form Card */}
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Xarajat Turini Tahrirlash</CardTitle>
          <CardDescription>
            "{category.name}" xarajat turini yangilang
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EditExpenseCategoryForm category={category} />
        </CardContent>
      </Card>
    </div>
  )
}

