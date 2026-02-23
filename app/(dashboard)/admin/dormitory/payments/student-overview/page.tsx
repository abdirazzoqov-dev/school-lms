import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { DormitoryOverviewClient } from './dormitory-overview-client'

export const revalidate = 0
export const dynamic = 'force-dynamic'

export default async function DormitoryPaymentOverviewPage({
  searchParams,
}: {
  searchParams: { studentId?: string }
}) {
  const session = await getServerSession(authOptions)

  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'MODERATOR')) {
    redirect('/unauthorized')
  }

  const tenantId = session.user.tenantId!
  const currentYear = new Date().getFullYear()

  // Fetch active dormitory students
  const students = await db.student.findMany({
    where: {
      tenantId,
      status: 'ACTIVE',
      dormitoryAssignment: {
        status: 'ACTIVE',
      },
    },
    select: {
      id: true,
      studentCode: true,
      paymentDueDay: true,
      user: {
        select: {
          fullName: true,
          avatar: true,
        }
      },
      class: { select: { name: true } },
      dormitoryAssignment: {
        select: {
          monthlyFee: true,
          checkInDate: true,
          room: {
            select: {
              roomNumber: true,
              building: { select: { name: true } },
            }
          },
          bed: { select: { bedNumber: true } },
        }
      }
    },
    orderBy: { user: { fullName: 'asc' } }
  })

  return (
    <div className="space-y-6">
      <DormitoryOverviewClient
        students={students}
        currentYear={currentYear}
        tenantId={tenantId}
        preSelectedStudentId={searchParams.studentId}
      />
    </div>
  )
}
