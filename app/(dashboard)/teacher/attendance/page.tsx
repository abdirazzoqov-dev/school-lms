import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { Card, CardContent } from '@/components/ui/card'
import { CalendarCheck, Users, Clock, TrendingUp } from 'lucide-react'
import { TeacherAttendanceFilters } from './teacher-attendance-filters'
import { TeacherAttendanceTable } from './teacher-attendance-table'
import { getCurrentAcademicYear } from '@/lib/utils'

type SearchParams = {
  date?: string
  period?: 'day' | 'week' | 'month'
  classId?: string
  groupId?: string
  subjectId?: string
  timeSlot?: string
}

export default async function TeacherAttendancePage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'TEACHER') {
    redirect('/unauthorized')
  }

  const tenantId = session.user.tenantId!

  // Get teacher
  const teacher = await db.teacher.findFirst({
    where: { userId: session.user.id }
  })

  if (!teacher) {
    redirect('/unauthorized')
  }

  // Get teacher's classes, groups and subjects from schedules
  const [teacherSchedules, groupSchedules] = await Promise.all([
    db.schedule.findMany({
      where: { tenantId, teacherId: teacher.id, academicYear: getCurrentAcademicYear(), type: 'LESSON' },
      include: { class: true, subject: true },
      distinct: ['classId', 'subjectId'],
    }),
    db.groupSchedule.findMany({
      where: { tenantId, teacherId: teacher.id, type: 'LESSON' },
      include: {
        group: { select: { id: true, name: true, _count: { select: { students: true } } } },
        subject: true,
      },
      distinct: ['groupId', 'subjectId'],
    }),
  ])

  // Extract unique classes and subjects (filter out nulls)
  const classes = Array.from(
    new Map(
      teacherSchedules
        .filter(s => s.class !== null)
        .map(s => [s.classId, s.class!])
    ).values()
  )

  const groups = Array.from(
    new Map(
      groupSchedules
        .filter(s => s.group !== null)
        .map(s => [s.groupId, s.group!])
    ).values()
  )

  const subjects = Array.from(
    new Map<string, typeof teacherSchedules[0]['subject'] & {}>([
      ...teacherSchedules.filter(s => s.subject !== null).map(s => [s.subjectId, s.subject!] as [string, NonNullable<typeof s.subject>]),
      ...groupSchedules.filter(s => s.subject !== null).map(s => [s.subjectId, s.subject!] as [string, NonNullable<typeof s.subject>]),
    ])
  ).map(([, v]) => v)

  // Get unique time slots from teacher's schedules
  const [classTimeSlots, groupTimeSlots] = await Promise.all([
    db.schedule.findMany({
      where: { tenantId, teacherId: teacher.id, academicYear: getCurrentAcademicYear(), type: 'LESSON' },
      select: { startTime: true, endTime: true },
      distinct: ['startTime', 'endTime'],
      orderBy: { startTime: 'asc' },
    }),
    db.groupSchedule.findMany({
      where: { tenantId, teacherId: teacher.id, type: 'LESSON' },
      select: { startTime: true, endTime: true },
      distinct: ['startTime', 'endTime'],
      orderBy: { startTime: 'asc' },
    }),
  ])

  const timeSlots = Array.from(
    new Map([
      ...classTimeSlots.map(s => [`${s.startTime}-${s.endTime}`, s]),
      ...groupTimeSlots.map(s => [`${s.startTime}-${s.endTime}`, s]),
    ]).values()
  ).sort((a, b) => a.startTime.localeCompare(b.startTime))

  // Parse filters
  const period = searchParams.period || 'day'
  const selectedDate = searchParams.date ? new Date(searchParams.date) : new Date()
  selectedDate.setHours(0, 0, 0, 0)

  // Calculate date range based on period
  let startDate = new Date(selectedDate)
  let endDate = new Date(selectedDate)

  if (period === 'week') {
    const dayOfWeek = startDate.getDay()
    const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1
    startDate.setDate(startDate.getDate() - diff)
    endDate = new Date(startDate)
    endDate.setDate(endDate.getDate() + 6)
  } else if (period === 'month') {
    startDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1)
    endDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0)
  }

  endDate.setHours(23, 59, 59, 999)

  // Build where clause for attendance
  const whereClause: any = {
    tenantId,
    teacherId: teacher.id,
    date: {
      gte: startDate,
      lte: endDate
    }
  }

  if (searchParams.classId) {
    whereClause.classId = searchParams.classId
  }

  if (searchParams.groupId) {
    const groupStudents = await db.student.findMany({
      where: { tenantId, groupId: searchParams.groupId, status: 'ACTIVE' },
      select: { id: true },
    })
    whereClause.studentId = { in: groupStudents.map((s) => s.id) }
  }

  if (searchParams.subjectId) {
    whereClause.subjectId = searchParams.subjectId
  }

  if (searchParams.timeSlot) {
    whereClause.startTime = searchParams.timeSlot
  }

  // Get attendance records
  const attendanceRecords = await db.attendance.findMany({
    where: whereClause,
    include: {
      student: {
        include: {
          user: {
            select: { fullName: true, avatar: true }
          },
          class: {
            select: { name: true }
          }
        }
      },
      subject: {
        select: { name: true }
      }
    },
    orderBy: [
      { date: 'desc' },
      { startTime: 'asc' }
    ]
  })

  // Filter out records with null user or class (safety check)
  type AttendanceWithRelations = typeof attendanceRecords[0] & {
    student: {
      user: { fullName: string; avatar: string | null }
      class: { name: string }
    } & typeof attendanceRecords[0]['student']
  }

  const attendances = attendanceRecords.filter(
    (record): record is AttendanceWithRelations => 
      record.student.user !== null && record.student.class !== null
  )

  // Calculate statistics
  const totalRecords = attendances.length
  const presentCount = attendances.filter(a => a.status === 'PRESENT').length
  const absentCount = attendances.filter(a => a.status === 'ABSENT').length
  const lateCount = attendances.filter(a => a.status === 'LATE').length
  const attendanceRate = totalRecords > 0 ? ((presentCount / totalRecords) * 100).toFixed(1) : '0'

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          Davomat
        </h1>
        <p className="text-lg text-muted-foreground">
          O'quvchilar davomatini boshqaring va hisobot oling
        </p>
      </div>

      {/* Container with flex for mobile reordering */}
      <div className="flex flex-col">
        {/* Filters - order-2 on mobile (below stats), order-1 on desktop (above stats) */}
        <div className="order-2 lg:order-1 mb-6">
          <TeacherAttendanceFilters 
            classes={classes}
            groups={groups}
            subjects={subjects}
            timeSlots={timeSlots}
          />
        </div>

        {/* Stats Cards - order-1 on mobile (above filters), order-2 on desktop (below filters) */}
        <div className="order-1 lg:order-2 mb-6">
          <div className="grid gap-4 md:grid-cols-4">
            <Card className="border-none shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 card-hover">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg">
                    <Users className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-blue-600">{totalRecords}</div>
                    <p className="text-sm text-muted-foreground font-medium">Jami yozuvlar</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 card-hover">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-lg">
                    <CalendarCheck className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-green-600">{presentCount}</div>
                    <p className="text-sm text-muted-foreground font-medium">Kelgan</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950/20 dark:to-rose-950/20 card-hover">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 text-white shadow-lg">
                    <Clock className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-red-600">{absentCount}</div>
                    <p className="text-sm text-muted-foreground font-medium">Kelmagan</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20 card-hover">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 text-white shadow-lg">
                    <TrendingUp className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-orange-600">{attendanceRate}%</div>
                    <p className="text-sm text-muted-foreground font-medium">Davomat %</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Attendance Table */}
      <TeacherAttendanceTable 
        attendances={attendances}
        startDate={startDate}
        endDate={endDate}
      />
    </div>
  )
}
