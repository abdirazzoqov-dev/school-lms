'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Users, BookOpen, Clock, GraduationCap, ArrowRight, UserCheck, Calendar } from 'lucide-react'

type ScheduleItem = {
  id: string
  subjectId: string
  subjectName: string
  dayOfWeek: number
  startTime: string
  endTime: string
  roomNumber: string | null
}

type ClassData = {
  id: string
  name: string
  studentCount: number
  type: 'CLASS'
  schedules: ScheduleItem[]
}

type GroupData = {
  id: string
  name: string
  studentCount: number
  type: 'GROUP'
  schedules: ScheduleItem[]
}

type Props = {
  classes: ClassData[]
  groups: GroupData[]
}

export function TeacherClassesClient({ classes, groups }: Props) {
  const [selectedItem, setSelectedItem] = useState<ClassData | GroupData | null>(null)
  const [isSubjectDialogOpen, setIsSubjectDialogOpen] = useState(false)
  const [selectedSubject, setSelectedSubject] = useState<{ id: string; name: string } | null>(null)
  const [isTimeSlotDialogOpen, setIsTimeSlotDialogOpen] = useState(false)

  const classGradients = [
    'from-blue-500 to-indigo-600',
    'from-purple-500 to-pink-600',
    'from-green-500 to-emerald-600',
    'from-orange-500 to-red-600',
    'from-cyan-500 to-blue-600',
    'from-violet-500 to-purple-600',
  ]

  const groupGradients = [
    'from-fuchsia-500 to-purple-700',
    'from-rose-500 to-pink-700',
    'from-amber-500 to-orange-600',
    'from-teal-500 to-cyan-700',
    'from-lime-500 to-green-700',
    'from-sky-500 to-blue-700',
  ]

  const totalClassStudents = classes.reduce((acc, c) => acc + c.studentCount, 0)
  const totalGroupStudents = groups.reduce((acc, g) => acc + g.studentCount, 0)
  const totalLessons = [...classes, ...groups].reduce((acc, item) => acc + item.schedules.length, 0)
  const uniqueSubjects = new Set([...classes, ...groups].flatMap(item => item.schedules.map(s => s.subjectName)))
  const subjectCount = uniqueSubjects.size

  const daysOfWeek = ['Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh', 'Ya']

  const getSubjects = (item: ClassData | GroupData) => {
    const subjectsMap = new Map<string, string>()
    item.schedules.forEach(schedule => {
      subjectsMap.set(schedule.subjectId, schedule.subjectName)
    })
    return Array.from(subjectsMap.entries()).map(([id, name]) => ({ id, name }))
  }

  const handleItemClick = (item: ClassData | GroupData) => {
    setSelectedItem(item)
    setIsSubjectDialogOpen(true)
  }

  const handleSubjectSelect = (subjectId: string, subjectName: string) => {
    setSelectedSubject({ id: subjectId, name: subjectName })
    setIsSubjectDialogOpen(false)
    setIsTimeSlotDialogOpen(true)
  }

  const handleTimeSlotSelect = (startTime: string, endTime: string) => {
    if (selectedItem && selectedSubject) {
      if (selectedItem.type === 'CLASS') {
        window.location.href = `/teacher/classes/${selectedItem.id}?subjectId=${selectedSubject.id}&startTime=${startTime}&endTime=${endTime}`
      } else {
        window.location.href = `/teacher/groups/${selectedItem.id}?subjectId=${selectedSubject.id}&startTime=${startTime}&endTime=${endTime}`
      }
    }
  }

  const getTimeSlots = () => {
    if (!selectedItem || !selectedSubject) return []

    type TimeSlot = { startTime: string; endTime: string; dayOfWeek: number; roomNumber: string | null }

    return selectedItem.schedules
      .filter(s => s.subjectId === selectedSubject.id)
      .map(s => ({ startTime: s.startTime, endTime: s.endTime, dayOfWeek: s.dayOfWeek, roomNumber: s.roomNumber }))
      .reduce((acc, slot) => {
        const timeKey = `${slot.startTime}-${slot.endTime}`
        if (!acc.find(s => `${s.startTime}-${s.endTime}` === timeKey)) acc.push(slot)
        return acc
      }, [] as TimeSlot[])
      .sort((a, b) => a.startTime.localeCompare(b.startTime))
  }

  const renderCard = (item: ClassData | GroupData, index: number) => {
    const isGroup = item.type === 'GROUP'
    const gradient = isGroup ? groupGradients[index % groupGradients.length] : classGradients[index % classGradients.length]

    return (
      <Card
        key={item.id}
        className="group relative overflow-hidden border-none shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
      >
        {/* Gradient Header */}
        <div className={`h-32 bg-gradient-to-br ${gradient} p-6 relative`}>
          <div className="absolute inset-0 bg-black/10" />
          <div className="relative z-10 flex flex-col h-full">
            <div className="flex items-center gap-2">
              <Badge className="self-start bg-white/20 backdrop-blur-sm text-white border-white/30 hover:bg-white/30">
                {item.schedules.length} ta dars
              </Badge>
              {isGroup && (
                <Badge className="bg-white/30 backdrop-blur-sm text-white border-white/40 text-xs">
                  Guruh
                </Badge>
              )}
            </div>
            <div className="mt-auto">
              <h3 className="text-3xl font-bold text-white">{item.name}</h3>
            </div>
          </div>
          <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-white/10 rounded-full" />
          <div className="absolute -right-4 -top-4 w-20 h-20 bg-white/10 rounded-full" />
        </div>

        <CardContent className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/20">
                <Users className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <div className="text-lg font-bold">{item.studentCount}</div>
                <p className="text-xs text-muted-foreground">O'quvchi</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-950/20">
                <Calendar className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <div className="text-lg font-bold">{item.schedules.length}</div>
                <p className="text-xs text-muted-foreground">Dars/hafta</p>
              </div>
            </div>
          </div>

          {item.schedules.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Dars jadvali:</p>
              <div className="space-y-1.5 max-h-32 overflow-y-auto custom-scrollbar">
                {item.schedules.slice(0, 4).map((schedule) => (
                  <div key={schedule.id} className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-gray-900/50 text-xs">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <Badge variant="outline" className="shrink-0 text-[10px] px-1.5 py-0">
                        {daysOfWeek[schedule.dayOfWeek - 1]}
                      </Badge>
                      <span className="font-medium truncate">{schedule.subjectName}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground shrink-0 ml-2">
                      <Clock className="h-3 w-3" />
                      <span className="text-[10px]">{schedule.startTime}</span>
                    </div>
                  </div>
                ))}
                {item.schedules.length > 4 && (
                  <p className="text-xs text-center text-muted-foreground pt-1">
                    +{item.schedules.length - 4} ta dars
                  </p>
                )}
              </div>
            </div>
          )}

          <Button
            onClick={() => handleItemClick(item)}
            className={`w-full text-white shadow-lg group-hover:shadow-xl transition-all ${
              isGroup
                ? 'bg-gradient-to-r from-fuchsia-600 to-purple-700 hover:from-fuchsia-700 hover:to-purple-800'
                : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700'
            }`}
            size="lg"
          >
            Darsga kirish
            <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Button>
        </CardContent>
      </Card>
    )
  }

  const hasAnyData = classes.length > 0 || groups.length > 0

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Mening Sinflarim
        </h1>
        <p className="text-lg text-muted-foreground">
          Dars jadvalidagi sinflar va guruhlar
        </p>
      </div>

      {/* Summary Stats */}
      {hasAnyData && (
        <div className="grid gap-6 md:grid-cols-4">
          <Card className="border-none shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-blue-500 text-white shadow-lg">
                  <GraduationCap className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-3xl font-bold text-blue-600">{classes.length + groups.length}</div>
                  <p className="text-sm text-muted-foreground font-medium">Sinf/Guruhlar</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-green-500 text-white shadow-lg">
                  <UserCheck className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-3xl font-bold text-green-600">{totalClassStudents + totalGroupStudents}</div>
                  <p className="text-sm text-muted-foreground font-medium">Jami o'quvchilar</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-purple-500 text-white shadow-lg">
                  <Calendar className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-3xl font-bold text-purple-600">{totalLessons}</div>
                  <p className="text-sm text-muted-foreground font-medium">Darslar/hafta</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-orange-500 text-white shadow-lg">
                  <BookOpen className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-3xl font-bold text-orange-600">{subjectCount}</div>
                  <p className="text-sm text-muted-foreground font-medium">Fanlar</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Classes Grid */}
      {classes.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
            <GraduationCap className="h-6 w-6 text-blue-600" />
            Sinflar
            <Badge variant="secondary" className="ml-1">{classes.length}</Badge>
          </h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {classes.map((classItem, index) => renderCard(classItem, index))}
          </div>
        </div>
      )}

      {/* Groups Grid */}
      {groups.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
            <Users className="h-6 w-6 text-purple-600" />
            Guruhlar
            <Badge variant="secondary" className="ml-1 bg-purple-100 text-purple-700">{groups.length}</Badge>
          </h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {groups.map((groupItem, index) => renderCard(groupItem, index))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!hasAnyData && (
        <Card className="border-dashed border-2">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="p-4 rounded-full bg-blue-50 dark:bg-blue-950/20 mb-4">
              <BookOpen className="h-12 w-12 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">
              Sizga hozircha dars jadvali yaratilmagan
            </h3>
            <p className="text-muted-foreground text-center max-w-md">
              Administrator dars jadvalini constructor orqali yaratgandan keyin, sinflar va guruhlar shu yerda ko'rinadi
            </p>
          </CardContent>
        </Card>
      )}

      {/* Subject Selection Dialog */}
      <Dialog open={isSubjectDialogOpen} onOpenChange={setIsSubjectDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Fanni tanlang</DialogTitle>
            <DialogDescription>
              {selectedItem?.name} {selectedItem?.type === 'GROUP' ? 'guruhida' : 'sinfida'} qaysi fan bo'yicha dars o'tmoqchisiz?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            {selectedItem && getSubjects(selectedItem).map((subject) => (
              <Button
                key={subject.id}
                onClick={() => handleSubjectSelect(subject.id, subject.name)}
                className="w-full justify-start h-auto py-4 px-6 text-left bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 hover:from-blue-100 hover:to-indigo-100 text-gray-900 dark:text-gray-100 border border-blue-200 dark:border-blue-800"
                variant="outline"
              >
                <div className="flex items-center gap-4 w-full">
                  <div className="p-3 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                    <BookOpen className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-lg">{subject.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedItem.schedules.filter(s => s.subjectId === subject.id).length} ta dars/hafta
                    </p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground" />
                </div>
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Time Slot Selection Dialog */}
      <Dialog open={isTimeSlotDialogOpen} onOpenChange={setIsTimeSlotDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Dars vaqtini tanlang</DialogTitle>
            <DialogDescription>
              {selectedSubject?.name} fani uchun qaysi darsga kirmoqchisiz?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            {getTimeSlots().map((slot, index) => (
              <Button
                key={`${slot.startTime}-${slot.endTime}`}
                onClick={() => handleTimeSlotSelect(slot.startTime, slot.endTime)}
                className="w-full justify-start h-auto py-4 px-6 text-left bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 hover:from-green-100 hover:to-emerald-100 text-gray-900 dark:text-gray-100 border border-green-200 dark:border-green-800"
                variant="outline"
              >
                <div className="flex items-center gap-4 w-full">
                  <div className="p-3 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 text-white">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-lg">{index + 1}-dars</p>
                    <p className="text-sm text-muted-foreground">
                      {slot.startTime} - {slot.endTime}
                      {slot.roomNumber && ` • Xona: ${slot.roomNumber}`}
                    </p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground" />
                </div>
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
