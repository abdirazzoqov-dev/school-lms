'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/use-toast'
import { Loader2, Save, Award } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface Grade {
  id: string
  score: any
  maxScore: any
  percentage: any
  notes: string | null
  student: {
    studentCode: string
    user: {
      fullName: string
    } | null
  }
  subject: {
    name: string
  }
}

interface EditGradeFormProps {
  grade: Grade
}

export function EditGradeForm({ grade }: EditGradeFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  
  const [score, setScore] = useState(Number(grade.score))
  const [maxScore, setMaxScore] = useState(Number(grade.maxScore))
  const [notes, setNotes] = useState(grade.notes || '')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const percentage = maxScore > 0 ? (score / maxScore) * 100 : 0

  const getGradeLevel = () => {
    if (percentage >= 90) return { label: '5 (A\'lo)', color: 'bg-green-500' }
    if (percentage >= 70) return { label: '4 (Yaxshi)', color: 'bg-blue-500' }
    if (percentage >= 60) return { label: '3 (Qoniqarli)', color: 'bg-orange-500' }
    return { label: '2 (Qoniqarsiz)', color: 'bg-red-500' }
  }

  const gradeLevel = getGradeLevel()

  const handleSubmit = async () => {
    if (score < 0 || score > maxScore) {
      toast({
        variant: 'destructive',
        title: 'Xato!',
        description: `Ball 0 dan ${maxScore} gacha bo'lishi kerak`,
      })
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch(`/api/grades/${grade.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          score,
          maxScore,
          percentage,
          notes: notes || null,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Xatolik yuz berdi')
      }

      toast({
        title: 'Muvaffaqiyatli!',
        description: 'Baho yangilandi',
      })

      router.push(`/admin/grades/${grade.id}`)
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

  return (
    <div className="space-y-6">
      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>Ma'lumotlar</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">O'quvchi</p>
              <p className="font-semibold">{grade.student.user?.fullName}</p>
              <p className="text-xs text-muted-foreground">{grade.student.studentCode}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Fan</p>
              <p className="font-semibold">{grade.subject.name}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Form */}
      <Card>
        <CardHeader>
          <CardTitle>Bahoni Tahrirlash</CardTitle>
          <CardDescription>
            Ball va izohni o'zgartiring
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Score Input */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label>Olingan Ball *</Label>
              <Input
                type="number"
                min="0"
                max={maxScore}
                value={score}
                onChange={(e) => setScore(parseFloat(e.target.value) || 0)}
                className="text-center text-2xl font-bold"
              />
            </div>

            <div className="space-y-2">
              <Label>Maksimal Ball *</Label>
              <Input
                type="number"
                min="1"
                max="1000"
                value={maxScore}
                onChange={(e) => setMaxScore(parseInt(e.target.value) || 100)}
                className="text-center text-2xl font-bold"
              />
            </div>

            <div className="space-y-2">
              <Label>Foiz</Label>
              <div className="h-[60px] flex items-center justify-center border rounded-lg bg-muted">
                <p className={`text-3xl font-bold ${
                  percentage >= 90 ? 'text-green-600' :
                  percentage >= 70 ? 'text-blue-600' :
                  percentage >= 60 ? 'text-orange-600' :
                  'text-red-600'
                }`}>
                  {percentage.toFixed(1)}%
                </p>
              </div>
            </div>
          </div>

          {/* Grade Preview */}
          <div className="p-6 bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-lg">
            <div className="text-center space-y-3">
              <Award className="h-12 w-12 text-yellow-500 mx-auto" />
              <div>
                <p className="text-sm text-muted-foreground mb-2">Baho:</p>
                <Badge className={`text-xl px-6 py-2 ${gradeLevel.color}`}>
                  {gradeLevel.label}
                </Badge>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>Izoh (ixtiyoriy)</Label>
            <Textarea
              placeholder="Qo'shimcha ma'lumot..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
            />
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
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
          disabled={isSubmitting}
          className="gap-2 bg-yellow-500 hover:bg-yellow-600"
        >
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
          <Save className="h-4 w-4" />
          Saqlash
        </Button>
      </div>
    </div>
  )
}

