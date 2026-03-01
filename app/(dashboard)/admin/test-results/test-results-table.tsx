'use client'

import { useState, useMemo } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import {
  Search, Filter, X, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  ClipboardList, FlaskConical, Trophy, AlertTriangle, TrendingUp
} from 'lucide-react'

interface TestResult {
  id: string
  score: number
  maxScore: number
  percentage: number | null
  gradeType: string
  quarter: number | null
  academicYear: string | null
  date: string
  notes: string | null
  student: {
    id: string
    user: { fullName: string; avatar: string | null }
    class: { id: string; name: string } | null
  }
  subject: { id: string; name: string; color: string | null }
  teacher: { user: { fullName: string } } | null
}

interface Props {
  results: TestResult[]
  subjects: { id: string; name: string }[]
  classes: { id: string; name: string }[]
  groups: { id: string; name: string }[]
}

function getLetterGrade(pct: number) {
  if (pct >= 90) return { letter: 'A', color: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700' }
  if (pct >= 75) return { letter: 'B', color: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700' }
  if (pct >= 60) return { letter: 'C', color: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700' }
  if (pct >= 45) return { letter: 'D', color: 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300 border-orange-300 dark:border-orange-700' }
  return { letter: 'F', color: 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 border-red-300 dark:border-red-700' }
}

function getProgressColor(pct: number) {
  if (pct >= 90) return 'bg-emerald-500'
  if (pct >= 75) return 'bg-blue-500'
  if (pct >= 60) return 'bg-amber-500'
  if (pct >= 45) return 'bg-orange-500'
  return 'bg-red-500'
}

const PAGE_SIZE = 15

export function TestResultsTable({ results, subjects, classes, groups }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [filterSubject, setFilterSubject] = useState(searchParams.get('subjectId') || '')
  const [filterClass, setFilterClass] = useState(searchParams.get('classId') || '')
  const [filterGradeType, setFilterGradeType] = useState(searchParams.get('gradeType') || '')
  const [filterQuarter, setFilterQuarter] = useState(searchParams.get('quarter') || '')
  const [currentPage, setCurrentPage] = useState(1)

  const filtered = useMemo(() => {
    return results.filter(r => {
      if (search && !r.student.user.fullName.toLowerCase().includes(search.toLowerCase())) return false
      if (filterSubject && r.subject.id !== filterSubject) return false
      if (filterClass && r.student.class?.id !== filterClass) return false
      if (filterGradeType && r.gradeType !== filterGradeType) return false
      if (filterQuarter && r.quarter !== parseInt(filterQuarter)) return false
      return true
    })
  }, [results, search, filterSubject, filterClass, filterGradeType, filterQuarter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  const clearFilters = () => {
    setSearch('')
    setFilterSubject('')
    setFilterClass('')
    setFilterGradeType('')
    setFilterQuarter('')
    setCurrentPage(1)
  }
  const hasFilters = search || filterSubject || filterClass || filterGradeType || filterQuarter

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-end">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="O'quvchi ismi bo'yicha qidirish..."
            value={search}
            onChange={e => { setSearch(e.target.value); setCurrentPage(1) }}
            className="pl-9"
          />
        </div>
        <Select value={filterGradeType || 'ALL'} onValueChange={v => { setFilterGradeType(v === 'ALL' ? '' : v); setCurrentPage(1) }}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Turi" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Barcha tur</SelectItem>
            <SelectItem value="TEST">Test</SelectItem>
            <SelectItem value="EXAM">Imtihon</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterSubject || 'ALL'} onValueChange={v => { setFilterSubject(v === 'ALL' ? '' : v); setCurrentPage(1) }}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Fan" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Barcha fanlar</SelectItem>
            {subjects.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterClass || 'ALL'} onValueChange={v => { setFilterClass(v === 'ALL' ? '' : v); setCurrentPage(1) }}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Sinf" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Barcha sinflar</SelectItem>
            {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterQuarter || 'ALL'} onValueChange={v => { setFilterQuarter(v === 'ALL' ? '' : v); setCurrentPage(1) }}>
          <SelectTrigger className="w-[130px]">
            <SelectValue placeholder="Chorak" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Barcha chorak</SelectItem>
            <SelectItem value="1">1-chorak</SelectItem>
            <SelectItem value="2">2-chorak</SelectItem>
            <SelectItem value="3">3-chorak</SelectItem>
            <SelectItem value="4">4-chorak</SelectItem>
          </SelectContent>
        </Select>
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground">
            <X className="mr-1.5 h-4 w-4" /> Tozalash
          </Button>
        )}
      </div>

      {/* Results count */}
      <div className="text-sm text-muted-foreground">
        {filtered.length} ta natija topildi
        {hasFilters && <span className="ml-1 text-violet-500">(filtrlangan)</span>}
      </div>

      {/* Table */}
      {paginated.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <ClipboardList className="h-16 w-16 mb-3 opacity-30" />
          <p className="text-lg font-medium">Natijalar topilmadi</p>
          <p className="text-sm mt-1">Filtrlarni o'zgartiring yoki yangi natija kiriting</p>
        </div>
      ) : (
        <div className="rounded-xl border overflow-hidden">
          <Table>
            <TableHeader>
              <tr className="bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-950/50 dark:to-purple-950/50">
                <TableHead className="font-bold text-xs tracking-wider uppercase text-violet-700 dark:text-violet-300 w-8">#</TableHead>
                <TableHead className="font-bold text-xs tracking-wider uppercase text-violet-700 dark:text-violet-300">O'quvchi</TableHead>
                <TableHead className="font-bold text-xs tracking-wider uppercase text-violet-700 dark:text-violet-300">Sinf</TableHead>
                <TableHead className="font-bold text-xs tracking-wider uppercase text-violet-700 dark:text-violet-300">Fan</TableHead>
                <TableHead className="font-bold text-xs tracking-wider uppercase text-violet-700 dark:text-violet-300">Tur</TableHead>
                <TableHead className="font-bold text-xs tracking-wider uppercase text-violet-700 dark:text-violet-300">Ball</TableHead>
                <TableHead className="font-bold text-xs tracking-wider uppercase text-violet-700 dark:text-violet-300 w-40">Ko'rsatkich</TableHead>
                <TableHead className="font-bold text-xs tracking-wider uppercase text-violet-700 dark:text-violet-300">Baho</TableHead>
                <TableHead className="font-bold text-xs tracking-wider uppercase text-violet-700 dark:text-violet-300">Chorak</TableHead>
                <TableHead className="font-bold text-xs tracking-wider uppercase text-violet-700 dark:text-violet-300">Sana</TableHead>
              </tr>
            </TableHeader>
            <TableBody>
              {paginated.map((r, idx) => {
                const pct = r.percentage ?? (r.score / r.maxScore * 100)
                const { letter, color } = getLetterGrade(pct)
                const progressColor = getProgressColor(pct)
                const rowNum = (currentPage - 1) * PAGE_SIZE + idx + 1

                return (
                  <TableRow key={r.id} className="hover:bg-violet-50/30 dark:hover:bg-violet-950/20 transition-colors">
                    <TableCell className="text-muted-foreground text-sm font-mono">{rowNum}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <Avatar className="h-8 w-8 shrink-0">
                          <AvatarImage src={r.student.user.avatar || ''} />
                          <AvatarFallback className="bg-violet-100 dark:bg-violet-900 text-violet-700 dark:text-violet-300 text-xs font-bold">
                            {r.student.user.fullName.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium text-sm">{r.student.user.fullName}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {r.student.class?.name || '—'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs font-medium">
                        {r.subject.name}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {r.gradeType === 'TEST' ? (
                        <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
                          <FlaskConical className="h-3.5 w-3.5" />
                          <span className="text-xs font-medium">Test</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-purple-600 dark:text-purple-400">
                          <ClipboardList className="h-3.5 w-3.5" />
                          <span className="text-xs font-medium">Imtihon</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="font-bold text-sm">
                        {r.score}<span className="text-muted-foreground font-normal">/{r.maxScore}</span>
                      </div>
                    </TableCell>
                    <TableCell className="w-40">
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className={`font-semibold ${pct >= 60 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                            {pct.toFixed(1)}%
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${progressColor}`}
                            style={{ width: `${Math.min(100, pct)}%` }}
                          />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`font-bold text-sm w-8 justify-center ${color}`}>
                        {letter}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {r.quarter ? `${r.quarter}-chorak` : '—'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground whitespace-nowrap">
                        {new Date(r.date).toLocaleDateString('uz-UZ', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                      </span>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-sm text-muted-foreground">
            Jami {filtered.length} ta, {PAGE_SIZE} tadan ko'rsatilmoqda • {currentPage}/{totalPages} sahifa
          </p>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentPage(1)} disabled={currentPage === 1}>
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
              .reduce<(number | string)[]>((acc, p, i, arr) => {
                if (i > 0 && (p as number) - (arr[i - 1] as number) > 1) acc.push('...')
                acc.push(p)
                return acc
              }, [])
              .map((p, i) =>
                p === '...' ? (
                  <span key={`e-${i}`} className="px-2 text-muted-foreground text-sm">...</span>
                ) : (
                  <Button
                    key={p}
                    variant={currentPage === p ? 'default' : 'outline'}
                    size="icon"
                    className={`h-8 w-8 ${currentPage === p ? 'bg-violet-600 hover:bg-violet-700' : ''}`}
                    onClick={() => setCurrentPage(p as number)}
                  >
                    {p}
                  </Button>
                )
              )}
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === totalPages}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages}>
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
