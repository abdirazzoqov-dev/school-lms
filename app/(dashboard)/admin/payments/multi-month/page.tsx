import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { MultiMonthPaymentForm } from './multi-month-form'

export default async function MultiMonthPaymentPage() {
  const session = await getServerSession(authOptions)

  if (!session || !['ADMIN', 'ACCOUNTANT'].includes(session.user.role)) {
    redirect('/unauthorized')
  }

  const tenantId = session.user.tenantId!

  // Get all active students
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
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Bir Nechta Oy Uchun To'lov</h1>
        <p className="text-muted-foreground mt-2">
          O'quvchi bir vaqtda bir nechta oy uchun to'lov qilishi mumkin
        </p>
      </div>

      {/* Form */}
      <MultiMonthPaymentForm students={students} />
    </div>
  )
}

