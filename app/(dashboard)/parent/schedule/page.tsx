import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export const revalidate = 0
export const dynamic = 'force-dynamic'

const dayNamesShort = ['Yak', 'Dush', 'Sesh', 'Chor', 'Pay', 'Juma', 'Shan']
const dayNamesFull = ['Yakshanba', 'Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba']
const monthNames = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr']

export default async function ParentSchedulePage({
  searchParams
}: {
  searchParams: { childId?: string; month?: string; year?: string }
}) {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'PARENT') {
    redirect('/unauthorized')
  }

  const tenantId = session.user.tenantId!

  // Get parent with students
  const parent = await db.parent.findUnique({
    where: { userId: session.user.id, tenantId },
    include: {
      students: {
        include: {
          student: {
            include: {
              user: { select: { fullName: true, avatar: true } },
              class: { 
                select: { 
                  name: true,
                  schedules: {
                    include: {
                      subject: true,
                      teacher: { include: { user: { select: { fullName: true } } } }
                    },
                    orderBy: { startTime: 'asc' }
                  }
                } 
              },
              group: { 
                select: {
                  name: true,
                  schedules: {
                    include: {
                      subject: true,
                      teacher: { include: { user: { select: { fullName: true } } } }
                    },
                    orderBy: { startTime: 'asc' }
                  }
                }
              },
            }
          }
        }
      }
    }
  })

  if (!parent || parent.students.length === 0) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <Card className="max-w-md">
          <CardContent className="py-8 text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-semibold text-muted-foreground">Farzandlar topilmadi</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const children = parent.students.map(sp => sp.student)
  const selectedChildId = searchParams.childId || children[0].id
  const selectedChild = children.find(c => c.id === selectedChildId)

  if (!selectedChild) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <Card className="max-w-md">
          <CardContent className="py-8 text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-semibold text-muted-foreground">Farzand topilmadi</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Get schedules
  const classSchedules = selectedChild.class?.schedules || []
  const groupSchedules = selectedChild.group?.schedules || []
  const allSchedules = [
    ...classSchedules.map(s => ({ ...s, type: 'CLASS' as const })),
    ...groupSchedules.map(s => ({ ...s, type: 'GROUP' as const }))
  ]

  // Group by day
  const schedulesByDay: Record<number, typeof allSchedules> = {}
  allSchedules.forEach(schedule => {
    if (!schedulesByDay[schedule.dayOfWeek]) {
      schedulesByDay[schedule.dayOfWeek] = []
    }
    schedulesByDay[schedule.dayOfWeek].push(schedule)
  })

  // Calendar calculations
  const today = new Date()
  const currentMonth = searchParams.month ? parseInt(searchParams.month) : today.getMonth()
  const currentYear = searchParams.year ? parseInt(searchParams.year) : today.getFullYear()

  const firstDayOfMonth = new Date(currentYear, currentMonth, 1)
  const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0)
  const startingDayOfWeek = firstDayOfMonth.getDay()
  const daysInMonth = lastDayOfMonth.getDate()

  const prevMonthLastDay = new Date(currentYear, currentMonth, 0).getDate()
  const prevMonthDays = Array.from({ length: startingDayOfWeek }, (_, i) => prevMonthLastDay - startingDayOfWeek + i + 1)
  const currentMonthDays = Array.from({ length: daysInMonth }, (_, i) => i + 1)
  const totalCells = 42
  const remainingCells = totalCells - prevMonthDays.length - currentMonthDays.length
  const nextMonthDays = Array.from({ length: remainingCells }, (_, i) => i + 1)

  const todayDate = today.getDate()
  const todayMonth = today.getMonth()
  const todayYear = today.getFullYear()

  const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1
  const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear
  const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1
  const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear

  return (
    <div className="h-full bg-gradient-to-br from-gray-50 via-white to-gray-50 p-4 md:p-6">
      <div className="max-w-[1600px] mx-auto space-y-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between bg-white rounded-2xl p-4 md:p-6 shadow-sm border gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
              <Calendar className="h-6 w-6 md:h-7 md:w-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Dars Jadvali
              </h1>
              <p className="text-sm text-gray-500">
                {selectedChild.user?.fullName || 'Farzand'} • {selectedChild.class?.name || 'Sinf belgilanmagan'}
              </p>
            </div>
          </div>

          {children.length > 1 && (
            <form method="get" className="w-full md:w-auto">
              <Select name="childId" defaultValue={selectedChildId}>
                <SelectTrigger className="w-full md:w-[250px] bg-gray-50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {children.map(child => (
                    <SelectItem key={child.id} value={child.id}>
                      {child.user?.fullName || 'N/A'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </form>
          )}
        </div>

        {/* Calendar Card */}
        <Card className="shadow-lg border-0 overflow-hidden">
          {/* Calendar Header */}
          <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border-b p-4 md:p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl md:text-2xl font-bold text-gray-800">
                {monthNames[currentMonth]} {currentYear}
              </h2>
              <div className="flex items-center gap-2">
                <form method="get" className="contents">
                  <input type="hidden" name="childId" value={selectedChildId} />
                  <input type="hidden" name="month" value={prevMonth} />
                  <input type="hidden" name="year" value={prevYear} />
                  <Button type="submit" variant="ghost" size="sm" className="hover:bg-white/50">
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                </form>
                <form method="get" className="contents">
                  <input type="hidden" name="childId" value={selectedChildId} />
                  <Button type="submit" variant="ghost" size="sm" className="hover:bg-white/50">
                    Bugun
                  </Button>
                </form>
                <form method="get" className="contents">
                  <input type="hidden" name="childId" value={selectedChildId} />
                  <input type="hidden" name="month" value={nextMonth} />
                  <input type="hidden" name="year" value={nextYear} />
                  <Button type="submit" variant="ghost" size="sm" className="hover:bg-white/50">
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                </form>
              </div>
            </div>
          </div>

          <CardContent className="p-0">
            {/* Week Days Header */}
            <div className="grid grid-cols-7 bg-gray-50 border-b">
              {dayNamesShort.map((day, i) => (
                <div key={day} className={`py-3 text-center text-sm font-semibold ${i === 0 || i === 6 ? 'text-red-600' : 'text-gray-600'}`}>
                  <span className="hidden md:inline">{dayNamesFull[i]}</span>
                  <span className="md:hidden">{day}</span>
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7">
              {/* Previous month days */}
              {prevMonthDays.map((day) => (
                <div key={`prev-${day}`} className="min-h-[100px] md:min-h-[140px] border-b border-r bg-gray-50/50 p-1 md:p-2">
                  <span className="text-xs md:text-sm text-gray-400">{day}</span>
                </div>
              ))}

              {/* Current month days */}
              {currentMonthDays.map((day) => {
                const date = new Date(currentYear, currentMonth, day)
                const dayOfWeek = date.getDay()
                const daySchedules = schedulesByDay[dayOfWeek] || []
                const isToday = day === todayDate && currentMonth === todayMonth && currentYear === todayYear
                const isWeekend = dayOfWeek === 0 || dayOfWeek === 6

                return (
                  <div
                    key={`current-${day}`}
                    className={`min-h-[100px] md:min-h-[140px] border-b border-r p-1 md:p-2 transition-colors hover:bg-gray-50 ${
                      isToday ? 'bg-blue-50 ring-2 ring-blue-500 ring-inset' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-xs md:text-sm font-semibold ${
                        isToday ? 'bg-blue-500 text-white px-2 py-0.5 rounded-full' : isWeekend ? 'text-red-600' : 'text-gray-700'
                      }`}>
                        {day}
                      </span>
                      {daySchedules.length > 0 && (
                        <Badge variant="secondary" className="text-[10px] md:text-xs px-1 py-0">
                          {daySchedules.length}
                        </Badge>
                      )}
                    </div>

                    <div className="space-y-1 overflow-y-auto max-h-[70px] md:max-h-[110px]">
                      {daySchedules.map((schedule) => (
                        <div
                          key={`${schedule.type}-${schedule.id}`}
                          className={`text-[10px] md:text-xs p-1 md:p-1.5 rounded ${
                            schedule.type === 'CLASS' 
                              ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                              : 'bg-purple-100 text-purple-700 border border-purple-200'
                          } hover:shadow-sm transition-shadow cursor-pointer`}
                          title={`${schedule.subject?.name || 'Dars'} • ${schedule.startTime.slice(0, 5)}-${schedule.endTime.slice(0, 5)}${schedule.teacher?.user ? ' • ' + schedule.teacher.user.fullName : ''}`}
                        >
                          <div className="flex items-center gap-1">
                            <span className="hidden md:inline">{schedule.type === 'CLASS' ? '📚' : '👥'}</span>
                            <span className="font-medium truncate">{schedule.subject?.name || 'Dars'}</span>
                          </div>
                          <div className="text-[9px] md:text-[10px] text-gray-600 mt-0.5">
                            ⏰ {schedule.startTime.slice(0, 5)}-{schedule.endTime.slice(0, 5)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}

              {/* Next month days */}
              {nextMonthDays.map((day) => (
                <div key={`next-${day}`} className="min-h-[100px] md:min-h-[140px] border-b border-r bg-gray-50/50 p-1 md:p-2">
                  <span className="text-xs md:text-sm text-gray-400">{day}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Legend */}
        <Card className="shadow-sm border">
          <CardContent className="py-4">
            <div className="flex flex-wrap gap-3 md:gap-4 justify-center items-center">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 md:w-4 md:h-4 rounded bg-blue-100 border border-blue-200"></div>
                <span className="text-xs md:text-sm">📚 Sinf darslari</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 md:w-4 md:h-4 rounded bg-purple-100 border border-purple-200"></div>
                <span className="text-xs md:text-sm">👥 Guruh darslari</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
