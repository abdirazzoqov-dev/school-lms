'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { 
  Clock, BookOpen, Save, Trash2, Plus,
  AlertCircle, CheckCircle2, Edit, X, Settings, TrendingUp,
  Calendar, Users, Sparkles, Coffee, Utensils
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface Teacher {
  id: string
  user: { fullName: string }
  specialization: string
}

interface Subject {
  id: string
  name: string
  code: string
  color?: string
}

interface Class {
  id: string
  name: string
  gradeLevel: number
}

interface Group {
  id: string
  name: string
  description?: string | null
}

interface TimeSlot {
  id: string
  startTime: string
  endTime: string
  label: string
}

type ScheduleItemType = 'LESSON' | 'BREAK' | 'LUNCH'

interface ScheduleItem {
  id: string
  dayOfWeek: number
  timeSlotId: string
  type: ScheduleItemType
  subjectId?: string
  teacherId?: string
  roomNumber?: string
  title?: string // For break/lunch names
  duration?: number // In minutes
}

interface ScheduleBuilderProps {
  classItem?: Class | null
  groupItem?: Group | null
  type: 'class' | 'group'
  teachers: Teacher[]
  subjects: Subject[]
  existingSchedules?: any[]
}

const DAYS = [
  { id: 1, name: 'Dushanba', short: 'Dush' },
  { id: 2, name: 'Seshanba', short: 'Sesh' },
  { id: 3, name: 'Chorshanba', short: 'Chor' },
  { id: 4, name: 'Payshanba', short: 'Pay' },
  { id: 5, name: 'Juma', short: 'Juma' },
  { id: 6, name: 'Shanba', short: 'Shan' },
]

const DEFAULT_TIME_SLOTS: TimeSlot[] = [
  { id: '1', startTime: '08:00', endTime: '08:45', label: '1-dars' },
  { id: '2', startTime: '08:55', endTime: '09:40', label: '2-dars' },
  { id: '3', startTime: '09:50', endTime: '10:35', label: '3-dars' },
  { id: '4', startTime: '10:55', endTime: '11:40', label: '4-dars' },
  { id: '5', startTime: '11:50', endTime: '12:35', label: '5-dars' },
  { id: '6', startTime: '12:45', endTime: '13:30', label: '6-dars' },
  { id: '7', startTime: '13:40', endTime: '14:25', label: '7-dars' },
]

const SUBJECT_COLORS = [
  { bg: 'bg-blue-100', border: 'border-blue-300', text: 'text-blue-900', hover: 'hover:bg-blue-200' },
  { bg: 'bg-green-100', border: 'border-green-300', text: 'text-green-900', hover: 'hover:bg-green-200' },
  { bg: 'bg-purple-100', border: 'border-purple-300', text: 'text-purple-900', hover: 'hover:bg-purple-200' },
  { bg: 'bg-orange-100', border: 'border-orange-300', text: 'text-orange-900', hover: 'hover:bg-orange-200' },
  { bg: 'bg-pink-100', border: 'border-pink-300', text: 'text-pink-900', hover: 'hover:bg-pink-200' },
  { bg: 'bg-indigo-100', border: 'border-indigo-300', text: 'text-indigo-900', hover: 'hover:bg-indigo-200' },
  { bg: 'bg-teal-100', border: 'border-teal-300', text: 'text-teal-900', hover: 'hover:bg-teal-200' },
  { bg: 'bg-cyan-100', border: 'border-cyan-300', text: 'text-cyan-900', hover: 'hover:bg-cyan-200' },
]

