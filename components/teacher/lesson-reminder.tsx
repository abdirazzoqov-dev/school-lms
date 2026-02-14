'use client'

import { useEffect, useState } from 'react'
import { Bell, Clock, BookOpen, Users } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { toast } from 'sonner'

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

interface LessonReminderProps {
  schedules: LessonSchedule[]
}

export function LessonReminder({ schedules }: LessonReminderProps) {
  const [notifiedLessons, setNotifiedLessons] = useState<Set<string>>(new Set())
  const [upcomingLesson, setUpcomingLesson] = useState<LessonSchedule | null>(null)
  const [minutesUntilLesson, setMinutesUntilLesson] = useState<number>(0)
  const [permissionGranted, setPermissionGranted] = useState(false)

  // Request notification permission
  useEffect(() => {
    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        setPermissionGranted(true)
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
          setPermissionGranted(permission === 'granted')
        })
      }
    }
  }, [])

  useEffect(() => {
    const checkUpcomingLessons = () => {
      const now = new Date()
      const currentTime = now.getHours() * 60 + now.getMinutes() // Minutes since midnight

      let closestLesson: LessonSchedule | null = null
      let minDifference = Infinity

      schedules.forEach(schedule => {
        const [hours, minutes] = schedule.startTime.split(':').map(Number)
        const lessonTime = hours * 60 + minutes
        const difference = lessonTime - currentTime

        // Check if lesson is upcoming (within next 10 minutes and hasn't started yet)
        if (difference > 0 && difference <= 10 && difference < minDifference) {
          closestLesson = schedule
          minDifference = difference
        }

        // Send notification 5-10 minutes before lesson starts
        if (difference >= 5 && difference <= 10 && !notifiedLessons.has(schedule.id)) {
          // Browser notification
          if (permissionGranted) {
            new Notification('Dars Eslatma 🔔', {
              body: `${difference} daqiqadan keyin "${schedule.subject.name}" darsingiz boshlanadi!\nSinf: ${schedule.class.name}${schedule.roomNumber ? `\nXona: ${schedule.roomNumber}` : ''}`,
              icon: '/logo.png',
              tag: schedule.id,
              requireInteraction: true
            })
          }

          // In-app toast notification
          toast.info(`Dars Eslatma`, {
            description: `${difference} daqiqadan keyin "${schedule.subject.name}" darsingiz boshlanadi! Sinf: ${schedule.class.name}`,
            duration: 10000,
            action: {
              label: 'Darsga kirish',
              onClick: () => {
                window.location.href = `/teacher/classes/${schedule.classId}?subjectId=${schedule.subjectId}&startTime=${schedule.startTime}&endTime=${schedule.endTime}`
              }
            }
          })

          setNotifiedLessons(prev => new Set(prev).add(schedule.id))
        }
      })

      setUpcomingLesson(closestLesson)
      setMinutesUntilLesson(minDifference)
    }

    // Check immediately
    checkUpcomingLessons()

    // Check every 30 seconds
    const interval = setInterval(checkUpcomingLessons, 30000)

    return () => clearInterval(interval)
  }, [schedules, notifiedLessons, permissionGranted])

  // Don't show anything if no upcoming lesson within 10 minutes
  if (!upcomingLesson || minutesUntilLesson > 10) {
    return null
  }

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

  return (
    <Card className="border-2 border-orange-500 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30 shadow-2xl animate-pulse-slow">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          {/* Animated Bell Icon */}
          <div className="relative">
            <div className="absolute inset-0 bg-orange-500/20 rounded-full animate-ping" />
            <div className="relative p-3 rounded-full bg-gradient-to-br from-orange-500 to-red-600 text-white shadow-lg">
              <Bell className="h-6 w-6 animate-bounce" />
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Badge className="bg-orange-500 hover:bg-orange-600 text-white">
                    <Clock className="h-3 w-3 mr-1" />
                    {minutesUntilLesson} daqiqadan keyin
                  </Badge>
                  <Badge variant="outline" className="border-orange-500 text-orange-700">
                    {getLessonNumber(upcomingLesson.startTime)}-dars
                  </Badge>
                </div>
                <h3 className="text-lg font-bold text-foreground">
                  Dars boshlanishga tayyorlaning! 📚
                </h3>
              </div>
            </div>

            {/* Lesson Details */}
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-blue-100 dark:bg-blue-900/20">
                  <Clock className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Vaqt</p>
                  <p className="font-semibold">{formatTime(upcomingLesson.startTime)} - {formatTime(upcomingLesson.endTime)}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-purple-100 dark:bg-purple-900/20">
                  <BookOpen className="h-4 w-4 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Fan</p>
                  <p className="font-semibold line-clamp-1">{upcomingLesson.subject.name}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-green-100 dark:bg-green-900/20">
                  <Users className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Sinf</p>
                  <p className="font-semibold">{upcomingLesson.class.name} ({upcomingLesson.class._count.students} ta)</p>
                </div>
              </div>

              {upcomingLesson.roomNumber && (
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-md bg-orange-100 dark:bg-orange-900/20">
                    <Clock className="h-4 w-4 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Xona</p>
                    <p className="font-semibold">{upcomingLesson.roomNumber}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Action Button */}
            <Link 
              href={`/teacher/classes/${upcomingLesson.classId}?subjectId=${upcomingLesson.subjectId}&startTime=${upcomingLesson.startTime}&endTime=${upcomingLesson.endTime}`}
            >
              <Button className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white shadow-lg">
                <Bell className="mr-2 h-4 w-4" />
                Darsga Kirish
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

