'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
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
import { useToast } from '@/components/ui/use-toast'
import { Loader2, Save, Award, Users } from 'lucide-react'
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

interface MarkGradesFormProps {
  classes: Class[]
  subjects: Subject[]
  teachers: Teacher[]
}

export function MarkGradesForm({ classes, subjects, teachers }: MarkGradesFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  
  const [selectedClassId, setSelectedClassId] = useState('')
  const [selectedSubjectId, setSelectedSubjectId] = useState('')
  const [selectedTeacherId, setSelectedTeacherId] = useState('')
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [gradeType, setGradeType] = useState<'ORAL' | 'WRITTEN' | 'TEST' | 'EXAM' | 'QUARTER' | 'FINAL'>('ORAL')
  const [quarter, setQuarter] = useState('1')
  const [maxScore, setMaxScore] = useState(100)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [gradeRecords, setGradeRecords] = useState<Record<string, {
    score: number
    notes: string
  }>>({})

  const selectedClass = classes.find(c => c.id === selectedClassId)

  const handleScoreChange = (studentId: string, score: number) => {
    setGradeRecords(prev => ({
      ...prev,
      [studentId]: {
        score: Math.min(score, maxScore),
        notes: prev[studentId]?.notes || '',
      },
    }))
  }

  const handleNotesChange = (studentId: string, notes: string) => {
    setGradeRecords(prev => ({
      ...prev,
      [studentId]: {
        score: prev[studentId]?.score || 0,
        notes,
      },
    }))
  }

  const calculatePercentage = (score: number) => {
    return maxScore > 0 ? (score / maxScore) * 100 : 0
  }

  const getGradeLevel = (percentage: number): string => {
    if (percentage >= 90) return '5 (A\'lo)'
    if (percentage >= 70) return '4 (Yaxshi)'
    if (percentage >= 60) return '3 (Qoniqarli)'
    return '2 (Qoniqarsiz)'
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

    // Filter only students with scores
    const recordsToSubmit = selectedClass.students
      .filter(student => gradeRecords[student.id] && gradeRecords[student.id].score > 0)
      .map(student => ({
        studentId: student.id,
        score: gradeRecords[student.id].score,
        percentage: calculatePercentage(gradeRecords[student.id].score),
        notes: gradeRecords[student.id].notes || null,
      }))

    if (recordsToSubmit.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Xato!',
        description: 'Kamida bitta o\'quvchiga baho qo\'ying',
      })
      return
    }

    setIsSubmitting(true)

    try {
      const currentYear = new Date().getFullYear()
      const currentMonth = new Date().getMonth()
      const academicYear = `${currentMonth >= 8 ? currentYear : currentYear - 1}-${currentMonth >= 8 ? currentYear + 1 : currentYear}`

      const response = await fetch('/api/grades/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          classId: selectedClassId,
          subjectId: selectedSubjectId,
          teacherId: selectedTeacherId,
          date: selectedDate,
          gradeType,
          maxScore,
          quarter: ['QUARTER', 'FINAL'].includes(gradeType) ? parseInt(quarter) : null,
          academicYear,
          records: recordsToSubmit,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Xatolik yuz berdi')
      }

      toast({
        title: 'Muvaffaqiyatli!',
        description: `${recordsToSubmit.length} ta o'quvchiga baho qo'yildi`,
      })

      router.push('/admin/grades')
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

  const currentYear = new Date().getFullYear()
  const currentMonth = new Date().getMonth()
  const academicYear = `${currentMonth >= 8 ? currentYear : currentYear - 1}-${currentMonth >= 8 ? currentYear + 1 : currentYear}`

  return (
    <div className="space-y-6">
      {/* Settings Form */}
      <Card>
        <CardHeader>
          <CardTitle>1. Baholash Ma'lumotlari</CardTitle>
          <CardDescription>
            Sinf, fan va baholash turini tanlang
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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

            <div className="space-y-2">
              <Label>Baho turi *</Label>
              <Select value={gradeType} onValueChange={(v: any) => setGradeType(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ORAL">Og'zaki</SelectItem>
                  <SelectItem value="WRITTEN">Yozma</SelectItem>
                  <SelectItem value="TEST">Test</SelectItem>
                  <SelectItem value="EXAM">Imtihon</SelectItem>
                  <SelectItem value="QUARTER">Chorak bahosi</SelectItem>
                  <SelectItem value="FINAL">Yillik baho</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Maksimal ball *</Label>
              <Input
                type="number"
                min="1"
                max="1000"
                value={maxScore}
                onChange={(e) => setMaxScore(parseInt(e.target.value) || 100)}
              />
            </div>

            {(gradeType === 'QUARTER' || gradeType === 'FINAL') && (
              <div className="space-y-2">
                <Label>Chorak *</Label>
                <Select value={quarter} onValueChange={setQuarter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1-chorak</SelectItem>
                    <SelectItem value="2">2-chorak</SelectItem>
                    <SelectItem value="3">3-chorak</SelectItem>
                    <SelectItem value="4">4-chorak</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label>O'quv yili</Label>
              <Input
                type="text"
                value={academicYear}
                disabled
                className="bg-muted"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Students Grading */}
      {selectedClass && selectedClass.students.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  2. O'quvchilarga Baho Qo'ying ({selectedClass.students.length})
                </CardTitle>
                <CardDescription>
                  Ball kiriting (0 dan {maxScore} gacha)
                </CardDescription>
              </div>
              <div className="text-sm space-y-1 text-right">
                <p className="text-muted-foreground">Baholash tizimi:</p>
                <div className="space-y-1">
                  <p className="text-xs"><span className="font-semibold text-green-600">5 (A'lo)</span> - 90-100%</p>
                  <p className="text-xs"><span className="font-semibold text-blue-600">4 (Yaxshi)</span> - 70-89%</p>
                  <p className="text-xs"><span className="font-semibold text-orange-600">3 (Qoniqarli)</span> - 60-69%</p>
                  <p className="text-xs"><span className="font-semibold text-red-600">2 (Qoniqarsiz)</span> - 0-59%</p>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {selectedClass.students.map((student, index) => {
                const score = gradeRecords[student.id]?.score || 0
                const percentage = calculatePercentage(score)
                const gradeLevel = getGradeLevel(percentage)

                return (
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

                    <div className="flex items-center gap-3">
                      <div className="w-32">
                        <Label className="text-xs mb-1">Ball</Label>
                        <Input
                          type="number"
                          min="0"
                          max={maxScore}
                          placeholder="0"
                          value={gradeRecords[student.id]?.score || ''}
                          onChange={(e) => handleScoreChange(student.id, parseFloat(e.target.value) || 0)}
                          className="text-center font-bold text-lg"
                        />
                      </div>

                      <div className="text-center w-24">
                        <Label className="text-xs mb-1">Foiz</Label>
                        <div className={`font-bold text-lg ${
                          percentage >= 90 ? 'text-green-600' :
                          percentage >= 70 ? 'text-blue-600' :
                          percentage >= 60 ? 'text-orange-600' :
                          'text-red-600'
                        }`}>
                          {percentage.toFixed(0)}%
                        </div>
                      </div>

                      <div className="w-32">
                        <Label className="text-xs mb-1">Baho</Label>
                        <Badge className={`w-full justify-center ${
                          percentage >= 90 ? 'bg-green-500' :
                          percentage >= 70 ? 'bg-blue-500' :
                          percentage >= 60 ? 'bg-orange-500' :
                          'bg-red-500'
                        }`}>
                          {gradeLevel}
                        </Badge>
                      </div>

                      <div className="w-64">
                        <Label className="text-xs mb-1">Izoh</Label>
                        <Input
                          placeholder="Izoh (ixtiyoriy)"
                          value={gradeRecords[student.id]?.notes || ''}
                          onChange={(e) => handleNotesChange(student.id, e.target.value)}
                          className="text-sm"
                        />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary */}
      {selectedClass && Object.keys(gradeRecords).length > 0 && (
        <Card className="border-blue-200 bg-blue-50/50">
          <CardHeader>
            <CardTitle className="text-blue-900">Xulosa</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-blue-800">
            <p>
              • Baholar soni: <strong>{Object.values(gradeRecords).filter(r => r.score > 0).length}</strong>
            </p>
            <p>
              • O'rtacha ball: <strong>
                {Object.values(gradeRecords).length > 0
                  ? (Object.values(gradeRecords).reduce((sum, r) => sum + r.score, 0) / Object.values(gradeRecords).filter(r => r.score > 0).length).toFixed(1)
                  : 0
                }
              </strong>
            </p>
            <p>
              • O'rtacha foiz: <strong>
                {Object.values(gradeRecords).length > 0
                  ? (Object.values(gradeRecords).reduce((sum, r) => sum + calculatePercentage(r.score), 0) / Object.values(gradeRecords).filter(r => r.score > 0).length).toFixed(1)
                : 0}%
              </strong>
            </p>
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
            className="gap-2 bg-yellow-500 hover:bg-yellow-600"
          >
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            <Save className="h-4 w-4" />
            Baholarni Saqlash
          </Button>
        </div>
      )}
    </div>
  )
}

