import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { ComposeMessageForm } from './compose-message-form'
import { getCurrentAcademicYear } from '@/lib/utils'

export default async function ParentComposeMessagePage({
  searchParams,
}: {
  searchParams: { replyTo?: string }
}) {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'PARENT') {
    redirect('/unauthorized')
  }

  const tenantId = session.user.tenantId!

  const parent = await db.parent.findFirst({
    where: { userId: session.user.id }
  })

  if (!parent) {
    redirect('/unauthorized')
  }

  // Get parent's children with their teachers FROM SCHEDULE
  const children = await db.studentParent.findMany({
    where: { parentId: parent.id },
    include: {
      student: {
        include: {
          user: {
            select: { fullName: true }
          },
          class: {
            select: {
              name: true,
              id: true
            }
          }
        }
      }
    }
  })

  // Get teachers who teach these students from Schedule
  const teachersMap = new Map()
  const studentsMap = new Map()

  for (const { student } of children) {
    studentsMap.set(student.id, {
      id: student.id,
      name: student.user?.fullName || 'Unknown',
      className: student.class?.name || 'Unknown'
    })

    if (student.classId) {
      // Get all schedules for this class
      const schedules = await db.schedule.findMany({
        where: {
          classId: student.classId,
          tenantId,
          academicYear: getCurrentAcademicYear(),
          type: 'LESSON'
        },
        include: {
          teacher: {
            include: {
              user: {
                select: { id: true, fullName: true }
              }
            }
          },
          subject: {
            select: { name: true }
          }
        },
        distinct: ['teacherId', 'subjectId']
      })

      schedules.forEach(schedule => {
        if (schedule.teacher && schedule.subject) {
          const teacherKey = schedule.teacher.user.id
          
          if (!teachersMap.has(teacherKey)) {
            teachersMap.set(teacherKey, {
              id: schedule.teacher.user.id,
              name: schedule.teacher.user.fullName,
              subjects: [],
              students: []
            })
          }
          
          const teacherData = teachersMap.get(teacherKey)
          
          // Add subject if not exists
          if (!teacherData.subjects.find((s: string) => s === schedule.subject.name)) {
            teacherData.subjects.push(schedule.subject.name)
          }
          
          // Add student if not exists
          if (!teacherData.students.find((s: any) => s.id === student.id)) {
            teacherData.students.push({
              id: student.id,
              name: student.user?.fullName || 'Unknown',
              className: student.class?.name || 'Unknown'
            })
          }
        }
      })
    }
  }

  const teachers = Array.from(teachersMap.values())
  const students = Array.from(studentsMap.values())

  // If replying to a message
  let replyToMessage = null
  if (searchParams.replyTo) {
    replyToMessage = await db.message.findFirst({
      where: {
        id: searchParams.replyTo,
        tenantId,
        receiverId: session.user.id
      },
      include: {
        sender: {
          select: { id: true, fullName: true }
        }
      }
    })
  }

  return <ComposeMessageForm teachers={teachers} students={students} replyToMessage={replyToMessage} />
}
