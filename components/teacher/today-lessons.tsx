'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Users, BookOpen, Clock, MapPin, ArrowRight, CheckCircle2, PlayCircle, Timer, TrendingUp } from 'lucide-react'
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

  const getTimeUntilLesson = (startTime: string): string => {
    const now = currentTime.getHours() * 60 + currentTime.getMinutes()
    const start = parseTime(startTime)
    const diff = start - now

    if (diff <= 0) return ''

    const hours = Math.floor(diff / 60)
    const minutes = diff % 60

    if (hours > 0) {
      return `${hours}s ${minutes}d`
    }
    return `${minutes}d`
  }

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

  const getStatusConfig = (status: LessonStatus) => {
    switch (status) {
      case 'current':
        return {
          badge: (
            <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white border-0 shadow-lg shadow-emerald-500/50 animate-pulse">
              <PlayCircle className="h-3 w-3 mr-1" />
              Hozir
            </Badge>
          ),
          gradient: 'from-emerald-500 via-green-500 to-teal-500',
          ringColor: 'ring-emerald-400',
          glowColor: 'shadow-emerald-500/30'
        }
      case 'completed':
        return {
          badge: (
            <Badge variant="secondary" className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Tugadi
            </Badge>
          ),
          gradient: 'from-slate-400 to-slate-500',
          ringColor: 'ring-slate-300',
          glowColor: 'shadow-slate-500/20'
        }
      default:
        return {
          badge: null,
          gradient: '',
          ringColor: '',
          glowColor: ''
        }
    }
  }

  const getCardGradient = (index: number) => {
    const gradients = [
      { header: 'from-blue-500 via-indigo-500 to-purple-500', accent: 'bg-blue-500' },
      { header: 'from-purple-500 via-pink-500 to-rose-500', accent: 'bg-purple-500' },
      { header: 'from-emerald-500 via-teal-500 to-cyan-500', accent: 'bg-emerald-500' },
      { header: 'from-orange-500 via-red-500 to-pink-500', accent: 'bg-orange-500' },
      { header: 'from-cyan-500 via-blue-500 to-indigo-500', accent: 'bg-cyan-500' },
      { header: 'from-violet-500 via-purple-500 to-fuchsia-500', accent: 'bg-violet-500' },
    ]
    return gradients[index % gradients.length]
  }

  if (schedules.length === 0) {
    return null
  }

  const now = currentTime.getHours() * 60 + currentTime.getMinutes()
  const nextLessonIndex = schedules.findIndex(s => parseTime(s.startTime) > now)

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {schedules.map((schedule, index) => {
        const lessonNum = getLessonNumber(schedule.startTime)
        const status = getLessonStatus(schedule.startTime, schedule.endTime)
        const statusConfig = getStatusConfig(status)
        const isNextLesson = index === nextLessonIndex
        const timeUntil = status === 'upcoming' ? getTimeUntilLesson(schedule.startTime) : ''
        const gradient = getCardGradient(index)

        return (
          <Card 
            key={schedule.id}
            className={`group relative overflow-hidden transition-all duration-500 hover:shadow-2xl ${
              isNextLesson 
                ? 'ring-4 ring-orange-400 ring-offset-2 dark:ring-offset-slate-900 scale-105 shadow-2xl shadow-orange-500/50' 
                : status === 'current'
                ? `ring-2 ${statusConfig.ringColor} shadow-xl ${statusConfig.glowColor}`
                : 'hover:scale-105 shadow-lg'
            } ${
              status === 'completed' ? 'opacity-75' : ''
            }`}
          >
            {/* Gradient Header with Lesson Number */}
            <div className={`relative h-32 bg-gradient-to-br ${
              status === 'completed' 
                ? statusConfig.gradient 
                : gradient.header
            } p-6 overflow-hidden`}>
              {/* Animated Background Pattern */}
              <div className="absolute inset-0 opacity-20">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(255,255,255,0.1),transparent)]" />
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl" />
              </div>

              <div className="relative z-10 flex items-start justify-between">
                {/* Lesson Number Badge */}
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-2xl bg-white/95 backdrop-blur-sm flex items-center justify-center shadow-2xl shadow-black/20 ring-2 ring-white/30">
                    <span className="text-2xl font-black bg-gradient-to-br from-slate-700 to-slate-900 bg-clip-text text-transparent">
                      {lessonNum}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <Badge className="bg-white/20 backdrop-blur-md text-white border-white/30 hover:bg-white/30 font-semibold text-xs px-3 py-1 shadow-lg">
                      <Clock className="h-3 w-3 mr-1.5" />
                      {formatTime(schedule.startTime)} - {formatTime(schedule.endTime)}
                    </Badge>
                    {statusConfig.badge}
                  </div>
                </div>
              </div>

              {/* Decorative Elements */}
              <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-white/10 rounded-full blur-2xl" />
              <div className="absolute -top-6 -left-6 w-20 h-20 bg-white/10 rounded-full blur-xl" />
            </div>

            <CardContent className="p-6 space-y-4 bg-gradient-to-br from-white to-slate-50/50 dark:from-slate-900 dark:to-slate-800/50">
              {/* Next Lesson Countdown - Prominent Display */}
              {isNextLesson && timeUntil && (
                <div className="relative -mt-3 mb-4">
                  <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl blur-lg opacity-50 animate-pulse" />
                  <div className="relative bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-950/50 dark:to-red-950/50 border-2 border-orange-400 dark:border-orange-600 rounded-xl p-4 shadow-lg">
                    <div className="flex items-center justify-center gap-3">
                      <div className="p-2 rounded-lg bg-orange-500 text-white shadow-lg">
                        <Timer className="h-5 w-5 animate-bounce" />
                      </div>
                      <div className="text-center">
                        <p className="text-xs font-medium text-orange-600 dark:text-orange-400 mb-0.5">
                          Keyingi dars
                        </p>
                        <p className="text-2xl font-black text-orange-600 dark:text-orange-400 tracking-tight">
                          {timeUntil}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Regular Countdown for Upcoming Lessons */}
              {!isNextLesson && status === 'upcoming' && timeUntil && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                  <div className="flex items-center justify-center gap-2">
                    <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                      {timeUntil} dan keyin
                    </p>
                  </div>
                </div>
              )}

              {/* Subject */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className={`p-2 rounded-lg ${gradient.accent} bg-opacity-10`}>
                    <BookOpen className={`h-4 w-4 ${gradient.accent.replace('bg-', 'text-')}`} />
                  </div>
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Fan
                  </span>
                </div>
                <p className="text-lg font-bold text-slate-900 dark:text-slate-100 line-clamp-1 pl-10">
                  {schedule.subject?.name || 'Fan nomi yo\'q'}
                </p>
              </div>

              {/* Class Info */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-blue-500 bg-opacity-10">
                    <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Sinf
                  </span>
                </div>
                <div className="flex items-center justify-between pl-10">
                  <p className="text-base font-bold text-slate-900 dark:text-slate-100">
                    {schedule.class?.name || 'Sinf yo\'q'}
                  </p>
                  <Badge variant="secondary" className="text-xs font-semibold bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                    <Users className="h-3 w-3 mr-1" />
                    {schedule.class?._count.students || 0}
                  </Badge>
                </div>
              </div>

              {/* Room Number */}
              {schedule.roomNumber && (
                <div className="flex items-center gap-2 text-sm bg-slate-100 dark:bg-slate-800 rounded-lg p-3">
                  <div className="p-1.5 rounded-md bg-orange-500 bg-opacity-10">
                    <MapPin className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                  </div>
                  <span className="font-medium text-slate-600 dark:text-slate-300">
                    Xona: <span className="font-bold text-slate-900 dark:text-slate-100">{schedule.roomNumber}</span>
                  </span>
                </div>
              )}

              {/* Action Button */}
              <Link 
                href={`/teacher/classes/${schedule.classId}?subjectId=${schedule.subjectId}&startTime=${schedule.startTime}&endTime=${schedule.endTime}`}
                className="block mt-4"
              >
                <Button 
                  className={`w-full h-12 text-base font-bold shadow-lg group-hover:shadow-xl transition-all duration-300 ${
                    status === 'current' 
                      ? 'bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 shadow-emerald-500/50' 
                      : status === 'completed'
                      ? 'bg-gradient-to-r from-slate-400 to-slate-500 hover:from-slate-500 hover:to-slate-600 cursor-not-allowed opacity-60'
                      : isNextLesson
                      ? 'bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 shadow-orange-500/50 ring-2 ring-orange-300 ring-offset-2'
                      : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-purple-500/50'
                  } text-white`}
                  disabled={status === 'completed'}
                >
                  {status === 'current' ? (
                    <>
                      <PlayCircle className="mr-2 h-5 w-5 animate-pulse" />
                      Darsga Kirish
                      <TrendingUp className="ml-2 h-5 w-5" />
                    </>
                  ) : status === 'completed' ? (
                    <>
                      <CheckCircle2 className="mr-2 h-5 w-5" />
                      Dars Tugadi
                    </>
                  ) : (
                    <>
                      Darsga Kirish
                      <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
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
