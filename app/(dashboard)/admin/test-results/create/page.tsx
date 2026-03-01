import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { TestResultsForm } from './test-results-form'

export const revalidate = 0
export const dynamic = 'force-dynamic'

export default async function CreateTestResultsPage() {
  const session = await getServerSession(authOptions)

  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'MODERATOR')) {
    redirect('/unauthorized')
  }

  const tenantId = session.user.tenantId!

  // Get teacher ID if moderator is a teacher
  let teacherId: string | null = null
  if (session.user.role === 'MODERATOR') {
    const teacher = await db.teacher.findFirst({ where: { userId: session.user.id } })
    if (teacher) teacherId = teacher.id
    if (!teacher) {
      // Try as staff
      const staff = await db.staff.findFirst({ where: { userId: session.user.id } })
      // Staff can still enter results; teacherId stays null (will use first available)
    }
  }

  const [students, classes, groups, subjects, teachers] = await Promise.all([
    db.student.findMany({
      where: { tenantId },
      include: {
        user: { select: { fullName: true, avatar: true } },
        class: { select: { id: true, name: true } }
      },
      orderBy: { user: { fullName: 'asc' } }
    }),
    db.class.findMany({
      where: { tenantId },
      include: {
        students: {
          include: {
            user: { select: { fullName: true, avatar: true } }
          }
        }
      },
      orderBy: { name: 'asc' }
    }),
    db.group.findMany({
      where: { tenantId },
      include: {
        students: {
          include: {
            user: { select: { fullName: true, avatar: true } }
          }
        }
      },
      orderBy: { name: 'asc' }
    }),
    db.subject.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' }
    }),
    db.teacher.findMany({
      where: { tenantId },
      include: { user: { select: { fullName: true } } },
      orderBy: { user: { fullName: 'asc' } }
    })
  ])

  const now = new Date()
  const currentYear = `${now.getFullYear()}-${now.getFullYear() + 1}`

  return (
    <TestResultsForm
      students={students as any}
      classes={classes as any}
      groups={groups as any}
      subjects={subjects}
      teachers={teachers as any}
      defaultTeacherId={teacherId}
      currentYear={currentYear}
    />
  )
}
