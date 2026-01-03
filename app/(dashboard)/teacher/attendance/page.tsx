import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CalendarCheck, Users } from 'lucide-react'
import Link from 'next/link'

export default async function TeacherAttendancePage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'TEACHER') {
    redirect('/unauthorized')
  }

  const tenantId = session.user.tenantId!

  // Get teacher
  const teacher = await db.teacher.findFirst({
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
          }
        }
      }
    }
  })

  if (!teacher) {
    redirect('/unauthorized')
  }

  // Get unique classes from classSubjects
  const classesMap = new Map()
  teacher.classSubjects.forEach(cs => {
    if (!classesMap.has(cs.class.id)) {
      classesMap.set(cs.class.id, cs.class)
    }
  })
  const classes = Array.from(classesMap.values())

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
    }
  })

  const presentCount = todayAttendance.filter(a => a.status === 'PRESENT').length
  const absentCount = todayAttendance.filter(a => a.status === 'ABSENT').length
  const lateCount = todayAttendance.filter(a => a.status === 'LATE').length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Davomat</h1>
          <p className="text-muted-foreground">
            O'quvchilar davomatini boshqaring
          </p>
        </div>
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
                <div className="text-2xl font-bold text-green-600">{presentCount}</div>
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
                <div className="text-2xl font-bold text-red-600">{absentCount}</div>
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
                <div className="text-2xl font-bold text-orange-600">{lateCount}</div>
                <p className="text-sm text-muted-foreground">Kech kelgan</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Classes */}
      <Card>
        <CardHeader>
          <CardTitle>Mening sinflarim</CardTitle>
        </CardHeader>
        <CardContent>
          {classes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Sizga hech qanday sinf biriktirilmagan
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {classes.map((cls) => (
                <Card key={cls.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-lg">{cls.name}</h3>
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          {cls._count.students} o'quvchi
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {cls.gradeLevel}-sinf, {cls.section} bo'lim
                      </p>
                      <div className="flex gap-2 mt-4">
                        <Link href={`/teacher/attendance/${cls.id}`} className="flex-1">
                          <Button className="w-full" size="sm">
                            <CalendarCheck className="mr-2 h-4 w-4" />
                            Davomat belgilash
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Today's Attendance */}
      {todayAttendance.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Bugungi davomat</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border overflow-x-auto">
              <table className="w-full">
                <thead className="border-b bg-muted/50">
                  <tr>
                    <th className="p-4 text-left text-sm font-medium">O'quvchi</th>
                    <th className="p-4 text-left text-sm font-medium">Sinf</th>
                    <th className="p-4 text-left text-sm font-medium">Status</th>
                    <th className="p-4 text-left text-sm font-medium">Vaqt</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {todayAttendance.map((attendance) => (
                    <tr key={attendance.id} className="hover:bg-muted/50">
                      <td className="p-4">
                        <div className="font-medium">{attendance.student.user?.fullName || 'N/A'}</div>
                      </td>
                      <td className="p-4">{attendance.student.class?.name || '-'}</td>
                      <td className="p-4">
                        <span className={`text-xs px-2 py-1 rounded ${
                          attendance.status === 'PRESENT' ? 'bg-green-100 text-green-800' :
                          attendance.status === 'ABSENT' ? 'bg-red-100 text-red-800' :
                          attendance.status === 'LATE' ? 'bg-orange-100 text-orange-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {attendance.status === 'PRESENT' ? 'Kelgan' :
                           attendance.status === 'ABSENT' ? 'Kelmagan' :
                           attendance.status === 'LATE' ? 'Kech kelgan' :
                           'Sababli'}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-muted-foreground">
                        {new Date(attendance.createdAt).toLocaleTimeString('uz-UZ')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

