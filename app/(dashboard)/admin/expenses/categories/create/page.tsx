import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { ExpenseCategoryForm } from './expense-category-form'

export default async function CreateExpenseCategoryPage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'ADMIN') {
    redirect('/unauthorized')
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
          <CardTitle>Yangi Xarajat Turi</CardTitle>
          <CardDescription>
            Yangi xarajat turini yarating va limit belgilang
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ExpenseCategoryForm />
        </CardContent>
      </Card>
    </div>
  )
}

