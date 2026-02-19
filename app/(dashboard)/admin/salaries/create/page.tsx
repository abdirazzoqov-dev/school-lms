import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { SalaryPaymentForm } from './salary-payment-form'
import { currentMonth, currentYear } from '@/lib/validations/salary'

export default async function CreateSalaryPaymentPage({
  searchParams
}: {
  searchParams: { employeeId?: string; employeeType?: string; month?: string; year?: string }
}) {
  const session = await getServerSession(authOptions)

  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'MODERATOR')) {
    redirect('/unauthorized')
  }

  const tenantId = session.user.tenantId!
  
  // Extract query params
  const preselectedEmployeeId = searchParams.employeeId
  const preselectedEmployeeType = searchParams.employeeType as 'teacher' | 'staff' | undefined
  const preselectedMonth = searchParams.month ? parseInt(searchParams.month) : undefined
  const preselectedYear = searchParams.year ? parseInt(searchParams.year) : undefined

  // Get all teachers
  const teachers = await db.teacher.findMany({
    where: { tenantId },
    include: {
      user: {
        select: {
          fullName: true,
          avatar: true,
          email: true
        }
      }
    },
    orderBy: {
      user: {
        fullName: 'asc'
      }
    }
  })

  // Get all staff (non-teaching employees)
  const staff = await db.staff.findMany({
    where: {
      tenantId
    },
    include: {
      user: {
        select: {
          fullName: true,
          email: true,
          avatar: true
        }
      }
    },
    orderBy: {
      user: {
        fullName: 'asc'
      }
    }
  })

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
          <h1 className="text-3xl font-bold">Maosh To'lash</h1>
          <p className="text-muted-foreground mt-1">
            Xodim yoki o'qituvchiga maosh to'lash, avans berish
          </p>
        </div>
      </div>

      {/* Form */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle>To'lov Ma'lumotlari</CardTitle>
        </CardHeader>
        <CardContent>
          <SalaryPaymentForm 
            teachers={teachers} 
            staff={staff}
            preselectedEmployeeId={preselectedEmployeeId}
            preselectedEmployeeType={preselectedEmployeeType}
            preselectedMonth={preselectedMonth}
            preselectedYear={preselectedYear}
          />
        </CardContent>
      </Card>
    </div>
  )
}