export function ScheduleBuilder({
  classItem,
  groupItem,
  type,
  teachers,
  subjects,
  existingSchedules = []
}: ScheduleBuilderProps) {
  const targetItem = type === 'class' ? classItem : groupItem
  const targetId = targetItem?.id
  const targetName = type === 'class' ? classItem?.name : groupItem?.name
  const [schedules, setSchedules] = useState<ScheduleItem[]>([])
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>(DEFAULT_TIME_SLOTS)
  const [selectedCell, setSelectedCell] = useState<{ day: number; slot: string } | null>(null)
  const [draggedSubject, setDraggedSubject] = useState<Subject | null>(null)
  const [draggedSpecialItem, setDraggedSpecialItem] = useState<{type: 'BREAK' | 'LUNCH', title: string} | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [showTimeEditor, setShowTimeEditor] = useState(false)

  // Assign colors to subjects
  const subjectsWithColors = subjects.map((subject, index) => ({
    ...subject,
    colorScheme: SUBJECT_COLORS[index % SUBJECT_COLORS.length]
  }))

  useEffect(() => {
    if (existingSchedules.length > 0) {
      const mapped = existingSchedules.map((s, index) => ({
        id: s.id || `existing-${index}`,
        dayOfWeek: s.dayOfWeek,
        timeSlotId: timeSlots.find(t => t.startTime === s.startTime)?.id || '1',
        type: (s.type as ScheduleItemType) || 'LESSON',
        subjectId: s.subjectId,
        teacherId: s.teacherId,
        roomNumber: s.roomNumber,
        title: s.title,
        duration: s.duration
      }))
      setSchedules(mapped)
    }
  }, [existingSchedules, timeSlots])

  const getScheduleForCell = (day: number, slotId: string) => {
    return schedules.find(s => s.dayOfWeek === day && s.timeSlotId === slotId)
  }

  const addScheduleDialog = (day: number, slotId: string, itemType: ScheduleItemType = 'LESSON') => {
    const newSchedule: ScheduleItem = {
      id: `new-${Date.now()}`,
      dayOfWeek: day,
      timeSlotId: slotId,
      type: itemType,
      title: itemType === 'BREAK' ? 'Tanafus' : itemType === 'LUNCH' ? 'Tushlik' : undefined,
    }
    
    setSchedules(prev => [...prev, newSchedule])
    setHasChanges(true)
    setSelectedCell({ day, slot: slotId })
    const message = itemType === 'BREAK' ? '☕ Tanafus qo\'shildi' : 
                   itemType === 'LUNCH' ? '🍽️ Ovqatlanish qo\'shildi' : 
                   'Yangi dars qo\'shildi'
    toast.success(message)
  }

  const handleDrop = (day: number, slotId: string) => {
    const existing = getScheduleForCell(day, slotId)

    // Handle special items (Break/Lunch)
    if (draggedSpecialItem) {
      if (existing) {
        updateSchedule(existing.id, { 
          type: draggedSpecialItem.type, 
          title: draggedSpecialItem.title,
          subjectId: undefined,
          teacherId: undefined,
          roomNumber: undefined
        })
      } else {
        const newSchedule: ScheduleItem = {
          id: `new-${Date.now()}`,
          dayOfWeek: day,
          timeSlotId: slotId,
          type: draggedSpecialItem.type,
          title: draggedSpecialItem.title
        }
        setSchedules(prev => [...prev, newSchedule])
        setSelectedCell({ day, slot: slotId })
      }
      setHasChanges(true)
      const icon = draggedSpecialItem.type === 'BREAK' ? '☕' : '🍽️'
      toast.success(`${icon} ${draggedSpecialItem.title} qo'shildi!`)
      setDraggedSpecialItem(null)
      return
    }

    // Handle regular subjects
    if (!draggedSubject) return

    if (existing) {
      updateSchedule(existing.id, { 
        type: 'LESSON',
        subjectId: draggedSubject.id,
        title: undefined
      })
    } else {
      const newSchedule: ScheduleItem = {
        id: `new-${Date.now()}`,
        dayOfWeek: day,
        timeSlotId: slotId,
        type: 'LESSON',
        subjectId: draggedSubject.id
      }
      setSchedules(prev => [...prev, newSchedule])
      setSelectedCell({ day, slot: slotId })
    }
    
    setHasChanges(true)
    setDraggedSubject(null)
    toast.success(`${draggedSubject.name} qo'shildi!`)
  }

  const updateSchedule = (id: string, updates: Partial<ScheduleItem>) => {
    setSchedules(prev => prev.map(s => 
      s.id === id ? { ...s, ...updates } : s
    ))
    setHasChanges(true)
  }

  const removeSchedule = (id: string) => {
    setSchedules(prev => prev.filter(s => s.id !== id))
    setHasChanges(true)
    setSelectedCell(null)
    toast.success('Dars o\'chirildi')
  }

  const handleSave = async () => {
    if (!targetId) {
      toast.error(type === 'class' ? 'Sinf tanlanmagan' : 'Guruh tanlanmagan')
      return
    }

    // Only validate lessons, not breaks/lunch
    const incompleteLessons = schedules.filter(s => 
      s.type === 'LESSON' && (!s.subjectId || !s.teacherId)
    )
    if (incompleteLessons.length > 0) {
      toast.error(`${incompleteLessons.length} ta darsda fan yoki o'qituvchi tanlanmagan`, {
        description: 'Barcha darslarni to\'ldiring'
      })
      return
    }

    if (schedules.length === 0) {
      toast.error('Hech bo\'lmaganda bitta element qo\'shing')
      return
    }

    setIsSaving(true)
    try {
      const { saveSchedules } = await import('@/app/actions/schedule')
      const result = await saveSchedules(targetId, schedules as any, timeSlots, type)
      
      if (result.success) {
        setHasChanges(false)
        toast.success(result.message || 'Dars jadvali saqlandi! ✅', {
          description: `${schedules.length} ta dars muvaffaqiyatli saqlandi`
        })
      } else {
        toast.error(result.error || 'Xatolik yuz berdi')
      }
    } catch (error) {
      toast.error('Xatolik yuz berdi')
    } finally {
      setIsSaving(false)
    }
  }

  const addNewTimeSlot = () => {
    const newId = (timeSlots.length + 1).toString()
    const lastSlot = timeSlots[timeSlots.length - 1]
    const newSlot: TimeSlot = {
      id: newId,
      startTime: lastSlot ? lastSlot.endTime : '14:30',
      endTime: lastSlot ? addMinutes(lastSlot.endTime, 45) : '15:15',
      label: `${newId}-dars`
    }
    setTimeSlots(prev => [...prev, newSlot])
    setHasChanges(true)
    toast.success('Yangi dars vaqti qo\'shildi')
  }

  const removeTimeSlot = (id: string) => {
    if (timeSlots.length <= 1) {
      toast.error('Kamida 1 ta dars vaqti bo\'lishi kerak')
      return
    }
    setTimeSlots(prev => prev.filter(t => t.id !== id))
    setSchedules(prev => prev.filter(s => s.timeSlotId !== id))
    setHasChanges(true)
    toast.success('Dars vaqti o\'chirildi')
  }

  const addMinutes = (time: string, minutes: number) => {
    const [hours, mins] = time.split(':').map(Number)
    const date = new Date()
    date.setHours(hours, mins + minutes)
    return date.toTimeString().slice(0, 5)
  }

  const getSubject = (id?: string) => subjectsWithColors.find(s => s.id === id)
  const getTeacher = (id?: string) => teachers.find(t => t.id === id)
  const getTimeSlot = (id: string) => timeSlots.find(t => t.id === id)

  const selectedSchedule = selectedCell 
    ? getScheduleForCell(selectedCell.day, selectedCell.slot)
    : null

  const completedCount = schedules.filter(s => 
    s.type === 'LESSON' ? (s.subjectId && s.teacherId) : true
  ).length
  const incompleteCount = schedules.filter(s => 
    s.type === 'LESSON' && s.subjectId && !s.teacherId
  ).length
  const breakCount = schedules.filter(s => s.type === 'BREAK').length
  const lunchCount = schedules.filter(s => s.type === 'LUNCH').length
  const totalCells = timeSlots.length * DAYS.length
  const progressPercent = (completedCount / totalCells) * 100

  return (
    <>
      <div className="grid gap-4 lg:gap-6 xl:grid-cols-[1fr_400px]">
        {/* Main Schedule Grid */}
        <div className="space-y-4">
          {/* Action Bar */}
          <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-lg shadow-sm">
                    <Sparkles className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Drag & Drop Constructor</p>
                    <p className="text-xs text-muted-foreground">Fanlarni sudrab jadvalga qo'shing</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Button 
                    variant="outline"
                    size="sm"
                    onClick={() => setShowTimeEditor(true)}
                    className="flex-1 sm:flex-none"
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    Vaqtlar
                  </Button>
                  <Button 
                    onClick={handleSave}
                    disabled={!hasChanges || isSaving}
                    size="sm"
                    className="flex-1 sm:flex-none shadow-md"
                  >
                    <Save className="mr-2 h-4 w-4" />
                    {isSaving ? 'Saqlanmoqda...' : 'Saqlash'}
                  </Button>
                </div>
              </div>

              {hasChanges && (
                <div className="mt-3 p-2.5 bg-amber-100 border border-amber-300 rounded-lg flex items-center gap-2 text-xs text-amber-900">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  <span>O'zgarishlar saqlanmagan. Saqlashni unutmang!</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Schedule Table */}
          <Card className="border-2">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg lg:text-xl flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    {targetName}
                  </CardTitle>
                  <CardDescription className="text-xs mt-1">
                    {timeSlots.length} dars × {DAYS.length} kun = {totalCells} jami slot
                  </CardDescription>
                </div>
                <Badge variant="outline" className="text-sm px-3 py-1">
                  {completedCount}/{totalCells}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-2 lg:p-4">
              <div className="w-full overflow-x-auto rounded-lg border-2 shadow-sm">
                <table className="w-full border-collapse min-w-[900px] bg-white">
                  <thead>
                    <tr className="bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50">
                      <th className="p-2 lg:p-3 text-left font-semibold border-r w-28 lg:w-36 sticky left-0 bg-white z-20 shadow-sm">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-blue-600" />
                          <span className="text-xs lg:text-sm">Vaqt</span>
                        </div>
                      </th>
                      {DAYS.map(day => (
                        <th key={day.id} className="p-2 lg:p-3 text-center font-semibold border-r min-w-[140px]">
                          <div className="text-sm lg:text-base font-bold">{day.name}</div>
                          <div className="text-xs text-muted-foreground font-normal">{day.short}</div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {timeSlots.map((slot, slotIndex) => (
                      <tr key={slot.id} className={cn(
                        "border-t transition-colors",
                        slotIndex % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                      )}>
                        <td className="p-2 lg:p-3 border-r bg-gradient-to-r from-gray-50 to-gray-100 sticky left-0 z-10 shadow-sm">
                          <div className="text-xs lg:text-sm font-bold text-blue-900">{slot.label}</div>
                          <div className="text-[10px] lg:text-xs text-muted-foreground font-mono mt-0.5">
                            {slot.startTime}-{slot.endTime}
                          </div>
                        </td>
                        {DAYS.map(day => {
                          const schedule = getScheduleForCell(day.id, slot.id)
                          const subject = schedule ? getSubject(schedule.subjectId) : null
                          const teacher = schedule ? getTeacher(schedule.teacherId) : null
                          const isSelected = selectedCell?.day === day.id && selectedCell?.slot === slot.id
                          const isComplete = schedule && schedule.subjectId && schedule.teacherId

                          return (
                            <td
                              key={day.id}
                              className={cn(
                                "p-1 lg:p-1.5 border-r relative group transition-all",
                                isSelected && "ring-2 ring-blue-500 ring-inset bg-blue-50/50",
                                !schedule && "hover:bg-blue-50/40 cursor-pointer"
                              )}
                              onDragOver={(e) => {
                                e.preventDefault()
                                e.currentTarget.classList.add('bg-blue-200', 'ring-2', 'ring-blue-400')
                              }}
                              onDragLeave={(e) => {
                                e.currentTarget.classList.remove('bg-blue-200', 'ring-2', 'ring-blue-400')
                              }}
                              onDrop={(e) => {
                                e.currentTarget.classList.remove('bg-blue-200', 'ring-2', 'ring-blue-400')
                                handleDrop(day.id, slot.id)
                              }}
                              onClick={() => !schedule && addScheduleDialog(day.id, slot.id, 'LESSON')}
                            >
                              {schedule ? (
                                <div 
                                  className={cn(
                                    "p-2 rounded-md text-xs space-y-1 min-h-[65px] lg:min-h-[75px] relative cursor-pointer hover:shadow-lg transition-all",
                                    // Break styling
                                    schedule.type === 'BREAK' && "bg-gradient-to-br from-amber-100 to-amber-200 border-2 border-amber-400",
                                    // Lunch styling
                                    schedule.type === 'LUNCH' && "bg-gradient-to-br from-green-100 to-green-200 border-2 border-green-400",
                                    // Lesson styling
                                    schedule.type === 'LESSON' && subject ? `${subject.colorScheme.bg} border-2 ${subject.colorScheme.border}` : 
                                    schedule.type === 'LESSON' && "bg-gray-100 border-2 border-gray-300",
                                    !isComplete && schedule.type === 'LESSON' && "border-dashed border-amber-400 border-2"
                                  )}
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setSelectedCell({ day: day.id, slot: slot.id })
                                  }}
                                >
                                  {/* Complete indicator only for lessons */}
                                  {isComplete && schedule.type === 'LESSON' && (
                                    <div className="absolute -top-1 -right-1">
                                      <div className="bg-green-500 rounded-full p-0.5">
                                        <CheckCircle2 className="h-3 w-3 text-white" />
                                      </div>
                                    </div>
                                  )}

                                  {/* Break display */}
                                  {schedule.type === 'BREAK' && (
                                    <div className="flex flex-col items-center justify-center h-full text-center">
                                      <Coffee className="h-6 w-6 lg:h-7 lg:w-7 text-amber-700 mb-1" />
                                      <div className="font-bold text-sm text-amber-900">{schedule.title || 'Tanafus'}</div>
                                      <div className="text-[10px] text-amber-700">Dam olish</div>
                                    </div>
                                  )}

                                  {/* Lunch display */}
                                  {schedule.type === 'LUNCH' && (
                                    <div className="flex flex-col items-center justify-center h-full text-center">
                                      <Utensils className="h-6 w-6 lg:h-7 lg:w-7 text-green-700 mb-1" />
                                      <div className="font-bold text-sm text-green-900">{schedule.title || 'Tushlik'}</div>
                                      <div className="text-[10px] text-green-700">Ovqatlanish</div>
                                    </div>
                                  )}

                                  {/* Lesson display */}
                                  {schedule.type === 'LESSON' && (
                                    <>
                                      <div className={cn(
                                        "font-bold text-[11px] lg:text-xs line-clamp-2 leading-tight",
                                        subject?.colorScheme.text
                                      )}>
                                        {subject?.name || '⚠️ Fan tanlanmagan'}
                                      </div>
                                      
                                      {teacher ? (
                                        <div className="text-[10px] lg:text-xs text-muted-foreground line-clamp-1 flex items-center gap-1">
                                          <Users className="h-2.5 w-2.5 lg:h-3 lg:w-3" />
                                          {teacher.user.fullName.split(' ').slice(0, 2).join(' ')}
                                        </div>
                                      ) : (
                                        <div className="text-[10px] lg:text-xs text-amber-700 font-medium">
                                          ⚠️ O'qituvchi yo'q
                                        </div>
                                      )}
                                      
                                      {schedule.roomNumber && (
                                        <div className="text-[10px] lg:text-xs text-muted-foreground font-medium">
                                          🏢 {schedule.roomNumber}
                                        </div>
                                      )}
                                    </>
                                  )}
                                </div>
                              ) : (
                                <div className="h-[65px] lg:h-[75px] flex items-center justify-center rounded-md border-2 border-dashed border-gray-300 hover:border-blue-400 hover:bg-blue-50/70 transition-all">
                                  <div className="text-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Plus className="h-5 w-5 lg:h-6 lg:w-6 text-blue-500 mx-auto mb-0.5" />
                                    <span className="text-[10px] text-blue-600 font-medium">Qo'shish</span>
                                  </div>
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
            </CardContent>
          </Card>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-4 lg:sticky lg:top-6 lg:h-fit">
          {/* Special Items Panel (Break & Lunch) */}
          <Card className="border-2 border-amber-300 shadow-md">
            <CardHeader className="bg-gradient-to-br from-amber-50 to-orange-100 pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base lg:text-lg flex items-center gap-2">
                  <Clock className="h-5 w-5 text-amber-600" />
                  Tanaffus & Ovqatlanish
                </CardTitle>
                <Badge className="bg-amber-600">2</Badge>
              </div>
              <CardDescription className="text-xs">
                Tanaffus yoki ovqatlanish vaqtini qo'shing
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-2">
                {/* Break Card */}
                <div
                  draggable
                  onDragStart={() => {
                    setDraggedSpecialItem({ type: 'BREAK', title: 'Tanafus' })
                    toast.info('☕ Tanafus tanlandi', { duration: 1500 })
                  }}
                  onDragEnd={() => setDraggedSpecialItem(null)}
                  className={cn(
                    "p-3 rounded-lg border-2 cursor-grab active:cursor-grabbing transition-all hover:shadow-lg hover:scale-[1.02]",
                    "bg-amber-100 border-amber-300 hover:bg-amber-200",
                    draggedSpecialItem?.type === 'BREAK' && "opacity-50 scale-95 ring-2 ring-amber-400"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-200 rounded-lg">
                      <Coffee className="h-5 w-5 text-amber-700" />
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-sm text-amber-900">☕ Tanafus</div>
                      <div className="text-xs text-amber-700">Dam olish vaqti</div>
                    </div>
                  </div>
                </div>

                {/* Lunch Card */}
                <div
                  draggable
                  onDragStart={() => {
                    setDraggedSpecialItem({ type: 'LUNCH', title: 'Tushlik' })
                    toast.info('🍽️ Ovqatlanish tanlandi', { duration: 1500 })
                  }}
                  onDragEnd={() => setDraggedSpecialItem(null)}
                  className={cn(
                    "p-3 rounded-lg border-2 cursor-grab active:cursor-grabbing transition-all hover:shadow-lg hover:scale-[1.02]",
                    "bg-green-100 border-green-300 hover:bg-green-200",
                    draggedSpecialItem?.type === 'LUNCH' && "opacity-50 scale-95 ring-2 ring-green-400"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-200 rounded-lg">
                      <Utensils className="h-5 w-5 text-green-700" />
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-sm text-green-900">🍽️ Tushlik</div>
                      <div className="text-xs text-green-700">Ovqatlanish vaqti</div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Subjects Panel */}
          <Card className="border-2 border-blue-300 shadow-md">
            <CardHeader className="bg-gradient-to-br from-blue-50 to-blue-100 pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base lg:text-lg flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-blue-600" />
                  Fanlar
                </CardTitle>
                <Badge className="bg-blue-600">{subjectsWithColors.length}</Badge>
              </div>
              <CardDescription className="text-xs">
                Fanni sudrab jadvalga qo'ying
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                {subjectsWithColors.length > 0 ? (
                  subjectsWithColors.map(subject => (
                    <div
                      key={subject.id}
                      draggable
                      onDragStart={() => {
                        setDraggedSubject(subject)
                        toast.info(`${subject.name} tanlandida`, { duration: 1500 })
                      }}
                      onDragEnd={() => setDraggedSubject(null)}
                      className={cn(
                        "p-3 rounded-lg border-2 cursor-grab active:cursor-grabbing transition-all hover:shadow-lg hover:scale-[1.02]",
                        draggedSubject?.id === subject.id && "opacity-50 scale-95 ring-2 ring-blue-400",
                        `${subject.colorScheme.bg} ${subject.colorScheme.border} ${subject.colorScheme.hover}`
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className={cn("font-bold text-sm mb-1", subject.colorScheme.text)}>
                            {subject.name}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            📝 {subject.code}
                          </div>
                        </div>
                        <div className={cn("w-2 h-2 rounded-full shrink-0 mt-1", subject.colorScheme.bg, "ring-2", subject.colorScheme.border)} />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-30" />
                    <p className="text-sm font-semibold text-muted-foreground mb-1">
                      Fanlar yo'q
                    </p>
                    <p className="text-xs text-muted-foreground px-4">
                      Dars jadval yaratish uchun avval fanlar qo'shing
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Selected Cell Editor */}
          {selectedSchedule && (
            <Card className="border-2 border-green-400 shadow-lg animate-in slide-in-from-right">
              <CardHeader className="bg-gradient-to-br from-green-50 to-emerald-100 pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Edit className="h-4 w-4" />
                    Tahrirlash
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedCell(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <CardDescription className="text-xs font-medium">
                  {DAYS.find(d => d.id === selectedCell?.day)?.name} • {getTimeSlot(selectedCell?.slot || '')?.label}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                {/* Type Badge */}
                <div className="flex items-center gap-2 pb-2 border-b">
                  {selectedSchedule.type === 'BREAK' && (
                    <Badge className="bg-amber-500 text-white flex items-center gap-1">
                      <Coffee className="h-3 w-3" />
                      Tanafus
                    </Badge>
                  )}
                  {selectedSchedule.type === 'LUNCH' && (
                    <Badge className="bg-green-500 text-white flex items-center gap-1">
                      <Utensils className="h-3 w-3" />
                      Ovqatlanish
                    </Badge>
                  )}
                  {selectedSchedule.type === 'LESSON' && (
                    <Badge className="bg-blue-500 text-white flex items-center gap-1">
                      <BookOpen className="h-3 w-3" />
                      Dars
                    </Badge>
                  )}
                </div>

                {/* Break/Lunch specific fields */}
                {(selectedSchedule.type === 'BREAK' || selectedSchedule.type === 'LUNCH') && (
                  <>
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold">Nomi</Label>
                      <Input
                        type="text"
                        placeholder={selectedSchedule.type === 'BREAK' ? 'Tanafus' : 'Tushlik'}
                        value={selectedSchedule.title || ''}
                        onChange={(e) => updateSchedule(selectedSchedule.id, { title: e.target.value })}
                      />
                    </div>

                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                        <div className="text-xs text-blue-900">
                          <p className="font-medium mb-1">
                            {selectedSchedule.type === 'BREAK' ? '☕ Tanafus' : '🍽️ Ovqatlanish'} vaqti
                          </p>
                          <p className="text-blue-700">
                            {selectedSchedule.type === 'BREAK' 
                              ? 'O\'quvchilar dam olishi uchun vaqt' 
                              : 'Ovqatlanish uchun ajratilgan vaqt'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* Lesson specific fields */}
                {selectedSchedule.type === 'LESSON' && (
                  <>
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold">Fan *</Label>
                      <Select
                        value={selectedSchedule.subjectId || ''}
                        onValueChange={(value) => {
                          updateSchedule(selectedSchedule.id, { subjectId: value })
                          toast.success('Fan o\'zgartirildi')
                        }}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Fan tanlang..." />
                        </SelectTrigger>
                        <SelectContent>
                          {subjectsWithColors.map(subject => (
                            <SelectItem key={subject.id} value={subject.id}>
                              <div className="flex items-center gap-2">
                                <div className={cn("w-3 h-3 rounded-full", subject.colorScheme.bg, "border", subject.colorScheme.border)} />
                                <span className="font-medium">{subject.name}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-semibold">O'qituvchi *</Label>
                      <Select
                        value={selectedSchedule.teacherId || ''}
                        onValueChange={(value) => {
                          updateSchedule(selectedSchedule.id, { teacherId: value })
                          toast.success('O\'qituvchi o\'zgartirildi')
                        }}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="O'qituvchi tanlang..." />
                        </SelectTrigger>
                        <SelectContent>
                          {teachers.map(teacher => (
                            <SelectItem key={teacher.id} value={teacher.id}>
                              <div>
                                <div className="font-semibold text-sm">{teacher.user.fullName}</div>
                                <div className="text-xs text-muted-foreground">{teacher.specialization}</div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-semibold">Xona raqami</Label>
                      <Input
                        type="text"
                        placeholder="101, A-12, Lab-1..."
                        value={selectedSchedule.roomNumber || ''}
                        onChange={(e) => updateSchedule(selectedSchedule.id, { roomNumber: e.target.value })}
                      />
                    </div>
                  </>
                )}

                <div className="border-t my-4" />

                <Button
                  variant="destructive"
                  size="sm"
                  className="w-full"
                  onClick={() => removeSchedule(selectedSchedule.id)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Darsni o'chirish
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Statistics */}
          <Card className="border-2 border-purple-300 shadow-md">
            <CardHeader className="bg-gradient-to-br from-purple-50 to-pink-100 pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-purple-600" />
                Statistika
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-4">
              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 bg-blue-50 rounded-lg text-center">
                  <div className="text-2xl font-bold text-blue-600">{schedules.length}</div>
                  <div className="text-xs text-muted-foreground">Jami</div>
                </div>
                <div className="p-3 bg-green-50 rounded-lg text-center">
                  <div className="text-2xl font-bold text-green-600">{completedCount}</div>
                  <div className="text-xs text-muted-foreground">To'liq</div>
                </div>
                <div className="p-3 bg-amber-50 rounded-lg text-center">
                  <div className="text-2xl font-bold text-amber-600">{incompleteCount}</div>
                  <div className="text-xs text-muted-foreground">Tugallanmagan</div>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg text-center">
                  <div className="text-2xl font-bold text-gray-600">{totalCells - schedules.length}</div>
                  <div className="text-xs text-muted-foreground">Bo'sh</div>
                </div>
              </div>

              {/* Special items count */}
              {(breakCount > 0 || lunchCount > 0) && (
                <div className="grid grid-cols-2 gap-2 pt-2 border-t">
                  <div className="p-2.5 bg-amber-50 rounded-lg text-center border border-amber-200">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Coffee className="h-3.5 w-3.5 text-amber-600" />
                      <div className="text-lg font-bold text-amber-600">{breakCount}</div>
                    </div>
                    <div className="text-xs text-amber-700">Tanafus</div>
                  </div>
                  <div className="p-2.5 bg-green-50 rounded-lg text-center border border-green-200">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Utensils className="h-3.5 w-3.5 text-green-600" />
                      <div className="text-lg font-bold text-green-600">{lunchCount}</div>
                    </div>
                    <div className="text-xs text-green-700">Tushlik</div>
                  </div>
                </div>
              )}

              <div className="border-t my-3" />

              <div>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="font-medium">To'ldirilganlik</span>
                  <span className="font-bold text-lg">{progressPercent.toFixed(0)}%</span>
                </div>
                <Progress value={progressPercent} className="h-3" />
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  {completedCount} / {totalCells} dars tayyor
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Time Slot Editor Dialog */}
      <Dialog open={showTimeEditor} onOpenChange={setShowTimeEditor}>
        <DialogContent className="max-w-3xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Clock className="h-5 w-5 text-blue-600" />
              Dars Vaqtlarini Sozlash
            </DialogTitle>
            <DialogDescription>
              Har bir dars uchun boshlanish va tugash vaqtini belgilang
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[500px] overflow-y-auto pr-2">
            <div className="space-y-3">
              {timeSlots.map((slot, index) => (
                <div key={slot.id} className="flex items-center gap-3 p-4 border-2 rounded-lg hover:border-blue-400 hover:bg-blue-50/50 transition-all">
                  <div className="font-bold text-base w-20 shrink-0 text-blue-900">{slot.label}</div>
                  <div className="flex items-center gap-2 flex-1">
                    <div className="flex-1">
                      <Label className="text-xs text-muted-foreground mb-1 block">Boshlash</Label>
                      <Input
                        type="time"
                        value={slot.startTime}
                        onChange={(e) => {
                          const newSlots = [...timeSlots]
                          newSlots[index].startTime = e.target.value
                          setTimeSlots(newSlots)
                          setHasChanges(true)
                        }}
                      />
                    </div>
                    <span className="text-muted-foreground text-lg mt-5">→</span>
                    <div className="flex-1">
                      <Label className="text-xs text-muted-foreground mb-1 block">Tugash</Label>
                      <Input
                        type="time"
                        value={slot.endTime}
                        onChange={(e) => {
                          const newSlots = [...timeSlots]
                          newSlots[index].endTime = e.target.value
                          setTimeSlots(newSlots)
                          setHasChanges(true)
                        }}
                      />
                    </div>
                  </div>
                  {timeSlots.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeTimeSlot(slot.id)}
                      className="shrink-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                      title="O'chirish"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-2 pt-4 border-t">
            <Button
              variant="outline"
              onClick={addNewTimeSlot}
              className="flex-1 sm:flex-none"
            >
              <Plus className="mr-2 h-4 w-4" />
              Yangi dars qo'shish
            </Button>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowTimeEditor(false)}
                className="flex-1 sm:flex-none"
              >
                Bekor qilish
              </Button>
              <Button 
                onClick={() => {
                  setShowTimeEditor(false)
                  toast.success('Vaqtlar saqlandi!')
                }}
                className="flex-1 sm:flex-none"
              >
                <Save className="mr-2 h-4 w-4" />
                Saqlash
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
