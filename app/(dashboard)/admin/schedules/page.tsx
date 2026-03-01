import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Calendar, Clock, CheckCircle2, Coffee, Utensils, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { getCurrentAcademicYear } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { PermissionGate } from '@/components/admin/permission-gate'

// Optimized caching
export const revalidate = 30
export const dynamic = 'auto'

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

// Subject colors — light + dark mode
const SUBJECT_COLORS = [
  { bg: 'bg-blue-100 dark:bg-blue-900/40', border: 'border-blue-300 dark:border-blue-700', text: 'text-blue-900 dark:text-blue-200' },
  { bg: 'bg-green-100 dark:bg-green-900/40', border: 'border-green-300 dark:border-green-700', text: 'text-green-900 dark:text-green-200' },
  { bg: 'bg-purple-100 dark:bg-purple-900/40', border: 'border-purple-300 dark:border-purple-700', text: 'text-purple-900 dark:text-purple-200' },
  { bg: 'bg-orange-100 dark:bg-orange-900/40', border: 'border-orange-300 dark:border-orange-700', text: 'text-orange-900 dark:text-orange-200' },
  { bg: 'bg-pink-100 dark:bg-pink-900/40', border: 'border-pink-300 dark:border-pink-700', text: 'text-pink-900 dark:text-pink-200' },
  { bg: 'bg-indigo-100 dark:bg-indigo-900/40', border: 'border-indigo-300 dark:border-indigo-700', text: 'text-indigo-900 dark:text-indigo-200' },
  { bg: 'bg-teal-100 dark:bg-teal-900/40', border: 'border-teal-300 dark:border-teal-700', text: 'text-teal-900 dark:text-teal-200' },
  { bg: 'bg-cyan-100 dark:bg-cyan-900/40', border: 'border-cyan-300 dark:border-cyan-700', text: 'text-cyan-900 dark:text-cyan-200' },
]

