import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Users, BookOpen, Calendar } from 'lucide-react'
import { getCurrentAcademicYear } from '@/lib/utils'
import Link from 'next/link'
import { LessonReminder } from '@/components/teacher/lesson-reminder'
import { TodayLessons } from '@/components/teacher/today-lessons'

// Smart caching: Revalidate every 60 seconds ⚡
export const revalidate = 60
export const dynamic = 'auto'

export default async function TeacherDashboard() {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'TEACHER') {
      redirect('/unauthorized')
    }

    const tenantId = session.user.tenantId!

    // Get teacher record
    const teacher = await db.teacher.findUnique({
      where: { userId: session.user.id }
    })

    if (!teacher) {
      return (
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-muted-foreground">O'qituvchi ma'lumotlari topilmadi</p>
        </div>
      )
    }

    // Get ALL teacher's schedules first to debug
    const allTeacherSchedules = await db.schedule.findMany({
      where: {
        tenantId,
        teacherId: teacher.id,
        academicYear: getCurrentAcademicYear()
      },
      include: {
        class: {
          include: {
            _count: {
              select: { students: true }
            }
          }
        },
        subject: true
      },
      orderBy: { startTime: 'asc' }
    })

    // Get today's schedule from constructor
    const today = new Date()
    const dayOfWeek = today.getDay() // 0-6, Sunday-Saturday
    
    // Convert JavaScript day (0-6, Sun-Sat) to database day (1-7, Mon-Sun)
    const dbDayOfWeek = dayOfWeek === 0 ? 7 : dayOfWeek

    const todaySchedule = allTeacherSchedules.filter(s => s.dayOfWeek === dbDayOfWeek)

    // Get quick stats - fetch all schedules to count unique classes and subjects
    const totalClasses = new Set(allTeacherSchedules.map(s => s.classId)).size
    const totalSubjects = new Set(allTeacherSchedules.map(s => s.subjectId)).size

    // Days of week
    const daysOfWeek = ['Yakshanba', 'Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba']
    const todayName = daysOfWeek[dayOfWeek]

    // Filter out schedules with null subject for lesson reminder
    const validSchedules = todaySchedule.filter((s): s is typeof s & { subject: NonNullable<typeof s.subject>; subjectId: string } => 
      s.subject !== null && s.subjectId !== null
    )

    // Debug info to show on page
    const debugInfo = {
      teacherId: teacher.id,
      dayOfWeek: dayOfWeek,
      dbDayOfWeek: dbDayOfWeek,
      todayName: todayName,
      academicYear: getCurrentAcademicYear(),
      totalSchedules: allTeacherSchedules.length,
      todayScheduleCount: todaySchedule.length,
      scheduleDays: [...new Set(allTeacherSchedules.map(s => s.dayOfWeek))].sort()
    }

    console.log('🔍 Teacher Dashboard Debug:', debugInfo)

    return (
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Dashboard
          </h1>
          <p className="text-lg text-muted-foreground">
            Salom, <span className="font-semibold text-foreground">{session.user.fullName}</span>! 👋
          </p>
        </div>

        {/* Debug Info Card - TEMPORARY */}
        <Card className="border-2 border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20">
          <CardContent className="pt-6">
            <h3 className="font-bold text-lg mb-2">🔍 Debug Ma'lumotlari:</h3>
            <div className="space-y-1 text-sm font-mono">
              <p>Bugun: <strong>{todayName}</strong> (JS: {dayOfWeek}, DB: {dbDayOfWeek})</p>
              <p>O'quv yili: <strong>{debugInfo.academicYear}</strong></p>
              <p>Jami darslar: <strong>{debugInfo.totalSchedules}</strong></p>
              <p>Bugungi darslar: <strong>{debugInfo.todayScheduleCount}</strong></p>
              <p>Mavjud kunlar: <strong>{debugInfo.scheduleDays.join(', ')}</strong></p>
              {todaySchedule.length > 0 && (
                <div className="mt-2 pt-2 border-t">
                  <p className="font-bold">Birinchi dars:</p>
                  <p>Fan: {todaySchedule[0].subject?.name}</p>
                  <p>Sinf: {todaySchedule[0].class?.name}</p>
                  <p>Vaqt: {todaySchedule[0].startTime} - {todaySchedule[0].endTime}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Lesson Reminder - Show 5-10 minutes before lesson */}
        <LessonReminder schedules={validSchedules} />

        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-none shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 card-hover">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg">
                  <Users className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-3xl font-bold text-blue-600">{totalClasses}</div>
                  <p className="text-sm text-muted-foreground font-medium">Sinflar</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 card-hover">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 text-white shadow-lg">
                  <BookOpen className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-3xl font-bold text-purple-600">{totalSubjects}</div>
                  <p className="text-sm text-muted-foreground font-medium">Fanlar</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 card-hover">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-lg">
                  <Calendar className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-3xl font-bold text-green-600">{todaySchedule.length}</div>
                  <p className="text-sm text-muted-foreground font-medium">Bugungi darslar</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Today's Schedule */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Bugungi Darslar</h2>
              <p className="text-muted-foreground">
                {todayName} - {today.toLocaleDateString('uz-UZ', { day: '2-digit', month: 'long', year: 'numeric' })}
              </p>
            </div>
            <Link href="/teacher/schedule">
              <Button variant="outline" className="gap-2">
                <Calendar className="h-4 w-4" />
                To'liq Jadval
              </Button>
            </Link>
          </div>

          {validSchedules.length > 0 ? (
            <TodayLessons schedules={validSchedules} />
          ) : (
            <Card className="border-dashed border-2">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <div className="p-4 rounded-full bg-purple-50 dark:bg-purple-950/20 mb-4">
                  <Calendar className="h-12 w-12 text-purple-400" />
                </div>
                <h3 className="text-xl font-semibold mb-2">
                  Bugun dars yo'q
                </h3>
                <p className="text-muted-foreground max-w-md">
                  Bugun sizning dars jadvlingizda dars yo'q. Dam oling yoki boshqa ishlar bilan shug'ullaning!
                </p>
                <Link href="/teacher/schedule" className="mt-6">
                  <Button variant="outline" className="gap-2">
                    <Calendar className="h-4 w-4" />
                    To'liq Jadvalga O'tish
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    )
  } catch (error) {
    console.error('Teacher dashboard error:', error)
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-destructive font-semibold mb-2">Xatolik yuz berdi</p>
            <p className="text-sm text-muted-foreground">
              Dashboard ma'lumotlarini yuklashda muammo yuz berdi. Iltimos, sahifani yangilang.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }
}
