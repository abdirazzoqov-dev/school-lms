import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText, BarChart3, Users, TrendingUp } from 'lucide-react'
import { AttendanceChart } from '@/components/charts/attendance-chart'
import { GradeDistributionChart } from '@/components/charts/grade-distribution-chart'
import { getCurrentAcademicYear } from '@/lib/utils'

export default async function TeacherReportsPage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'TEACHER') {
    redirect('/unauthorized')
  }

  const tenantId = session.user.tenantId!
  const academicYear = getCurrentAcademicYear()

  // Get teacher
  const teacher = await db.teacher.findFirst({
    where: { userId: session.user.id }
  })

  if (!teacher) {
    redirect('/unauthorized')
  }

  // Get teacher's classes
  const classSubjects = await db.classSubject.findMany({
    where: { teacherId: teacher.id },
    include: {
      class: true,
      subject: true
    }
  })

  // Get unique classes
  const classesMap = new Map()
  classSubjects.forEach(cs => {
    if (!classesMap.has(cs.class.id)) {
      classesMap.set(cs.class.id, cs.class)
    }
  })
  const classes = Array.from(classesMap.values())

  // Get statistics
  const totalStudents = await db.student.count({
    where: {
      tenantId,
      classId: { in: classes.map(c => c.id) }
    }
  })

  const totalGrades = await db.grade.count({
    where: {
      tenantId,
      teacherId: teacher.id
    }
  })

  const totalAttendance = await db.attendance.count({
    where: {
      tenantId,
      teacherId: teacher.id
    }
  })

  // Get attendance data for chart (last 7 days)
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    d.setHours(0, 0, 0, 0)
    return d
  })

  const attendanceData = await Promise.all(
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

      return {
        date: date.toLocaleDateString('uz-UZ', { month: 'short', day: 'numeric' }),
        present,
        absent,
        late,
        total: attendance.length
      }
    })
  )

  // Get grade distribution
  const grades = await db.grade.findMany({
    where: {
      tenantId,
      teacherId: teacher.id
    }
  })

  const totalGradesForChart = grades.length || 1 // Avoid division by zero
  
  const gradeDistribution = [
    { 
      range: '5 (85-100)', 
      count: grades.filter(g => Number(g.score) >= 85).length,
      percentage: (grades.filter(g => Number(g.score) >= 85).length / totalGradesForChart) * 100
    },
    { 
      range: '4 (70-84)', 
      count: grades.filter(g => Number(g.score) >= 70 && Number(g.score) < 85).length,
      percentage: (grades.filter(g => Number(g.score) >= 70 && Number(g.score) < 85).length / totalGradesForChart) * 100
    },
    { 
      range: '3 (55-69)', 
      count: grades.filter(g => Number(g.score) >= 55 && Number(g.score) < 70).length,
      percentage: (grades.filter(g => Number(g.score) >= 55 && Number(g.score) < 70).length / totalGradesForChart) * 100
    },
    { 
      range: '2 (0-54)', 
      count: grades.filter(g => Number(g.score) < 55).length,
      percentage: (grades.filter(g => Number(g.score) < 55).length / totalGradesForChart) * 100
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Hisobotlar</h1>
        <p className="text-muted-foreground">
          O'quv faoliyati statistikasi va tahlillari
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{totalStudents}</div>
                <p className="text-sm text-muted-foreground">O'quvchilar</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <BarChart3 className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{classes.length}</div>
                <p className="text-sm text-muted-foreground">Sinflar</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-purple-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{totalGrades}</div>
                <p className="text-sm text-muted-foreground">Baholar</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-orange-100 rounded-lg">
                <FileText className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{totalAttendance}</div>
                <p className="text-sm text-muted-foreground">Davomat</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <AttendanceChart data={attendanceData} />
        <GradeDistributionChart data={gradeDistribution} />
      </div>

      {/* My Classes */}
      <Card>
        <CardHeader>
          <CardTitle>Mening Sinflarim</CardTitle>
        </CardHeader>
        <CardContent>
          {classes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Sizga sinflar biriktirilmagan
            </div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <table className="w-full">
                <thead className="border-b bg-muted/50">
                  <tr>
                    <th className="p-4 text-left text-sm font-medium">Sinf</th>
                    <th className="p-4 text-left text-sm font-medium">Daraja</th>
                    <th className="p-4 text-left text-sm font-medium">Bo'lim</th>
                    <th className="p-4 text-left text-sm font-medium">O'quv yili</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {classes.map((cls) => (
                    <tr key={cls.id} className="hover:bg-muted/50">
                      <td className="p-4 font-medium">{cls.name}</td>
                      <td className="p-4">{cls.gradeLevel}</td>
                      <td className="p-4">{cls.section}</td>
                      <td className="p-4">{cls.academicYear}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <BarChart3 className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-900 mb-1">
                Hisobotlar
              </h3>
              <p className="text-sm text-blue-800">
                Bu yerda sizning o'qitish faoliyatingiz bo'yicha statistika va tahlillar ko'rsatiladi.
                Davomatni kuzatish, baholarni tahlil qilish va o'quvchilar natijalari haqida ma'lumot olish mumkin.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

