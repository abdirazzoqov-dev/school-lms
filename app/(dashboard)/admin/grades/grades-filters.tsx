'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Filter, X, Calendar } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface Class {
  id: string
  name: string
  _count: {
    students: number
  }
}

interface Subject {
  id: string
  name: string
  code: string
}

interface TimeSlot {
  label: string
  value: string
  lessonNumber: number
}

interface Group {
  id: string
  name: string
  _count: { students: number }
}

interface GradesFiltersProps {
  classes: Class[]
  groups: Group[]
  subjects: Subject[]
  timeSlots: TimeSlot[]
  searchParams: {
    date?: string
    period?: 'day' | 'week' | 'month'
    classId?: string
    groupId?: string
    subjectId?: string
    quarter?: string
    gradeType?: string
    timeSlot?: string
  }
  selectedDate: string
  period: 'day' | 'week' | 'month'
}

export function GradesFilters({ classes, groups, subjects, timeSlots, searchParams, selectedDate, period }: GradesFiltersProps) {
  const router = useRouter()
  const pathname = usePathname()
  const urlSearchParams = useSearchParams()

  const updateSearchParams = (key: string, value: string) => {
    const params = new URLSearchParams(urlSearchParams.toString())
    if (value && value !== 'all') {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    router.push(`${pathname}?${params.toString()}`)
  }

  const clearFilters = () => {
    router.push(`${pathname}?date=${selectedDate}&period=${period}`)
  }

  const hasActiveFilters = searchParams.classId || searchParams.groupId || searchParams.subjectId || 
    searchParams.quarter || searchParams.gradeType || searchParams.timeSlot

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="font-semibold text-sm">Filterlar</span>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="h-7"
              >
                <X className="h-4 w-4 mr-1" />
                Tozalash
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-7 gap-4">
            {/* Date */}
            <div className="space-y-2">
              <Label className="text-xs flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Sana
              </Label>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => updateSearchParams('date', e.target.value)}
                className="w-full"
              />
            </div>

            {/* Period */}
            <div className="space-y-2">
              <Label className="text-xs">Davr</Label>
              <Select
                value={period}
                onValueChange={(value) => updateSearchParams('period', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">Kun</SelectItem>
                  <SelectItem value="week">Hafta</SelectItem>
                  <SelectItem value="month">Oy</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Class Filter */}
            <div className="space-y-2">
              <Label className="text-xs">Sinf</Label>
              <Select
                value={searchParams.classId || 'all'}
                onValueChange={(value) => updateSearchParams('classId', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Barcha sinflar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Barcha sinflar</SelectItem>
                  {classes.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.name} ({cls._count.students})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Group Filter */}
            <div className="space-y-2">
              <Label className="text-xs">Guruh</Label>
              <Select
                value={searchParams.groupId || 'all'}
                onValueChange={(value) => updateSearchParams('groupId', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Barcha guruhlar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Barcha guruhlar</SelectItem>
                  {groups.map((grp) => (
                    <SelectItem key={grp.id} value={grp.id}>
                      {grp.name} ({grp._count.students})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Subject Filter */}
            <div className="space-y-2">
              <Label className="text-xs">Fan</Label>
              <Select
                value={searchParams.subjectId || 'all'}
                onValueChange={(value) => updateSearchParams('subjectId', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Barcha fanlar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Barcha fanlar</SelectItem>
                  {subjects.map((subject) => (
                    <SelectItem key={subject.id} value={subject.id}>
                      {subject.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Grade Type Filter */}
            <div className="space-y-2">
              <Label className="text-xs">Baho turi</Label>
              <Select
                value={searchParams.gradeType || 'all'}
                onValueChange={(value) => updateSearchParams('gradeType', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Barcha turlar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Barcha turlar</SelectItem>
                  <SelectItem value="ORAL">Og'zaki</SelectItem>
                  <SelectItem value="WRITTEN">Yozma</SelectItem>
                  <SelectItem value="TEST">Test</SelectItem>
                  <SelectItem value="EXAM">Imtihon</SelectItem>
                  <SelectItem value="QUARTER">Chorak</SelectItem>
                  <SelectItem value="FINAL">Yillik</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Time Slot Filter */}
            <div className="space-y-2">
              <Label className="text-xs">Dars Vaqti</Label>
              <Select
                value={searchParams.timeSlot || 'all'}
                onValueChange={(value) => updateSearchParams('timeSlot', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Barcha darslar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Barcha darslar</SelectItem>
                  {timeSlots.map((slot) => (
                    <SelectItem key={slot.value} value={slot.value}>
                      {slot.lessonNumber}-dars: {slot.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Active Filters Display */}
          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t">
              <span className="text-xs text-muted-foreground">Faol filterlar:</span>
              {searchParams.classId && (
                <Badge variant="secondary">
                  {classes.find(c => c.id === searchParams.classId)?.name}
                </Badge>
              )}
              {searchParams.groupId && (
                <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                  Guruh: {groups.find(g => g.id === searchParams.groupId)?.name}
                </Badge>
              )}
              {searchParams.subjectId && (
                <Badge variant="secondary">
                  {subjects.find(s => s.id === searchParams.subjectId)?.name}
                </Badge>
              )}
              {searchParams.gradeType && (
                <Badge variant="secondary">
                  {searchParams.gradeType}
                </Badge>
              )}
              {searchParams.timeSlot && (
                <Badge variant="secondary">
                  {timeSlots.find(s => s.value === searchParams.timeSlot)?.lessonNumber}-dars: {timeSlots.find(s => s.value === searchParams.timeSlot)?.label}
                </Badge>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

