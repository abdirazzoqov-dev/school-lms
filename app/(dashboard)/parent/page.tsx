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
  try {
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
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="rounded-2xl bg-gradient-to-r from-green-500/10 via-emerald-500/10 to-teal-500/10 p-6 border border-green-500/20">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">
          Ota-ona Dashboard
        </h1>
        <p className="text-muted-foreground mt-1">
          Salom, ahmadov sherzod!
        </p>
      </div>

      {/* Children Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {parent.students.map(({ student }, index) => (
          <div
            key={student.id}
            className="group animate-slide-in"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <Card className="border-2 hover:border-green-500/50 hover:shadow-xl transition-all duration-300 hover:scale-[1.02] cursor-pointer overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-500 to-teal-500" />
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg group-hover:text-green-600 transition-colors">
                      {student.user?.fullName}
                    </CardTitle>
                    <p className="text-sm font-medium text-muted-foreground mt-1">
                      {student.class?.name || 'Sinf biriktirilmagan'}
                    </p>
                  </div>
                  <div className="p-2 rounded-full bg-green-100 group-hover:bg-green-200 transition-colors">
                    <Users className="h-5 w-5 text-green-600" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                  <span className="text-sm text-muted-foreground">Status:</span>
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                    student.status === 'ACTIVE' 
                      ? 'bg-green-100 text-green-700 shadow-sm' 
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${
                      student.status === 'ACTIVE' ? 'bg-green-600 animate-pulse' : 'bg-gray-600'
                    }`} />
                    {student.status}
                  </span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                  <span className="text-sm text-muted-foreground">O'quvchi kodi:</span>
                  <span className="font-mono text-sm font-bold">{student.studentCode}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        ))}
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300 hover:scale-[1.02] cursor-pointer border-green-200 hover:border-green-400">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-500/10 to-transparent rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground group-hover:text-green-700 transition-colors">
              O'rtacha Ball
            </CardTitle>
            <div className="p-2 rounded-full bg-green-100 group-hover:bg-green-200 transition-colors">
              <TrendingUp className="h-4 w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600 group-hover:scale-110 transition-transform">
              {averageGrade.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Oxirgi baholar asosida
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300 hover:scale-[1.02] cursor-pointer border-blue-200 hover:border-blue-400">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-transparent rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground group-hover:text-blue-700 transition-colors">
              Bu haftaning davomati
            </CardTitle>
            <div className="p-2 rounded-full bg-blue-100 group-hover:bg-blue-200 transition-colors">
              <Calendar className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600 group-hover:scale-110 transition-transform">
              {thisWeekAttendance}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              kun bordi
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300 hover:scale-[1.02] cursor-pointer border-emerald-200 hover:border-emerald-400">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-500/10 to-transparent rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground group-hover:text-emerald-700 transition-colors">
              To'lovlar
            </CardTitle>
            <div className="p-2 rounded-full bg-emerald-100 group-hover:bg-emerald-200 transition-colors">
              <DollarSign className="h-4 w-4 text-emerald-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-600 group-hover:scale-110 transition-transform">
              {Number(totalPayments._sum.amount || 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Bu yil to'langan (so'm)
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300 hover:scale-[1.02] cursor-pointer border-orange-200 hover:border-orange-400">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-orange-500/10 to-transparent rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground group-hover:text-orange-700 transition-colors">
              To'lanmagan
            </CardTitle>
            <div className="p-2 rounded-full bg-orange-100 group-hover:bg-orange-200 transition-colors">
              <AlertCircle className="h-4 w-4 text-orange-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600 group-hover:scale-110 transition-transform">
              {pendingPayments}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              to'lovlar
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Recent Grades */}
        <Card className="hover:shadow-xl transition-all duration-300 border-2 hover:border-primary/30">
          <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent border-b">
            <CardTitle className="flex items-center gap-2 text-lg">
              <div className="p-2 rounded-lg bg-primary/10">
                <Award className="h-5 w-5 text-primary" />
              </div>
              Oxirgi Baholar
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-3">
              {recentGrades.map((grade, index) => (
                <div
                  key={grade.id}
                  className="flex items-center justify-between p-3 rounded-lg border hover:border-primary/50 hover:bg-primary/5 transition-all duration-300 group cursor-pointer"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex-1">
                    <p className="font-semibold group-hover:text-primary transition-colors">
                      {grade.subject.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {grade.student.user?.fullName}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-primary group-hover:scale-110 transition-transform inline-block">
                      {Number(grade.score)}/{Number(grade.maxScore)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {new Date(grade.date).toLocaleDateString('uz-UZ')}
                    </p>
                  </div>
                </div>
              ))}
              {recentGrades.length === 0 && (
                <div className="text-center py-8">
                  <Award className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">
                    Hozircha baholar yo'q
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Attendance */}
        <Card className="hover:shadow-xl transition-all duration-300 border-2 hover:border-blue-500/30">
          <CardHeader className="bg-gradient-to-r from-blue-500/5 to-transparent border-b">
            <CardTitle className="flex items-center gap-2 text-lg">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
              Oxirgi Davomat
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-3">
              {recentAttendance.map((attendance, index) => (
                <div
                  key={attendance.id}
                  className="flex items-center justify-between p-3 rounded-lg border hover:border-blue-500/50 hover:bg-blue-500/5 transition-all duration-300 group cursor-pointer"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex-1">
                    <p className="font-semibold group-hover:text-blue-600 transition-colors">
                      {attendance.subject.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {attendance.student.user?.fullName}
                    </p>
                  </div>
                  <div className="text-right space-y-1">
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold shadow-sm ${
                      attendance.status === 'PRESENT' 
                        ? 'bg-green-100 text-green-800'
                        : attendance.status === 'LATE'
                        ? 'bg-yellow-100 text-yellow-800'
                        : attendance.status === 'EXCUSED'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${
                        attendance.status === 'PRESENT' ? 'bg-green-600' :
                        attendance.status === 'LATE' ? 'bg-yellow-600' :
                        attendance.status === 'EXCUSED' ? 'bg-blue-600' : 'bg-red-600'
                      }`} />
                      {attendance.status === 'PRESENT' ? 'Bor' :
                       attendance.status === 'LATE' ? 'Kech' :
                       attendance.status === 'EXCUSED' ? 'Sababli' : 'Yo\'q'}
                    </span>
                    <p className="text-xs text-muted-foreground">
                      {new Date(attendance.date).toLocaleDateString('uz-UZ')}
                    </p>
                  </div>
                </div>
              ))}
              {recentAttendance.length === 0 && (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">
                    Hozircha davomat yo'q
                  </p>
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
      console.error('Parent dashboard error:', error)
    }
    // Re-throw to trigger error boundary
    throw error
  }
}

