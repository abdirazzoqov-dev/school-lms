import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Calendar, Clock, AlertCircle, Users, BookOpen, CheckCircle2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { getCurrentAcademicYear } from '@/lib/utils'
import { cn } from '@/lib/utils'

export const revalidate = 0
export const dynamic = 'force-dynamic'

const DAYS = [
  { id: 1, name: 'Dushanba', short: 'Dush' },
  { id: 2, name: 'Seshanba', short: 'Sesh' },
  { id: 3, name: 'Chorshanba', short: 'Chor' },
  { id: 4, name: 'Payshanba', short: 'Pay' },
  { id: 5, name: 'Juma', short: 'Juma' },
  { id: 6, name: 'Shanba', short: 'Shan' },
]

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

// Subject colors matching admin constructor
const SUBJECT_COLORS = [
  { bg: 'bg-blue-100', border: 'border-blue-300', text: 'text-blue-900' },
  { bg: 'bg-green-100', border: 'border-green-300', text: 'text-green-900' },
  { bg: 'bg-purple-100', border: 'border-purple-300', text: 'text-purple-900' },
  { bg: 'bg-orange-100', border: 'border-orange-300', text: 'text-orange-900' },
  { bg: 'bg-pink-100', border: 'border-pink-300', text: 'text-pink-900' },
  { bg: 'bg-indigo-100', border: 'border-indigo-300', text: 'text-indigo-900' },
  { bg: 'bg-teal-100', border: 'border-teal-300', text: 'text-teal-900' },
  { bg: 'bg-cyan-100', border: 'border-cyan-300', text: 'text-cyan-900' },
]

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

  // Assign colors to subjects
  const subjectColors = new Map<string, typeof SUBJECT_COLORS[0]>()
  let colorIndex = 0
  allSchedules.forEach(schedule => {
    if (schedule.subject?.id && !subjectColors.has(schedule.subject.id)) {
      subjectColors.set(schedule.subject.id, SUBJECT_COLORS[colorIndex % SUBJECT_COLORS.length])
      colorIndex++
    }
  })

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
  const totalSlots = DAYS.length * timeSlots.length
  const filledSlots = allSchedules.length

  return (
    <div className="space-y-4 md:space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-4 md:p-6 shadow-sm border">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl shadow-lg">
            <Calendar className="h-6 w-6 md:h-7 md:w-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Mening Dars Jadvalim</h1>
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
      <Card className="border-2 shadow-lg">
        <CardHeader className="pb-3 bg-gradient-to-r from-purple-50 via-indigo-50 to-blue-50">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg lg:text-xl flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Haftalik Dars Jadvali
              </CardTitle>
              <CardDescription className="text-xs mt-1">
                {timeSlots.length} dars × {DAYS.length} kun = {totalSlots} jami slot ({filledSlots} band)
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-sm px-3 py-1">
              {filledSlots}/{totalSlots}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-2 lg:p-4">
          <div className="w-full overflow-x-auto rounded-lg border-2 shadow-sm">
            <table className="w-full border-collapse min-w-[900px] bg-white">
              <thead>
                <tr className="bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50">
                  <th className="p-2 lg:p-3 text-left font-semibold border-r w-28 lg:w-36 sticky left-0 bg-white z-20 shadow-sm">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-blue-600" />
                      <span className="text-xs lg:text-sm">Vaqt</span>
                    </div>
                  </th>
                  {DAYS.map(day => (
                    <th key={day.id} className="p-2 lg:p-3 text-center font-semibold border-r min-w-[140px]">
                      <div className="text-sm lg:text-base font-bold">{day.name}</div>
                      <div className="text-xs text-muted-foreground font-normal">{day.short}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {timeSlots.length > 0 ? (
                  timeSlots.map((slot, slotIndex) => (
                    <tr key={slotIndex} className={cn(
                      "border-t transition-colors",
                      slotIndex % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                    )}>
                      <td className="p-2 lg:p-3 border-r bg-gradient-to-r from-gray-50 to-gray-100 sticky left-0 z-10 shadow-sm">
                        <div className="text-xs lg:text-sm font-bold text-purple-900">{slot.period}-dars</div>
                        <div className="text-[10px] lg:text-xs text-muted-foreground font-mono mt-0.5">
                          {slot.startTime.slice(0, 5)}-{slot.endTime.slice(0, 5)}
                        </div>
                      </td>
                      {DAYS.map(day => {
                        const timeKey = `${slot.startTime}-${slot.endTime}`
                        const lessons = scheduleGrid[day.id]?.[timeKey] || []
                        
                        return (
                          <td key={day.id} className="p-1 lg:p-1.5 border-r relative">
                            {lessons.length > 0 ? (
                              <div className="space-y-1">
                                {lessons.map((lesson, idx) => {
                                  const colorScheme = subjectColors.get(lesson.subject?.id || '') || SUBJECT_COLORS[0]
                                  return (
                                    <div
                                      key={idx}
                                      className={cn(
                                        "p-2 rounded-md text-xs space-y-1 min-h-[65px] lg:min-h-[75px] relative",
                                        "border-2 shadow-sm hover:shadow-lg transition-all",
                                        `${colorScheme.bg} ${colorScheme.border}`
                                      )}
                                    >
                                      {/* Complete indicator */}
                                      <div className="absolute -top-1 -right-1">
                                        <div className="bg-green-500 rounded-full p-0.5">
                                          <CheckCircle2 className="h-3 w-3 text-white" />
                                        </div>
                                      </div>

                                      {/* Subject name */}
                                      <div className={cn(
                                        "font-bold text-[11px] lg:text-xs line-clamp-2 leading-tight",
                                        colorScheme.text
                                      )}>
                                        {lesson.subject?.name || 'Dars'}
                                      </div>
                                      
                                      {/* Class/Group name */}
                                      {lesson.className && (
                                        <div className="text-[10px] lg:text-xs text-muted-foreground line-clamp-1 font-medium">
                                          🏫 {lesson.className}
                                        </div>
                                      )}
                                      
                                      {/* Room number */}
                                      {lesson.roomNumber && (
                                        <div className="text-[10px] lg:text-xs text-muted-foreground font-medium">
                                          🚪 Xona {lesson.roomNumber}
                                        </div>
                                      )}
                                    </div>
                                  )
                                })}
                              </div>
                            ) : (
                              <div className="h-[65px] lg:h-[75px] flex items-center justify-center rounded-md border-2 border-dashed border-gray-300">
                                <span className="text-gray-300 text-sm">-</span>
                              </div>
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-12 text-center">
                      <AlertCircle className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                      <p className="text-gray-500 font-medium">Dars jadvali mavjud emas</p>
                      <p className="text-sm text-gray-400 mt-1">Administrator tomonidan sizga darslar biriktirilmagan</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
