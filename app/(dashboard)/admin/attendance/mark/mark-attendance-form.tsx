'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/components/ui/use-toast'
import { Loader2, Save, UserCheck, UserX, Clock, FileText, Users } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface Student {
  id: string
  studentCode: string
  user: {
    fullName: string
  } | null
}

interface Class {
  id: string
  name: string
  students: Student[]
  _count: {
    students: number
  }
}

interface Subject {
  id: string
  name: string
  code: string
}

interface Teacher {
  id: string
  user: {
    fullName: string
  } | null
}

interface MarkAttendanceFormProps {
  classes: Class[]
  subjects: Subject[]
  teachers: Teacher[]
}

export function MarkAttendanceForm({ classes, subjects, teachers }: MarkAttendanceFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  
  const [selectedClassId, setSelectedClassId] = useState('')
  const [selectedSubjectId, setSelectedSubjectId] = useState('')
  const [selectedTeacherId, setSelectedTeacherId] = useState('')
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [attendanceRecords, setAttendanceRecords] = useState<Record<string, {
    status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED'
    notes: string
  }>>({})

  const selectedClass = classes.find(c => c.id === selectedClassId)

  const handleStatusChange = (studentId: string, status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED') => {
    setAttendanceRecords(prev => ({
      ...prev,
      [studentId]: {
        status,
        notes: prev[studentId]?.notes || '',
      },
    }))
  }

  const handleNotesChange = (studentId: string, notes: string) => {
    setAttendanceRecords(prev => ({
      ...prev,
      [studentId]: {
        status: prev[studentId]?.status || 'PRESENT',
        notes,
      },
    }))
  }

  const handleSubmit = async () => {
    if (!selectedClassId || !selectedSubjectId || !selectedTeacherId) {
      toast({
        variant: 'destructive',
        title: 'Xato!',
        description: 'Iltimos, barcha maydonlarni to\'ldiring',
      })
      return
    }

    if (!selectedClass || selectedClass.students.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Xato!',
        description: 'Tanlangan sinfda o\'quvchilar yo\'q',
      })
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/attendance/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          classId: selectedClassId,
          subjectId: selectedSubjectId,
          teacherId: selectedTeacherId,
          date: selectedDate,
          records: selectedClass.students.map(student => ({
            studentId: student.id,
            status: attendanceRecords[student.id]?.status || 'PRESENT',
            notes: attendanceRecords[student.id]?.notes || null,
          })),
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Xatolik yuz berdi')
      }

      toast({
        title: 'Muvaffaqiyatli!',
        description: 'Davomat belgilandi',
      })

      router.push('/admin/attendance')
      router.refresh()
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Xato!',
        description: error.message,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const setAllStatus = (status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED') => {
    if (!selectedClass) return
    
    const newRecords: typeof attendanceRecords = {}
    selectedClass.students.forEach(student => {
      newRecords[student.id] = {
        status,
        notes: attendanceRecords[student.id]?.notes || '',
      }
    })
    setAttendanceRecords(newRecords)
  }

  return (
    <div className="space-y-6">
      {/* Selection Form */}
      <Card>
        <CardHeader>
          <CardTitle>1. Dars Ma'lumotlari</CardTitle>
          <CardDescription>
            Sinf, fan va o'qituvchini tanlang
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Sana *</Label>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Sinf *</Label>
              <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                <SelectTrigger>
                  <SelectValue placeholder="Sinfni tanlang" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.name} ({cls._count.students} o'quvchi)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Fan *</Label>
              <Select value={selectedSubjectId} onValueChange={setSelectedSubjectId}>
                <SelectTrigger>
                  <SelectValue placeholder="Fanni tanlang" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((subject) => (
                    <SelectItem key={subject.id} value={subject.id}>
                      {subject.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>O'qituvchi *</Label>
              <Select value={selectedTeacherId} onValueChange={setSelectedTeacherId}>
                <SelectTrigger>
                  <SelectValue placeholder="O'qituvchini tanlang" />
                </SelectTrigger>
                <SelectContent>
                  {teachers.map((teacher) => (
                    <SelectItem key={teacher.id} value={teacher.id}>
                      {teacher.user?.fullName || 'N/A'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Students Attendance */}
      {selectedClass && selectedClass.students.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  2. O'quvchilar Davomati ({selectedClass.students.length})
                </CardTitle>
                <CardDescription>
                  Har bir o'quvchi uchun davomatni belgilang
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setAllStatus('PRESENT')}
                  className="gap-1"
                >
                  <UserCheck className="h-4 w-4" />
                  Barchasi Kelgan
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setAllStatus('ABSENT')}
                  className="gap-1"
                >
                  <UserX className="h-4 w-4" />
                  Barchasi Kelmagan
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {selectedClass.students.map((student, index) => (
                <div
                  key={student.id}
                  className="flex items-center gap-4 p-4 border rounded-lg hover:shadow-md transition-all"
                >
                  <div className="flex-shrink-0 w-12">
                    <p className="text-sm font-medium text-muted-foreground">
                      #{index + 1}
                    </p>
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">
                      {student.user?.fullName || 'N/A'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {student.studentCode}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant={attendanceRecords[student.id]?.status === 'PRESENT' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleStatusChange(student.id, 'PRESENT')}
                      className={attendanceRecords[student.id]?.status === 'PRESENT' ? 'bg-green-500 hover:bg-green-600' : ''}
                    >
                      <UserCheck className="h-4 w-4 mr-1" />
                      Kelgan
                    </Button>
                    
                    <Button
                      type="button"
                      variant={attendanceRecords[student.id]?.status === 'ABSENT' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleStatusChange(student.id, 'ABSENT')}
                      className={attendanceRecords[student.id]?.status === 'ABSENT' ? 'bg-red-500 hover:bg-red-600' : ''}
                    >
                      <UserX className="h-4 w-4 mr-1" />
                      Kelmagan
                    </Button>

                    <Button
                      type="button"
                      variant={attendanceRecords[student.id]?.status === 'LATE' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleStatusChange(student.id, 'LATE')}
                      className={attendanceRecords[student.id]?.status === 'LATE' ? 'bg-orange-500 hover:bg-orange-600' : ''}
                    >
                      <Clock className="h-4 w-4 mr-1" />
                      Kech
                    </Button>

                    <Button
                      type="button"
                      variant={attendanceRecords[student.id]?.status === 'EXCUSED' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleStatusChange(student.id, 'EXCUSED')}
                      className={attendanceRecords[student.id]?.status === 'EXCUSED' ? 'bg-blue-500 hover:bg-blue-600' : ''}
                    >
                      <FileText className="h-4 w-4 mr-1" />
                      Sababli
                    </Button>
                  </div>

                  {attendanceRecords[student.id] && (
                    <div className="w-64">
                      <Input
                        placeholder="Izoh (ixtiyoriy)"
                        value={attendanceRecords[student.id]?.notes || ''}
                        onChange={(e) => handleNotesChange(student.id, e.target.value)}
                        className="text-sm"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Submit */}
      {selectedClass && selectedClass.students.length > 0 && (
        <div className="flex items-center justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isSubmitting}
          >
            Bekor qilish
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !selectedClassId || !selectedSubjectId || !selectedTeacherId}
            className="gap-2"
          >
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            <Save className="h-4 w-4" />
            Davomatni Saqlash
          </Button>
        </div>
      )}
    </div>
  )
}

