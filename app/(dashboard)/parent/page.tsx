import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Award, Calendar, DollarSign, TrendingUp, AlertCircle } from 'lucide-react'

// Smart caching: Revalidate every 60 seconds ⚡
export const revalidate = 60
export const dynamic = 'auto' // Optimized for better caching

export default async function ParentDashboard() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'PARENT') {
    redirect('/unauthorized')
  }

  const tenantId = session.user.tenantId!

  // Get parent record with children
  const parent = await db.parent.findUnique({
    where: { userId: session.user.id },
    include: {
      students: {
        include: {
          student: {
            include: {
              user: {
                select: {
                  fullName: true
                }
              },
              class: true
            }
          }
        }
      }
    }
  })

  if (!parent || parent.students.length === 0) {
    return (
      <div className="space-y-8">
        <h1 className="text-3xl font-bold">Ota-ona Dashboard</h1>
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              Farzandlar ma'lumotlari topilmadi
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const studentIds = parent.students.map(s => s.studentId)

  // Calculate dates
  const oneWeekAgo = new Date()
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
  oneWeekAgo.setHours(0, 0, 0, 0)

  const yearStart = new Date(new Date().getFullYear(), 0, 1)

  // Get all data for children
  const [
    recentGrades,
    recentAttendance,
    pendingPayments,
    totalPayments,
    thisWeekAttendance
  ] = await Promise.all([
    // Recent grades
    db.grade.findMany({
      where: {
        tenantId,
        studentId: { in: studentIds }
      },
      take: 10,
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
    }),
    // Recent attendance
    db.attendance.findMany({
      where: {
        tenantId,
        studentId: { in: studentIds }
      },
      take: 10,
      orderBy: { date: 'desc' },
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
    }),
    // Pending payments
    db.payment.count({
      where: {
        tenantId,
        studentId: { in: studentIds },
        status: 'PENDING'
      }
    }),
    // Total payments this year
    db.payment.aggregate({
      where: {
        tenantId,
        studentId: { in: studentIds },
        status: 'COMPLETED',
        paidDate: {
          gte: yearStart
        }
      },
      _sum: { amount: true }
    }),
    // This week attendance
    db.attendance.count({
      where: {
        tenantId,
        studentId: { in: studentIds },
        date: {
          gte: oneWeekAgo
        },
        status: 'PRESENT'
      }
    })
  ])

  // Calculate average grade
  const averageGrade = recentGrades.length > 0
    ? recentGrades.reduce((acc, grade) => {
        const percentage = (Number(grade.score) / Number(grade.maxScore)) * 100
        return acc + percentage
      }, 0) / recentGrades.length
    : 0

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Ota-ona Dashboard</h1>
        <p className="text-muted-foreground">
          Salom, {session.user.fullName}!
        </p>
      </div>

      {/* Children Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {parent.students.map(({ student }) => (
          <Card key={student.id}>
            <CardHeader>
              <CardTitle className="text-base">
                {student.user?.fullName}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {student.class?.name || 'Sinf biriktirilmagan'}
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Status:</span>
                  <span className="font-medium">
                    <span className={`inline-block rounded-full px-2 py-1 text-xs ${
                      student.status === 'ACTIVE' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {student.status}
                    </span>
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">O'quvchi kodi:</span>
                  <span className="font-mono font-medium">{student.studentCode}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">O'rtacha Ball</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {averageGrade.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Oxirgi baholar asosida
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bu haftaning davomati</CardTitle>
            <Calendar className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{thisWeekAttendance}</div>
            <p className="text-xs text-muted-foreground">
              kun bordi
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">To'lovlar</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Number(totalPayments._sum.amount || 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Bu yil to'langan (so'm)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">To'lanmagan</CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {pendingPayments}
            </div>
            <p className="text-xs text-muted-foreground">
              to'lovlar
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Recent Grades */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
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
                    <p className="font-medium">{grade.subject.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {grade.student.user?.fullName}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-primary">
                      {Number(grade.score)}/{Number(grade.maxScore)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(grade.date).toLocaleDateString('uz-UZ')}
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

        {/* Recent Attendance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Oxirgi Davomat
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentAttendance.map((attendance) => (
                <div
                  key={attendance.id}
                  className="flex items-center justify-between border-b pb-3 last:border-0"
                >
                  <div>
                    <p className="font-medium">{attendance.subject.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {attendance.student.user?.fullName}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-block rounded-full px-2 py-1 text-xs font-semibold ${
                      attendance.status === 'PRESENT' 
                        ? 'bg-green-100 text-green-800'
                        : attendance.status === 'LATE'
                        ? 'bg-yellow-100 text-yellow-800'
                        : attendance.status === 'EXCUSED'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {attendance.status === 'PRESENT' ? 'Bor' :
                       attendance.status === 'LATE' ? 'Kech' :
                       attendance.status === 'EXCUSED' ? 'Sababli' : 'Yo\'q'}
                    </span>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {new Date(attendance.date).toLocaleDateString('uz-UZ')}
                    </p>
                  </div>
                </div>
              ))}
              {recentAttendance.length === 0 && (
                <p className="text-center text-sm text-muted-foreground">
                  Hozircha davomat yo'q
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