export default async function SchedulesPage({
  searchParams,
}: {
  searchParams: { classId?: string; groupId?: string; type?: 'class' | 'group' }
}) {
  const session = await getServerSession(authOptions)

  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'MODERATOR')) {
    redirect('/unauthorized')
  }

  const tenantId = session.user.tenantId!
  const academicYear = getCurrentAcademicYear()

  // Get all classes and groups
  const classes = await db.class.findMany({
    where: { tenantId, academicYear },
    orderBy: { name: 'asc' }
  })

  const groups = await db.group.findMany({
    where: { tenantId, academicYear },
    orderBy: { name: 'asc' }
  })

  // Determine which type to show
  const activeType = searchParams.type || (searchParams.classId ? 'class' : searchParams.groupId ? 'group' : 'class')

  // Get schedules (filtered by class or group if selected)
  const whereClause: any = {
    tenantId,
    academicYear
  }

  let schedules: any[] = []
  let selectedItem: any = null

  if (activeType === 'class') {
    if (searchParams.classId) {
      whereClause.classId = searchParams.classId
      selectedItem = classes.find(c => c.id === searchParams.classId)
    }

    schedules = await db.schedule.findMany({
      where: whereClause,
      include: {
        subject: true,
        teacher: {
          include: {
            user: {
              select: { fullName: true }
            }
          }
        },
        class: true
      },
      orderBy: [
        { dayOfWeek: 'asc' },
        { startTime: 'asc' }
      ]
    })
  } else {
    // Group schedules
    const groupWhereClause: any = {
      tenantId
    }

    if (searchParams.groupId) {
      groupWhereClause.groupId = searchParams.groupId
      selectedItem = groups.find(g => g.id === searchParams.groupId)
    }

    schedules = await db.groupSchedule.findMany({
      where: groupWhereClause,
      include: {
        subject: true,
        teacher: {
          include: {
            user: {
              select: { fullName: true }
            }
          }
        },
        group: true
      },
      orderBy: [
        { dayOfWeek: 'asc' },
        { startTime: 'asc' }
      ]
    })
  }

  // Get statistics
  const totalClassSchedules = await db.schedule.count({
    where: { tenantId, academicYear }
  })

  const totalGroupSchedules = await db.groupSchedule.count({
    where: { tenantId }
  })

  const totalSchedules = totalClassSchedules + totalGroupSchedules

  const schedulesByClass = await db.schedule.groupBy({
    by: ['classId'],
    where: { tenantId, academicYear },
    _count: true
  })

  const schedulesByGroup = await db.groupSchedule.groupBy({
    by: ['groupId'],
    where: { tenantId },
    _count: true
  })

  // Get time slots
  const timeSlots = getTimeSlots(schedules)

  // Assign colors to subjects
  const subjectColors = new Map<string, typeof SUBJECT_COLORS[0]>()
  let colorIndex = 0
  schedules.forEach(schedule => {
    if (schedule.subject?.id && !subjectColors.has(schedule.subject.id)) {
      subjectColors.set(schedule.subject.id, SUBJECT_COLORS[colorIndex % SUBJECT_COLORS.length])
      colorIndex++
    }
  })

  // Group schedules by day and time
  const scheduleGrid: Record<number, Record<string, typeof schedules>> = {}
  
  schedules.forEach(schedule => {
    if (!scheduleGrid[schedule.dayOfWeek]) {
      scheduleGrid[schedule.dayOfWeek] = {}
    }
    const timeKey = `${schedule.startTime}-${schedule.endTime}`
    if (!scheduleGrid[schedule.dayOfWeek][timeKey]) {
      scheduleGrid[schedule.dayOfWeek][timeKey] = []
    }
    scheduleGrid[schedule.dayOfWeek][timeKey].push(schedule)
  })

  // Calculate total slots
  const totalSlots = DAYS.length * timeSlots.length
  const filledSlots = schedules.length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
            <Calendar className="h-6 w-6 md:h-7 md:w-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Dars Jadvali</h1>
            <p className="text-muted-foreground">
              Sinflar va guruhlar uchun dars jadvalini boshqaring
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <PermissionGate resource="schedules" action="CREATE">
            <Button variant="outline" asChild>
              <Link href="/admin/schedules/builder">
                <Calendar className="mr-2 h-4 w-4" />
                Constructor
              </Link>
            </Button>
          </PermissionGate>
          <PermissionGate resource="schedules" action="CREATE">
            <Button asChild>
              <Link href="/admin/schedules/create">
                <Plus className="mr-2 h-4 w-4" />
                Jadval Qo&apos;shish
              </Link>
            </Button>
          </PermissionGate>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-lg">
                <Calendar className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <div className="text-2xl font-bold">{totalSchedules}</div>
                <p className="text-sm text-muted-foreground">Jami darslar</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-green-100 dark:bg-green-900/40 rounded-lg">
                <Calendar className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <div className="text-2xl font-bold">{schedulesByClass.length}</div>
                <p className="text-sm text-muted-foreground">Sinflar</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/40 rounded-lg">
                <Calendar className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <div className="text-2xl font-bold">{schedulesByGroup.length}</div>
                <p className="text-sm text-muted-foreground">Guruhlar</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/40 rounded-lg">
                <Calendar className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <div className="text-2xl font-bold">{academicYear}</div>
                <p className="text-sm text-muted-foreground">O&apos;quv yili</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Type Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>Turi</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Link href="/admin/schedules?type=class" className="flex-1">
              <Button
                variant={activeType === 'class' ? 'default' : 'outline'}
                className="w-full"
              >
                Sinflar
              </Button>
            </Link>
            <Link href="/admin/schedules?type=group" className="flex-1">
              <Button
                variant={activeType === 'group' ? 'default' : 'outline'}
                className="w-full"
              >
                Guruhlar
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Class/Group Filter */}
      {activeType === 'class' ? (
        <Card>
          <CardHeader>
            <CardTitle>Sinf tanlang</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
            <Link href="/admin/schedules?type=class">
              <Button 
                variant={!searchParams.classId ? 'default' : 'outline'} 
                size="sm"
              >
                Barcha sinflar
              </Button>
            </Link>
            {classes.map(cls => (
              <Link key={cls.id} href={`/admin/schedules?type=class&classId=${cls.id}`}>
                <Button 
                  variant={searchParams.classId === cls.id ? 'default' : 'outline'} 
                  size="sm"
                >
                  {cls.name}
                </Button>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Guruh tanlang</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
            <Link href="/admin/schedules?type=group">
              <Button 
                variant={!searchParams.groupId ? 'default' : 'outline'} 
                size="sm"
              >
                Barcha guruhlar
              </Button>
            </Link>
            {groups.map(grp => (
              <Link key={grp.id} href={`/admin/schedules?type=group&groupId=${grp.id}`}>
                <Button 
                  variant={searchParams.groupId === grp.id ? 'default' : 'outline'} 
                  size="sm"
                >
                  {grp.name}
                </Button>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
      )}

      {/* Schedule Table */}
      {(searchParams.classId || searchParams.groupId) && selectedItem ? (
        <Card className="border-2 shadow-lg">
          <CardHeader className="pb-3 bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 dark:from-slate-800 dark:via-slate-800 dark:to-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg lg:text-xl flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  {selectedItem.name} - Haftalik Dars Jadvali
                </CardTitle>
                <CardDescription className="text-xs mt-1">
                  {timeSlots.length} dars × {DAYS.length} kun = {totalSlots} jami slot
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-sm px-3 py-1">
                {filledSlots}/{totalSlots}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {timeSlots.length > 0 ? (
              <div className="w-full overflow-x-auto rounded-lg">
                <div className="min-w-[1200px]">
                  <table className="w-full border-collapse bg-card">
                  <thead>
                    <tr className="bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 dark:from-slate-800 dark:via-slate-800 dark:to-slate-800">
                      <th className="p-3 text-left font-semibold border-r w-[140px] sticky left-0 bg-blue-50 dark:bg-slate-800 z-20 shadow-sm">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-blue-600" />
                          <span className="text-sm">Vaqt</span>
                        </div>
                      </th>
                      {DAYS.map(day => (
                        <th key={day.id} className="p-3 text-center font-semibold border-r w-[170px] bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 dark:bg-slate-800 dark:bg-none">
                          <div className="text-base font-bold dark:text-slate-100">{day.name}</div>
                          <div className="text-xs text-muted-foreground font-normal dark:text-slate-400">{day.short}</div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {timeSlots.map((slot, slotIndex) => (
                      <tr key={slotIndex} className={cn(
                        "border-t transition-colors",
                        slotIndex % 2 === 0 ? "bg-card" : "bg-muted/30"
                      )}>
                        <td className="p-3 border-r bg-gradient-to-r from-gray-50 to-gray-100 dark:from-slate-800 dark:to-slate-700 sticky left-0 z-10 shadow-sm">
                          <div className="text-sm font-bold text-blue-900 dark:text-blue-300">{slot.period}-dars</div>
                          <div className="text-xs text-muted-foreground font-mono mt-0.5">
                            {slot.startTime.slice(0, 5)}-{slot.endTime.slice(0, 5)}
                          </div>
                        </td>
                        {DAYS.map(day => {
                          const timeKey = `${slot.startTime}-${slot.endTime}`
                          const lessons = scheduleGrid[day.id]?.[timeKey] || []
                          
                          return (
                            <td key={day.id} className="p-2 border-r relative">
                              {lessons.length > 0 ? (
                                <div className="space-y-1">
                                  {lessons.map((lesson, idx) => {
                                    const colorScheme = subjectColors.get(lesson.subject?.id || '') || SUBJECT_COLORS[0]
                                    const isBreak = lesson.type === 'BREAK'
                                    const isLunch = lesson.type === 'LUNCH'
                                    
                                    return (
                                      <div
                                        key={idx}
                                        className={cn(
                                          "p-2.5 rounded-lg text-xs space-y-1.5 min-h-[80px] relative",
                                          "border-2 shadow-sm hover:shadow-lg transition-all",
                                          isBreak && "bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-900/40 dark:to-amber-800/40 border-amber-400 dark:border-amber-600",
                                          isLunch && "bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900/40 dark:to-green-800/40 border-green-400 dark:border-green-600",
                                          !isBreak && !isLunch && `${colorScheme.bg} ${colorScheme.border}`
                                        )}
                                      >
                                        {/* Complete indicator - only for lessons */}
                                        {!isBreak && !isLunch && (
                                          <div className="absolute -top-1 -right-1">
                                            <div className="bg-green-500 rounded-full p-0.5">
                                              <CheckCircle2 className="h-3 w-3 text-white" />
                                            </div>
                                          </div>
                                        )}

                                        {/* Break display */}
                                        {isBreak && (
                                          <div className="flex flex-col items-center justify-center h-full text-center">
                                            <Coffee className="h-7 w-7 text-amber-700 mb-1.5" />
                                            <div className="font-bold text-sm text-amber-900 dark:text-amber-200">{lesson.title || 'Tanafus'}</div>
                                            <div className="text-xs text-amber-700 dark:text-amber-400">Dam olish</div>
                                          </div>
                                        )}

                                        {/* Lunch display */}
                                        {isLunch && (
                                          <div className="flex flex-col items-center justify-center h-full text-center">
                                            <Utensils className="h-7 w-7 text-green-700 mb-1.5" />
                                            <div className="font-bold text-sm text-green-900 dark:text-green-200">{lesson.title || 'Tushlik'}</div>
                                            <div className="text-xs text-green-700 dark:text-green-400">Ovqatlanish</div>
                                          </div>
                                        )}

                                        {/* Lesson display */}
                                        {!isBreak && !isLunch && (
                                          <>
                                            {/* Subject name */}
                                            <div className={cn(
                                              "font-bold text-xs line-clamp-2 leading-tight",
                                              colorScheme.text
                                            )}>
                                              {lesson.subject?.name || 'Dars'}
                                            </div>
                                            
                                            {/* Teacher */}
                                            {lesson.teacher?.user?.fullName && (
                                              <div className="text-xs text-muted-foreground line-clamp-1">
                                                {lesson.teacher.user.fullName.split(' ').slice(0, 2).join(' ')}
                                              </div>
                                            )}
                                            
                                            {/* Room number */}
                                            {lesson.roomNumber && (
                                              <div className="text-xs text-muted-foreground font-medium">
                                                🏢 {lesson.roomNumber}
                                              </div>
                                            )}
                                          </>
                                        )}
                                      </div>
                                    )
                                  })}
                                </div>
                              ) : (
                                <div className="h-[80px] flex items-center justify-center rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 bg-gray-50/50 dark:bg-gray-800/30">
                                  <span className="text-gray-300 dark:text-gray-600 text-sm">-</span>
                                </div>
                              )}
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center">
                <AlertCircle className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                <p className="text-gray-500 font-medium">Dars jadvali mavjud emas</p>
                <p className="text-sm text-gray-400 mt-1">Constructor orqali dars jadvali yarating</p>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Jadvalini ko&apos;rish uchun {activeType === 'class' ? 'sinfni' : 'guruhni'} tanlang</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
