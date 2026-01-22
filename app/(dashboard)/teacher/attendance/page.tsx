import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CalendarCheck, Users, Download, FileSpreadsheet } from 'lucide-react'
import Link from 'next/link'
import { AttendanceTable } from '@/components/teacher/attendance-table'

export default async function TeacherAttendancePage() {
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

  // Get today's date
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Get today's attendance for teacher's classes
  const todayAttendance = await db.attendance.findMany({
    where: {
      teacherId: teacher.id,
      date: today,
    },
    include: {
      student: {
        include: {
          user: {
            select: { fullName: true }
          },
          class: {
            select: { name: true }
          }
        }
      }
    },
    orderBy: {
      createdAt: 'asc'
    }
  })

  const presentCount = todayAttendance.filter(a => a.status === 'PRESENT').length
  const absentCount = todayAttendance.filter(a => a.status === 'ABSENT').length
  const lateCount = todayAttendance.filter(a => a.status === 'LATE').length

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Davomat</h1>
          <p className="text-muted-foreground">
            O'quvchilar davomatini boshqaring
          </p>
        </div>
        
        {/* Export Buttons */}
        {todayAttendance.length > 0 && (
          <div className="flex gap-2">
            <form action="/api/teacher/attendance/export" method="POST">
              <input type="hidden" name="format" value="excel" />
              <input type="hidden" name="date" value={today.toISOString()} />
              <Button variant="outline" type="submit">
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Excel
              </Button>
            </form>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{todayAttendance.length}</div>
                <p className="text-sm text-muted-foreground">Bugun belgilangan</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <CalendarCheck className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{presentCount}</div>
                <p className="text-sm text-muted-foreground">Kelgan</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-red-100 rounded-lg">
                <CalendarCheck className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{absentCount}</div>
                <p className="text-sm text-muted-foreground">Kelmagan</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-orange-100 rounded-lg">
                <CalendarCheck className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{lateCount}</div>
                <p className="text-sm text-muted-foreground">Kech kelgan</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Attendance Table with Filters */}
      {todayAttendance.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Bugungi davomat</CardTitle>
          </CardHeader>
          <CardContent>
            <AttendanceTable attendances={todayAttendance} />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Bugun hali davomat belgilanmagan
          </CardContent>
        </Card>
      )}
    </div>
  )
}
