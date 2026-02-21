import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { SalaryEditForm } from './salary-edit-form'

export default async function EditSalaryPaymentPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)

  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'MODERATOR')) {
    redirect('/unauthorized')
  }

  const tenantId = session.user.tenantId!
  
  // Fetch salary payment
  const salaryPayment = await db.salaryPayment.findUnique({
    where: { 
      id: params.id,
      tenantId 
    },
    include: {
      teacher: {
        include: {
          user: {
            select: {
              fullName: true,
              email: true
            }
          }
        }
      },
      staff: {
        include: {
          user: {
            select: {
              fullName: true,
              email: true
            }
          }
        }
      }
    }
  })

  if (!salaryPayment) {
    redirect('/admin/salaries')
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/admin/salaries">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Maosh To'lovini Tahrirlash</h1>
          <p className="text-muted-foreground mt-1">
            Maosh to'lov ma'lumotlarini yangilang
          </p>
        </div>
      </div>

      {/* Form */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle>To'lov Ma'lumotlari</CardTitle>
          <CardDescription>
            {salaryPayment.teacher 
              ? `O'qituvchi: ${salaryPayment.teacher.user.fullName}`
              : `Xodim: ${salaryPayment.staff?.user.fullName}`
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SalaryEditForm salaryPayment={salaryPayment as any} />
        </CardContent>
      </Card>
    </div>
  )
}

