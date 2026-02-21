import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, FileText, Download, TrendingUp, BarChart3 } from 'lucide-react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'

export const revalidate = 30 // Optimized for faster loads
export const dynamic = 'auto' // Optimized for better caching

export default async function AttendanceReportsPage() {
  const session = await getServerSession(authOptions)

  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'MODERATOR')) {
    redirect('/unauthorized')
  }

  const tenantId = session.user.tenantId!

  // Get overall statistics
  const [
    totalAttendances,
    presentCount,
    absentCount,
    lateCount,
    excusedCount,
    classesList,
  ] = await Promise.all([
    db.attendance.count({ where: { tenantId } }),
    db.attendance.count({ where: { tenantId, status: 'PRESENT' } }),
    db.attendance.count({ where: { tenantId, status: 'ABSENT' } }),
    db.attendance.count({ where: { tenantId, status: 'LATE' } }),
    db.attendance.count({ where: { tenantId, status: 'EXCUSED' } }),
    db.class.findMany({
      where: { tenantId },
      include: {
        _count: {
          select: {
            students: true,
            attendances: true,
          },
        },
      },
    }),
  ])

  const attendanceRate = totalAttendances > 0 ? (presentCount / totalAttendances) * 100 : 0

  // Class-wise attendance
  const classAttendance = await Promise.all(
    classesList.map(async (cls) => {
      const classPresent = await db.attendance.count({
        where: { tenantId, classId: cls.id, status: 'PRESENT' },
      })
      const classTotal = await db.attendance.count({
        where: { tenantId, classId: cls.id },
      })
      
      return {
        class: cls,
        presentCount: classPresent,
        totalCount: classTotal,
        attendanceRate: classTotal > 0 ? (classPresent / classTotal) * 100 : 0,
      }
    })
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/attendance">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <FileText className="h-8 w-8 text-blue-500" />
              Davomat Hisobotlari
            </h1>
            <p className="text-muted-foreground mt-1">
              Umumiy statistika va tahlillar
            </p>
          </div>
        </div>
        <Button className="gap-2">
          <Download className="h-4 w-4" />
          Export
        </Button>
      </div>

      {/* Overall Statistics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Jami Yozuvlar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalAttendances}</div>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-700">
              Kelganlar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-700">{presentCount}</div>
            <p className="text-xs text-green-600 mt-1">
              {totalAttendances > 0 ? ((presentCount / totalAttendances) * 100).toFixed(1) : 0}%
            </p>
          </CardContent>
        </Card>

        <Card className="border-red-200 bg-red-50/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-700">
              Kelmaganlar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-700">{absentCount}</div>
            <p className="text-xs text-red-600 mt-1">
              {totalAttendances > 0 ? ((absentCount / totalAttendances) * 100).toFixed(1) : 0}%
            </p>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-orange-50/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-orange-700">
              Kech Kelganlar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-700">{lateCount}</div>
            <p className="text-xs text-orange-600 mt-1">
              {totalAttendances > 0 ? ((lateCount / totalAttendances) * 100).toFixed(1) : 0}%
            </p>
          </CardContent>
        </Card>

        <Card className="border-purple-200 bg-purple-50/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-purple-700">
              Umumiy Foiz
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-700">
              {attendanceRate.toFixed(1)}%
            </div>
            <p className="text-xs text-purple-600 mt-1">
              <TrendingUp className="h-3 w-3 inline mr-1" />
              Davomat
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Class-wise Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Sinflar Bo'yicha Statistika
          </CardTitle>
          <CardDescription>
            Har bir sinfning davomat ko'rsatkichlari
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {classAttendance
              .sort((a, b) => b.attendanceRate - a.attendanceRate)
              .map((item) => (
                <div key={item.class.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold">{item.class.name}</h3>
                      <Badge variant="outline">
                        {item.class._count.students} o'quvchi
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-muted-foreground">
                        {item.presentCount}/{item.totalCount}
                      </span>
                      <span className={`font-bold ${
                        item.attendanceRate >= 80
                          ? 'text-green-600'
                          : item.attendanceRate >= 60
                          ? 'text-orange-600'
                          : 'text-red-600'
                      }`}>
                        {item.attendanceRate.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full transition-all ${
                        item.attendanceRate >= 80
                          ? 'bg-green-500'
                          : item.attendanceRate >= 60
                          ? 'bg-orange-500'
                          : 'bg-red-500'
                      }`}
                      style={{ width: `${item.attendanceRate}%` }}
                    />
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      <Card className="border-blue-200 bg-blue-50/50">
        <CardHeader>
          <CardTitle className="text-blue-900">Xulosa</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-blue-800">
          <p>
            • Umumiy davomat foizi: <strong>{attendanceRate.toFixed(1)}%</strong>
          </p>
          <p>
            • Eng yuqori davomat: <strong>
              {classAttendance.length > 0 
                ? `${classAttendance[0].class.name} - ${classAttendance[0].attendanceRate.toFixed(1)}%`
                : 'Ma\'lumot yo\'q'
              }
            </strong>
          </p>
          <p>
            • Jami belgilangan davomat: <strong>{totalAttendances} ta</strong>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

