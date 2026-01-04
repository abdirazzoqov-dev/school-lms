'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Clock, MapPin } from 'lucide-react'

interface Schedule {
  id: string
  dayOfWeek: number
  startTime: string
  endTime: string
  roomNumber: string | null
  type?: string
  title?: string | null
  subject?: {
    name: string
    code?: string
  } | null
  teacher?: {
    user: {
      fullName: string
    }
  } | null
  class?: {
    name: string
  } | null
}

interface TimetableProps {
  schedules: Schedule[]
  title?: string
  showTeacher?: boolean
  showClass?: boolean
}

const DAYS = ['Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba', 'Yakshanba']

const TIME_SLOTS = [
  '08:00', '08:45', '09:30', '10:15', '11:00', '11:45',
  '12:30', '13:15', '14:00', '14:45', '15:30', '16:15'
]

export function Timetable({ schedules, title = 'Dars Jadvali', showTeacher = true, showClass = false }: TimetableProps) {
  // Group schedules by day
  const schedulesByDay: Record<number, Schedule[]> = {}
  schedules.forEach(schedule => {
    if (!schedulesByDay[schedule.dayOfWeek]) {
      schedulesByDay[schedule.dayOfWeek] = []
    }
    schedulesByDay[schedule.dayOfWeek].push(schedule)
  })

  // Sort schedules within each day by start time
  Object.keys(schedulesByDay).forEach(day => {
    schedulesByDay[parseInt(day)].sort((a, b) => 
      a.startTime.localeCompare(b.startTime)
    )
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Desktop View - Grid */}
        <div className="hidden md:block">
          <div className="grid grid-cols-6 gap-2">
            {/* Days 1-6 (Monday-Saturday) */}
            {[1, 2, 3, 4, 5, 6].map(day => (
              <div key={day} className="space-y-2">
                <div className="text-center font-semibold text-sm bg-primary/10 rounded-lg p-2">
                  {DAYS[day - 1]}
                </div>
                <div className="space-y-2">
                  {schedulesByDay[day]?.map(schedule => {
                    const isBreak = schedule.type === 'BREAK'
                    const isLunch = schedule.type === 'LUNCH'
                    
                    return (
                      <div
                        key={schedule.id}
                        className="p-3 border rounded-lg bg-card hover:bg-accent transition-colors"
                      >
                        <div className="space-y-1">
                          <div className="font-semibold text-sm text-primary">
                            {isBreak && <span className="text-amber-700">☕ {schedule.title || 'Tanafus'}</span>}
                            {isLunch && <span className="text-green-700">🍽️ {schedule.title || 'Tushlik'}</span>}
                            {!isBreak && !isLunch && schedule.subject?.name}
                          </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {schedule.startTime} - {schedule.endTime}
                        </div>
                        {schedule.roomNumber && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            Xona {schedule.roomNumber}
                          </div>
                        )}
                        {showTeacher && schedule.teacher && (
                          <div className="text-xs text-muted-foreground">
                            {schedule.teacher.user.fullName}
                          </div>
                        )}
                        {showClass && schedule.class && (
                          <div className="text-xs font-medium text-blue-600">
                            {schedule.class.name}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
                  {(!schedulesByDay[day] || schedulesByDay[day].length === 0) && (
                    <div className="p-3 text-center text-sm text-muted-foreground border rounded-lg border-dashed">
                      Dars yo'q
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Mobile View - List */}
        <div className="md:hidden space-y-4">
          {[1, 2, 3, 4, 5, 6].map(day => (
            <div key={day} className="space-y-2">
              <div className="font-semibold text-sm bg-primary/10 rounded-lg p-2">
                {DAYS[day - 1]}
              </div>
              {schedulesByDay[day]?.map(schedule => {
                const isBreak = schedule.type === 'BREAK'
                const isLunch = schedule.type === 'LUNCH'
                
                return (
                  <div
                    key={schedule.id}
                    className="p-3 border rounded-lg bg-card"
                  >
                    <div className="space-y-1">
                      <div className="font-semibold text-primary">
                        {isBreak && <span className="text-amber-700">☕ {schedule.title || 'Tanafus'}</span>}
                        {isLunch && <span className="text-green-700">🍽️ {schedule.title || 'Tushlik'}</span>}
                        {!isBreak && !isLunch && schedule.subject?.name}
                      </div>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {schedule.startTime} - {schedule.endTime}
                    </div>
                    {schedule.roomNumber && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        Xona {schedule.roomNumber}
                      </div>
                    )}
                    {showTeacher && schedule.teacher && (
                      <div className="text-sm text-muted-foreground">
                        {schedule.teacher.user.fullName}
                      </div>
                    )}
                    {showClass && schedule.class && (
                      <div className="text-sm font-medium text-blue-600">
                        {schedule.class.name}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
              {(!schedulesByDay[day] || schedulesByDay[day].length === 0) && (
                <div className="p-3 text-center text-sm text-muted-foreground border rounded-lg border-dashed">
                  Dars yo'q
                </div>
              )}
            </div>
          ))}
        </div>

        {schedules.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            Hozircha jadval yo'q
          </div>
        )}
      </CardContent>
    </Card>
  )
}
