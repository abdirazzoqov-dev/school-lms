'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Users, BookOpen, Clock, MapPin, ArrowRight, CheckCircle2, PlayCircle } from 'lucide-react'
import Link from 'next/link'

interface LessonSchedule {
  id: string
  startTime: string
  endTime: string
  roomNumber: string | null
  classId: string
  subjectId: string
  class: {
    name: string
    _count: {
      students: number
    }
  }
  subject: {
    name: string
  }
}

interface TodayLessonsProps {
  schedules: LessonSchedule[]
}

type LessonStatus = 'upcoming' | 'current' | 'completed'

export function TodayLessons({ schedules }: TodayLessonsProps) {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [nextLessonCountdown, setNextLessonCountdown] = useState<string>('')

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000) // Update every second

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
    return hours * 60 + minutes // Convert to minutes since midnight
  }

  const getLessonStatus = (startTime: string, endTime: string): LessonStatus => {
    const now = currentTime.getHours() * 60 + currentTime.getMinutes()
    const start = parseTime(startTime)
    const end = parseTime(endTime)

    if (now < start) return 'upcoming'
    if (now >= start && now <= end) return 'current'
    return 'completed'
  }

  const getTimeUntilLesson = (startTime: string): string => {
    const now = currentTime.getHours() * 60 + currentTime.getMinutes()
    const start = parseTime(startTime)
    const diff = start - now

    if (diff <= 0) return ''

    const hours = Math.floor(diff / 60)
    const minutes = diff % 60

    if (hours > 0) {
      return `${hours} soat ${minutes} daqiqa`
    }
    return `${minutes} daqiqa`
  }

  // Find next lesson
  useEffect(() => {
    const now = currentTime.getHours() * 60 + currentTime.getMinutes()
    
    const upcomingLessons = schedules
      .filter(s => parseTime(s.startTime) > now)
      .sort((a, b) => parseTime(a.startTime) - parseTime(b.startTime))

    if (upcomingLessons.length > 0) {
      const nextLesson = upcomingLessons[0]
      const timeUntil = getTimeUntilLesson(nextLesson.startTime)
      setNextLessonCountdown(timeUntil)
    } else {
      setNextLessonCountdown('')
    }
  }, [currentTime, schedules])

  const getStatusBadge = (status: LessonStatus) => {
    switch (status) {
      case 'current':
        return (
          <Badge className="bg-green-500 hover:bg-green-600 text-white animate-pulse">
            <PlayCircle className="h-3 w-3 mr-1" />
            Hozir
          </Badge>
        )
      case 'completed':
        return (
          <Badge variant="secondary" className="bg-gray-200 dark:bg-gray-700">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            O'tdi
          </Badge>
        )
      default:
        return null
    }
  }

  const getCardGradient = (index: number, status: LessonStatus) => {
    if (status === 'completed') {
      return 'from-gray-400 to-gray-500'
    }
    if (status === 'current') {
      return 'from-green-500 to-emerald-600'
    }
    
    const gradients = [
      'from-blue-500 to-indigo-600',
      'from-purple-500 to-pink-600',
      'from-green-500 to-emerald-600',
      'from-orange-500 to-red-600',
      'from-cyan-500 to-blue-600',
      'from-violet-500 to-purple-600',
    ]
    return gradients[index % gradients.length]
  }

  if (schedules.length === 0) {
    return null
  }

  // Find next lesson for highlight
  const now = currentTime.getHours() * 60 + currentTime.getMinutes()
  const nextLessonIndex = schedules.findIndex(s => parseTime(s.startTime) > now)

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {schedules.map((schedule, index) => {
        const lessonNum = getLessonNumber(schedule.startTime)
        const status = getLessonStatus(schedule.startTime, schedule.endTime)
        const gradient = getCardGradient(index, status)
        const isNextLesson = index === nextLessonIndex
        const timeUntil = status === 'upcoming' ? getTimeUntilLesson(schedule.startTime) : ''

        return (
          <Card 
            key={schedule.id}
            className={`group relative overflow-hidden border-none shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 ${
              isNextLesson ? 'ring-2 ring-orange-500 ring-offset-2' : ''
            }`}
          >
            {/* Gradient Header */}
            <div className={`h-24 bg-gradient-to-br ${gradient} p-4 relative ${
              status === 'completed' ? 'opacity-60' : ''
            }`}>
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
                    {getStatusBadge(status)}
                  </div>
                </div>
              </div>
              {/* Decorative circle */}
              <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-white/10 rounded-full" />
            </div>

            <CardContent className="p-5 space-y-4">
              {/* Next Lesson Countdown */}
              {isNextLesson && timeUntil && (
                <div className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-950/30 dark:to-red-950/30 border-2 border-orange-500 rounded-lg p-3 animate-pulse-slow">
                  <div className="flex items-center justify-center gap-2">
                    <Clock className="h-5 w-5 text-orange-600 animate-bounce" />
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground font-medium">Keyingi dars</p>
                      <p className="text-lg font-bold text-orange-600">{timeUntil}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Upcoming countdown for other lessons */}
              {!isNextLesson && status === 'upcoming' && timeUntil && (
                <div className="bg-muted/50 rounded-lg p-2 text-center">
                  <p className="text-xs text-muted-foreground">Boshlanishiga</p>
                  <p className="text-sm font-semibold text-foreground">{timeUntil}</p>
                </div>
              )}

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
                  className={`w-full ${
                    status === 'current' 
                      ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700' 
                      : status === 'completed'
                      ? 'bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800'
                      : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700'
                  } text-white shadow-lg group-hover:shadow-xl transition-all`}
                  size="sm"
                  disabled={status === 'completed'}
                >
                  {status === 'current' ? (
                    <>
                      <PlayCircle className="mr-2 h-4 w-4" />
                      Darsga kirish
                    </>
                  ) : status === 'completed' ? (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Dars tugadi
                    </>
                  ) : (
                    <>
                      Darsga kirish
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

