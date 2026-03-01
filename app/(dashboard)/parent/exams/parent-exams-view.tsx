'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  ClipboardCheck, BarChart3, Calendar, BookOpen,
  TrendingUp, Award, Target, ChevronDown, ChevronUp
} from 'lucide-react'

interface ExamSubject {
  id: string; subjectName: string; questionCount: number; pointsPerQ: number; order: number
}
interface Exam { id: string; title: string; date: string | null; subjects: ExamSubject[] }
interface ExamResult {
  id: string; examId: string; totalScore: number; totalMax: number; percentage: number; source: string
  scores: Record<string, { correct: number; wrong: number; empty: number; score: number; total: number; maxScore: number }>
  createdAt: string; exam: Exam
}
interface Student {
  id: string
  user: { fullName: string; avatar: string | null }
  class: { name: string } | null
  examResults: ExamResult[]
}

function getLetterGrade(pct: number) {
  if (pct >= 90) return { letter: 'A', label: "A'lo", color: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700' }
  if (pct >= 75) return { letter: 'B', label: 'Yaxshi', color: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700' }
  if (pct >= 60) return { letter: 'C', label: 'Qoniqarli', color: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700' }
  if (pct >= 45) return { letter: 'D', label: 'Zaif', color: 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300 border-orange-300 dark:border-orange-700' }
  return { letter: 'F', label: 'Qoniqarsiz', color: 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 border-red-300 dark:border-red-700' }
}

function getProgressColor(pct: number) {
  if (pct >= 90) return 'bg-emerald-500'
  if (pct >= 75) return 'bg-blue-500'
  if (pct >= 60) return 'bg-amber-500'
  if (pct >= 45) return 'bg-orange-500'
  return 'bg-red-500'
}

function StudentExams({ student }: { student: Student }) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const results = student.examResults
  const total = results.length
  const avgPct = total > 0 ? results.reduce((s, r) => s + r.percentage, 0) / total : 0
  const passCount = results.filter(r => r.percentage >= 60).length

  if (total === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <ClipboardCheck className="h-16 w-16 mb-3 opacity-30" />
        <p className="text-lg font-medium">Imtihon natijalari mavjud emas</p>
        <p className="text-sm mt-1">Imtihon natijalari kiritilmagan</p>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-4 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-center">
          <p className="text-2xl font-bold text-indigo-700 dark:text-indigo-300">{total}</p>
          <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-0.5">Jami imtihon</p>
        </div>
        <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-center">
          <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{avgPct.toFixed(1)}%</p>
          <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">O'rtacha</p>
        </div>
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-center">
          <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">{passCount}</p>
          <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">O'tdi (≥60%)</p>
        </div>
      </div>

      {/* Results list */}
      <div className="space-y-3">
        {results.map(result => {
          const { letter, label, color } = getLetterGrade(result.percentage)
          const isExpanded = expandedId === result.id
          const progressColor = getProgressColor(result.percentage)

          return (
            <div key={result.id} className="rounded-xl border-2 border-slate-200 dark:border-slate-700 overflow-hidden hover:border-indigo-300 dark:hover:border-indigo-700 transition-all">
              {/* Main row */}
              <button
                className="w-full flex items-start gap-3 p-4 text-left hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors"
                onClick={() => setExpandedId(isExpanded ? null : result.id)}
              >
                <div className="p-2.5 bg-indigo-100 dark:bg-indigo-900/40 rounded-xl shrink-0 mt-0.5">
                  <ClipboardCheck className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold">{result.exam.title}</h3>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    {result.exam.date && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {new Date(result.exam.date).toLocaleDateString('uz-UZ')}
                      </span>
                    )}
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <BookOpen className="h-3 w-3" />
                      {result.exam.subjects.length} ta fan
                    </span>
                    <Badge variant="outline" className="text-xs h-5">
                      {result.source === 'SCAN' ? '📷 Skaner' : '✍️ Qo\'lda'}
                    </Badge>
                  </div>
                  {/* Progress bar */}
                  <div className="mt-2 space-y-0.5">
                    <div className="h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${progressColor}`} style={{ width: `${Math.min(100, result.percentage)}%` }} />
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{result.percentage.toFixed(1)}%</span>
                      <span>{result.totalScore}/{result.totalMax} ball</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <Badge variant="outline" className={`font-bold text-base px-3 py-1 ${color}`}>
                    {letter}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{label}</span>
                  {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                </div>
              </button>

              {/* Expanded subject breakdown */}
              {isExpanded && (
                <div className="border-t bg-slate-50 dark:bg-slate-900/30 p-4">
                  <h4 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wider">Fan bo'yicha natijalar</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {result.exam.subjects.map(sub => {
                      const subScore = (result.scores as any)[String(sub.order)]
                      if (!subScore) return null
                      const subPct = subScore.maxScore > 0 ? (subScore.score / subScore.maxScore) * 100 : 0
                      const { letter: sl, color: sc } = getLetterGrade(subPct)

                      return (
                        <div key={sub.id} className="p-3 rounded-xl bg-white dark:bg-card border border-slate-200 dark:border-slate-700">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-sm">{sub.subjectName}</span>
                            <Badge variant="outline" className={`font-bold text-xs ${sc}`}>{sl}</Badge>
                          </div>
                          <div className="grid grid-cols-3 gap-1 text-center text-xs">
                            <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30">
                              <p className="font-bold text-emerald-600 dark:text-emerald-400">{subScore.correct}</p>
                              <p className="text-emerald-600/70 dark:text-emerald-400/70">To'g'ri</p>
                            </div>
                            <div className="p-1.5 rounded-lg bg-red-50 dark:bg-red-950/30">
                              <p className="font-bold text-red-600 dark:text-red-400">{subScore.wrong}</p>
                              <p className="text-red-600/70 dark:text-red-400/70">Noto'g'ri</p>
                            </div>
                            <div className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-900/50">
                              <p className="font-bold text-slate-500">{subScore.empty}</p>
                              <p className="text-slate-400">Bo'sh</p>
                            </div>
                          </div>
                          <div className="mt-2 flex justify-between text-xs font-bold">
                            <span>{subScore.score}/{subScore.maxScore} ball</span>
                            <span className={getLetterGrade(subPct).color}>{subPct.toFixed(0)}%</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function ParentExamsView({ students }: { students: Student[] }) {
  return (
    <div className="space-y-6 animate-fade-in p-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-500 via-blue-500 to-cyan-500 p-8 text-white shadow-2xl">
        <div className="absolute inset-0 bg-black/10" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
              <ClipboardCheck className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Imtihon Natijalari</h1>
              <p className="text-blue-100">Farzandlaringizning test va imtihon natijalari</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3 mt-4">
            {students.map(s => (
              <div key={s.id} className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-xl px-3 py-2">
                <Avatar className="h-7 w-7">
                  <AvatarImage src={s.user.avatar || ''} />
                  <AvatarFallback className="bg-white/30 text-white text-xs font-bold">{s.user.fullName.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-semibold">{s.user.fullName}</p>
                  {s.class && <p className="text-xs text-blue-200">{s.class.name}</p>}
                </div>
                <Badge className="bg-white/20 text-white border-0 text-xs">{s.examResults.length} ta</Badge>
              </div>
            ))}
          </div>
        </div>
        <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -left-8 -bottom-8 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
      </div>

      {students.length === 1 ? (
        <StudentExams student={students[0]} />
      ) : (
        <Tabs defaultValue={students[0].id}>
          <TabsList className="grid h-12 bg-muted/50 rounded-xl p-1" style={{ gridTemplateColumns: `repeat(${students.length}, 1fr)` }}>
            {students.map(s => (
              <TabsTrigger key={s.id} value={s.id} className="rounded-lg text-sm font-medium">
                <Avatar className="h-6 w-6 mr-2">
                  <AvatarImage src={s.user.avatar || ''} />
                  <AvatarFallback className="text-xs">{s.user.fullName.charAt(0)}</AvatarFallback>
                </Avatar>
                <span className="truncate">{s.user.fullName.split(' ')[0]}</span>
                <Badge variant="outline" className="ml-1.5 text-xs h-5">{s.examResults.length}</Badge>
              </TabsTrigger>
            ))}
          </TabsList>
          {students.map(s => (
            <TabsContent key={s.id} value={s.id} className="mt-5">
              <StudentExams student={s} />
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  )
}
