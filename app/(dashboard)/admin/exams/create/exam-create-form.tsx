'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select'
import {
  ClipboardCheck, ArrowLeft, Plus, Trash2, Save,
  BookOpen, FlaskConical, Loader2, ChevronDown, ChevronUp, Info,
  Database, CheckCircle2, Link2
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { createExam } from '@/app/actions/exam'

const ANSWER_OPTIONS = ['A', 'B', 'C', 'D', 'E']

interface QuestionBankOption {
  id: string
  subjectName: string
  totalCount: number
  questions: { order: number; correctAnswer: string | null }[]
}

interface SubjectConfig {
  id: string
  subjectName: string
  questionCount: number
  pointsPerQ: number
  correctAnswers: Record<string, string>
  expanded: boolean
  linkedBankId?: string // linked question bank
}

function generateId() {
  return Math.random().toString(36).slice(2)
}

function createSubject(order: number): SubjectConfig {
  return {
    id: generateId(),
    subjectName: '',
    questionCount: 30,
    pointsPerQ: 1,
    correctAnswers: {},
    expanded: true,
  }
}

export function ExamCreateForm({ questionBanks = [] }: { questionBanks?: QuestionBankOption[] }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  // Exam info
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState('')
  const [duration, setDuration] = useState('120')

  // Subjects
  const [subjects, setSubjects] = useState<SubjectConfig[]>([createSubject(0)])

  const addSubject = () => {
    setSubjects(prev => [...prev, createSubject(prev.length)])
  }

  const removeSubject = (id: string) => {
    setSubjects(prev => prev.filter(s => s.id !== id))
  }

  const updateSubject = (id: string, field: keyof SubjectConfig, value: any) => {
    setSubjects(prev => prev.map(s => {
      if (s.id !== id) return s
      if (field === 'questionCount') {
        // Rebuild correctAnswers to match new question count
        const count = parseInt(value) || 0
        const newAnswers: Record<string, string> = {}
        for (let i = 1; i <= count; i++) {
          newAnswers[String(i)] = s.correctAnswers[String(i)] || ''
        }
        return { ...s, questionCount: count, correctAnswers: newAnswers }
      }
      return { ...s, [field]: value }
    }))
  }

  const setCorrectAnswer = (subjectId: string, qNum: number, answer: string) => {
    setSubjects(prev => prev.map(s => {
      if (s.id !== subjectId) return s
      const newAnswers = { ...s.correctAnswers, [String(qNum)]: answer }
      return { ...s, correctAnswers: newAnswers }
    }))
  }

  const loadFromBank = (subjectId: string, bankId: string) => {
    const bank = questionBanks.find(b => b.id === bankId)
    if (!bank) return

    // Build answer map from bank's correct answers
    const newAnswers: Record<string, string> = {}
    bank.questions.forEach((q, idx) => {
      const qNum = (q.order + 1).toString()
      if (q.correctAnswer) newAnswers[qNum] = q.correctAnswer
    })

    setSubjects(prev => prev.map(s => {
      if (s.id !== subjectId) return s
      return {
        ...s,
        subjectName: bank.subjectName,
        questionCount: bank.totalCount,
        linkedBankId: bankId,
        correctAnswers: newAnswers,
      }
    }))
    toast.success(`"${bank.subjectName}" bazasidan ${bank.totalCount} ta savol yuklandi`)
  }

  const fillAllAnswers = (subjectId: string, answer: string) => {
    setSubjects(prev => prev.map(s => {
      if (s.id !== subjectId) return s
      const newAnswers: Record<string, string> = {}
      for (let i = 1; i <= s.questionCount; i++) {
        newAnswers[String(i)] = answer
      }
      return { ...s, correctAnswers: newAnswers }
    }))
  }

  const handleSubmit = async () => {
    if (!title.trim()) { toast.error("Imtihon nomini kiriting"); return }
    if (subjects.length === 0) { toast.error("Kamida 1 ta fan kerak"); return }

    for (const s of subjects) {
      if (!s.subjectName.trim()) { toast.error(`Fan nomi kiritilmagan`); return }
      if (s.questionCount < 1) { toast.error(`${s.subjectName}: savollar soni noto'g'ri`); return }
    }

    // Check all answers filled
    for (const s of subjects) {
      for (let i = 1; i <= s.questionCount; i++) {
        if (!s.correctAnswers[String(i)]) {
          toast.error(`${s.subjectName}: ${i}-savol javobi kiritilmagan`)
          return
        }
      }
    }

    setLoading(true)
    try {
      const result = await createExam({
        title: title.trim(),
        description: description || undefined,
        date: date || undefined,
        duration: duration ? parseInt(duration) : undefined,
        subjects: subjects.map((s, i) => ({
          subjectName: s.subjectName,
          questionCount: s.questionCount,
          pointsPerQ: s.pointsPerQ,
          correctAnswers: s.correctAnswers,
          order: i,
        }))
      })

      if (result.success) {
        toast.success('Imtihon muvaffaqiyatli yaratildi!')
        router.push(`/admin/exams/${result.exam?.id}`)
      } else {
        toast.error(result.error || 'Xatolik yuz berdi')
      }
    } catch (e) {
      toast.error('Xatolik yuz berdi')
    } finally {
      setLoading(false)
    }
  }

  const totalQuestions = subjects.reduce((s, sub) => s + sub.questionCount, 0)
  const totalMax = subjects.reduce((s, sub) => s + sub.questionCount * sub.pointsPerQ, 0)

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-blue-600 to-cyan-600 p-8 text-white shadow-2xl">
        <div className="absolute inset-0 bg-black/10" />
        <div className="relative z-10">
          <Button asChild variant="ghost" size="sm" className="text-white/80 hover:text-white hover:bg-white/20 -ml-2 mb-3">
            <Link href="/admin/exams"><ArrowLeft className="h-4 w-4 mr-1" /> Orqaga</Link>
          </Button>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
              <ClipboardCheck className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Yangi Imtihon Yaratish</h1>
              <p className="text-blue-100 mt-0.5">Fanlar, savollar va to'g'ri javoblarni belgilang</p>
            </div>
          </div>
        </div>
        <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
      </div>

      {/* Exam Info */}
      <Card className="border-2">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <div className="h-6 w-1 bg-indigo-500 rounded-full" />
            Imtihon Ma'lumotlari
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2 space-y-1.5">
            <Label className="text-sm font-semibold">Imtihon nomi <span className="text-red-500">*</span></Label>
            <Input placeholder="Masalan: 2024-2025 o'quv yili 1-chorak yakuniy imtihon" value={title} onChange={e => setTitle(e.target.value)} className="text-base" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-semibold">Sana</Label>
            <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-semibold">Vaqt (daqiqada)</Label>
            <Input type="number" min="1" placeholder="120" value={duration} onChange={e => setDuration(e.target.value)} />
          </div>
          <div className="md:col-span-2 space-y-1.5">
            <Label className="text-sm font-semibold">Izoh</Label>
            <Textarea placeholder="Imtihon haqida qo'shimcha ma'lumot..." value={description} onChange={e => setDescription(e.target.value)} rows={2} className="resize-none" />
          </div>
        </CardContent>
      </Card>

      {/* Summary bar */}
      {subjects.length > 0 && (
        <div className="flex flex-wrap gap-4 p-4 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800">
          <div className="flex items-center gap-2 text-sm">
            <BookOpen className="h-4 w-4 text-indigo-500" />
            <span className="text-muted-foreground">Fanlar:</span>
            <span className="font-bold text-indigo-700 dark:text-indigo-300">{subjects.length} ta</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <FlaskConical className="h-4 w-4 text-blue-500" />
            <span className="text-muted-foreground">Savollar:</span>
            <span className="font-bold text-blue-700 dark:text-blue-300">{totalQuestions} ta</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <ClipboardCheck className="h-4 w-4 text-green-500" />
            <span className="text-muted-foreground">Maks. ball:</span>
            <span className="font-bold text-green-700 dark:text-green-300">{totalMax}</span>
          </div>
        </div>
      )}

      {/* Subjects */}
      <div className="space-y-4">
        {subjects.map((sub, idx) => (
          <SubjectEditor
            key={sub.id}
            subject={sub}
            index={idx}
            questionBanks={questionBanks}
            onUpdate={(field, value) => updateSubject(sub.id, field, value)}
            onSetAnswer={(q, a) => setCorrectAnswer(sub.id, q, a)}
            onFillAll={(a) => fillAllAnswers(sub.id, a)}
            onLoadFromBank={(bankId) => loadFromBank(sub.id, bankId)}
            onRemove={() => removeSubject(sub.id)}
            canRemove={subjects.length > 1}
          />
        ))}

        <Button
          variant="outline"
          className="w-full border-2 border-dashed border-indigo-300 dark:border-indigo-700 hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 h-12"
          onClick={addSubject}
        >
          <Plus className="h-5 w-5 mr-2" />
          Fan Qo'shish
        </Button>
      </div>

      {/* Submit */}
      <div className="flex items-center justify-between p-5 rounded-xl border-2 bg-card">
        <div className="text-sm text-muted-foreground">
          {subjects.length} ta fan • {totalQuestions} ta savol • Maks. {totalMax} ball
        </div>
        <div className="flex gap-3">
          <Button variant="outline" asChild><Link href="/admin/exams">Bekor qilish</Link></Button>
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="bg-indigo-600 hover:bg-indigo-700 min-w-[160px]"
            size="lg"
          >
            {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Imtihon Yaratish
          </Button>
        </div>
      </div>
    </div>
  )
}

// ─── Subject Editor Sub-component ────────────────────────────────────────────
function SubjectEditor({
  subject, index, questionBanks, onUpdate, onSetAnswer, onFillAll, onLoadFromBank, onRemove, canRemove
}: {
  subject: SubjectConfig
  index: number
  questionBanks: QuestionBankOption[]
  onUpdate: (field: keyof SubjectConfig, value: any) => void
  onSetAnswer: (q: number, a: string) => void
  onFillAll: (a: string) => void
  onLoadFromBank: (bankId: string) => void
  onRemove: () => void
  canRemove: boolean
}) {
  const filledCount = Object.values(subject.correctAnswers).filter(Boolean).length
  const allFilled = filledCount === subject.questionCount && subject.questionCount > 0

  // Build rows of questions (5 per row in answer sheet style)
  const rows: number[][] = []
  for (let i = 1; i <= subject.questionCount; i += 5) {
    rows.push(Array.from({ length: Math.min(5, subject.questionCount - i + 1) }, (_, j) => i + j))
  }

  return (
    <Card className={`border-2 transition-all ${allFilled ? 'border-green-300 dark:border-green-700' : 'border-indigo-200 dark:border-indigo-800'}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
              {index + 1}
            </div>
            <div>
              <Input
                value={subject.subjectName}
                onChange={e => onUpdate('subjectName', e.target.value)}
                placeholder="Fan nomi (masalan: Matematika)"
                className="text-base font-semibold border-0 border-b rounded-none px-0 h-8 focus-visible:ring-0 bg-transparent"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={allFilled ? 'border-green-400 text-green-600 dark:text-green-400' : 'border-orange-400 text-orange-600 dark:text-orange-400'}>
              {filledCount}/{subject.questionCount}
            </Badge>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => onUpdate('expanded', !subject.expanded)}
            >
              {subject.expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
            {canRemove && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                onClick={onRemove}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      {subject.expanded && (
        <CardContent className="space-y-4">
          {/* Question Bank selector */}
          {questionBanks.length > 0 && (
            <div className="flex flex-wrap items-center gap-3 p-3 bg-teal-50 dark:bg-teal-950/20 rounded-lg border border-teal-200 dark:border-teal-800">
              <div className="flex items-center gap-2 text-sm font-medium text-teal-700 dark:text-teal-300">
                <Database className="h-4 w-4" />
                Savollar bazasidan yuklash:
              </div>
              <Select onValueChange={onLoadFromBank} value={subject.linkedBankId || ''}>
                <SelectTrigger className="w-56 h-8 text-sm border-teal-300 dark:border-teal-700 focus:ring-teal-500">
                  <SelectValue placeholder="Baza tanlang..." />
                </SelectTrigger>
                <SelectContent>
                  {questionBanks.map(b => {
                    const answeredCount = b.questions.filter(q => q.correctAnswer).length
                    return (
                      <SelectItem key={b.id} value={b.id}>
                        <div className="flex items-center gap-2">
                          <span>{b.subjectName}</span>
                          <span className="text-xs text-muted-foreground">({answeredCount}/{b.totalCount} javob)</span>
                        </div>
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
              {subject.linkedBankId && (
                <Badge className="bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300 border-teal-300">
                  <CheckCircle2 className="h-3 w-3 mr-1" /> Baza ulangan
                </Badge>
              )}
              <Link href="/admin/question-banks/upload" target="_blank" className="text-xs text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1">
                <Plus className="h-3 w-3" /> Yangi baza yaratish
              </Link>
            </div>
          )}

          {/* Config row */}
          <div className="flex flex-wrap gap-4 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Savollar soni</Label>
              <Input
                type="number" min="1" max="100"
                value={subject.questionCount}
                onChange={e => onUpdate('questionCount', e.target.value)}
                className="w-20 text-center"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Ball/savol</Label>
              <Input
                type="number" min="0.5" step="0.5"
                value={subject.pointsPerQ}
                onChange={e => onUpdate('pointsPerQ', parseFloat(e.target.value))}
                className="w-20 text-center"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Maks. ball</Label>
              <div className="h-9 flex items-center px-3 bg-white dark:bg-card border rounded-md text-sm font-bold text-indigo-600 dark:text-indigo-400 w-20 justify-center">
                {subject.questionCount * subject.pointsPerQ}
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Barchasini to'ldirish</Label>
              <div className="flex gap-1">
                {ANSWER_OPTIONS.map(opt => (
                  <Button
                    key={opt}
                    variant="outline"
                    size="sm"
                    className="h-9 w-9 p-0 font-bold hover:bg-indigo-50 hover:border-indigo-400"
                    onClick={() => onFillAll(opt)}
                  >
                    {opt}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Answer grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
            {Array.from({ length: subject.questionCount }, (_, i) => i + 1).map(qNum => {
              const current = subject.correctAnswers[String(qNum)]
              return (
                <div key={qNum} className="flex items-center gap-2">
                  <span className="text-xs font-mono text-muted-foreground w-6 text-right shrink-0">{qNum}.</span>
                  <div className="flex gap-1">
                    {ANSWER_OPTIONS.map(opt => (
                      <button
                        key={opt}
                        onClick={() => onSetAnswer(qNum, opt)}
                        className={`h-7 w-7 rounded-full text-xs font-bold border-2 transition-all ${
                          current === opt
                            ? 'bg-indigo-600 border-indigo-600 text-white scale-110'
                            : 'border-slate-300 dark:border-slate-600 hover:border-indigo-400 hover:text-indigo-600'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      )}
    </Card>
  )
}
