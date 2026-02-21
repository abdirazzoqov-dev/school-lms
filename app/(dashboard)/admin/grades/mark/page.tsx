import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Award } from 'lucide-react'
import Link from 'next/link'
import { MarkGradesForm } from './mark-grades-form'

export default async function MarkGradesPage() {
  const session = await getServerSession(authOptions)

  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'MODERATOR')) {
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

  const formattedTimeSlots = timeSlots.map((slot, index) => ({
    label: `${slot.startTime} - ${slot.endTime}`,
    value: `${slot.startTime}-${slot.endTime}`,
    lessonNumber: index + 1,
  }))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/grades">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Award className="h-8 w-8 text-yellow-500" />
            Baho Qo'yish
          </h1>
          <p className="text-muted-foreground mt-1">
            O'quvchilarga baho qo'yish
          </p>
        </div>
      </div>

      {/* Form */}
      <MarkGradesForm
        classes={classes}
        subjects={subjects}
        teachers={teachers}
        timeSlots={formattedTimeSlots}
      />
    </div>
  )
}

