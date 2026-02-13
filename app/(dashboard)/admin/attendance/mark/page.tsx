import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { Button } from '@/components/ui/button'
import { ArrowLeft, ClipboardCheck } from 'lucide-react'
import Link from 'next/link'
import { MarkAttendanceForm } from './mark-attendance-form'

export default async function MarkAttendancePage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'ADMIN') {
    redirect('/unauthorized')
  }

  const tenantId = session.user.tenantId!

  // Get classes with students
  const classes = await db.class.findMany({
    where: { tenantId },
    include: {
      students: {
        where: { status: 'ACTIVE' },
        include: {
          user: {
            select: {
              fullName: true,
            },
          },
        },
        orderBy: {
          user: {
            fullName: 'asc',
          },
        },
      },
      _count: {
        select: { students: true },
      },
    },
    orderBy: { name: 'asc' },
  })

  // Get subjects
  const subjects = await db.subject.findMany({
    where: { tenantId },
    select: {
      id: true,
      name: true,
      code: true,
    },
    orderBy: { name: 'asc' },
  })

  // Get teachers
  const teachers = await db.teacher.findMany({
    where: { tenantId },
    include: {
      user: {
        select: {
          fullName: true,
        },
      },
    },
    orderBy: {
      user: {
        fullName: 'asc',
      },
    },
  })

  // Get unique time slots from schedules
  const timeSlots = await db.schedule.findMany({
    where: {
      tenantId,
      type: 'LESSON',
    },
    select: {
      startTime: true,
      endTime: true,
    },
    distinct: ['startTime', 'endTime'],
    orderBy: {
      startTime: 'asc',
    },
  })

  // Format time slots
  const formattedTimeSlots = timeSlots.map(slot => ({
    value: `${slot.startTime}-${slot.endTime}`,
    label: `${slot.startTime} - ${slot.endTime}`,
  }))
  
  // Remove duplicates
  const uniqueTimeSlots = Array.from(
    new Map(formattedTimeSlots.map(item => [item.value, item])).values()
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/attendance">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <ClipboardCheck className="h-8 w-8 text-blue-500" />
            Davomat Belgilash
          </h1>
          <p className="text-muted-foreground mt-1">
            Sinfni tanlang va davomatni belgilang
          </p>
        </div>
      </div>

      {/* Form */}
      <MarkAttendanceForm
        classes={classes}
        subjects={subjects}
        teachers={teachers}
        timeSlots={uniqueTimeSlots}
      />
    </div>
  )
}

