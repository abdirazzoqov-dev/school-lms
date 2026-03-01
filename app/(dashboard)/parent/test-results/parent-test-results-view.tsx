'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  ClipboardList, FlaskConical, Search, TrendingUp, Award,
  Target, BarChart3, Calendar, BookOpen, User, ChevronUp, ChevronDown
} from 'lucide-react'

interface Grade {
  id: string
  score: number
  maxScore: number
  percentage: number | null
  gradeType: string
  quarter: number | null
  academicYear: string | null
  date: string
  notes: string | null
  subject: { id: string; name: string; color: string | null }
  teacher: { user: { fullName: string } } | null
}

interface Student {
  id: string
  user: { fullName: string; avatar: string | null }
  class: { id: string; name: string } | null
  grades: Grade[]
}

interface Props {
  students: Student[]
}

function getLetterGrade(pct: number) {
  if (pct >= 90) return { letter: 'A', label: 'A\'lo', color: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700' }
  if (pct >= 75) return { letter: 'B', label: 'Yaxshi', color: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700' }
  if (pct >= 60) return { letter: 'C', label: 'Qoniqarli', color: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700' }
  if (pct >= 45) return { letter: 'D', label: 'Zaif', color: 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300 border-orange-300 dark:border-orange-700' }
  return { letter: 'F', label: 'Qoniqarsiz', color: 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 border-red-300 dark:border-red-700' }
}

function getProgressBarColor(pct: number) {
  if (pct >= 90) return 'bg-emerald-500'
  if (pct >= 75) return 'bg-blue-500'
  if (pct >= 60) return 'bg-amber-500'
  if (pct >= 45) return 'bg-orange-500'
  return 'bg-red-500'
}

function StudentTestResults({ student }: { student: Student }) {
  const [search, setSearch] = useState('')
  const [filterSubject, setFilterSubject] = useState('')
  const [filterQuarter, setFilterQuarter] = useState('')
  const [filterType, setFilterType] = useState('')
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc')

  const subjects = useMemo(() => {
    const map = new Map<string, string>()
    student.grades.forEach(g => map.set(g.subject.id, g.subject.name))
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }))
  }, [student.grades])

  const filtered = useMemo(() => {
    let result = [...student.grades]
    if (search) result = result.filter(g => g.subject.name.toLowerCase().includes(search.toLowerCase()))
    if (filterSubject) result = result.filter(g => g.subject.id === filterSubject)
    if (filterQuarter) result = result.filter(g => g.quarter === parseInt(filterQuarter))
    if (filterType) result = result.filter(g => g.gradeType === filterType)
    result.sort((a, b) => {
      const diff = new Date(a.date).getTime() - new Date(b.date).getTime()
      return sortOrder === 'desc' ? -diff : diff
    })
    return result
  }, [student.grades, search, filterSubject, filterQuarter, filterType, sortOrder])

  // Stats
  const total = student.grades.length
  const avgPct = total > 0
    ? student.grades.reduce((s, g) => s + (g.percentage ?? (g.score / g.maxScore * 100)), 0) / total
    : 0
  const passCount = student.grades.filter(g => (g.percentage ?? (g.score / g.maxScore * 100)) >= 60).length
  const excellentCount = student.grades.filter(g => (g.percentage ?? (g.score / g.maxScore * 100)) >= 90).length

  if (total === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <ClipboardList className="h-16 w-16 mb-3 opacity-30" />
        <p className="text-lg font-medium">Natijalar mavjud emas</p>
        <p className="text-sm mt-1">Test yoki imtihon natijalari kiritilmagan</p>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Mini stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-violet-50 dark:bg-violet-950/40 border border-violet-200 dark:border-violet-800 text-center">
          <p className="text-2xl font-bold text-violet-700 dark:text-violet-300">{total}</p>
          <p className="text-xs text-violet-600 dark:text-violet-400 mt-0.5">Jami testlar</p>
        </div>
        <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-center">
          <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{avgPct.toFixed(1)}%</p>
          <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">O'rtacha ball</p>
        </div>
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-center">
          <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">{passCount}</p>
          <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">O'tdi (≥60%)</p>
        </div>
        <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-center">
          <p className="text-2xl font-bold text-amber-700 dark:text-amber-300">{excellentCount}</p>
          <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">A'lo (≥90%)</p>
        </div>
      </div>

      {/* Overall progress bar */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30 border border-violet-200 dark:border-violet-800">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-semibold">Umumiy ko'rsatkich</span>
          <span className={`text-sm font-bold ${getLetterGrade(avgPct).color} px-2.5 py-0.5 rounded-full border text-xs`}>
            {getLetterGrade(avgPct).letter} — {getLetterGrade(avgPct).label}
          </span>
        </div>
        <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${getProgressBarColor(avgPct)}`}
            style={{ width: `${Math.min(100, avgPct)}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span>0%</span>
          <span className="font-semibold text-foreground">{avgPct.toFixed(1)}%</span>
          <span>100%</span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[160px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Fan qidirish..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-8 h-9 text-sm"
          />
        </div>
        <Select value={filterType || 'ALL'} onValueChange={v => setFilterType(v === 'ALL' ? '' : v)}>
          <SelectTrigger className="w-[130px] h-9 text-sm">
            <SelectValue placeholder="Tur" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Barcha tur</SelectItem>
            <SelectItem value="TEST">Test</SelectItem>
            <SelectItem value="EXAM">Imtihon</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterSubject || 'ALL'} onValueChange={v => setFilterSubject(v === 'ALL' ? '' : v)}>
          <SelectTrigger className="w-[150px] h-9 text-sm">
            <SelectValue placeholder="Fan" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Barcha fanlar</SelectItem>
            {subjects.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterQuarter || 'ALL'} onValueChange={v => setFilterQuarter(v === 'ALL' ? '' : v)}>
          <SelectTrigger className="w-[120px] h-9 text-sm">
            <SelectValue placeholder="Chorak" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Barcha</SelectItem>
            <SelectItem value="1">1-chorak</SelectItem>
            <SelectItem value="2">2-chorak</SelectItem>
            <SelectItem value="3">3-chorak</SelectItem>
            <SelectItem value="4">4-chorak</SelectItem>
          </SelectContent>
        </Select>
        <button
          onClick={() => setSortOrder(o => o === 'desc' ? 'asc' : 'desc')}
          className="flex items-center gap-1.5 h-9 px-3 rounded-md border border-input bg-background text-sm hover:bg-accent transition-colors"
        >
          {sortOrder === 'desc' ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />}
          Sana
        </button>
      </div>

      {/* Results list */}
      {filtered.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p>Natijalar topilmadi</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(grade => {
            const pct = grade.percentage ?? (grade.score / grade.maxScore * 100)
            const { letter, label, color } = getLetterGrade(pct)
            const progressColor = getProgressBarColor(pct)

            return (
              <div
                key={grade.id}
                className="p-4 rounded-xl border bg-card hover:shadow-md transition-all hover:border-violet-300 dark:hover:border-violet-700"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={`p-2 rounded-lg shrink-0 ${grade.gradeType === 'TEST' ? 'bg-blue-100 dark:bg-blue-900/40' : 'bg-purple-100 dark:bg-purple-900/40'}`}>
                      {grade.gradeType === 'TEST'
                        ? <FlaskConical className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        : <ClipboardList className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                      }
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm">{grade.subject.name}</span>
                        <Badge variant="outline" className="text-xs h-5">
                          {grade.gradeType === 'TEST' ? 'Test' : 'Imtihon'}
                        </Badge>
                        {grade.quarter && (
                          <Badge variant="outline" className="text-xs h-5">
                            {grade.quarter}-chorak
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(grade.date).toLocaleDateString('uz-UZ', { day: '2-digit', month: 'long', year: 'numeric' })}
                        </span>
                        {grade.teacher && (
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {grade.teacher.user.fullName}
                          </span>
                        )}
                      </div>
                      {grade.notes && (
                        <p className="text-xs text-muted-foreground mt-1 italic">{grade.notes}</p>
                      )}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="flex items-center gap-2 justify-end mb-1.5">
                      <span className="text-2xl font-bold">{grade.score}</span>
                      <span className="text-muted-foreground text-sm">/{grade.maxScore}</span>
                      <Badge variant="outline" className={`text-base font-bold px-2.5 py-1 ${color}`}>
                        {letter}
                      </Badge>
                    </div>
                    <div className="w-32">
                      <div className="flex justify-between text-xs mb-0.5">
                        <span className={`font-medium ${pct >= 60 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>
                          {pct >= 60 ? '✓ O\'tdi' : '✗ O\'tmadi'}
                        </span>
                        <span className="text-muted-foreground">{pct.toFixed(1)}%</span>
                      </div>
                      <div className="h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${progressColor}`}
                          style={{ width: `${Math.min(100, pct)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export function ParentTestResultsView({ students }: Props) {
  const activeStudentId = students[0]?.id || ''

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-500 via-purple-500 to-indigo-500 p-8 text-white shadow-2xl">
        <div className="absolute inset-0 bg-black/10" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
              <ClipboardList className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Test Natijalari</h1>
              <p className="text-violet-100">Farzandlaringizning test va imtihon natijalari</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3 mt-4">
            {students.map(s => (
              <div key={s.id} className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-xl px-3 py-2">
                <Avatar className="h-7 w-7">
                  <AvatarImage src={s.user.avatar || ''} />
                  <AvatarFallback className="bg-white/30 text-white text-xs font-bold">
                    {s.user.fullName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-semibold">{s.user.fullName}</p>
                  {s.class && <p className="text-xs text-violet-200">{s.class.name}</p>}
                </div>
                <Badge className="bg-white/20 text-white border-0 text-xs">
                  {s.grades.length} ta natija
                </Badge>
              </div>
            ))}
          </div>
        </div>
        <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -left-8 -bottom-8 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
      </div>

      {/* Tabs per child */}
      {students.length === 1 ? (
        <StudentTestResults student={students[0]} />
      ) : (
        <Tabs defaultValue={activeStudentId}>
          <TabsList className={`grid h-12 bg-muted/50 rounded-xl p-1`} style={{ gridTemplateColumns: `repeat(${students.length}, 1fr)` }}>
            {students.map(s => (
              <TabsTrigger key={s.id} value={s.id} className="rounded-lg text-sm font-medium">
                <Avatar className="h-6 w-6 mr-2">
                  <AvatarImage src={s.user.avatar || ''} />
                  <AvatarFallback className="text-xs">{s.user.fullName.charAt(0)}</AvatarFallback>
                </Avatar>
                <span className="truncate">{s.user.fullName.split(' ')[0]}</span>
                <Badge variant="outline" className="ml-1.5 text-xs h-5">{s.grades.length}</Badge>
              </TabsTrigger>
            ))}
          </TabsList>
          {students.map(s => (
            <TabsContent key={s.id} value={s.id} className="mt-5">
              <StudentTestResults student={s} />
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  )
}
