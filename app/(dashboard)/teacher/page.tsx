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

// Real-time updates: Always fetch fresh data for schedule changes ⚡
export const revalidate = 0 // No caching - always fresh data
export const dynamic = 'force-dynamic' // Force dynamic rendering

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

    const today = new Date()
    const dayOfWeek = today.getDay() // 0-6, Sunday-Saturday
    // Convert JavaScript day (0-6, Sun-Sat) to database day (1-7, Mon-Sun)
    const dbDayOfWeek = dayOfWeek === 0 ? 7 : dayOfWeek

    // Get ALL teacher's class schedules
    const allClassSchedules = await db.schedule.findMany({
      where: {
        tenantId,
        teacherId: teacher.id,
        academicYear: getCurrentAcademicYear()
      },
      include: {
        class: {
          include: { _count: { select: { students: true } } }
        },
        subject: true
      },
      orderBy: { startTime: 'asc' }
    })

    // Get ALL teacher's group schedules
    const allGroupSchedules = await db.groupSchedule.findMany({
      where: {
        tenantId,
        teacherId: teacher.id,
      },
      include: {
        group: {
          include: { _count: { select: { students: true } } }
        },
        subject: true
      },
      orderBy: { startTime: 'asc' }
    })

    // Today's schedules combined
    const todayClassSchedules = allClassSchedules.filter(s => s.dayOfWeek === dbDayOfWeek)
    const todayGroupSchedules = allGroupSchedules.filter(s => s.dayOfWeek === dbDayOfWeek)

    // Quick stats
    const totalClasses = new Set(allClassSchedules.map(s => s.classId)).size
    const totalGroups = new Set(allGroupSchedules.map(s => s.groupId)).size
    const totalSubjects = new Set([
      ...allClassSchedules.map(s => s.subjectId),
      ...allGroupSchedules.map(s => s.subjectId)
    ]).size

    const daysOfWeek = ['Yakshanba', 'Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba']
    const todayName = daysOfWeek[dayOfWeek]

    // Filter valid class schedules (with subject) for lesson reminder
    const validClassSchedules = todayClassSchedules.filter(
      (s): s is typeof s & { subject: NonNullable<typeof s.subject>; subjectId: string } =>
        s.subject !== null && s.subjectId !== null
    )

    // Filter valid group schedules (with subject)
    const validGroupSchedules = todayGroupSchedules.filter(
      (s): s is typeof s & { subject: NonNullable<typeof s.subject>; subjectId: string } =>
        s.subject !== null && s.subjectId !== null
    )

    // Combine all today's schedules with source marker
    const combinedTodaySchedules = [
      ...validClassSchedules.map(s => ({ ...s, scheduleSource: 'CLASS' as const })),
      ...validGroupSchedules.map(s => ({ ...s, scheduleSource: 'GROUP' as const })),
    ].sort((a, b) => a.startTime.localeCompare(b.startTime))

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

        {/* Quick Stats */}
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
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

          <Card className="border-none shadow-lg bg-gradient-to-br from-fuchsia-50 to-purple-50 dark:from-fuchsia-950/20 dark:to-purple-950/20 card-hover">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-fuchsia-500 to-purple-600 text-white shadow-lg">
                  <Users className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-3xl font-bold text-fuchsia-600">{totalGroups}</div>
                  <p className="text-sm text-muted-foreground font-medium">Guruhlar</p>
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
                  <div className="text-3xl font-bold text-green-600">{combinedTodaySchedules.length}</div>
                  <p className="text-sm text-muted-foreground font-medium">Bugungi darslar</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lesson Reminder - Show 5-10 minutes before lesson */}
        <LessonReminder schedules={validClassSchedules} />

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

          {combinedTodaySchedules.length > 0 ? (
            <TodayLessons schedules={combinedTodaySchedules} />
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
