import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { Timetable } from '@/components/timetable'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar, Clock } from 'lucide-react'
import { getCurrentAcademicYear } from '@/lib/utils'

export default async function TeacherSchedulePage() {
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

  const academicYear = getCurrentAcademicYear()

  // Get teacher's schedule
  const schedules = await db.schedule.findMany({
    where: {
      tenantId,
      teacherId: teacher.id,
      academicYear
    },
    include: {
      subject: true,
      class: true
    },
    orderBy: [
      { dayOfWeek: 'asc' },
      { startTime: 'asc' }
    ]
  })

  // Get statistics
  const totalLessons = schedules.length
  const uniqueDays = new Set(schedules.map(s => s.dayOfWeek)).size
  const uniqueClasses = new Set(schedules.map(s => s.classId)).size

  // Calculate total hours per week
  const totalMinutes = schedules.reduce((sum, schedule) => {
    const start = schedule.startTime.split(':').map(Number)
    const end = schedule.endTime.split(':').map(Number)
    const startMinutes = start[0] * 60 + start[1]
    const endMinutes = end[0] * 60 + end[1]
    return sum + (endMinutes - startMinutes)
  }, 0)
  const totalHours = (totalMinutes / 60).toFixed(1)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Mening Dars Jadvalim</h1>
        <p className="text-muted-foreground">
          {academicYear} o'quv yili
        </p>
      </div>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{totalLessons}</div>
                <p className="text-sm text-muted-foreground">Haftalik darslar</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <Clock className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{totalHours}</div>
                <p className="text-sm text-muted-foreground">Soat/hafta</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Calendar className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{uniqueDays}</div>
                <p className="text-sm text-muted-foreground">Ish kunlari</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Calendar className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{uniqueClasses}</div>
                <p className="text-sm text-muted-foreground">Sinflar</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Timetable */}
      <Timetable 
        schedules={schedules}
        title="Haftalik Dars Jadvali"
        showClass={true}
        showTeacher={false}
      />

      {schedules.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Sizga hozircha darslar biriktirilmagan</p>
            <p className="text-sm mt-2">Administrator bilan bog'laning</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

