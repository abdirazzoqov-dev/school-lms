import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar, Clock, BookOpen, Users, AlertCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export const revalidate = 0
export const dynamic = 'force-dynamic'

const dayNames = ['Yakshanba', 'Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba']

export default async function ParentSchedulePage({
  searchParams
}: {
  searchParams: { childId?: string }
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
                    orderBy: [
                      { dayOfWeek: 'asc' },
                      { startTime: 'asc' }
                    ]
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
                    orderBy: [
                      { dayOfWeek: 'asc' },
                      { startTime: 'asc' }
                    ]
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
      <div className="space-y-6 p-6">
        <h1 className="text-3xl font-bold">Dars Jadvali</h1>
        <Card>
          <CardContent className="py-8 text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-semibold text-muted-foreground">Farzandlar topilmadi</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const children = parent.students.map(sp => sp.student)

  // If childId is specified, filter to that child; otherwise show first child
  const selectedChildId = searchParams.childId || children[0].id
  const selectedChild = children.find(c => c.id === selectedChildId)

  if (!selectedChild) {
    return (
      <div className="space-y-6 p-6">
        <h1 className="text-3xl font-bold">Dars Jadvali</h1>
        <Card>
          <CardContent className="py-8 text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-semibold text-muted-foreground">Farzand topilmadi</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Get class and group schedules
  const classSchedules = selectedChild.class?.schedules || []
  const groupSchedules = selectedChild.group?.schedules || []

  // Combine schedules
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

  // Sort each day's schedules by start time
  Object.keys(schedulesByDay).forEach(day => {
    schedulesByDay[parseInt(day)].sort((a, b) => a.startTime.localeCompare(b.startTime))
  })

  const weekDays = [1, 2, 3, 4, 5, 6]
  const currentDay = new Date().getDay()

  return (
    <div className="space-y-6 p-6">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 p-8 text-white shadow-2xl">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                  <Calendar className="h-8 w-8" />
                </div>
                <h1 className="text-4xl font-bold">Dars Jadvali</h1>
              </div>
              <p className="text-blue-50 text-lg">
                {selectedChild.user?.fullName || 'Farzand'} ning haftalik dars jadvali
              </p>
            </div>
            {children.length > 1 && (
              <form action="/parent/schedule" method="get" className="w-full lg:w-auto">
                <Select name="childId" defaultValue={selectedChildId}>
                  <SelectTrigger className="bg-white/20 text-white border-white/30 w-full lg:w-[250px]">
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
        </div>
        <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10 blur-2xl"></div>
        <div className="absolute -left-8 -bottom-8 h-40 w-40 rounded-full bg-white/10 blur-2xl"></div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-2 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Sinf</p>
                <p className="font-semibold text-lg">{selectedChild.class?.name || 'Belgilanmagan'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-purple-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm text-muted-foreground">Guruh</p>
                <p className="font-semibold text-lg">{selectedChild.group?.name || 'Guruhga biriktirilmagan'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Calendar View */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        {weekDays.map((dayIndex) => {
          const daySchedules = schedulesByDay[dayIndex] || []
          const isToday = currentDay === dayIndex

          return (
            <Card 
              key={dayIndex} 
              className={`${isToday ? 'ring-2 ring-blue-500 shadow-xl scale-105' : 'hover:shadow-lg'} transition-all duration-200`}
            >
              <CardHeader className={`pb-3 ${isToday ? 'bg-gradient-to-br from-blue-50 to-indigo-50' : 'bg-gradient-to-br from-gray-50 to-slate-50'}`}>
                <CardTitle className="text-base font-bold flex items-center justify-between">
                  <span className={isToday ? 'text-blue-700' : ''}>{dayNames[dayIndex]}</span>
                  {isToday && (
                    <Badge className="bg-blue-600 text-xs">Bugun</Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 pt-4">
                {daySchedules.length > 0 ? (
                  <>
                    {daySchedules.map((schedule, idx) => (
                      <div
                        key={`${schedule.type}-${schedule.id}`}
                        className={`p-3 rounded-lg border ${
                          schedule.type === 'CLASS' 
                            ? 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200' 
                            : 'bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <Badge 
                            className={`text-xs ${schedule.type === 'CLASS' ? 'bg-blue-600' : 'bg-purple-600'}`}
                          >
                            {schedule.type === 'CLASS' ? '📚' : '👥'}
                          </Badge>
                          <span className="text-xs font-bold text-gray-500">#{idx + 1}</span>
                        </div>

                        {schedule.subject && (
                          <p className="text-sm font-bold text-gray-800 mb-1">
                            {schedule.subject.name}
                          </p>
                        )}

                        <div className="flex items-center gap-1 text-xs text-gray-600 mb-1">
                          <Clock className="h-3 w-3" />
                          <span>{schedule.startTime.slice(0, 5)} - {schedule.endTime.slice(0, 5)}</span>
                        </div>

                        {schedule.teacher?.user && (
                          <p className="text-xs text-gray-600 truncate">
                            👨‍🏫 {schedule.teacher.user.fullName}
                          </p>
                        )}

                        {schedule.roomNumber && (
                          <p className="text-xs text-gray-600">
                            🚪 {schedule.roomNumber}
                          </p>
                        )}
                      </div>
                    ))}
                  </>
                ) : (
                  <div className="text-center py-8">
                    <Calendar className="mx-auto h-8 w-8 text-muted-foreground opacity-30 mb-2" />
                    <p className="text-xs text-muted-foreground">Darslar yo'q</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Legend */}
      <Card className="border-2 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4 justify-center items-center">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200"></div>
              <span className="text-sm">📚 Sinf darslari</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200"></div>
              <span className="text-sm">👥 Guruh darslari</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
