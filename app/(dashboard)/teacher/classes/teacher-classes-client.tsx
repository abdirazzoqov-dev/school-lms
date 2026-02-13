'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Users, BookOpen, Clock, GraduationCap, ArrowRight, UserCheck, Calendar } from 'lucide-react'
import Link from 'next/link'

type ClassData = {
  classId: string
  className: string
  studentCount: number
  schedules: Array<{
    id: string
    subjectId: string
    subjectName: string
    dayOfWeek: number
    startTime: string
    endTime: string
    roomNumber: string | null
  }>
}

type Props = {
  classes: ClassData[]
}

export function TeacherClassesClient({ classes }: Props) {
  const [selectedClass, setSelectedClass] = useState<ClassData | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const gradients = [
    'from-blue-500 to-indigo-600',
    'from-purple-500 to-pink-600',
    'from-green-500 to-emerald-600',
    'from-orange-500 to-red-600',
    'from-cyan-500 to-blue-600',
    'from-violet-500 to-purple-600',
  ]

  const totalStudents = classes.reduce((acc, c) => acc + c.studentCount, 0)
  const totalLessons = classes.reduce((acc, c) => acc + c.schedules.length, 0)
  
  // Get unique subjects
  const uniqueSubjects = new Set(classes.flatMap(c => c.schedules.map(s => s.subjectName)))
  const subjectCount = uniqueSubjects.size

  // Days of week mapping
  const daysOfWeek = ['Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh', 'Ya']

  // Get unique subjects for a class
  const getClassSubjects = (classItem: ClassData) => {
    const subjectsMap = new Map<string, string>()
    classItem.schedules.forEach(schedule => {
      subjectsMap.set(schedule.subjectId, schedule.subjectName)
    })
    return Array.from(subjectsMap.entries()).map(([id, name]) => ({ id, name }))
  }

  const handleClassClick = (classItem: ClassData) => {
    setSelectedClass(classItem)
    setIsDialogOpen(true)
  }

  const handleSubjectSelect = (subjectId: string) => {
    if (selectedClass) {
      // Redirect to class page with subject filter
      window.location.href = `/teacher/classes/${selectedClass.classId}?subjectId=${subjectId}`
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Mening Sinflarim
        </h1>
        <p className="text-lg text-muted-foreground">
          Dars jadvalidagi sinflar - Constructor orqali yaratilgan
        </p>
      </div>

      {/* Summary Stats */}
      {classes.length > 0 && (
        <div className="grid gap-6 md:grid-cols-4">
          <Card className="border-none shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-blue-500 text-white shadow-lg">
                  <GraduationCap className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-3xl font-bold text-blue-600">{classes.length}</div>
                  <p className="text-sm text-muted-foreground font-medium">Sinflar</p>
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
                  <div className="text-3xl font-bold text-green-600">{totalStudents}</div>
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
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {classes.map((classItem, index) => (
          <Card 
            key={classItem.classId}
            className="group relative overflow-hidden border-none shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
          >
            {/* Gradient Header */}
            <div className={`h-32 bg-gradient-to-br ${gradients[index % gradients.length]} p-6 relative`}>
              <div className="absolute inset-0 bg-black/10" />
              <div className="relative z-10 flex flex-col h-full">
                <Badge className="self-start bg-white/20 backdrop-blur-sm text-white border-white/30 hover:bg-white/30">
                  {classItem.schedules.length} ta dars
                </Badge>
                <div className="mt-auto">
                  <h3 className="text-3xl font-bold text-white">{classItem.className}</h3>
                </div>
              </div>
              {/* Decorative circles */}
              <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-white/10 rounded-full" />
              <div className="absolute -right-4 -top-4 w-20 h-20 bg-white/10 rounded-full" />
            </div>

            <CardContent className="p-6 space-y-4">
              {/* Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/20">
                    <Users className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-lg font-bold">{classItem.studentCount}</div>
                    <p className="text-xs text-muted-foreground">O'quvchi</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-950/20">
                    <Calendar className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <div className="text-lg font-bold">{classItem.schedules.length}</div>
                    <p className="text-xs text-muted-foreground">Dars/hafta</p>
                  </div>
                </div>
              </div>

              {/* Schedule Preview */}
              {classItem.schedules.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">Dars jadvali:</p>
                  <div className="space-y-1.5 max-h-32 overflow-y-auto custom-scrollbar">
                    {classItem.schedules.slice(0, 4).map((schedule) => (
                      <div
                        key={schedule.id}
                        className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-gray-900/50 text-xs"
                      >
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
                    {classItem.schedules.length > 4 && (
                      <p className="text-xs text-center text-muted-foreground pt-1">
                        +{classItem.schedules.length - 4} ta dars
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Action Button */}
              <Button 
                onClick={() => handleClassClick(classItem)}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg group-hover:shadow-xl transition-all"
                size="lg"
              >
                Darsga kirish
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {classes.length === 0 && (
        <Card className="border-dashed border-2">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="p-4 rounded-full bg-blue-50 dark:bg-blue-950/20 mb-4">
              <BookOpen className="h-12 w-12 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">
              Sizga hozircha dars jadvali yaratilmagan
            </h3>
            <p className="text-muted-foreground text-center max-w-md">
              Administrator dars jadvalini constructor orqali yaratgandan keyin, sinflar shu yerda ko'rinadi
            </p>
          </CardContent>
        </Card>
      )}

      {/* Subject Selection Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">
              Fanni tanlang
            </DialogTitle>
            <DialogDescription>
              {selectedClass?.className} sinfida qaysi fan bo'yicha dars o'tmoqchisiz?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            {selectedClass && getClassSubjects(selectedClass).map((subject) => (
              <Button
                key={subject.id}
                onClick={() => handleSubjectSelect(subject.id)}
                className="w-full justify-start h-auto py-4 px-6 text-left bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 hover:from-blue-100 hover:to-indigo-100 dark:hover:from-blue-900/30 dark:hover:to-indigo-900/30 text-gray-900 dark:text-gray-100 border border-blue-200 dark:border-blue-800"
                variant="outline"
              >
                <div className="flex items-center gap-4 w-full">
                  <div className="p-3 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                    <BookOpen className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-lg">{subject.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedClass.schedules.filter(s => s.subjectId === subject.id).length} ta dars/hafta
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

