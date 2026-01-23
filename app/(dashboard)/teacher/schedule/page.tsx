import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar, Clock, AlertCircle, Users, BookOpen } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { getCurrentAcademicYear } from '@/lib/utils'

export const revalidate = 0
export const dynamic = 'force-dynamic'

const dayNames = ['Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba']
const dayNamesShort = ['Dush', 'Sesh', 'Chor', 'Pay', 'Juma', 'Shan']

// Time slot configuration
interface TimeSlot {
  period: number
  startTime: string
  endTime: string
}

// Get unique time slots from schedules
function getTimeSlots(schedules: any[]): TimeSlot[] {
  const slotsMap = new Map<string, TimeSlot>()
  
  schedules.forEach(schedule => {
    const key = `${schedule.startTime}-${schedule.endTime}`
    if (!slotsMap.has(key)) {
      slotsMap.set(key, {
        period: slotsMap.size + 1,
        startTime: schedule.startTime,
        endTime: schedule.endTime
      })
    }
  })
  
  return Array.from(slotsMap.values()).sort((a, b) => 
    a.startTime.localeCompare(b.startTime)
  )
}

export default async function TeacherSchedulePage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'TEACHER') {
    redirect('/unauthorized')
  }

  const tenantId = session.user.tenantId!

  // Get teacher
  const teacher = await db.teacher.findFirst({
    where: { userId: session.user.id, tenantId },
    include: {
      user: {
        select: { fullName: true }
      }
    }
  })

  if (!teacher) {
    redirect('/unauthorized')
  }

  const academicYear = getCurrentAcademicYear()

  // Get teacher's class schedules
  const classSchedules = await db.schedule.findMany({
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

  // Get teacher's group schedules
  const groupSchedules = await db.groupSchedule.findMany({
    where: {
      tenantId,
      teacherId: teacher.id,
      academicYear
    },
    include: {
      subject: true,
      group: true
    },
    orderBy: [
      { dayOfWeek: 'asc' },
      { startTime: 'asc' }
    ]
  })

  // Combine all schedules
  const allSchedules = [
    ...classSchedules.map(s => ({ ...s, type: 'CLASS' as const, className: s.class?.name })),
    ...groupSchedules.map(s => ({ ...s, type: 'GROUP' as const, className: s.group?.name }))
  ]

  // Get time slots
  const timeSlots = getTimeSlots(allSchedules)

  // Group schedules by day and time
  const scheduleGrid: Record<number, Record<string, typeof allSchedules>> = {}
  
  allSchedules.forEach(schedule => {
    if (!scheduleGrid[schedule.dayOfWeek]) {
      scheduleGrid[schedule.dayOfWeek] = {}
    }
    const timeKey = `${schedule.startTime}-${schedule.endTime}`
    if (!scheduleGrid[schedule.dayOfWeek][timeKey]) {
      scheduleGrid[schedule.dayOfWeek][timeKey] = []
    }
    scheduleGrid[schedule.dayOfWeek][timeKey].push(schedule)
  })

  // Calculate statistics
  const totalLessons = allSchedules.length
  const uniqueDays = new Set(allSchedules.map(s => s.dayOfWeek)).size
  const uniqueClasses = new Set([
    ...classSchedules.map(s => s.classId),
    ...groupSchedules.map(s => s.groupId)
  ]).size

  // Calculate total hours per week
  const totalMinutes = allSchedules.reduce((sum, schedule) => {
    const start = schedule.startTime.split(':').map(Number)
    const end = schedule.endTime.split(':').map(Number)
    const startMinutes = start[0] * 60 + start[1]
    const endMinutes = end[0] * 60 + end[1]
    return sum + (endMinutes - startMinutes)
  }, 0)
  const totalHours = (totalMinutes / 60).toFixed(1)

  // Calculate total slots
  const totalSlots = dayNames.length * timeSlots.length
  const filledSlots = allSchedules.length

  return (
    <div className="h-full bg-gradient-to-br from-gray-50 via-white to-gray-50 p-4 md:p-6">
      <div className="max-w-[1600px] mx-auto space-y-4">
        {/* Header */}
        <div className="bg-white rounded-2xl p-4 md:p-6 shadow-sm border">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl shadow-lg">
              <Calendar className="h-6 w-6 md:h-7 md:w-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                Mening Dars Jadvalim
              </h1>
              <p className="text-sm text-gray-500">
                {teacher.user?.fullName || 'O\'qituvchi'} • {academicYear} o'quv yili
              </p>
            </div>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <div className="text-xl font-bold text-blue-700">{totalLessons}</div>
                <p className="text-xs text-blue-600">Haftalik darslar</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-100">
              <div className="p-2 bg-green-100 rounded-lg">
                <Clock className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <div className="text-xl font-bold text-green-700">{totalHours}</div>
                <p className="text-xs text-green-600">Soat/hafta</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg border border-purple-100">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Calendar className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <div className="text-xl font-bold text-purple-700">{uniqueDays}</div>
                <p className="text-xs text-purple-600">Ish kunlari</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg border border-orange-100">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Users className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <div className="text-xl font-bold text-orange-700">{uniqueClasses}</div>
                <p className="text-xs text-orange-600">Sinf/Guruh</p>
              </div>
            </div>
          </div>
        </div>

        {/* Timetable */}
        <Card className="shadow-lg border-0 overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-purple-50 via-indigo-50 to-blue-50 border-b">
            <CardTitle className="flex items-center gap-2 text-gray-800">
              <Clock className="h-5 w-5" />
              {timeSlots.length} dars × 6 kun = {totalSlots} jami slot ({filledSlots} band)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <div className="min-w-[800px]">
              {/* Header with day names */}
              <div className="grid grid-cols-[120px_repeat(6,1fr)] bg-gray-50 border-b sticky top-0 z-10">
                <div className="p-3 border-r flex items-center justify-center">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span className="ml-2 text-sm font-semibold text-gray-600">Vaqt</span>
                </div>
                {dayNames.map((day, idx) => (
                  <div key={day} className="p-3 border-r last:border-r-0 text-center">
                    <div className="font-semibold text-gray-700 hidden md:block">{day}</div>
                    <div className="font-semibold text-gray-700 md:hidden">{dayNamesShort[idx]}</div>
                    <div className="text-xs text-gray-500 mt-1">{day.slice(0, 4)}</div>
                  </div>
                ))}
              </div>

              {/* Time slots rows */}
              {timeSlots.length > 0 ? (
                timeSlots.map((slot, slotIdx) => (
                  <div key={slotIdx} className="grid grid-cols-[120px_repeat(6,1fr)] border-b hover:bg-gray-50/50 transition-colors">
                    {/* Time column */}
                    <div className="p-3 border-r bg-gray-50 flex flex-col justify-center">
                      <div className="font-semibold text-sm text-purple-700">{slotIdx + 1}-dars</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {slot.startTime.slice(0, 5)}-{slot.endTime.slice(0, 5)}
                      </div>
                    </div>

                    {/* Day columns */}
                    {[1, 2, 3, 4, 5, 6].map((dayOfWeek) => {
                      const timeKey = `${slot.startTime}-${slot.endTime}`
                      const lessons = scheduleGrid[dayOfWeek]?.[timeKey] || []
                      
                      return (
                        <div key={dayOfWeek} className="p-2 border-r last:border-r-0 min-h-[80px]">
                          {lessons.length > 0 ? (
                            <div className="space-y-1">
                              {lessons.map((lesson, idx) => (
                                <div
                                  key={idx}
                                  className={`p-2 rounded-lg border ${
                                    lesson.type === 'CLASS'
                                      ? 'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200'
                                      : 'bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200'
                                  } hover:shadow-md transition-all cursor-pointer group`}
                                >
                                  <div className="flex items-start gap-2">
                                    <span className="text-lg">
                                      {lesson.type === 'CLASS' ? '📚' : '👥'}
                                    </span>
                                    <div className="flex-1 min-w-0">
                                      <div className={`font-semibold text-sm ${
                                        lesson.type === 'CLASS' ? 'text-blue-700' : 'text-purple-700'
                                      }`}>
                                        {lesson.subject?.name || 'Dars'}
                                      </div>
                                      {lesson.className && (
                                        <div className="text-xs text-gray-600 mt-1 flex items-center gap-1">
                                          <span>🏫</span>
                                          <span className="truncate font-medium">{lesson.className}</span>
                                        </div>
                                      )}
                                      {lesson.roomNumber && (
                                        <div className="text-xs text-gray-500 mt-1">
                                          🚪 Xona {lesson.roomNumber}
                                        </div>
                                      )}
                                    </div>
                                    <Badge 
                                      variant="outline" 
                                      className={`text-[10px] ${
                                        lesson.type === 'CLASS' 
                                          ? 'bg-blue-100 text-blue-700 border-blue-300' 
                                          : 'bg-purple-100 text-purple-700 border-purple-300'
                                      }`}
                                    >
                                      {lesson.type === 'CLASS' ? 'Sinf' : 'Guruh'}
                                    </Badge>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="h-full flex items-center justify-center">
                              <span className="text-gray-300 text-sm">-</span>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                ))
              ) : (
                <div className="py-12 text-center">
                  <AlertCircle className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                  <p className="text-gray-500 font-medium">Dars jadvali mavjud emas</p>
                  <p className="text-sm text-gray-400 mt-1">Administrator tomonidan sizga darslar biriktirilmagan</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Legend */}
        <Card className="shadow-sm border">
          <CardContent className="py-4">
            <div className="flex flex-wrap gap-4 justify-center items-center">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200"></div>
                <span className="text-sm">📚 Sinf darslari</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200"></div>
                <span className="text-sm">👥 Guruh darslari</span>
              </div>
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-indigo-600" />
                <span className="text-sm text-gray-600">Barcha darslaringiz sinflar kesimida ko'rsatilgan</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
