'use client'

import { useState } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Filter, X, Calendar, Clock, BookOpen, Users, FileSpreadsheet } from 'lucide-react'

type Props = {
  classes: Array<{ id: string; name: string }>
  subjects: Array<{ id: string; name: string }>
  timeSlots: Array<{ startTime: string; endTime: string }>
}

export function TeacherAttendanceFilters({ classes, subjects, timeSlots }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [date, setDate] = useState(searchParams.get('date') || new Date().toISOString().split('T')[0])
  const [period, setPeriod] = useState(searchParams.get('period') || 'day')
  const [classId, setClassId] = useState(searchParams.get('classId') || '')
  const [subjectId, setSubjectId] = useState(searchParams.get('subjectId') || '')
  const [timeSlot, setTimeSlot] = useState(searchParams.get('timeSlot') || '')

  const updateSearchParams = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    router.push(`${pathname}?${params.toString()}`)
  }

  const handleDateChange = (newDate: string) => {
    setDate(newDate)
    updateSearchParams('date', newDate)
  }

  const handlePeriodChange = (newPeriod: string) => {
    setPeriod(newPeriod)
    updateSearchParams('period', newPeriod)
  }

  const handleClassChange = (newClassId: string) => {
    setClassId(newClassId)
    updateSearchParams('classId', newClassId)
  }

  const handleSubjectChange = (newSubjectId: string) => {
    setSubjectId(newSubjectId)
    updateSearchParams('subjectId', newSubjectId)
  }

  const handleTimeSlotChange = (newTimeSlot: string) => {
    setTimeSlot(newTimeSlot)
    updateSearchParams('timeSlot', newTimeSlot)
  }

  const clearFilters = () => {
    setDate(new Date().toISOString().split('T')[0])
    setPeriod('day')
    setClassId('')
    setSubjectId('')
    setTimeSlot('')
    router.push(pathname)
  }

  const handleExport = () => {
    const params = new URLSearchParams()
    params.set('date', date)
    params.set('period', period)
    if (classId) params.set('classId', classId)
    if (subjectId) params.set('subjectId', subjectId)
    if (timeSlot) params.set('timeSlot', timeSlot)
    
    window.location.href = `/api/teacher/attendance/export?${params.toString()}`
  }

  const hasActiveFilters = classId || subjectId || timeSlot || period !== 'day'

  // Get label for period
  const periodLabels: Record<string, string> = {
    day: 'Kun',
    week: 'Hafta',
    month: 'Oy'
  }

  return (
    <Card className="border-2 shadow-lg">
      <CardContent className="pt-6">
        <div className="space-y-4">
          {/* Filter Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/20">
                <Filter className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Filterlar</h3>
                <p className="text-sm text-muted-foreground">
                  Davomat ma'lumotlarini filter qiling
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4 mr-2" />
                  Tozalash
                </Button>
              )}
              <Button
                onClick={handleExport}
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                size="sm"
              >
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Excel
              </Button>
            </div>
          </div>

          {/* Filter Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            {/* Date */}
            <div className="space-y-2">
              <Label htmlFor="date" className="flex items-center gap-2 text-sm font-medium">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                Sana
              </Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => handleDateChange(e.target.value)}
                className="w-full"
              />
            </div>

            {/* Period */}
            <div className="space-y-2">
              <Label htmlFor="period" className="flex items-center gap-2 text-sm font-medium">
                <Clock className="h-4 w-4 text-muted-foreground" />
                Davr
              </Label>
              <Select value={period} onValueChange={handlePeriodChange}>
                <SelectTrigger id="period">
                  <SelectValue placeholder="Davrni tanlang" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">Kun</SelectItem>
                  <SelectItem value="week">Hafta</SelectItem>
                  <SelectItem value="month">Oy</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Class */}
            <div className="space-y-2">
              <Label htmlFor="class" className="flex items-center gap-2 text-sm font-medium">
                <Users className="h-4 w-4 text-muted-foreground" />
                Sinf
              </Label>
              <Select value={classId} onValueChange={handleClassChange}>
                <SelectTrigger id="class">
                  <SelectValue placeholder="Barcha sinflar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Barcha sinflar</SelectItem>
                  {classes.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Subject */}
            <div className="space-y-2">
              <Label htmlFor="subject" className="flex items-center gap-2 text-sm font-medium">
                <BookOpen className="h-4 w-4 text-muted-foreground" />
                Fan
              </Label>
              <Select value={subjectId} onValueChange={handleSubjectChange}>
                <SelectTrigger id="subject">
                  <SelectValue placeholder="Barcha fanlar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Barcha fanlar</SelectItem>
                  {subjects.map((subject) => (
                    <SelectItem key={subject.id} value={subject.id}>
                      {subject.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Time Slot */}
            <div className="space-y-2">
              <Label htmlFor="timeSlot" className="flex items-center gap-2 text-sm font-medium">
                <Clock className="h-4 w-4 text-muted-foreground" />
                Dars Vaqti
              </Label>
              <Select value={timeSlot} onValueChange={handleTimeSlotChange}>
                <SelectTrigger id="timeSlot">
                  <SelectValue placeholder="Barcha vaqtlar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Barcha vaqtlar</SelectItem>
                  {timeSlots.map((slot, index) => (
                    <SelectItem key={`${slot.startTime}-${slot.endTime}`} value={slot.startTime}>
                      {index + 1}-dars: {slot.startTime} - {slot.endTime}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Active Filters */}
          {hasActiveFilters && (
            <div className="flex items-center gap-2 pt-2 border-t">
              <span className="text-sm text-muted-foreground">Faol filterlar:</span>
              <div className="flex flex-wrap gap-2">
                {period !== 'day' && (
                  <Badge variant="secondary" className="gap-1">
                    Davr: {periodLabels[period]}
                    <button
                      onClick={() => handlePeriodChange('day')}
                      className="ml-1 hover:bg-secondary-foreground/20 rounded-full"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {classId && (
                  <Badge variant="secondary" className="gap-1">
                    Sinf: {classes.find(c => c.id === classId)?.name}
                    <button
                      onClick={() => handleClassChange('')}
                      className="ml-1 hover:bg-secondary-foreground/20 rounded-full"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {subjectId && (
                  <Badge variant="secondary" className="gap-1">
                    Fan: {subjects.find(s => s.id === subjectId)?.name}
                    <button
                      onClick={() => handleSubjectChange('')}
                      className="ml-1 hover:bg-secondary-foreground/20 rounded-full"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {timeSlot && (
                  <Badge variant="secondary" className="gap-1">
                    Vaqt: {timeSlot}
                    <button
                      onClick={() => handleTimeSlotChange('')}
                      className="ml-1 hover:bg-secondary-foreground/20 rounded-full"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

