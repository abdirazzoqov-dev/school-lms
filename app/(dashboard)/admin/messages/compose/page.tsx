import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { getUserPermissions } from '@/lib/permissions'
import { ComposeMessageForm } from './compose-form'

export const dynamic = 'force-dynamic'

export default async function ComposeMessagePage() {
  const session = await getServerSession(authOptions)

  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'MODERATOR')) {
    redirect('/unauthorized')
  }

  // MODERATOR must have messages CREATE permission
  if (session.user.role === 'MODERATOR') {
    const perms = await getUserPermissions(session.user.id, session.user.tenantId!)
    if (!perms.messages?.includes('CREATE') && !perms.messages?.includes('ALL')) {
      redirect('/unauthorized')
    }
  }

  const tenantId = session.user.tenantId!

  // Fetch classes with parent data
  const classes = await db.class.findMany({
    where: { tenantId },
    select: {
      id: true,
      name: true,
      gradeLevel: true,
      students: {
        where: { status: 'ACTIVE' },
        select: {
          id: true,
          parents: {
            select: {
              parent: {
                select: {
                  id: true,
                  user: { select: { id: true, fullName: true } },
                },
              },
            },
          },
        },
      },
    },
    orderBy: [{ gradeLevel: 'asc' }, { name: 'asc' }],
  })

  // Fetch groups with parent data
  const groups = await db.group.findMany({
    where: { tenantId },
    select: {
      id: true,
      name: true,
      students: {
        where: { status: 'ACTIVE' },
        select: {
          id: true,
          parents: {
            select: {
              parent: {
                select: {
                  id: true,
                  user: { select: { id: true, fullName: true } },
                },
              },
            },
          },
        },
      },
    },
    orderBy: { name: 'asc' },
  })

  // Fetch all parents
  const allParents = await db.parent.findMany({
    where: { tenantId },
    select: {
      id: true,
      user: { select: { id: true, fullName: true } },
      students: {
        select: {
          student: {
            select: {
              user: { select: { fullName: true } },
              class: { select: { name: true } },
              group: { select: { name: true } },
            },
          },
        },
      },
    },
    orderBy: { user: { fullName: 'asc' } },
  })

  // Fetch all teachers
  const allTeachers = await db.teacher.findMany({
    where: { tenantId, user: { isActive: true } },
    select: {
      id: true,
      user: { select: { id: true, fullName: true } },
      classSubjects: {
        take: 2,
        select: { subject: { select: { name: true } } },
      },
    },
    orderBy: { user: { fullName: 'asc' } },
  })

  // Fetch all staff
  const allStaff = await db.staff.findMany({
    where: { tenantId, user: { isActive: true } },
    select: {
      id: true,
      position: true,
      user: { select: { id: true, fullName: true } },
    },
    orderBy: { user: { fullName: 'asc' } },
  })

  // Build structured data for client
  const classesData = classes.map(c => {
    const parentUserIds = new Set<string>()
    const parentNames: { userId: string; name: string }[] = []
    c.students.forEach(s => {
      s.parents.forEach(sp => {
        const uid = sp.parent.user.id
        if (!parentUserIds.has(uid)) {
          parentUserIds.add(uid)
          parentNames.push({ userId: uid, name: sp.parent.user.fullName })
        }
      })
    })
    return {
      id: c.id,
      name: c.name,
      gradeLevel: c.gradeLevel,
      studentCount: c.students.length,
      parents: parentNames,
    }
  })

  const groupsData = groups.map(g => {
    const parentUserIds = new Set<string>()
    const parentNames: { userId: string; name: string }[] = []
    g.students.forEach(s => {
      s.parents.forEach(sp => {
        const uid = sp.parent.user.id
        if (!parentUserIds.has(uid)) {
          parentUserIds.add(uid)
          parentNames.push({ userId: uid, name: sp.parent.user.fullName })
        }
      })
    })
    return {
      id: g.id,
      name: g.name,
      studentCount: g.students.length,
      parents: parentNames,
    }
  })

  const parentsData = allParents.map(p => ({
    userId: p.user.id,
    name: p.user.fullName,
    studentInfo: p.students
      .map(sp => {
        const loc = sp.student.class?.name || sp.student.group?.name || ''
        const sName = sp.student.user?.fullName || ''
        return sName ? (loc ? `${sName} (${loc})` : sName) : loc
      })
      .filter(Boolean)
      .join(', '),
  }))

  const teachersData = allTeachers.map(t => ({
    userId: t.user.id,
    name: t.user.fullName,
    subjects: t.classSubjects.map(cs => cs.subject.name).filter(Boolean),
  }))

  const staffData = allStaff.map(s => ({
    userId: s.user.id,
    name: s.user.fullName,
    position: s.position || '',
  }))

  return (
    <ComposeMessageForm
      classesData={classesData}
      groupsData={groupsData}
      parentsData={parentsData}
      teachersData={teachersData}
      staffData={staffData}
      senderName={session.user.name || 'Admin'}
    />
  )
}
