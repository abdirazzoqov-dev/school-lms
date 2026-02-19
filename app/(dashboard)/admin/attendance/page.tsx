import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ClipboardCheck, Plus, TrendingUp, Users, UserCheck, UserX, Clock } from 'lucide-react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { AttendanceFilters } from './attendance-filters'
import { AttendanceTable } from './attendance-table'

interface SearchParams {
  date?: string
  period?: 'day' | 'week' | 'month'
  classId?: string
  groupId?: string
  subjectId?: string
  timeSlot?: string
}

// Optimized caching: Cache for 30 seconds for attendance data ⚡
export const revalidate = 30
export const dynamic = 'auto' // Allows Next.js to optimize route caching

export default async function AttendancePage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const session = await getServerSession(authOptions)

  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'MODERATOR')) {
    redirect('/unauthorized')
  }

  const tenantId = session.user.tenantId!

  // Default to today
  const selectedDate = searchParams.date || new Date().toISOString().split('T')[0]
  const period = searchParams.period || 'day'
  const classId = searchParams.classId
  const groupId = searchParams.groupId
  const subjectId = searchParams.subjectId
  const timeSlot = searchParams.timeSlot

  // Calculate date range based on period
  let startDate: Date
  let endDate: Date

  const baseDate = new Date(selectedDate)
  
  if (period === 'week') {
    // Get week start (Monday)
    const day = baseDate.getDay()
    const diff = baseDate.getDate() - day + (day === 0 ? -6 : 1)
    startDate = new Date(baseDate.setDate(diff))
    endDate = new Date(startDate)
    endDate.setDate(startDate.getDate() + 6)
  } else if (period === 'month') {
    startDate = new Date(baseDate.getFullYear(), baseDate.getMonth(), 1)
    endDate = new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, 0)
  } else {
    startDate = baseDate
    endDate = baseDate
  }

  // Build where clause
  const whereClause: any = {
    tenantId,
    date: {
      gte: startDate,
      lte: endDate,
    },
  }

  if (classId) {
    whereClause.classId = classId
  }

  if (subjectId) {
    whereClause.subjectId = subjectId
  }

  if (groupId) {
    whereClause.groupId = groupId
  }

  // Get attendance records
  const [attendances, classes, groups, subjects, totalStudents, timeSlots] = await Promise.all([
    db.attendance.findMany({
      where: whereClause,
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
        group: {
          select: {
            name: true,
          },
        },
        subject: {
          select: {
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
      orderBy: [
        { date: 'desc' },
        { student: { user: { fullName: 'asc' } } },
      ],
    }),
    db.class.findMany({
      where: { tenantId },
      select: {
        id: true,
        name: true,
        _count: { select: { students: true } },
      },
      orderBy: { name: 'asc' },
    }),
    db.group.findMany({
      where: { tenantId },
      select: {
        id: true,
        name: true,
        _count: { select: { students: true } },
      },
      orderBy: { name: 'asc' },
    }),
    db.subject.findMany({
      where: { tenantId },
      select: {
        id: true,
        name: true,
        code: true,
      },
      orderBy: { name: 'asc' },
    }),
    db.student.count({
      where: {
        tenantId,
        status: 'ACTIVE',
        ...(classId && { classId }),
      },
    }),
    // NEW: Get unique time slots from schedules
    db.schedule.findMany({
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
    }),
  ])

  // NEW: Format time slots for filter dropdown
  const formattedTimeSlots = timeSlots.map(slot => ({
    value: `${slot.startTime}-${slot.endTime}`,
    label: `${slot.startTime} - ${slot.endTime}`,
  }))
  
  // Remove duplicates
  const uniqueTimeSlots = Array.from(
    new Map(formattedTimeSlots.map(item => [item.value, item])).values()
  )

  // NEW: Filter attendances by time slot if specified
  // Now we can filter directly from Attendance table (no Schedule join needed)
  let filteredAttendances = attendances
  
  if (timeSlot) {
    const [startTime] = timeSlot.split('-')
    
    // Filter by startTime directly
    filteredAttendances = attendances.filter(att => att.startTime === startTime)
  }
  
  // Calculate statistics from filtered attendances
  const totalRecords = filteredAttendances.length
  const presentCount = filteredAttendances.filter((a) => a.status === 'PRESENT').length
  const absentCount = filteredAttendances.filter((a) => a.status === 'ABSENT').length
  const lateCount = filteredAttendances.filter((a) => a.status === 'LATE').length
  const excusedCount = filteredAttendances.filter((a) => a.status === 'EXCUSED').length

  const attendanceRate = totalRecords > 0 ? (presentCount / totalRecords) * 100 : 0

  // Get unique dates for day view
  const uniqueDates = [...new Set(filteredAttendances.map((a) => a.date.toISOString().split('T')[0]))]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <ClipboardCheck className="h-8 w-8 text-blue-500" />
            Davomat Boshqaruvi
          </h1>
          <p className="text-muted-foreground mt-1">
            O'quvchilar davomati va statistika
          </p>
        </div>
        <Link href="/admin/attendance/mark">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Davomat Belgilash
          </Button>
        </Link>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-800">
              Jami Yozuvlar
            </CardTitle>
            <ClipboardCheck className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-700">{totalRecords}</div>
            <p className="text-xs text-blue-600 mt-1">
              {period === 'day' ? 'Bugun' : period === 'week' ? 'Hafta' : 'Oy'}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-800">
              Kelgan
            </CardTitle>
            <UserCheck className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-700">{presentCount}</div>
            <p className="text-xs text-green-600 mt-1">
              {totalRecords > 0 ? ((presentCount / totalRecords) * 100).toFixed(1) : 0}%
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-red-800">
              Kelmagan
            </CardTitle>
            <UserX className="h-5 w-5 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-700">{absentCount}</div>
            <p className="text-xs text-red-600 mt-1">
              {totalRecords > 0 ? ((absentCount / totalRecords) * 100).toFixed(1) : 0}%
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-800">
              Kech Kelgan
            </CardTitle>
            <Clock className="h-5 w-5 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-700">{lateCount}</div>
            <p className="text-xs text-orange-600 mt-1">
              {totalRecords > 0 ? ((lateCount / totalRecords) * 100).toFixed(1) : 0}%
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-800">
              Davomat Foizi
            </CardTitle>
            <TrendingUp className="h-5 w-5 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-700">
              {attendanceRate.toFixed(1)}%
            </div>
            <p className="text-xs text-purple-600 mt-1">
              Kelganlar nisbati
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <AttendanceFilters
        classes={classes}
        groups={groups}
        subjects={subjects}
        timeSlots={uniqueTimeSlots}
        searchParams={searchParams}
      />

      {/* Attendance Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Davomat Yozuvlari</CardTitle>
              <CardDescription>
                {period === 'day' && `Sana: ${new Date(selectedDate).toLocaleDateString('uz-UZ')}`}
                {period === 'week' && `Hafta: ${startDate.toLocaleDateString('uz-UZ')} - ${endDate.toLocaleDateString('uz-UZ')}`}
                {period === 'month' && `Oy: ${startDate.toLocaleDateString('uz-UZ', { month: 'long', year: 'numeric' })}`}
              </CardDescription>
            </div>
            {filteredAttendances.length > 0 && (
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span>Kelgan</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <span>Kelmagan</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-orange-500" />
                  <span>Kech</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                  <span>Sababli</span>
                </div>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <AttendanceTable
            attendances={filteredAttendances}
            period={period}
            uniqueDates={uniqueDates}
          />
        </CardContent>
      </Card>
    </div>
  )
}

