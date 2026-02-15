import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { FileText } from 'lucide-react'
import { ContractsViewClient } from './contracts-view-client'

export const revalidate = 0
export const dynamic = 'force-dynamic'

export default async function TeacherContractsPage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'TEACHER') {
    redirect('/unauthorized')
  }

  const tenantId = session.user.tenantId!
  const userId = session.user.id

  // Get teacher
  const teacher = await db.teacher.findUnique({
    where: { userId },
    select: { id: true },
  })

  if (!teacher) {
    redirect('/unauthorized')
  }

  // Fetch contracts for this teacher
  const contracts = await db.contract.findMany({
    where: {
      tenantId,
      isActive: true,
      OR: [
        {
          forTeachers: true,
          teacherId: null, // General for all teachers
        },
        {
          forTeachers: true,
          teacherId: teacher.id, // Specific to this teacher
        },
      ],
    },
    include: {
      uploadedBy: {
        select: {
          fullName: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <FileText className="h-8 w-8 text-primary" />
          Shartnomalar
        </h2>
        <p className="text-muted-foreground mt-2">
          Sizga tegishli shartnomalarni ko'ring va yuklab oling
        </p>
      </div>

      <ContractsViewClient contracts={contracts} />
    </div>
  )
}

