import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Users, BookOpen, ClipboardCheck, FileText, Calendar, TrendingUp, Award, UserCheck, Clock } from 'lucide-react'
import { getCurrentAcademicYear } from '@/lib/utils'
import { GradeDistributionChart } from '@/components/charts/grade-distribution-chart'
import { AttendanceChart } from '@/components/charts/attendance-chart'

// Smart caching: Revalidate every 60 seconds ⚡
export const revalidate = 60
export const dynamic = 'auto' // Optimized for better caching

export default async function TeacherDashboard() {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'TEACHER') {
      redirect('/unauthorized')
    }

    const tenantId = session.user.tenantId!

    // Get teacher record
    const teacher = await db.teacher.findUnique({
    where: { userId: session.user.id },
    include: {
      classSubjects: {
        include: {
          class: {
            include: {
              _count: {
                select: { students: true }
              }
            }
          },
          subject: true
        }
      }
    }
  })

  if (!teacher) {
    return <div>O'qituvchi ma'lumotlari topilmadi</div>
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Get statistics
  const [
    totalStudents,
    todayAttendance,
    pendingGrades,
    totalAssignments,
    recentGrades
  ] = await Promise.all([
    // Total students in teacher's classes
    db.student.count({
      where: {
        tenantId,
        classId: {
          in: teacher.classSubjects.map(cs => cs.classId)
        }
      }
    }),
    // Today's attendance marked
    db.attendance.count({
      where: {
        tenantId,
        teacherId: teacher.id,
        date: today
      }
    }),
    // Pending grades (assignments submitted but not graded)
    db.assignmentSubmission.count({
      where: {
        assignment: {
          teacherId: teacher.id
        },
        status: 'PENDING'
      }
    }),
    // Total assignments
    db.assignment.count({
      where: {
        tenantId,
        teacherId: teacher.id
      }
    }),
    // Recent grades
    db.grade.findMany({
      where: {
        tenantId,
        teacherId: teacher.id
      },
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        student: {
          include: {
            user: {
              select: { fullName: true }
            }
          }
        },
        subject: true
      }
    })
  ])

  // Today's schedule
  const todaySchedule = await db.schedule.findMany({
    where: {
      tenantId,
      teacherId: teacher.id,
      dayOfWeek: new Date().getDay() || 7, // Sunday = 7
      academicYear: getCurrentAcademicYear()
    },
    include: {
      class: true,
      subject: true
    },
    orderBy: { startTime: 'asc' }
  })

  // Attendance data for last 7 days (teacher's classes)
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    d.setHours(0, 0, 0, 0)
    return d
  })

  const teacherAttendanceData = await Promise.all(
    last7Days.map(async (date) => {
      const attendance = await db.attendance.findMany({
        where: {
          tenantId,
          teacherId: teacher.id,
          date: date
        }
      })

      const present = attendance.filter(a => a.status === 'PRESENT').length
      const absent = attendance.filter(a => a.status === 'ABSENT').length
      const late = attendance.filter(a => a.status === 'LATE').length
      const total = attendance.length

      return {
        date: date.toLocaleDateString('uz-UZ', { day: '2-digit', month: '2-digit' }),
        present,
        absent,
        late,
        rate: total > 0 ? (present / total) * 100 : 0
      }
    })
  )

  // Grade distribution for teacher's grades
  const teacherGrades = await db.grade.findMany({
    where: {
      tenantId,
      teacherId: teacher.id
    },
    take: 200
  })

  const gradeRanges = [
    { range: '0-39% (F)', min: 0, max: 39 },
    { range: '40-69% (D-C)', min: 40, max: 69 },
    { range: '70-89% (B)', min: 70, max: 89 },
    { range: '90-100% (A)', min: 90, max: 100 }
  ]

  const teacherGradeDistribution = gradeRanges.map(({ range, min, max }) => {
    const count = teacherGrades.filter(g => {
      const percentage = (Number(g.score) / Number(g.maxScore)) * 100
      return percentage >= min && percentage <= max
    }).length
    return {
      range,
      count,
      percentage: teacherGrades.length > 0 ? (count / teacherGrades.length) * 100 : 0
    }
  })

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          O'qituvchi Dashboard
        </h1>
        <p className="text-lg text-muted-foreground">
          Salom, <span className="font-semibold text-gray-900 dark:text-gray-100">{session.user.fullName}</span>! 👋
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-none shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 hover:shadow-xl transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg">
                <UserCheck className="h-6 w-6" />
              </div>
              <div>
                <div className="text-3xl font-bold text-blue-600">{totalStudents}</div>
                <p className="text-sm text-muted-foreground font-medium">
                  {teacher.classSubjects.length} ta sinf
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 hover:shadow-xl transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-lg">
                <ClipboardCheck className="h-6 w-6" />
              </div>
              <div>
                <div className="text-3xl font-bold text-green-600">{todayAttendance}</div>
                <p className="text-sm text-muted-foreground font-medium">Bugungi davomat</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20 hover:shadow-xl transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 text-white shadow-lg">
                <FileText className="h-6 w-6" />
              </div>
              <div>
                <div className="text-3xl font-bold text-orange-600">{pendingGrades}</div>
                <p className="text-sm text-muted-foreground font-medium">Tekshirish kerak</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 hover:shadow-xl transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 text-white shadow-lg">
                <BookOpen className="h-6 w-6" />
              </div>
              <div>
                <div className="text-3xl font-bold text-purple-600">{totalAssignments}</div>
                <p className="text-sm text-muted-foreground font-medium">Uy vazifalari</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <AttendanceChart data={teacherAttendanceData} />
        <GradeDistributionChart data={teacherGradeDistribution} />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Today's Schedule */}
        <Card className="border-none shadow-lg">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
            <CardTitle className="flex items-center gap-2 text-blue-600">
              <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                <Calendar className="h-5 w-5" />
              </div>
              Bugungi Darslar
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-3">
              {todaySchedule.map((schedule) => {
                const isBreak = schedule.type === 'BREAK'
                const isLunch = schedule.type === 'LUNCH'
                
                return (
                  <div
                    key={schedule.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 hover:shadow-md transition-shadow"
                  >
                    <div className="flex-1">
                      <p className="font-semibold">
                        {isBreak && <span className="text-amber-600">☕ {schedule.title || 'Tanafus'}</span>}
                        {isLunch && <span className="text-green-600">🍽️ {schedule.title || 'Tushlik'}</span>}
                        {!isBreak && !isLunch && <span className="text-gray-900 dark:text-gray-100">{schedule.subject?.name}</span>}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {schedule.class.name}
                        </Badge>
                        {schedule.roomNumber && (
                          <span className="text-xs text-muted-foreground">
                            Xona {schedule.roomNumber}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-sm font-mono font-semibold bg-blue-100 dark:bg-blue-950/50 px-3 py-1.5 rounded-lg">
                        <Clock className="h-3 w-3" />
                        {schedule.startTime}
                      </div>
                    </div>
                  </div>
                )
              })}
              {todaySchedule.length === 0 && (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                  <p className="text-sm text-muted-foreground">Bugun darslar yo'q</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Grades */}
        <Card className="border-none shadow-lg">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20">
            <CardTitle className="flex items-center gap-2 text-purple-600">
              <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 text-white">
                <Award className="h-5 w-5" />
              </div>
              Oxirgi Baholar
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-3">
              {recentGrades.map((grade) => {
                const percentage = (Number(grade.score) / Number(grade.maxScore)) * 100
                const gradeColor = 
                  percentage >= 90 ? 'text-green-600' :
                  percentage >= 70 ? 'text-blue-600' :
                  percentage >= 40 ? 'text-orange-600' :
                  'text-red-600'
                
                return (
                  <div
                    key={grade.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 hover:shadow-md transition-shadow"
                  >
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 dark:text-gray-100">
                        {grade.student.user?.fullName || 'Noma\'lum'}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm text-muted-foreground">
                          {grade.subject.name}
                        </span>
                        <Badge variant="secondary" className="text-xs">
                          {grade.gradeType}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-2xl font-bold ${gradeColor}`}>
                        {Number(grade.score)}/{Number(grade.maxScore)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {percentage.toFixed(0)}%
                      </p>
                    </div>
                  </div>
                )
              })}
              {recentGrades.length === 0 && (
                <div className="text-center py-8">
                  <Award className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                  <p className="text-sm text-muted-foreground">Hozircha baholar yo'q</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
  } catch (error) {
    // Log error in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Teacher dashboard error:', error)
    }
    // Re-throw to trigger error boundary
    throw error
  }
}

