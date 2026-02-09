import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { SalaryOverviewClient } from './salary-overview-client'

export const revalidate = 0
export const dynamic = 'force-dynamic'

export default async function SalaryOverviewPage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'ADMIN') {
    redirect('/unauthorized')
  }

  const tenantId = session.user.tenantId!
  const currentYear = new Date().getFullYear()

  // Fetch teachers with salary
  const teachers = await db.teacher.findMany({
    where: { 
      tenantId,
      monthlySalary: { not: null }
    },
    select: {
      id: true,
      teacherCode: true,
      monthlySalary: true,
      specialization: true,
      user: {
        select: {
          fullName: true
        }
      }
    },
    orderBy: {
      teacherCode: 'asc'
    }
  })

  // Fetch staff with salary
  const staff = await db.staff.findMany({
    where: { 
      tenantId,
      monthlySalary: { not: null }
    },
    select: {
      id: true,
      staffCode: true,
      monthlySalary: true,
      position: true,
      user: {
        select: {
          fullName: true
        }
      }
    },
    orderBy: {
      staffCode: 'asc'
    }
  })

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Xodimlar Maosh Panoramasi</CardTitle>
          <CardDescription>
            Har bir xodim va o'qituvchining yil bo'yicha maoshlarini ko'ring va to'lov qabul qiling
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SalaryOverviewClient 
            teachers={teachers}
            staff={staff}
            currentYear={currentYear}
            tenantId={tenantId}
          />
        </CardContent>
      </Card>
    </div>
  )
}

