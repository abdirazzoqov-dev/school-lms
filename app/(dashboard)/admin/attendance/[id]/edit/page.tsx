import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { EditAttendanceForm } from './edit-attendance-form'

interface PageProps {
  params: {
    id: string
  }
}

export default async function EditAttendancePage({ params }: PageProps) {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'ADMIN') {
    redirect('/unauthorized')
  }

  const tenantId = session.user.tenantId!

  // Get attendance record
  const attendance = await db.attendance.findFirst({
    where: {
      id: params.id,
      tenantId,
    },
    include: {
      student: {
        include: {
          user: {
            select: {
              fullName: true,
            },
          },
        },
      },
      class: {
        select: {
          name: true,
        },
      },
      subject: {
        select: {
          name: true,
        },
      },
    },
  })

  if (!attendance) {
    notFound()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/admin/attendance/${attendance.id}`}>
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Davomatni Tahrirlash</h1>
          <p className="text-muted-foreground mt-1">
            {attendance.student.user?.fullName} - {attendance.subject.name}
          </p>
        </div>
      </div>

      {/* Form */}
      <EditAttendanceForm attendance={attendance} />
    </div>
  )
}

