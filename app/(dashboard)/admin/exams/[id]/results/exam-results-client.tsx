'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  ArrowLeft, Save, Loader2, Search, BarChart3, Users, Trophy,
  CheckCircle2, AlertTriangle, ScanLine, BookOpen, ClipboardList
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { saveExamResult, saveBulkExamResults } from '@/app/actions/exam'

interface ExamSubject {
  id: string; subjectName: string; questionCount: number; pointsPerQ: number; order: number
}
interface Exam {
  id: string; title: string; subjects: ExamSubject[]
}
interface Student {
  id: string
  user: { fullName: string; avatar: string | null }
  class: { id: string; name: string } | null
}
interface ExamResult {
  id: string
  studentId: string
  answers: Record<string, Record<string, string>>
  scores: Record<string, { correct: number; wrong: number; empty: number; score: number; total: number; maxScore: number }>
  totalScore: number; totalMax: number; percentage: number; source: string
  student: { user: { fullName: string; avatar: string | null }; class: { name: string } | null }
}

const ANSWER_OPTIONS = ['A', 'B', 'C', 'D', 'E']

function getLetterGrade(pct: number) {
  if (pct >= 90) return { letter: 'A', color: 'text-emerald-600 dark:text-emerald-400' }
  if (pct >= 75) return { letter: 'B', color: 'text-blue-600 dark:text-blue-400' }
  if (pct >= 60) return { letter: 'C', color: 'text-amber-600 dark:text-amber-400' }
  if (pct >= 45) return { letter: 'D', color: 'text-orange-600 dark:text-orange-400' }
  return { letter: 'F', color: 'text-red-600 dark:text-red-400' }
}

