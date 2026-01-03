import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, BookOpen, ClipboardCheck, FileText, Calendar, TrendingUp } from 'lucide-react'
import { getCurrentAcademicYear } from '@/lib/utils'
import { GradeDistributionChart } from '@/components/charts/grade-distribution-chart'
import { AttendanceChart } from '@/components/charts/attendance-chart'

// Smart caching: Revalidate every 60 seconds ⚡
export const revalidate = 60
export const dynamic = 'auto' // Optimized for better caching

export default async function TeacherDashboard() {
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
      const percentage = (g.score / g.maxScore) * 100
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
      <div>
        <h1 className="text-3xl font-bold">O'qituvchi Dashboard</h1>
        <p className="text-muted-foreground">
          Salom, {session.user.fullName}!
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mening O'quvchilarim</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStudents}</div>
            <p className="text-xs text-muted-foreground">
              {teacher.classSubjects.length} ta sinf
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bugungi Davomat</CardTitle>
            <ClipboardCheck className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayAttendance}</div>
            <p className="text-xs text-muted-foreground">
              Belgilangan
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tekshirish Kerak</CardTitle>
            <FileText className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{pendingGrades}</div>
            <p className="text-xs text-muted-foreground">
              Topshirilgan vazifalar
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Uy Vazifalari</CardTitle>
            <BookOpen className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAssignments}</div>
            <p className="text-xs text-muted-foreground">
              Jami topshiriqlar
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <AttendanceChart data={teacherAttendanceData} />
        <GradeDistributionChart data={teacherGradeDistribution} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Today's Schedule */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Bugungi Darslar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {todaySchedule.map((schedule) => {
                const isBreak = schedule.type === 'BREAK'
                const isLunch = schedule.type === 'LUNCH'
                
                return (
                  <div
                    key={schedule.id}
                    className="flex items-center justify-between border-b pb-3 last:border-0"
                  >
                    <div>
                      <p className="font-medium">
                        {isBreak && <span className="text-amber-700">☕ {schedule.title || 'Tanafus'}</span>}
                        {isLunch && <span className="text-green-700">🍽️ {schedule.title || 'Tushlik'}</span>}
                        {!isBreak && !isLunch && schedule.subject?.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {schedule.class.name} {schedule.roomNumber && `- Xona ${schedule.roomNumber}`}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono text-sm font-semibold">
                        {schedule.startTime} - {schedule.endTime}
                      </p>
                    </div>
                  </div>
                )
              })}
              {todaySchedule.length === 0 && (
                <p className="text-center text-sm text-muted-foreground">
                  Bugun darslar yo'q
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Grades */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Oxirgi Baholar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentGrades.map((grade) => (
                <div
                  key={grade.id}
                  className="flex items-center justify-between border-b pb-3 last:border-0"
                >
                  <div>
                    <p className="font-medium">
                      {grade.student.user?.fullName || 'Noma\'lum'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {grade.subject.name}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-primary">
                      {Number(grade.score)}/{Number(grade.maxScore)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {grade.gradeType}
                    </p>
                  </div>
                </div>
              ))}
              {recentGrades.length === 0 && (
                <p className="text-center text-sm text-muted-foreground">
                  Hozircha baholar yo'q
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Classes */}
      <Card>
        <CardHeader>
          <CardTitle>Mening Sinflarim</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {teacher.classSubjects.map((cs) => (
              <Card key={cs.id}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">{cs.class.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">{cs.subject.name}</p>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold">{cs.class._count.students}</p>
                      <p className="text-xs text-muted-foreground">o'quvchi</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">{cs.hoursPerWeek} soat/hafta</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {teacher.classSubjects.length === 0 && (
              <p className="col-span-full text-center text-muted-foreground">
                Sinflar biriktirilmagan
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

