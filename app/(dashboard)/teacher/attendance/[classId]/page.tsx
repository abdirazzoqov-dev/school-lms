import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { AttendanceMarkingForm } from './attendance-marking-form'

export default async function AttendanceMarkingPage({
  params,
}: {
  params: { classId: string }
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

  // Get class with students
  const classData = await db.class.findFirst({
    where: {
      id: params.classId,
      classTeacherId: teacher.id,
      tenantId
    },
    include: {
      students: {
        where: { status: 'ACTIVE' },
        include: {
          user: {
            select: {
              fullName: true,
              email: true
            }
          }
        },
        orderBy: {
          user: { fullName: 'asc' }
        }
      }
    }
  })

  if (!classData) {
    redirect('/teacher/attendance')
  }

  // Get today's attendance for this class
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const todayAttendance = await db.attendance.findMany({
    where: {
      classId: params.classId,
      date: today
    },
    include: {
      student: {
        include: {
          user: {
            select: { fullName: true }
          }
        }
      }
    }
  })

  // Get last 7 days attendance stats
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  sevenDaysAgo.setHours(0, 0, 0, 0)

  const recentAttendance = await db.attendance.findMany({
    where: {
      classId: params.classId,
      date: {
        gte: sevenDaysAgo,
        lt: today
      }
    }
  })

  const presentCount = recentAttendance.filter(a => a.status === 'PRESENT').length
  const absentCount = recentAttendance.filter(a => a.status === 'ABSENT').length
  const attendanceRate = recentAttendance.length > 0 
    ? ((presentCount / recentAttendance.length) * 100).toFixed(1)
    : '0'

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/teacher/attendance">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Orqaga
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">{classData.name}</h1>
          <p className="text-muted-foreground">
            {classData.students.length} ta o'quvchi
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">{presentCount}</div>
            <p className="text-sm text-muted-foreground">Kelganlar (7 kun)</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-red-600">{absentCount}</div>
            <p className="text-sm text-muted-foreground">Kelmaganlar (7 kun)</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600">{attendanceRate}%</div>
            <p className="text-sm text-muted-foreground">Davomat ko'rsatkichi</p>
          </CardContent>
        </Card>
      </div>

      {/* Attendance Marking Form */}
      <Card>
        <CardHeader>
          <CardTitle>Davomat belgilash</CardTitle>
        </CardHeader>
        <CardContent>
          <AttendanceMarkingForm
            classData={classData}
            students={classData.students}
            todayAttendance={todayAttendance}
          />
        </CardContent>
      </Card>
    </div>
  )
}

