import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { FileText } from 'lucide-react'
import { ContractsViewClient } from './contracts-view-client'

export const revalidate = 0
export const dynamic = 'force-dynamic'

export default async function StaffContractsPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/unauthorized')
  }

  const tenantId = session.user.tenantId!
  const userId = session.user.id

  // Get staff
  const staffMember = await db.staff.findUnique({
    where: { userId },
    select: { id: true },
  })

  if (!staffMember) {
    redirect('/unauthorized')
  }

  // Fetch contracts for this staff member
  const contracts = await db.contract.findMany({
    where: {
      tenantId,
      isActive: true,
      OR: [
        {
          forStaff: true,
          staffId: null, // General for all staff
        },
        {
          forStaff: true,
          staffId: staffMember.id, // Specific to this staff member
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