// ─── Single Student Answer Input ──────────────────────────────────────────────
function StudentAnswerInput({
  exam, student, existingResult, onSaved
}: {
  exam: Exam; student: Student
  existingResult?: ExamResult
  onSaved: () => void
}) {
  const [answers, setAnswers] = useState<Record<string, Record<string, string>>>(
    existingResult?.answers || {}
  )
  const [saving, setSaving] = useState(false)

  const setAnswer = (subjectOrder: number, qNum: number, answer: string) => {
    const key = String(subjectOrder)
    setAnswers(prev => ({
      ...prev,
      [key]: { ...(prev[key] || {}), [String(qNum)]: answer }
    }))
  }

  const clearAnswer = (subjectOrder: number, qNum: number) => {
    const key = String(subjectOrder)
    setAnswers(prev => {
      const newSub = { ...(prev[key] || {}) }
      delete newSub[String(qNum)]
      return { ...prev, [key]: newSub }
    })
  }

  const handleSave = async () => {
    setSaving(true)
    const result = await saveExamResult({ examId: exam.id, studentId: student.id, answers, source: 'MANUAL' })
    setSaving(false)
    if (result.success) {
      toast.success('Natija saqlandi!')
      onSaved()
    } else {
      toast.error(result.error || 'Xatolik')
    }
  }

  // Calculate live scores
  const liveScores = useMemo(() => {
    let total = 0; let max = 0
    for (const sub of exam.subjects) {
      const key = String(sub.order)
      const subAnswers = answers[key] || {}
      for (let q = 1; q <= sub.questionCount; q++) {
        // We don't have correctAnswers here on client for security, just count filled
        if (subAnswers[String(q)]) total++
      }
      max += sub.questionCount
    }
    return { filled: total, total: max }
  }, [answers, exam.subjects])

  return (
    <div className="space-y-4">
      {/* Student header */}
      <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
        <Avatar className="h-10 w-10">
          <AvatarImage src={student.user.avatar || ''} />
          <AvatarFallback className="bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 font-bold">
            {student.user.fullName.charAt(0)}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="font-semibold">{student.user.fullName}</p>
          <p className="text-sm text-muted-foreground">{student.class?.name || '—'}</p>
        </div>
        <div className="ml-auto text-sm text-muted-foreground">
          {liveScores.filled}/{liveScores.total} ta javob kiritildi
        </div>
      </div>

      {/* Answer grids per subject */}
      {exam.subjects.map(sub => {
        const subKey = String(sub.order)
        const subAnswers = answers[subKey] || {}

        return (
          <div key={sub.id} className="border-2 rounded-xl overflow-hidden">
            <div className="bg-indigo-600 text-white px-4 py-2 flex justify-between items-center">
              <span className="font-semibold">{sub.subjectName}</span>
              <span className="text-sm opacity-90">{sub.questionCount} savol • {sub.questionCount * sub.pointsPerQ} ball</span>
            </div>
            <div className="p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
              {Array.from({ length: sub.questionCount }, (_, i) => i + 1).map(qNum => {
                const current = subAnswers[String(qNum)]
                return (
                  <div key={qNum} className="flex items-center gap-1">
                    <span className="text-xs font-mono text-muted-foreground w-5 text-right shrink-0">{qNum}.</span>
                    <div className="flex gap-0.5">
                      {ANSWER_OPTIONS.map(opt => (
                        <button
                          key={opt}
                          onClick={() => current === opt ? clearAnswer(sub.order, qNum) : setAnswer(sub.order, qNum, opt)}
                          className={`h-6 w-6 rounded-full text-xs font-bold border transition-all ${
                            current === opt
                              ? 'bg-indigo-600 border-indigo-600 text-white scale-110'
                              : 'border-slate-300 dark:border-slate-600 hover:border-indigo-400 text-slate-500 hover:text-indigo-600'
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
          </div>
        )
      })}

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} className="bg-indigo-600 hover:bg-indigo-700">
          {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          Natijani Saqlash
        </Button>
      </div>
    </div>
  )
}

// ─── Main Results Client ──────────────────────────────────────────────────────
export function ExamResultsClient({ exam, students, existingResults }: {
  exam: Exam; students: Student[]; existingResults: ExamResult[]
}) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'overview' | 'enter'>('overview')
  const [selectedStudentId, setSelectedStudentId] = useState(students[0]?.id || '')
  const [search, setSearch] = useState('')
  const [results, setResults] = useState<ExamResult[]>(existingResults)

  const resultMap = useMemo(() => {
    const map = new Map<string, ExamResult>()
    results.forEach(r => map.set(r.studentId, r))
    return map
  }, [results])

  const filteredStudents = useMemo(() => {
    if (!search) return students
    return students.filter(s => s.user.fullName.toLowerCase().includes(search.toLowerCase()))
  }, [students, search])

  const stats = useMemo(() => {
    const total = results.length
    if (total === 0) return { total: 0, avg: 0, pass: 0, excellent: 0 }
    const avg = results.reduce((s, r) => s + r.percentage, 0) / total
    const pass = results.filter(r => r.percentage >= 60).length
    const excellent = results.filter(r => r.percentage >= 90).length
    return { total, avg, pass, excellent }
  }, [results])

  const handleResultSaved = () => {
    router.refresh()
  }

  const totalMax = exam.subjects.reduce((s, sub) => s + sub.questionCount * sub.pointsPerQ, 0)

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-blue-600 to-cyan-600 p-8 text-white shadow-2xl">
        <div className="absolute inset-0 bg-black/10" />
        <div className="relative z-10">
          <Button asChild variant="ghost" size="sm" className="text-white/80 hover:text-white hover:bg-white/20 -ml-2 mb-3">
            <Link href={`/admin/exams/${exam.id}`}><ArrowLeft className="h-4 w-4 mr-1" /> Orqaga</Link>
          </Button>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl"><BarChart3 className="h-8 w-8" /></div>
            <div>
              <h1 className="text-3xl font-bold">Natijalar</h1>
              <p className="text-blue-100 mt-0.5">{exam.title}</p>
            </div>
          </div>
        </div>
        <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
      </div>

      {/* Mini stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="border-2 border-indigo-200 dark:border-indigo-800 bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-950 dark:to-indigo-900/80">
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-indigo-600 dark:text-indigo-400">Kiritilgan</p>
            <p className="text-2xl font-bold text-indigo-700 dark:text-indigo-300">{stats.total}</p>
          </CardContent>
        </Card>
        <Card className="border-2 border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900/80">
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-blue-600 dark:text-blue-400">O'rtacha</p>
            <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{stats.avg.toFixed(1)}%</p>
          </CardContent>
        </Card>
        <Card className="border-2 border-green-200 dark:border-green-800 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900/80">
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-green-600 dark:text-green-400">O'tdi (≥60%)</p>
            <p className="text-2xl font-bold text-green-700 dark:text-green-300">{stats.pass}</p>
          </CardContent>
        </Card>
        <Card className="border-2 border-amber-200 dark:border-amber-800 bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950 dark:to-amber-900/80">
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-amber-600 dark:text-amber-400">A'lo (≥90%)</p>
            <p className="text-2xl font-bold text-amber-700 dark:text-amber-300">{stats.excellent}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={v => setActiveTab(v as any)}>
        <TabsList className="grid grid-cols-3 h-12 bg-muted/50 rounded-xl p-1">
          <TabsTrigger value="overview" className="rounded-lg font-medium">
            <BarChart3 className="h-4 w-4 mr-2" /> Umumiy Ko'rinish
          </TabsTrigger>
          <TabsTrigger value="enter" className="rounded-lg font-medium">
            <BookOpen className="h-4 w-4 mr-2" /> Javob Kiritish
          </TabsTrigger>
          <TabsTrigger value="scan" className="rounded-lg font-medium" onClick={() => router.push(`/admin/exams/${exam.id}/scan`)}>
            <ScanLine className="h-4 w-4 mr-2" /> Skaner Yuklash
          </TabsTrigger>
        </TabsList>

        {/* Overview tab */}
        <TabsContent value="overview" className="mt-5">
          {results.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <ClipboardList className="h-16 w-16 mb-3 opacity-30" />
              <p className="text-lg font-medium">Natijalar kiritilmagan</p>
              <p className="text-sm mt-1">"Javob Kiritish" yoki "Skaner" orqali natijalar qo'shing</p>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Rank list */}
              {results.map((r, idx) => {
                const { letter, color } = getLetterGrade(r.percentage)
                return (
                  <div key={r.id} className="flex items-center gap-3 p-3 rounded-xl border bg-card hover:shadow-sm transition-all">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${
                      idx === 0 ? 'bg-amber-400 text-white' : idx === 1 ? 'bg-slate-300 text-slate-700' : idx === 2 ? 'bg-orange-400 text-white' : 'bg-slate-100 dark:bg-slate-800 text-muted-foreground'
                    }`}>
                      {idx + 1}
                    </div>
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarImage src={r.student.user.avatar || ''} />
                      <AvatarFallback className="text-xs">{r.student.user.fullName.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{r.student.user.fullName}</p>
                      <p className="text-xs text-muted-foreground">{r.student.class?.name || '—'}</p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-2">
                        <span className="font-bold">{r.totalScore}</span>
                        <span className="text-muted-foreground text-xs">/{r.totalMax}</span>
                        <Badge variant="outline" className={`font-bold text-sm w-7 justify-center ${color}`}>
                          {letter}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground text-right">{r.percentage.toFixed(1)}%</div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </TabsContent>

        {/* Enter answers tab */}
        <TabsContent value="enter" className="mt-5">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            {/* Student sidebar */}
            <Card className="border-2 lg:col-span-1">
              <CardHeader className="pb-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Qidirish..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-[600px] overflow-y-auto">
                  {filteredStudents.map(s => {
                    const hasResult = resultMap.has(s.id)
                    return (
                      <button
                        key={s.id}
                        onClick={() => setSelectedStudentId(s.id)}
                        className={`w-full flex items-center gap-2 px-3 py-2.5 text-left transition-colors hover:bg-accent ${selectedStudentId === s.id ? 'bg-indigo-50 dark:bg-indigo-950/40' : ''}`}
                      >
                        <Avatar className="h-7 w-7 shrink-0">
                          <AvatarImage src={s.user.avatar || ''} />
                          <AvatarFallback className="text-xs">{s.user.fullName.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{s.user.fullName}</p>
                          <p className="text-xs text-muted-foreground">{s.class?.name}</p>
                        </div>
                        {hasResult ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                        ) : (
                          <div className="h-4 w-4 shrink-0" />
                        )}
                      </button>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Answer input area */}
            <div className="lg:col-span-3">
              {selectedStudentId ? (
                <StudentAnswerInput
                  exam={exam}
                  student={students.find(s => s.id === selectedStudentId)!}
                  existingResult={resultMap.get(selectedStudentId)}
                  onSaved={handleResultSaved}
                />
              ) : (
                <div className="flex items-center justify-center h-64 text-muted-foreground">
                  <p>O'quvchini tanlang</p>
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
