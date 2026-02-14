import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Users, BookOpen, Clock, Calendar, MapPin, ArrowRight } from 'lucide-react'
import { getCurrentAcademicYear } from '@/lib/utils'
import Link from 'next/link'
import { LessonReminder } from '@/components/teacher/lesson-reminder'

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

    // Get today's schedule from constructor
    const today = new Date()
    const dayOfWeek = today.getDay() || 7 // Sunday = 7

    const todaySchedule = await db.schedule.findMany({
      where: {
        tenantId,
        teacherId: teacher.id,
        dayOfWeek: dayOfWeek,
        academicYear: getCurrentAcademicYear(),
        type: 'LESSON'
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

    // Get quick stats - fetch all schedules to count unique classes and subjects
    const allSchedules = await db.schedule.findMany({
      where: {
        tenantId,
        teacherId: teacher.id,
        academicYear: getCurrentAcademicYear(),
        type: 'LESSON'
      },
      select: {
        classId: true,
        subjectId: true
      }
    })

    const totalClasses = new Set(allSchedules.map(s => s.classId)).size
    const totalSubjects = new Set(allSchedules.map(s => s.subjectId)).size

    // Days of week
    const daysOfWeek = ['Yakshanba', 'Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba']
    const todayName = daysOfWeek[dayOfWeek === 7 ? 0 : dayOfWeek]

    // Get lesson number for each schedule
    const getLessonNumber = (startTime: string) => {
      const timeslots = [
        { start: '08:00', end: '08:45', num: 1 },
        { start: '09:00', end: '09:45', num: 2 },
        { start: '10:00', end: '10:45', num: 3 },
        { start: '11:00', end: '11:45', num: 4 },
        { start: '12:00', end: '12:45', num: 5 },
        { start: '13:00', end: '13:45', num: 6 },
        { start: '14:00', end: '14:45', num: 7 },
        { start: '15:00', end: '15:45', num: 8 },
      ]
      const slot = timeslots.find(t => t.start === startTime)
      return slot ? slot.num : 0
    }

    const formatTime = (time: string) => {
      return time.slice(0, 5) // "08:00:00" -> "08:00"
    }

    // Filter out schedules with null subject for lesson reminder
    const validSchedules = todaySchedule.filter((s): s is typeof s & { subject: NonNullable<typeof s.subject>; subjectId: string } => 
      s.subject !== null && s.subjectId !== null
    )

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

          {todaySchedule.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {todaySchedule.map((schedule, index) => {
                const lessonNum = getLessonNumber(schedule.startTime)
                const gradients = [
                  'from-blue-500 to-indigo-600',
                  'from-purple-500 to-pink-600',
                  'from-green-500 to-emerald-600',
                  'from-orange-500 to-red-600',
                  'from-cyan-500 to-blue-600',
                  'from-violet-500 to-purple-600',
                ]
                const gradient = gradients[index % gradients.length]

                return (
                  <Card 
                    key={schedule.id}
                    className="group relative overflow-hidden border-none shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
                  >
                    {/* Gradient Header */}
                    <div className={`h-24 bg-gradient-to-br ${gradient} p-4 relative`}>
                      <div className="absolute inset-0 bg-black/10" />
                      <div className="relative z-10 flex items-center justify-between h-full">
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border-2 border-white/30">
                            <span className="text-2xl font-bold text-white">{lessonNum}</span>
                          </div>
                          <div>
                            <Badge className="bg-white/20 backdrop-blur-sm text-white border-white/30 hover:bg-white/30 mb-1">
                              {formatTime(schedule.startTime)} - {formatTime(schedule.endTime)}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      {/* Decorative circle */}
                      <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-white/10 rounded-full" />
                    </div>

                    <CardContent className="p-5 space-y-4">
                      {/* Subject */}
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-md bg-indigo-100 dark:bg-indigo-900/20">
                            <BookOpen className="h-3.5 w-3.5 text-indigo-600" />
                          </div>
                          <span className="text-xs text-muted-foreground font-medium">Fan</span>
                        </div>
                        <p className="text-lg font-bold text-foreground line-clamp-1">
                          {schedule.subject?.name || 'Fan nomi yo\'q'}
                        </p>
                      </div>

                      {/* Class */}
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-md bg-blue-100 dark:bg-blue-900/20">
                            <Users className="h-3.5 w-3.5 text-blue-600" />
                          </div>
                          <span className="text-xs text-muted-foreground font-medium">Sinf</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-base font-semibold text-foreground">
                            {schedule.class?.name || 'Sinf nomi yo\'q'}
                          </p>
                          <Badge variant="secondary" className="text-xs">
                            {schedule.class?._count.students || 0} ta o'quvchi
                          </Badge>
                        </div>
                      </div>

                      {/* Room */}
                      {schedule.roomNumber && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <div className="p-1.5 rounded-md bg-orange-100 dark:bg-orange-900/20">
                            <MapPin className="h-3.5 w-3.5 text-orange-600" />
                          </div>
                          <span>Xona: {schedule.roomNumber}</span>
                        </div>
                      )}

                      {/* Action Button */}
                      <Link 
                        href={`/teacher/classes/${schedule.classId}?subjectId=${schedule.subjectId}&startTime=${schedule.startTime}&endTime=${schedule.endTime}`}
                      >
                        <Button 
                          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg group-hover:shadow-xl transition-all"
                          size="sm"
                        >
                          Darsga kirish
                          <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
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
