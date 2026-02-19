import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Users, Download, ArrowLeft, TrendingUp, UserCheck, UserX, GraduationCap
} from 'lucide-react'
import Link from 'next/link'
import { formatNumber } from '@/lib/utils'

export const revalidate = 0
export const dynamic = 'force-dynamic'

export default async function StudentsReportPage({
  searchParams
}: {
  searchParams: { classId?: string; status?: string }
}) {
  const session = await getServerSession(authOptions)

  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'MODERATOR')) {
    redirect('/unauthorized')
  }

  const tenantId = session.user.tenantId!
  
  // Build where clause
  const where: any = { tenantId }
  if (searchParams.classId) where.classId = searchParams.classId
  if (searchParams.status) where.status = searchParams.status

  // Get students with full details
  const students = await db.student.findMany({
    where,
    include: {
      user: {
        select: {
          fullName: true,
          email: true,
          phone: true,
          isActive: true
        }
      },
      class: {
        select: {
          name: true,
          gradeLevel: true
        }
      },
      payments: {
        select: {
          amount: true,
          paidAmount: true,
          status: true
        }
      },
      attendances: {
        where: {
          createdAt: {
            gte: new Date(new Date().setMonth(new Date().getMonth() - 1))
          }
        },
        select: {
          status: true
        }
      },
      grades: {
        where: {
          date: {
            gte: new Date(new Date().setMonth(new Date().getMonth() - 1))
          }
        },
        select: {
          score: true
        }
      }
    },
    orderBy: {
      user: {
        fullName: 'asc'
      }
    }
  })

  // Get all classes for filter
  const classes = await db.class.findMany({
    where: { tenantId },
    select: {
      id: true,
      name: true,
      gradeLevel: true
    },
    orderBy: {
      gradeLevel: 'asc'
    }
  })

  // Calculate statistics
  const totalStudents = students.length
  const activeStudents = students.filter(s => s.status === 'ACTIVE').length
  const graduatedStudents = students.filter(s => s.status === 'GRADUATED').length
  const expelledStudents = students.filter(s => s.status === 'EXPELLED').length

  // Gender breakdown
  const maleStudents = students.filter(s => s.gender === 'MALE').length
  const femaleStudents = students.filter(s => s.gender === 'FEMALE').length

  // Payment statistics
  const totalRevenue = students.reduce((sum, s) => 
    sum + s.payments.reduce((pSum, p) => pSum + Number(p.paidAmount || 0), 0), 0
  )
  const avgRevenue = totalStudents > 0 ? totalRevenue / totalStudents : 0

  // Attendance statistics
  const totalAttendance = students.reduce((sum, s) => sum + s.attendances.length, 0)
  const presentCount = students.reduce((sum, s) => 
    sum + s.attendances.filter(a => a.status === 'PRESENT').length, 0
  )
  const avgAttendance = totalAttendance > 0 ? (presentCount / totalAttendance) * 100 : 0

  // Grade statistics
  const allGrades = students.flatMap(s => s.grades.map(g => Number(g.score)))
  const avgGrade = allGrades.length > 0 ? allGrades.reduce((a, b) => a + b, 0) / allGrades.length : 0

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/reports">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">O'quvchilar Hisoboti</h1>
          <p className="text-muted-foreground">
            Barcha o'quvchilar bo'yicha batafsil statistika va ma'lumotlar
          </p>
        </div>
        <Button asChild className="bg-blue-600 hover:bg-blue-700">
          <Link href={`/api/admin/reports/students/export?classId=${searchParams.classId || ''}&status=${searchParams.status || ''}`}>
            <Download className="mr-2 h-4 w-4" />
            Excel
          </Link>
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Jami O'quvchilar</p>
                <p className="text-3xl font-bold text-blue-600">{totalStudents}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-green-100">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Faol</p>
                <p className="text-3xl font-bold text-green-600">{activeStudents}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <UserCheck className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">O'rtacha Baho</p>
                <p className="text-3xl font-bold text-purple-600">{avgGrade.toFixed(1)}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <GraduationCap className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-orange-100">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Davomat %</p>
                <p className="text-3xl font-bold text-orange-600">{avgAttendance.toFixed(1)}%</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <TrendingUp className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Card */}
      <Card>
        <CardHeader>
          <CardTitle>Filtrlar</CardTitle>
          <CardDescription>O'quvchilarni sinf va status bo'yicha filtrlang</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 flex-wrap">
            <Link href="/admin/reports/students">
              <Button variant={!searchParams.classId && !searchParams.status ? "default" : "outline"} size="sm">
                Barchasi
              </Button>
            </Link>
            {classes.map(cls => (
              <Link key={cls.id} href={`/admin/reports/students?classId=${cls.id}`}>
                <Button variant={searchParams.classId === cls.id ? "default" : "outline"} size="sm">
                  {cls.name}
                </Button>
              </Link>
            ))}
            <Link href="/admin/reports/students?status=ACTIVE">
              <Button variant={searchParams.status === 'ACTIVE' ? "default" : "outline"} size="sm" className="bg-green-600 text-white hover:bg-green-700">
                Faol
              </Button>
            </Link>
            <Link href="/admin/reports/students?status=GRADUATED">
              <Button variant={searchParams.status === 'GRADUATED' ? "default" : "outline"} size="sm" className="bg-blue-600 text-white hover:bg-blue-700">
                Bitirgan
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Students Table */}
      <Card>
        <CardHeader>
          <CardTitle>O'quvchilar Ro'yxati ({students.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {students.map(student => {
              const totalPaid = student.payments.reduce((sum, p) => sum + Number(p.paidAmount || 0), 0)
              const studentAttendanceRate = student.attendances.length > 0
                ? (student.attendances.filter(a => a.status === 'PRESENT').length / student.attendances.length) * 100
                : 0
              const studentAvgGrade = student.grades.length > 0
                ? student.grades.reduce((sum, g) => sum + Number(g.score), 0) / student.grades.length
                : 0

              return (
                <div key={student.id} className="p-4 border-2 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold">{student.user?.fullName || 'N/A'}</h3>
                        {student.status === 'ACTIVE' && (
                          <Badge className="bg-green-600">Faol</Badge>
                        )}
                        {student.status === 'GRADUATED' && (
                          <Badge className="bg-blue-600">Bitirgan</Badge>
                        )}
                        {student.status === 'EXPELLED' && (
                          <Badge className="bg-red-600">Haydal gan</Badge>
                        )}
                        {student.class && (
                          <Badge variant="outline">{student.class.name}</Badge>
                        )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-2 text-sm">
                        <div>
                          <p className="text-muted-foreground">Kod:</p>
                          <p className="font-medium">{student.studentCode}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">O'rtacha baho:</p>
                          <p className="font-medium">{studentAvgGrade > 0 ? studentAvgGrade.toFixed(1) : 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Davomat:</p>
                          <p className="font-medium">{studentAttendanceRate.toFixed(0)}%</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">To'langan:</p>
                          <p className="font-medium">{formatNumber(totalPaid)} so'm</p>
                        </div>
                      </div>
                    </div>
                    <Link href={`/admin/students/${student.id}`}>
                      <Button variant="outline" size="sm">
                        Batafsil
                      </Button>
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Summary Statistics */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Jins bo'yicha taqsimot</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span>O'g'il bolalar</span>
                <Badge>{maleStudents} ({totalStudents > 0 ? ((maleStudents / totalStudents) * 100).toFixed(0) : 0}%)</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Qiz bolalar</span>
                <Badge>{femaleStudents} ({totalStudents > 0 ? ((femaleStudents / totalStudents) * 100).toFixed(0) : 0}%)</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Moliyaviy Ko'rsatkichlar</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span>Jami to'lovlar</span>
                <Badge>{formatNumber(totalRevenue)} so'm</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>O'rtacha (o'quvchi)</span>
                <Badge>{formatNumber(Math.round(avgRevenue))} so'm</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
