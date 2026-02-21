import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { BulkUpdateForm } from './bulk-update-form'

export default async function BulkUpdateTuitionPage() {
  const session = await getServerSession(authOptions)

  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'MODERATOR')) {
    redirect('/unauthorized')
  }

  const tenantId = session.user.tenantId!

  // Get all active students with their tuition fees
  const students = await db.student.findMany({
    where: {
      tenantId,
      status: 'ACTIVE'
    },
    select: {
      id: true,
      studentCode: true,
      monthlyTuitionFee: true,
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
      createdAt: 'desc'
    }
  })

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Ommaviy To'lov O'zgartirish</h1>
        <p className="text-muted-foreground mt-2">
          Bir nechta o'quvchining oylik to'lovini bir vaqtda o'zgartiring
        </p>
      </div>

      {/* Form */}
      <BulkUpdateForm students={students} />
    </div>
  )
}

