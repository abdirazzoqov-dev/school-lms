import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { PaymentFormClient } from './payment-form-client'

export const revalidate = 0
export const dynamic = 'force-dynamic'

export default async function CreatePaymentPage({
  searchParams
}: {
  searchParams: { studentId?: string; month?: string; year?: string }
}) {
  const session = await getServerSession(authOptions)

  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'MODERATOR')) {
    redirect('/unauthorized')
  }

  const tenantId = session.user.tenantId!

  // Fetch students and classes server-side (no API needed)
  const [students, classes] = await Promise.all([
    db.student.findMany({
      where: { tenantId },
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
            id: true,
            name: true,
          }
        }
      },
      orderBy: { studentCode: 'asc' }
    }),
    db.class.findMany({
      where: { tenantId },
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            students: true
          }
        }
      },
      orderBy: { name: 'asc' }
    })
  ])

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/payments">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Yangi To'lov</h2>
          <p className="text-muted-foreground">O'quvchi to'lovini ro'yxatga oling</p>
        </div>
      </div>

      <PaymentFormClient 
        initialStudents={students} 
        initialClasses={classes}
        preSelectedStudentId={searchParams.studentId}
        preSelectedMonth={searchParams.month ? parseInt(searchParams.month) : undefined}
        preSelectedYear={searchParams.year ? parseInt(searchParams.year) : undefined}
      />
    </div>
  )
}

