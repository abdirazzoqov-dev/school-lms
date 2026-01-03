import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { ClipboardCheck, TrendingUp, UserCheck, UserX, Clock, Calendar } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { AttendanceFilters } from './attendance-filters'
import { AttendanceStats } from './attendance-stats'
import { AttendanceCalendar } from './attendance-calendar'

interface SearchParams {
  period?: 'week' | 'month' | 'year'
  studentId?: string
}

export const revalidate = 30 // Optimized for faster loads
export const dynamic = 'auto' // Optimized for better caching

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

  // Get parent
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

  if (!parent) {
    redirect('/unauthorized')
  }

  // Get all children
  const children = parent.students.map(sp => sp.student)

  if (children.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <ClipboardCheck className="h-8 w-8 text-blue-500" />
            Farzandlarim Davomati
          </h1>
          <p className="text-muted-foreground mt-1">
            Farzandlaringiz davomati haqida ma'lumot
          </p>
        </div>

        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <UserCheck className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Farzandlar topilmadi</h3>
            <p className="text-muted-foreground">
              Sizga bog'langan farzandlar yo'q
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Default to first child if not specified
  const selectedStudentId = searchParams.studentId || children[0].id
  const selectedStudent = children.find(c => c.id === selectedStudentId) || children[0]

  // Calculate date range based on period
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
    // month
    startDate = new Date()
    startDate.setMonth(startDate.getMonth() - 1)
  }

  // Get attendance records for selected student
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

  // Calculate statistics
  const totalRecords = attendances.length
  const presentCount = attendances.filter(a => a.status === 'PRESENT').length
  const absentCount = attendances.filter(a => a.status === 'ABSENT').length
  const lateCount = attendances.filter(a => a.status === 'LATE').length
  const excusedCount = attendances.filter(a => a.status === 'EXCUSED').length

  const attendanceRate = totalRecords > 0 ? (presentCount / totalRecords) * 100 : 0

  // Group by subject
  const bySubject = attendances.reduce((acc, att) => {
    const subjectName = att.subject.name
    if (!acc[subjectName]) {
      acc[subjectName] = {
        total: 0,
        present: 0,
        absent: 0,
        late: 0,
        excused: 0,
      }
    }
    acc[subjectName].total++
    if (att.status === 'PRESENT') acc[subjectName].present++
    if (att.status === 'ABSENT') acc[subjectName].absent++
    if (att.status === 'LATE') acc[subjectName].late++
    if (att.status === 'EXCUSED') acc[subjectName].excused++
    return acc
  }, {} as Record<string, { total: number; present: number; absent: number; late: number; excused: number }>)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <ClipboardCheck className="h-8 w-8 text-blue-500" />
          Farzandlarim Davomati
        </h1>
        <p className="text-muted-foreground mt-1">
          Farzandlaringiz davomati haqida ma'lumot
        </p>
      </div>

      {/* Filters */}
      <AttendanceFilters
        students={children}
        searchParams={searchParams}
        selectedStudent={selectedStudent}
      />

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-800">
              Jami Darslar
            </CardTitle>
            <ClipboardCheck className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-700">{totalRecords}</div>
            <p className="text-xs text-blue-600 mt-1">
              {period === 'week' ? 'So\'ngi hafta' : period === 'month' ? 'So\'ngi oy' : 'So\'ngi yil'}
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
              Umumiy ko'rsatkich
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Progress Indicator */}
      <Card>
        <CardHeader>
          <CardTitle>Davomat Darajasi</CardTitle>
          <CardDescription>
            {selectedStudent.user?.fullName} ning umumiy davomat ko'rsatkichi
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="w-full bg-gray-200 rounded-full h-6">
              <div
                className={`h-6 rounded-full transition-all flex items-center justify-center text-xs font-semibold text-white ${
                  attendanceRate >= 90
                    ? 'bg-green-500'
                    : attendanceRate >= 75
                    ? 'bg-blue-500'
                    : attendanceRate >= 60
                    ? 'bg-orange-500'
                    : 'bg-red-500'
                }`}
                style={{ width: `${attendanceRate}%` }}
              >
                {attendanceRate > 10 && `${attendanceRate.toFixed(1)}%`}
              </div>
            </div>
            <div className="grid grid-cols-4 gap-2 text-center text-sm">
              <div>
                <div className="flex items-center justify-center gap-1 mb-1">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="text-xs text-muted-foreground">A'lo</span>
                </div>
                <p className="font-semibold">≥ 90%</p>
              </div>
              <div>
                <div className="flex items-center justify-center gap-1 mb-1">
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                  <span className="text-xs text-muted-foreground">Yaxshi</span>
                </div>
                <p className="font-semibold">75-89%</p>
              </div>
              <div>
                <div className="flex items-center justify-center gap-1 mb-1">
                  <div className="w-3 h-3 rounded-full bg-orange-500" />
                  <span className="text-xs text-muted-foreground">O'rta</span>
                </div>
                <p className="font-semibold">60-74%</p>
              </div>
              <div>
                <div className="flex items-center justify-center gap-1 mb-1">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <span className="text-xs text-muted-foreground">Past</span>
                </div>
                <p className="font-semibold">{'<'} 60%</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Subject-wise Breakdown */}
      {Object.keys(bySubject).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Fanlar Bo'yicha Davomat</CardTitle>
            <CardDescription>
              Har bir fan bo'yicha davomat statistikasi
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(bySubject)
                .sort((a, b) => (b[1].present / b[1].total) - (a[1].present / a[1].total))
                .map(([subject, stats]) => {
                  const subjectRate = (stats.present / stats.total) * 100

                  return (
                    <div key={subject} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold">{subject}</h3>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="text-green-600 font-semibold">
                            {stats.present} kelgan
                          </span>
                          {stats.absent > 0 && (
                            <span className="text-red-600 font-semibold">
                              {stats.absent} kelmagan
                            </span>
                          )}
                          {stats.late > 0 && (
                            <span className="text-orange-600 font-semibold">
                              {stats.late} kech
                            </span>
                          )}
                          <span className="font-bold">{subjectRate.toFixed(1)}%</span>
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            subjectRate >= 90
                              ? 'bg-green-500'
                              : subjectRate >= 75
                              ? 'bg-blue-500'
                              : subjectRate >= 60
                              ? 'bg-orange-500'
                              : 'bg-red-500'
                          }`}
                          style={{ width: `${subjectRate}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Attendance */}
      <AttendanceCalendar attendances={attendances} period={period} />
    </div>
  )
}
