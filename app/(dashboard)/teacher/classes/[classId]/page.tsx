'use client'

import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ArrowLeft, Save, Check, X, Loader2, BookOpen, Clock } from 'lucide-react'
import Link from 'next/link'
import { useToast } from '@/components/ui/use-toast'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'

interface Student {
  id: string
  studentCode: string
  user: {
    fullName: string
  }
}

interface ClassData {
  id: string
  name: string
  students: Student[]
}

interface SubjectData {
  id: string
  name: string
}

export default function TeacherClassDetailPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const classId = params.classId as string
  const subjectId = searchParams.get('subjectId')
  const startTime = searchParams.get('startTime')
  const endTime = searchParams.get('endTime')

  const [classData, setClassData] = useState<ClassData | null>(null)
  const [subjectData, setSubjectData] = useState<SubjectData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isLessonActive, setIsLessonActive] = useState(true) // Check if lesson time is active

  // Attendance state
  const [attendance, setAttendance] = useState<Record<string, 'PRESENT' | 'ABSENT' | 'LATE'>>({})
  
  // Grades state
  const [grades, setGrades] = useState<Record<string, string>>({})

  // Check if current time is within lesson time
  useEffect(() => {
    if (!startTime || !endTime) {
      setIsLessonActive(true) // If no time specified, allow access
      return
    }

    const checkLessonTime = () => {
      const now = new Date()
      const currentMinutes = now.getHours() * 60 + now.getMinutes()
      
      const [startHour, startMin] = startTime.split(':').map(Number)
      const [endHour, endMin] = endTime.split(':').map(Number)
      
      const lessonStart = startHour * 60 + startMin
      const lessonEnd = endHour * 60 + endMin
      
      // Lesson is active if current time is within lesson time
      const active = currentMinutes >= lessonStart && currentMinutes <= lessonEnd
      setIsLessonActive(active)
    }

    // Check immediately
    checkLessonTime()

    // Check every minute
    const interval = setInterval(checkLessonTime, 60000)

    return () => clearInterval(interval)
  }, [startTime, endTime])

  useEffect(() => {
    loadClassData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classId, subjectId, startTime, endTime])

  const loadClassData = async () => {
    try {
      setLoading(true)
      const url = subjectId 
        ? `/api/teacher/classes/${classId}?subjectId=${subjectId}`
        : `/api/teacher/classes/${classId}`
      
      const res = await fetch(url, {
        cache: 'no-store',
        credentials: 'include',
      })

      if (!res.ok) {
        throw new Error('Failed to load class data')
      }

      const data = await res.json()
      setClassData(data.class)
      setSubjectData(data.subject || null)

      // Initialize attendance - check today's attendance first
      const initialAttendance: Record<string, 'PRESENT' | 'ABSENT' | 'LATE'> = {}
      if (data.todayAttendance && data.todayAttendance.length > 0) {
        // Pre-fill with today's attendance
        data.todayAttendance.forEach((att: any) => {
          initialAttendance[att.studentId] = att.status
        })
        // Set remaining students as PRESENT
        data.class.students.forEach((student: Student) => {
          if (!initialAttendance[student.id]) {
            initialAttendance[student.id] = 'PRESENT'
          }
        })
      } else {
        // All present by default
        data.class.students.forEach((student: Student) => {
          initialAttendance[student.id] = 'PRESENT'
        })
      }
      setAttendance(initialAttendance)

      // Initialize grades - pre-fill with today's grades
      const initialGrades: Record<string, string> = {}
      if (data.todayGrades && data.todayGrades.length > 0) {
        data.todayGrades.forEach((grade: any) => {
          initialGrades[grade.studentId] = grade.score.toString()
        })
      }
      // Set remaining students to empty
      data.class.students.forEach((student: Student) => {
        if (!initialGrades[student.id]) {
          initialGrades[student.id] = ''
        }
      })
      setGrades(initialGrades)
    } catch (error) {
      console.error('Error loading class data:', error)
      toast({
        variant: 'destructive',
        title: 'Xato!',
        description: 'Sinf ma\'lumotlarini yuklashda xatolik',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSaveAttendance = async () => {
    if (!isLessonActive) {
      toast({
        variant: 'destructive',
        title: 'Dars tugadi!',
        description: 'Dars vaqti tugagandan keyin davomat qilish mumkin emas.',
      })
      return
    }

    try {
      setSaving(true)

      const attendanceData = Object.entries(attendance).map(([studentId, status]) => ({
        studentId,
        status,
        date: new Date().toISOString(),
        classId,
        subjectId: subjectId || undefined,
        startTime: startTime || undefined,
        endTime: endTime || undefined,
      }))

      const res = await fetch('/api/teacher/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attendanceRecords: attendanceData }),
        credentials: 'include',
      })

      if (!res.ok) {
        throw new Error('Failed to save attendance')
      }

      toast({
        title: 'Muvaffaqiyatli!',
        description: 'Davomat saqlandi',
      })
    } catch (error) {
      console.error('Error saving attendance:', error)
      toast({
        variant: 'destructive',
        title: 'Xato!',
        description: 'Davomatni saqlashda xatolik',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleSaveGrades = async () => {
    if (!isLessonActive) {
      toast({
        variant: 'destructive',
        title: 'Dars tugadi!',
        description: 'Dars vaqti tugagandan keyin baholash mumkin emas.',
      })
      return
    }

    try {
      setSaving(true)

      // Filter out absent students and empty grades
      const gradesData = Object.entries(grades)
        .filter(([studentId, grade]) => {
          return grade !== '' && attendance[studentId] !== 'ABSENT'
        })
        .map(([studentId, grade]) => ({
          studentId,
          grade: parseInt(grade),
          classId,
          subjectId: subjectId || undefined,
          startTime: startTime || undefined,
          endTime: endTime || undefined,
        }))

      const res = await fetch('/api/teacher/grades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ grades: gradesData }),
        credentials: 'include',
      })

      if (!res.ok) {
        throw new Error('Failed to save grades')
      }

      toast({
        title: 'Muvaffaqiyatli!',
        description: 'Baholar saqlandi',
      })

      // Don't clear grades - keep them visible after saving
    } catch (error) {
      console.error('Error saving grades:', error)
      toast({
        variant: 'destructive',
        title: 'Xato!',
        description: 'Baholarni saqlashda xatolik',
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!classData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Sinf topilmadi</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/teacher/classes">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl md:text-3xl font-bold">{classData.name}</h1>
            {subjectData && (
              <Badge variant="secondary" className="text-base px-3 py-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                <BookOpen className="h-4 w-4 mr-1.5" />
                {subjectData.name}
              </Badge>
            )}
            {startTime && endTime && (
              <Badge variant="secondary" className="text-base px-3 py-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white">
                <Clock className="h-4 w-4 mr-1.5" />
                {startTime} - {endTime}
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground mt-1">
            {classData.students.length} ta o'quvchi
          </p>
        </div>
      </div>

      {/* Lesson Expired Alert */}
      {!isLessonActive && startTime && endTime && (
        <Card className="border-2 border-red-500 bg-red-50 dark:bg-red-950/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-red-500 text-white">
                <Clock className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-bold text-red-900 dark:text-red-100">Dars vaqti tugadi</h3>
                <p className="text-sm text-red-700 dark:text-red-300">
                  Bu dars {startTime} - {endTime} vaqtida bo'lgan. Dars tugagandan keyin davomat va baholash imkoniyati yo'q.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs defaultValue="attendance" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="attendance">Davomat</TabsTrigger>
          <TabsTrigger value="grades">Baholash</TabsTrigger>
        </TabsList>

        {/* Attendance Tab */}
        <TabsContent value="attendance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Bugungi Davomat</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {classData.students.map((student, index) => (
                  <div
                    key={student.id}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground w-8">
                        {index + 1}
                      </span>
                      <div>
                        <p className="font-medium">{student.user.fullName}</p>
                        <p className="text-sm text-muted-foreground">
                          {student.studentCode}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant={attendance[student.id] === 'PRESENT' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() =>
                          setAttendance((prev) => ({
                            ...prev,
                            [student.id]: 'PRESENT',
                          }))
                        }
                        disabled={!isLessonActive}
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Bor
                      </Button>
                      <Button
                        variant={attendance[student.id] === 'ABSENT' ? 'destructive' : 'outline'}
                        size="sm"
                        onClick={() =>
                          setAttendance((prev) => ({
                            ...prev,
                            [student.id]: 'ABSENT',
                          }))
                        }
                        disabled={!isLessonActive}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Yo'q
                      </Button>
                      <Button
                        variant={attendance[student.id] === 'LATE' ? 'secondary' : 'outline'}
                        size="sm"
                        onClick={() =>
                          setAttendance((prev) => ({
                            ...prev,
                            [student.id]: 'LATE',
                          }))
                        }
                        disabled={!isLessonActive}
                      >
                        Kech
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6">
                <Button 
                  onClick={handleSaveAttendance} 
                  disabled={saving || !isLessonActive} 
                  className="w-full"
                >
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saqlanmoqda...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Davomatni Saqlash
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Grades Tab */}
        <TabsContent value="grades" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Baholash</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Yo'q bo'lgan o'quvchilarga baho qo'yib bo'lmaydi
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {classData.students.map((student, index) => {
                  const isAbsent = attendance[student.id] === 'ABSENT'
                  
                  return (
                    <div
                      key={student.id}
                      className={`flex items-center justify-between p-3 rounded-lg border ${
                        isAbsent ? 'bg-red-50 opacity-60' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <span className="text-sm text-muted-foreground w-8">
                          {index + 1}
                        </span>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{student.user.fullName}</p>
                            {isAbsent && (
                              <Badge variant="destructive" className="text-xs">
                                Yo'q
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {student.studentCode}
                          </p>
                        </div>
                      </div>
                      <div className="w-24">
                        {isAbsent ? (
                          <Input
                            type="text"
                            value="-"
                            disabled
                            className="text-center bg-gray-100"
                          />
                        ) : (
                          <Input
                            type="number"
                            min="2"
                            max="5"
                            placeholder="Baho"
                            value={grades[student.id]}
                            onChange={(e) =>
                              setGrades((prev) => ({
                                ...prev,
                                [student.id]: e.target.value,
                              }))
                            }
                            className="text-center"
                            disabled={!isLessonActive}
                          />
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="mt-6">
                <Button 
                  onClick={handleSaveGrades} 
                  disabled={saving || !isLessonActive} 
                  className="w-full"
                >
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saqlanmoqda...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Baholarni Saqlash
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

