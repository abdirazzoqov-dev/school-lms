'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Users, BookOpen, Clock, MapPin, ArrowRight, CheckCircle2, PlayCircle } from 'lucide-react'
import Link from 'next/link'

// Unified schedule type - supports both class and group schedules
interface LessonSchedule {
  id: string
  startTime: string
  endTime: string
  roomNumber?: string | null
  scheduleSource: 'CLASS' | 'GROUP'
  // Class-specific
  classId?: string
  subjectId?: string | null
  class?: {
    name: string
    _count: { students: number }
  } | null
  // Group-specific
  groupId?: string | null
  group?: {
    name: string
    _count: { students: number }
  } | null
  subject?: {
    name: string
  } | null
}

interface TodayLessonsProps {
  schedules: LessonSchedule[]
}

type LessonStatus = 'upcoming' | 'current' | 'completed'

interface TimeRemaining {
  hours: number
  minutes: number
  seconds: number
}

export function TodayLessons({ schedules }: TodayLessonsProps) {
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  const getLessonNumber = (startTime: string) => {
    const timeslots = [
      { start: '08:00', num: 1 },
      { start: '09:00', num: 2 },
      { start: '10:00', num: 3 },
      { start: '11:00', num: 4 },
      { start: '12:00', num: 5 },
      { start: '13:00', num: 6 },
      { start: '14:00', num: 7 },
      { start: '15:00', num: 8 },
    ]
    const slot = timeslots.find(t => t.start === startTime)
    return slot ? slot.num : 0
  }

  const formatTime = (time: string) => time.slice(0, 5)

  const parseTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':').map(Number)
    return hours * 60 + minutes
  }

  const getLessonStatus = (startTime: string, endTime: string): LessonStatus => {
    const now = currentTime.getHours() * 60 + currentTime.getMinutes()
    const start = parseTime(startTime)
    const end = parseTime(endTime)

    if (now < start) return 'upcoming'
    if (now >= start && now <= end) return 'current'
    return 'completed'
  }

  const getTimeRemaining = (startTime: string): TimeRemaining | null => {
    const now = currentTime
    const [hours, minutes] = startTime.split(':').map(Number)

    const targetTime = new Date()
    targetTime.setHours(hours, minutes, 0, 0)

    const diff = targetTime.getTime() - now.getTime()
    if (diff <= 0) return null

    const totalSeconds = Math.floor(diff / 1000)
    const h = Math.floor(totalSeconds / 3600)
    const m = Math.floor((totalSeconds % 3600) / 60)
    const s = totalSeconds % 60

    return { hours: h, minutes: m, seconds: s }
  }

  const now = currentTime.getHours() * 60 + currentTime.getMinutes()
  const nextLessonIndex = schedules.findIndex(s => parseTime(s.startTime) > now)

  if (schedules.length === 0) return null

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {schedules.map((schedule, index) => {
        const lessonNum = getLessonNumber(schedule.startTime)
        const status = getLessonStatus(schedule.startTime, schedule.endTime)
        const isNextLesson = index === nextLessonIndex
        const timeRemaining = status === 'upcoming' ? getTimeRemaining(schedule.startTime) : null

        const isGroup = schedule.scheduleSource === 'GROUP'
        const entityName = isGroup
          ? (schedule.group?.name || 'Guruh')
          : (schedule.class?.name || 'Sinf')
        const studentCount = isGroup
          ? (schedule.group?._count?.students || 0)
          : (schedule.class?._count?.students || 0)

        // Build the correct href
        const entityId = isGroup ? schedule.groupId : schedule.classId
        const href = entityId
          ? `${isGroup ? '/teacher/groups' : '/teacher/classes'}/${entityId}?subjectId=${schedule.subjectId || ''}&startTime=${schedule.startTime}&endTime=${schedule.endTime}`
          : '#'

        return (
          <Card
            key={schedule.id}
            className={`group relative overflow-hidden transition-all duration-300 ${
              isNextLesson
                ? 'ring-2 ring-blue-500 shadow-xl shadow-blue-500/20'
                : status === 'current'
                ? 'ring-2 ring-green-500 shadow-xl shadow-green-500/20'
                : status === 'completed'
                ? 'opacity-60'
                : 'hover:shadow-lg'
            }`}
          >
            {/* Header */}
            <div className={`h-20 flex items-center justify-between px-6 ${
              status === 'completed'
                ? 'bg-gray-100 dark:bg-gray-800'
                : status === 'current'
                ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                : isNextLesson
                ? 'bg-gradient-to-r from-blue-500 to-indigo-500'
                : isGroup
                ? 'bg-gradient-to-r from-fuchsia-500 to-purple-600'
                : 'bg-gradient-to-r from-purple-500 to-pink-500'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-2xl ${
                  status === 'completed'
                    ? 'bg-gray-300 text-gray-600'
                    : 'bg-white/20 backdrop-blur-sm text-white'
                }`}>
                  {lessonNum}
                </div>
                <div>
                  <Badge variant="secondary" className={`${
                    status === 'completed'
                      ? 'bg-gray-200 text-gray-600'
                      : 'bg-white/20 backdrop-blur-md text-white border-white/30'
                  }`}>
                    {formatTime(schedule.startTime)} - {formatTime(schedule.endTime)}
                  </Badge>
                </div>
              </div>

              <div className="flex flex-col items-end gap-1">
                {status === 'current' && (
                  <Badge className="bg-white/20 backdrop-blur-md text-white border-white/30">
                    <PlayCircle className="h-3 w-3 mr-1 animate-pulse" />
                    Hozir
                  </Badge>
                )}
                {status === 'completed' && (
                  <Badge variant="secondary" className="bg-gray-200 text-gray-600">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Tugadi
                  </Badge>
                )}
                {isGroup && (
                  <Badge className="bg-white/20 backdrop-blur-sm text-white border-white/30 text-[10px]">
                    Guruh
                  </Badge>
                )}
              </div>
            </div>

            <CardContent className="p-6 space-y-4">
              {/* Professional Countdown Timer - Next Lesson */}
              {isNextLesson && timeRemaining && (
                <div className="mb-4">
                  <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-3 text-center uppercase tracking-wider">
                    Keyingi Dars Boshlanishiga
                  </p>
                  <div className="flex items-center justify-center gap-2">
                    <div className="flex flex-col items-center">
                      <div className="w-16 h-16 rounded-lg bg-blue-500 text-white flex items-center justify-center shadow-lg">
                        <span className="text-2xl font-bold tabular-nums">
                          {String(timeRemaining.hours).padStart(2, '0')}
                        </span>
                      </div>
                      <span className="text-xs font-medium text-gray-600 dark:text-gray-400 mt-1">soat</span>
                    </div>
                    <span className="text-2xl font-bold text-gray-400 pb-5">:</span>
                    <div className="flex flex-col items-center">
                      <div className="w-16 h-16 rounded-lg bg-blue-500 text-white flex items-center justify-center shadow-lg">
                        <span className="text-2xl font-bold tabular-nums">
                          {String(timeRemaining.minutes).padStart(2, '0')}
                        </span>
                      </div>
                      <span className="text-xs font-medium text-gray-600 dark:text-gray-400 mt-1">daqiqa</span>
                    </div>
                    <span className="text-2xl font-bold text-gray-400 pb-5">:</span>
                    <div className="flex flex-col items-center">
                      <div className="w-16 h-16 rounded-lg bg-blue-500 text-white flex items-center justify-center shadow-lg animate-pulse">
                        <span className="text-2xl font-bold tabular-nums">
                          {String(timeRemaining.seconds).padStart(2, '0')}
                        </span>
                      </div>
                      <span className="text-xs font-medium text-gray-600 dark:text-gray-400 mt-1">soniya</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Regular Countdown for Other Upcoming Lessons */}
              {!isNextLesson && status === 'upcoming' && timeRemaining && timeRemaining.hours < 3 && (
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 border border-purple-200 dark:border-purple-800 rounded-lg p-3 mb-4">
                  <div className="flex items-center justify-center gap-3">
                    <Clock className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    <span className="text-lg font-bold text-purple-700 dark:text-purple-300 tabular-nums">
                      {String(timeRemaining.hours).padStart(2, '0')}:
                      {String(timeRemaining.minutes).padStart(2, '0')}:
                      {String(timeRemaining.seconds).padStart(2, '0')}
                    </span>
                  </div>
                </div>
              )}

              {/* Subject */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <BookOpen className="h-4 w-4 text-indigo-600" />
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Fan</span>
                </div>
                <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  {schedule.subject?.name || 'Fan nomi yo\'q'}
                </p>
              </div>

              {/* Class / Group */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-4 w-4 text-blue-600" />
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    {isGroup ? 'Guruh' : 'Sinf'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <p className="text-base font-bold text-gray-900 dark:text-gray-100">
                      {entityName}
                    </p>
                    {isGroup && (
                      <Badge className="bg-purple-100 text-purple-700 text-[10px] px-1.5 py-0">
                        Guruh
                      </Badge>
                    )}
                  </div>
                  <Badge variant="secondary">{studentCount} ta</Badge>
                </div>
              </div>

              {/* Room */}
              {schedule.roomNumber && (
                <div className="flex items-center gap-2 text-sm bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 rounded-lg p-3">
                  <MapPin className="h-4 w-4 text-orange-600" />
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    Xona: <span className="font-bold">{schedule.roomNumber}</span>
                  </span>
                </div>
              )}

              {/* Action Button */}
              <Link href={href}>
                <Button
                  className={`w-full ${
                    status === 'current'
                      ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600'
                      : status === 'completed'
                      ? 'bg-gray-400 hover:bg-gray-500 cursor-not-allowed'
                      : isNextLesson
                      ? 'bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600'
                      : isGroup
                      ? 'bg-gradient-to-r from-fuchsia-500 to-purple-600 hover:from-fuchsia-600 hover:to-purple-700'
                      : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600'
                  } text-white shadow-lg`}
                  disabled={status === 'completed'}
                >
                  {status === 'current' ? (
                    <>
                      <PlayCircle className="mr-2 h-4 w-4" />
                      Darsga Kirish
                    </>
                  ) : status === 'completed' ? (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Dars Tugadi
                    </>
                  ) : (
                    <>
                      Darsga Kirish
                      <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </Button>
              </Link>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
