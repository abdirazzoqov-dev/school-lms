import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { ParentAttendanceView } from './parent-attendance-view'

interface SearchParams {
  period?: 'week' | 'month' | 'year'
  studentId?: string
}

export const revalidate = 30
export const dynamic = 'auto'

export default async function ParentAttendancePage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'PARENT') {
    redirect('/unauthorized')
  }

  const tenantId = session.user.tenantId!

  const parent = await db.parent.findFirst({
    where: {
      userId: session.user.id,
      tenantId,
    },
    include: {
      students: {
        include: {
          student: {
            include: {
              user: {
                select: {
                  fullName: true,
                  avatar: true,
                },
              },
              class: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      },
    },
  })

  if (!parent || parent.students.length === 0) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Farzandlarim Davomati
          </h1>
          <p className="text-lg text-muted-foreground mt-2">
            Farzandlaringiz davomati haqida ma'lumot
          </p>
        </div>
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-muted-foreground">Farzandlar topilmadi</p>
        </div>
      </div>
    )
  }

  const children = parent.students.map(sp => sp.student)
  const selectedStudentId = searchParams.studentId || children[0].id
  const selectedStudent = children.find(c => c.id === selectedStudentId) || children[0]

  const period = searchParams.period || 'month'
  let startDate: Date
  let endDate: Date = new Date()

  if (period === 'week') {
    startDate = new Date()
    startDate.setDate(startDate.getDate() - 7)
  } else if (period === 'year') {
    startDate = new Date()
    startDate.setFullYear(startDate.getFullYear() - 1)
  } else {
    startDate = new Date()
    startDate.setMonth(startDate.getMonth() - 1)
  }

  const attendances = await db.attendance.findMany({
    where: {
      tenantId,
      studentId: selectedStudent.id,
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
    include: {
      subject: {
        select: {
          id: true,
          name: true,
          code: true,
        },
      },
      teacher: {
        include: {
          user: {
            select: {
              fullName: true,
            },
          },
        },
      },
    },
    orderBy: {
      date: 'desc',
    },
  })

  return (
    <ParentAttendanceView
      students={children}
      selectedStudent={selectedStudent}
      attendances={attendances}
      period={period}
      startDate={startDate}
      endDate={endDate}
    />
  )
}
