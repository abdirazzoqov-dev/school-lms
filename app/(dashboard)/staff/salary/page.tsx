import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { StaffSalaryPanoramaClient } from './staff-salary-panorama-client'

export const revalidate = 0

export default async function StaffSalaryOverviewPage() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'STAFF') redirect('/unauthorized')

  const tenantId = session.user.tenantId!
  const currentYear = new Date().getFullYear()

  // Get staff with details
  const staff = await db.staff.findUnique({
    where: { userId: session.user.id },
    select: {
      id: true,
      staffCode: true,
      monthlySalary: true,
      position: true,
      user: {
        select: {
          fullName: true,
          email: true
        }
      }
    }
  })

  if (!staff) redirect('/unauthorized')

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Yillik Maosh Ko'rinishi</CardTitle>
          <CardDescription>
            Har bir oy bo'yicha maoshlarni ko'ring va to'lov qabul qiling
          </CardDescription>
        </CardHeader>
        <CardContent>
          <StaffSalaryPanoramaClient 
            staff={staff}
            currentYear={currentYear}
            tenantId={tenantId}
          />
        </CardContent>
      </Card>
    </div>
  )
}

