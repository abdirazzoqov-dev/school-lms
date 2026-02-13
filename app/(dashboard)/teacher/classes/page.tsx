import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { getCurrentAcademicYear } from '@/lib/utils'
import { TeacherClassesClient } from './teacher-classes-client'

export default async function TeacherClassesPage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'TEACHER') {
    redirect('/unauthorized')
  }

  const tenantId = session.user.tenantId!
  const currentYear = getCurrentAcademicYear()

  const teacher = await db.teacher.findUnique({
    where: { userId: session.user.id },
  })

  if (!teacher) {
    return <div>O'qituvchi ma'lumotlari topilmadi</div>
  }

  // Fetch schedules from constructor
  const schedules = await db.schedule.findMany({
    where: {
      tenantId,
      teacherId: teacher.id,
      academicYear: currentYear,
      type: 'LESSON'
    },
    include: {
      class: {
        include: {
          _count: {
            select: {
              students: true
            }
          }
        }
      },
      subject: true
    },
    orderBy: [
      { dayOfWeek: 'asc' },
      { startTime: 'asc' }
    ]
  })

  // Group schedules by class
  const classByIdMap = new Map<string, {
    classId: string
    className: string
    studentCount: number
    schedules: Array<{
      id: string
      subjectId: string
      subjectName: string
      dayOfWeek: number
      startTime: string
      endTime: string
      roomNumber: string | null
    }>
  }>()

  schedules.forEach(schedule => {
    const classId = schedule.class.id
    
    if (!classByIdMap.has(classId)) {
      classByIdMap.set(classId, {
        classId,
        className: schedule.class.name,
        studentCount: schedule.class._count.students,
        schedules: []
      })
    }

    classByIdMap.get(classId)!.schedules.push({
      id: schedule.id,
      subjectId: schedule.subject?.id || '',
      subjectName: schedule.subject?.name || 'Fan nomi yo\'q',
      dayOfWeek: schedule.dayOfWeek,
      startTime: schedule.startTime,
      endTime: schedule.endTime,
      roomNumber: schedule.roomNumber
    })
  })

  const classes = Array.from(classByIdMap.values())

  return <TeacherClassesClient classes={classes} />
}
