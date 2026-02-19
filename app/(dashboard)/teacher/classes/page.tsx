import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { getCurrentAcademicYear } from '@/lib/utils'
import { TeacherClassesClient } from './teacher-classes-client'

export const revalidate = 0
export const dynamic = 'force-dynamic'

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

  // Fetch class schedules from constructor
  const classSchedules = await db.schedule.findMany({
    where: {
      tenantId,
      teacherId: teacher.id,
      academicYear: currentYear,
      type: 'LESSON'
    },
    include: {
      class: {
        include: {
          _count: { select: { students: true } }
        }
      },
      subject: true
    },
    orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }]
  })

  // Fetch group schedules
  const groupSchedules = await db.groupSchedule.findMany({
    where: {
      tenantId,
      teacherId: teacher.id,
      type: 'LESSON'
    },
    include: {
      group: {
        include: {
          _count: { select: { students: true } }
        }
      },
      subject: true
    },
    orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }]
  })

  // Group class schedules by classId
  const classByIdMap = new Map<string, {
    id: string
    name: string
    studentCount: number
    type: 'CLASS'
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

  classSchedules.forEach(schedule => {
    const classId = schedule.class.id
    if (!classByIdMap.has(classId)) {
      classByIdMap.set(classId, {
        id: classId,
        name: schedule.class.name,
        studentCount: schedule.class._count.students,
        type: 'CLASS',
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

  // Group group schedules by groupId
  const groupByIdMap = new Map<string, {
    id: string
    name: string
    studentCount: number
    type: 'GROUP'
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

  groupSchedules.forEach(schedule => {
    if (!schedule.group) return
    const groupId = schedule.group.id
    if (!groupByIdMap.has(groupId)) {
      groupByIdMap.set(groupId, {
        id: groupId,
        name: schedule.group.name,
        studentCount: schedule.group._count.students,
        type: 'GROUP',
        schedules: []
      })
    }
    groupByIdMap.get(groupId)!.schedules.push({
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
  const groups = Array.from(groupByIdMap.values())

  return <TeacherClassesClient classes={classes} groups={groups} />
}
