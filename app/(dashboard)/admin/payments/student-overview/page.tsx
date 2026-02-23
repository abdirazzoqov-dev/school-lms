import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { StudentPaymentOverviewClient } from './student-overview-client'

export const revalidate = 0
export const dynamic = 'force-dynamic'

export default async function StudentPaymentOverviewPage() {
  const session = await getServerSession(authOptions)

  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'MODERATOR')) {
    redirect('/unauthorized')
  }

  const tenantId = session.user.tenantId!
  const currentYear = new Date().getFullYear()

  // Fetch active students with their payments
  // Tekin o'quvchilar (isFreeStudent = true) panoramadan chiqariladi
  const students = await db.student.findMany({
    where: { 
      tenantId,
      status: 'ACTIVE',
      monthlyTuitionFee: { not: null },
      isFreeStudent: false,
    },
    select: {
      id: true,
      studentCode: true,
      monthlyTuitionFee: true,
      paymentDueDay: true,
      user: {
        select: {
          fullName: true
        }
      },
      class: {
        select: {
          name: true
        }
      }
    },
    orderBy: {
      studentCode: 'asc'
    }
  })

  return (
    <div className="space-y-6">
      <StudentPaymentOverviewClient 
        students={students}
        currentYear={currentYear}
        tenantId={tenantId}
      />
    </div>
  )
}

