'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { createBulkGrades } from '@/app/actions/grade'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

interface Student {
  id: string
  studentCode: string
  user: {
    fullName: string
    email: string | null
  } | null
}

interface ClassSubject {
  id: string
  classId: string
  subjectId: string
  class: {
    name: string
  }
  subject: {
    name: string
  }
}

export function GradeEntryForm({ 
  classSubject, 
  students 
}: { 
  classSubject: ClassSubject
  students: Student[]
}) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [gradeType, setGradeType] = useState<string>('HOMEWORK')
  const [maxScore, setMaxScore] = useState<string>('100')
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0])
  const [notes, setNotes] = useState<string>('')
  const [scores, setScores] = useState<Record<string, string>>({})

  const handleScoreChange = (studentId: string, value: string) => {
    setScores(prev => ({ ...prev, [studentId]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate that at least one score is entered
    const enteredScores = Object.entries(scores).filter(([_, score]) => score !== '' && score !== undefined)
    
    if (enteredScores.length === 0) {
      toast.error('Kamida bitta o\'quvchiga baho kiriting')
      return
    }

    // Validate scores
    const maxScoreNum = parseInt(maxScore)
    for (const [_, scoreStr] of enteredScores) {
      const score = parseFloat(scoreStr)
      if (isNaN(score) || score < 0 || score > maxScoreNum) {
        toast.error(`Ball 0 va ${maxScoreNum} orasida bo'lishi kerak`)
        return
      }
    }

    setIsLoading(true)

    try {
      const result = await createBulkGrades({
        classId: classSubject.classId,
        subjectId: classSubject.subjectId,
        gradeType: gradeType as any,
        maxScore: maxScoreNum,
        date,
        notes,
        grades: enteredScores.map(([studentId, scoreStr]) => ({
          studentId,
          score: parseFloat(scoreStr),
        })),
      })

      if (result.success) {
        toast.success(`${result.count} ta baho kiritildi`)
        setScores({})
        setNotes('')
        router.refresh()
      } else {
        toast.error(result.error || 'Xatolik yuz berdi')
      }
    } catch (error) {
      toast.error('Xatolik yuz berdi')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Grade Settings */}
      <div className="grid gap-4 md:grid-cols-4">
        <div>
          <Label htmlFor="gradeType">Baho turi *</Label>
          <Select value={gradeType} onValueChange={setGradeType} required>
            <SelectTrigger id="gradeType">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="HOMEWORK">Uy vazifa</SelectItem>
              <SelectItem value="QUIZ">Nazorat ishi</SelectItem>
              <SelectItem value="EXAM">Imtihon</SelectItem>
              <SelectItem value="PROJECT">Loyiha</SelectItem>
              <SelectItem value="MIDTERM">Yarim yillik</SelectItem>
              <SelectItem value="FINAL">Yillik</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="maxScore">Maksimal ball *</Label>
          <Input
            id="maxScore"
            type="number"
            min="1"
            max="1000"
            value={maxScore}
            onChange={(e) => setMaxScore(e.target.value)}
            required
          />
        </div>

        <div>
          <Label htmlFor="date">Sana *</Label>
          <Input
            id="date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </div>

        <div className="flex items-end">
          <Button 
            type="button" 
            variant="outline" 
            className="w-full"
            onClick={() => {
              const quickScore = prompt(`Barcha o'quvchilarga bir xil ball kiriting (0-${maxScore}):`)
              if (quickScore) {
                const score = parseFloat(quickScore)
                if (!isNaN(score) && score >= 0 && score <= parseInt(maxScore)) {
                  const newScores: Record<string, string> = {}
                  students.forEach(student => {
                    newScores[student.id] = quickScore
                  })
                  setScores(newScores)
                  toast.success('Barcha o\'quvchilarga ball kiritildi')
                }
              }
            }}
          >
            Bir xil ball
          </Button>
        </div>
      </div>

      <div>
        <Label htmlFor="notes">Izoh (ixtiyoriy)</Label>
        <Textarea
          id="notes"
          placeholder="Baho haqida qo'shimcha ma'lumot..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
        />
      </div>

      {/* Students List */}
      <div className="rounded-md border">
        <div className="max-h-[500px] overflow-y-auto">
          <table className="w-full">
            <thead className="sticky top-0 border-b bg-muted/50">
              <tr>
                <th className="p-4 text-left text-sm font-medium w-16">#</th>
                <th className="p-4 text-left text-sm font-medium">O'quvchi</th>
                <th className="p-4 text-left text-sm font-medium">Kodi</th>
                <th className="p-4 text-left text-sm font-medium w-32">Ball (0-{maxScore})</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {students.map((student, index) => (
                <tr key={student.id} className="hover:bg-muted/50">
                  <td className="p-4 text-sm text-muted-foreground">{index + 1}</td>
                  <td className="p-4">
                    <div>
                      <div className="font-medium">{student.user?.fullName || 'N/A'}</div>
                      <div className="text-sm text-muted-foreground">{student.user?.email}</div>
                    </div>
                  </td>
                  <td className="p-4">
                    <code className="text-sm">{student.studentCode}</code>
                  </td>
                  <td className="p-4">
                    <Input
                      type="number"
                      min="0"
                      max={maxScore}
                      step="0.5"
                      placeholder="Ball"
                      value={scores[student.id] || ''}
                      onChange={(e) => handleScoreChange(student.id, e.target.value)}
                      className="w-full"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Submit */}
      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setScores({})
            setNotes('')
          }}
        >
          Tozalash
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saqlanmoqda...
            </>
          ) : (
            'Baholarni saqlash'
          )}
        </Button>
      </div>
    </form>
  )
}

