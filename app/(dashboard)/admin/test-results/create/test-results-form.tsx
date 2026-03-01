'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import {
  ClipboardList, User, Users, UsersRound, ArrowLeft, Save,
  CheckCircle2, AlertTriangle, FlaskConical, BookOpen, Loader2,
  ChevronDown, Search, Check
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

interface Student {
  id: string
  user: { fullName: string; avatar: string | null }
  class: { id: string; name: string } | null
}

interface ClassWithStudents {
  id: string
  name: string
  students: { id: string; user: { fullName: string; avatar: string | null } }[]
}

interface GroupWithStudents {
  id: string
  name: string
  students: { id: string; user: { fullName: string; avatar: string | null } }[]
}

interface Subject { id: string; name: string }
interface Teacher { id: string; user: { fullName: string } }

interface Props {
  students: Student[]
  classes: ClassWithStudents[]
  groups: GroupWithStudents[]
  subjects: Subject[]
  teachers: Teacher[]
  defaultTeacherId: string | null
  currentYear: string
}

interface BulkScore {
  studentId: string
  score: string
  notes: string
  skip: boolean
}

function getLetterGrade(pct: number) {
  if (pct >= 90) return { letter: 'A', color: 'text-emerald-600 dark:text-emerald-400' }
  if (pct >= 75) return { letter: 'B', color: 'text-blue-600 dark:text-blue-400' }
  if (pct >= 60) return { letter: 'C', color: 'text-amber-600 dark:text-amber-400' }
  if (pct >= 45) return { letter: 'D', color: 'text-orange-600 dark:text-orange-400' }
  return { letter: 'F', color: 'text-red-600 dark:text-red-400' }
}

export function TestResultsForm({
  students, classes, groups, subjects, teachers, defaultTeacherId, currentYear
}: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('individual')

  // Shared fields
  const [subjectId, setSubjectId] = useState('')
  const [teacherId, setTeacherId] = useState(defaultTeacherId || '')
  const [gradeType, setGradeType] = useState<'TEST' | 'EXAM'>('TEST')
  const [maxScore, setMaxScore] = useState('100')
  const [quarter, setQuarter] = useState('')
  const [academicYear, setAcademicYear] = useState(currentYear)
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])

  // Individual
  const [studentId, setStudentId] = useState('')
  const [score, setScore] = useState('')
  const [notes, setNotes] = useState('')

  // Bulk (class/group/all)
  const [selectedClassId, setSelectedClassId] = useState('')
  const [selectedGroupId, setSelectedGroupId] = useState('')
  const [bulkSearch, setBulkSearch] = useState('')
  const [bulkScores, setBulkScores] = useState<BulkScore[]>([])
  const [bulkMode, setBulkMode] = useState<'class' | 'group' | 'all'>('class')

  const maxScoreNum = parseFloat(maxScore) || 100

  // Get students for bulk entry
  const bulkStudents = useMemo(() => {
    if (activeTab === 'bulk') {
      if (bulkMode === 'class' && selectedClassId) {
        const cls = classes.find(c => c.id === selectedClassId)
        return cls?.students || []
      } else if (bulkMode === 'group' && selectedGroupId) {
        const grp = groups.find(g => g.id === selectedGroupId)
        return grp?.students || []
      } else if (bulkMode === 'all') {
        return students
      }
    }
    return []
  }, [activeTab, bulkMode, selectedClassId, selectedGroupId, students, classes, groups])

  const filteredBulkStudents = useMemo(() => {
    if (!bulkSearch) return bulkStudents
    return bulkStudents.filter(s =>
      s.user.fullName.toLowerCase().includes(bulkSearch.toLowerCase())
    )
  }, [bulkStudents, bulkSearch])

  // Initialize bulk scores when students change
  const initBulkScores = (stds: typeof bulkStudents) => {
    setBulkScores(stds.map(s => ({
      studentId: s.id,
      score: '',
      notes: '',
      skip: false
    })))
  }

  const handleBulkModeChange = (mode: 'class' | 'group' | 'all') => {
    setBulkMode(mode)
    setBulkScores([])
    setSelectedClassId('')
    setSelectedGroupId('')
  }

  const handleClassChange = (id: string) => {
    setSelectedClassId(id)
    const cls = classes.find(c => c.id === id)
    initBulkScores(cls?.students || [])
  }

  const handleGroupChange = (id: string) => {
    setSelectedGroupId(id)
    const grp = groups.find(g => g.id === id)
    initBulkScores(grp?.students || [])
  }

  const handleAllStudents = () => {
    initBulkScores(students)
  }

  const updateBulkScore = (studentId: string, field: keyof BulkScore, value: string | boolean) => {
    setBulkScores(prev => prev.map(s => s.studentId === studentId ? { ...s, [field]: value } : s))
  }

  const getBulkScore = (studentId: string) => bulkScores.find(s => s.studentId === studentId)

  // Validation helper
  const validateShared = () => {
    if (!subjectId) { toast.error('Fan tanlanmamagan'); return false }
    if (!teacherId) { toast.error('O\'qituvchi tanlanmamagan'); return false }
    if (!maxScore || parseFloat(maxScore) <= 0) { toast.error('Maksimal ball noto\'g\'ri'); return false }
    if (!date) { toast.error('Sana tanlanmamagan'); return false }
    return true
  }

  const handleIndividualSubmit = async () => {
    if (!validateShared()) return
    if (!studentId) { toast.error('O\'quvchi tanlanmamagan'); return }
    if (!score) { toast.error('Ball kiritilmamagan'); return }
    if (parseFloat(score) > maxScoreNum) { toast.error('Ball maksimal balldan katta'); return }

    setLoading(true)
    try {
      const { createGrade } = await import('@/app/actions/grade')
      const result = await createGrade({
        studentId,
        subjectId,
        teacherId,
        gradeType,
        score: parseFloat(score),
        maxScore: maxScoreNum,
        quarter: quarter ? parseInt(quarter) : undefined,
        academicYear,
        date,
        notes: notes || undefined,
      } as any)

      if (result.success) {
        toast.success('Natija muvaffaqiyatli kiritildi!')
        router.push('/admin/test-results')
        router.refresh()
      } else {
        toast.error(result.error || 'Xatolik yuz berdi')
      }
    } catch (e) {
      toast.error('Xatolik yuz berdi')
    } finally {
      setLoading(false)
    }
  }

  const handleBulkSubmit = async () => {
    if (!validateShared()) return
    const toSubmit = bulkScores.filter(s => !s.skip && s.score !== '')
    if (toSubmit.length === 0) { toast.error('Hech qanday ball kiritilmagan'); return }

    const invalid = toSubmit.find(s => parseFloat(s.score) > maxScoreNum || parseFloat(s.score) < 0)
    if (invalid) { toast.error('Ba\'zi balllar noto\'g\'ri (0 dan maksimaldan katta)'); return }

    setLoading(true)
    try {
      const { createBulkGrades } = await import('@/app/actions/grade')
      const result = await createBulkGrades({
        grades: toSubmit.map(s => ({
          studentId: s.studentId,
          subjectId,
          teacherId,
          gradeType,
          score: parseFloat(s.score),
          maxScore: maxScoreNum,
          quarter: quarter ? parseInt(quarter) : undefined,
          academicYear,
          date,
          notes: s.notes || undefined,
        })),
      } as any)

      if (result.success) {
        toast.success(`${toSubmit.length} ta natija muvaffaqiyatli kiritildi!`)
        router.push('/admin/test-results')
        router.refresh()
      } else {
        toast.error(result.error || 'Xatolik yuz berdi')
      }
    } catch (e) {
      toast.error('Xatolik yuz berdi')
    } finally {
      setLoading(false)
    }
  }

  const individualPct = score && maxScore ? (parseFloat(score) / maxScoreNum) * 100 : null
  const filledCount = bulkScores.filter(s => !s.skip && s.score !== '').length
  const skippedCount = bulkScores.filter(s => s.skip).length

  const SharedFields = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-5 bg-slate-50 dark:bg-slate-900/50 rounded-xl border">
      <div className="space-y-1.5">
        <Label className="text-sm font-semibold flex items-center gap-1.5">
          <BookOpen className="h-3.5 w-3.5 text-violet-500" /> Fan <span className="text-red-500">*</span>
        </Label>
        <Select value={subjectId} onValueChange={setSubjectId}>
          <SelectTrigger>
            <SelectValue placeholder="Fan tanlang" />
          </SelectTrigger>
          <SelectContent>
            {subjects.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label className="text-sm font-semibold">Tur <span className="text-red-500">*</span></Label>
        <Select value={gradeType} onValueChange={(v) => setGradeType(v as 'TEST' | 'EXAM')}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="TEST">
              <div className="flex items-center gap-2">
                <FlaskConical className="h-4 w-4 text-blue-500" /> Test
              </div>
            </SelectItem>
            <SelectItem value="EXAM">
              <div className="flex items-center gap-2">
                <ClipboardList className="h-4 w-4 text-purple-500" /> Imtihon
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label className="text-sm font-semibold">Maksimal ball <span className="text-red-500">*</span></Label>
        <Input
          type="number"
          min="1"
          placeholder="100"
          value={maxScore}
          onChange={e => setMaxScore(e.target.value)}
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-sm font-semibold">Sana <span className="text-red-500">*</span></Label>
        <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
      </div>

      <div className="space-y-1.5">
        <Label className="text-sm font-semibold">Chorak</Label>
        <Select value={quarter || 'NONE'} onValueChange={v => setQuarter(v === 'NONE' ? '' : v)}>
          <SelectTrigger>
            <SelectValue placeholder="Tanlang" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="NONE">Belgilanmagan</SelectItem>
            <SelectItem value="1">1-chorak</SelectItem>
            <SelectItem value="2">2-chorak</SelectItem>
            <SelectItem value="3">3-chorak</SelectItem>
            <SelectItem value="4">4-chorak</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label className="text-sm font-semibold">O'qituvchi <span className="text-red-500">*</span></Label>
        <Select value={teacherId} onValueChange={setTeacherId}>
          <SelectTrigger>
            <SelectValue placeholder="Tanlang" />
          </SelectTrigger>
          <SelectContent>
            {teachers.map(t => (
              <SelectItem key={t.id} value={t.id}>{t.user.fullName}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-600 p-8 text-white shadow-2xl">
        <div className="absolute inset-0 bg-black/10" />
        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Button asChild variant="ghost" size="sm" className="text-white/80 hover:text-white hover:bg-white/20 -ml-2">
                <Link href="/admin/test-results">
                  <ArrowLeft className="h-4 w-4 mr-1" /> Orqaga
                </Link>
              </Button>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                <ClipboardList className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Test Natijasi Kiritish</h1>
                <p className="text-violet-100 mt-0.5">Individual, sinf/guruh yoki barcha o'quvchilar uchun</p>
              </div>
            </div>
          </div>
        </div>
        <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -left-8 -bottom-8 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3 h-14 bg-muted/50 rounded-xl p-1">
          <TabsTrigger value="individual" className="rounded-lg font-medium data-[state=active]:bg-white dark:data-[state=active]:bg-card data-[state=active]:shadow-sm">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <div className="text-left">
                <div className="text-sm font-semibold">Individual</div>
                <div className="text-xs text-muted-foreground hidden sm:block">1 ta o'quvchi</div>
              </div>
            </div>
          </TabsTrigger>
          <TabsTrigger value="bulk" className="rounded-lg font-medium data-[state=active]:bg-white dark:data-[state=active]:bg-card data-[state=active]:shadow-sm">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <div className="text-left">
                <div className="text-sm font-semibold">Sinf / Guruh</div>
                <div className="text-xs text-muted-foreground hidden sm:block">Ko'plab o'quvchi</div>
              </div>
            </div>
          </TabsTrigger>
          <TabsTrigger value="all" className="rounded-lg font-medium data-[state=active]:bg-white dark:data-[state=active]:bg-card data-[state=active]:shadow-sm">
            <div className="flex items-center gap-2">
              <UsersRound className="h-4 w-4" />
              <div className="text-left">
                <div className="text-sm font-semibold">Barcha</div>
                <div className="text-xs text-muted-foreground hidden sm:block">{students.length} ta o'quvchi</div>
              </div>
            </div>
          </TabsTrigger>
        </TabsList>

        {/* === INDIVIDUAL TAB === */}
        <TabsContent value="individual" className="mt-6 space-y-5">
          <Card className="border-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <div className="h-6 w-1 bg-violet-500 rounded-full" />
                Umumiy Ma'lumotlar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <SharedFields />
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <div className="h-6 w-1 bg-violet-500 rounded-full" />
                O'quvchi va Natija
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-sm font-semibold">O'quvchi <span className="text-red-500">*</span></Label>
                <Select value={studentId} onValueChange={setStudentId}>
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="O'quvchi tanlang..." />
                  </SelectTrigger>
                  <SelectContent>
                    {students.map(s => (
                      <SelectItem key={s.id} value={s.id}>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{s.user.fullName}</span>
                          {s.class && (
                            <Badge variant="outline" className="text-xs">{s.class.name}</Badge>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-sm font-semibold">Ball <span className="text-red-500">*</span></Label>
                  <Input
                    type="number"
                    min="0"
                    max={maxScoreNum}
                    placeholder={`0 – ${maxScoreNum}`}
                    value={score}
                    onChange={e => setScore(e.target.value)}
                    className="text-lg font-bold"
                  />
                  {individualPct !== null && (
                    <div className="mt-2 space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className={`font-bold text-base ${getLetterGrade(individualPct).color}`}>
                          {getLetterGrade(individualPct).letter} — {individualPct.toFixed(1)}%
                        </span>
                        <span className={`text-xs font-medium ${individualPct >= 60 ? 'text-emerald-600' : 'text-red-500'}`}>
                          {individualPct >= 60 ? '✓ O\'tdi' : '✗ O\'tmadi'}
                        </span>
                      </div>
                      <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            individualPct >= 90 ? 'bg-emerald-500' :
                            individualPct >= 75 ? 'bg-blue-500' :
                            individualPct >= 60 ? 'bg-amber-500' :
                            individualPct >= 45 ? 'bg-orange-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${Math.min(100, individualPct)}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label className="text-sm font-semibold">Izoh</Label>
                  <Textarea
                    placeholder="Qo'shimcha izoh..."
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    rows={3}
                    className="resize-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline" asChild>
                  <Link href="/admin/test-results">Bekor qilish</Link>
                </Button>
                <Button
                  onClick={handleIndividualSubmit}
                  disabled={loading}
                  className="bg-violet-600 hover:bg-violet-700 min-w-[140px]"
                >
                  {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  Saqlash
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* === BULK (CLASS/GROUP) TAB === */}
        <TabsContent value="bulk" className="mt-6 space-y-5">
          <Card className="border-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <div className="h-6 w-1 bg-violet-500 rounded-full" />
                Umumiy Ma'lumotlar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <SharedFields />
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <div className="h-6 w-1 bg-violet-500 rounded-full" />
                Sinf yoki Guruh Tanlash
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant={bulkMode === 'class' ? 'default' : 'outline'}
                  className={bulkMode === 'class' ? 'bg-violet-600 hover:bg-violet-700' : ''}
                  onClick={() => handleBulkModeChange('class')}
                >
                  <BookOpen className="h-4 w-4 mr-2" /> Sinf
                </Button>
                <Button
                  variant={bulkMode === 'group' ? 'default' : 'outline'}
                  className={bulkMode === 'group' ? 'bg-violet-600 hover:bg-violet-700' : ''}
                  onClick={() => handleBulkModeChange('group')}
                >
                  <Users className="h-4 w-4 mr-2" /> Guruh
                </Button>
              </div>

              {bulkMode === 'class' && (
                <Select value={selectedClassId} onValueChange={handleClassChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sinf tanlang..." />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map(c => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name} ({c.students.length} ta o'quvchi)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {bulkMode === 'group' && (
                <Select value={selectedGroupId} onValueChange={handleGroupChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Guruh tanlang..." />
                  </SelectTrigger>
                  <SelectContent>
                    {groups.map(g => (
                      <SelectItem key={g.id} value={g.id}>
                        {g.name} ({g.students.length} ta o'quvchi)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </CardContent>
          </Card>

          {bulkScores.length > 0 && (
            <BulkScoreTable
              students={bulkStudents}
              bulkScores={bulkScores}
              maxScoreNum={maxScoreNum}
              bulkSearch={bulkSearch}
              setBulkSearch={setBulkSearch}
              filteredStudents={filteredBulkStudents}
              updateBulkScore={updateBulkScore}
              getBulkScore={getBulkScore}
              filledCount={filledCount}
              skippedCount={skippedCount}
              onSubmit={handleBulkSubmit}
              loading={loading}
            />
          )}
        </TabsContent>

        {/* === ALL STUDENTS TAB === */}
        <TabsContent value="all" className="mt-6 space-y-5">
          <Card className="border-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <div className="h-6 w-1 bg-violet-500 rounded-full" />
                Umumiy Ma'lumotlar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <SharedFields />
            </CardContent>
          </Card>

          {bulkScores.length === 0 ? (
            <Card className="border-2 border-dashed">
              <CardContent className="py-12 flex flex-col items-center gap-4">
                <div className="p-4 bg-violet-100 dark:bg-violet-900/30 rounded-full">
                  <UsersRound className="h-10 w-10 text-violet-600 dark:text-violet-400" />
                </div>
                <div className="text-center">
                  <p className="font-semibold text-lg">Barcha o'quvchilar uchun natija kiritish</p>
                  <p className="text-muted-foreground text-sm mt-1">
                    {students.length} ta o'quvchi uchun ball kiritish jadvalini yuklash
                  </p>
                </div>
                <Button
                  onClick={handleAllStudents}
                  className="bg-violet-600 hover:bg-violet-700"
                  size="lg"
                >
                  <UsersRound className="h-4 w-4 mr-2" />
                  Barcha O'quvchilarni Yuklash
                </Button>
              </CardContent>
            </Card>
          ) : (
            <BulkScoreTable
              students={students}
              bulkScores={bulkScores}
              maxScoreNum={maxScoreNum}
              bulkSearch={bulkSearch}
              setBulkSearch={setBulkSearch}
              filteredStudents={filteredBulkStudents}
              updateBulkScore={updateBulkScore}
              getBulkScore={getBulkScore}
              filledCount={filledCount}
              skippedCount={skippedCount}
              onSubmit={handleBulkSubmit}
              loading={loading}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Sub-component for bulk score entry table
interface BulkScoreTableProps {
  students: { id: string; user: { fullName: string; avatar: string | null } }[]
  bulkScores: BulkScore[]
  maxScoreNum: number
  bulkSearch: string
  setBulkSearch: (v: string) => void
  filteredStudents: { id: string; user: { fullName: string; avatar: string | null } }[]
  updateBulkScore: (studentId: string, field: keyof BulkScore, value: string | boolean) => void
  getBulkScore: (studentId: string) => BulkScore | undefined
  filledCount: number
  skippedCount: number
  onSubmit: () => void
  loading: boolean
}

function BulkScoreTable({
  students, bulkScores, maxScoreNum, bulkSearch, setBulkSearch,
  filteredStudents, updateBulkScore, getBulkScore,
  filledCount, skippedCount, onSubmit, loading
}: BulkScoreTableProps) {
  const totalVisible = filteredStudents.length
  const totalAll = students.length

  return (
    <Card className="border-2">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <div className="h-6 w-1 bg-violet-500 rounded-full" />
            Ball Kiritish Jadvali
            <Badge variant="outline" className="ml-2 text-xs">
              {totalAll} ta o'quvchi
            </Badge>
          </CardTitle>
          <div className="flex items-center gap-3 text-sm">
            <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4" /> {filledCount} ta kiritildi
            </span>
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <AlertTriangle className="h-4 w-4" /> {skippedCount} ta o'tkazildi
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Kiritish jarayoni</span>
            <span>{filledCount}/{totalAll - skippedCount}</span>
          </div>
          <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-violet-500 rounded-full transition-all"
              style={{ width: totalAll > 0 ? `${(filledCount / (totalAll - skippedCount || 1)) * 100}%` : '0%' }}
            />
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="O'quvchi ismi bo'yicha..."
            value={bulkSearch}
            onChange={e => setBulkSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Student score rows */}
        <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
          {filteredStudents.map((student, idx) => {
            const bs = getBulkScore(student.id)
            if (!bs) return null
            const scoreNum = parseFloat(bs.score)
            const pct = bs.score !== '' && !isNaN(scoreNum) ? (scoreNum / maxScoreNum) * 100 : null
            const { letter, color } = pct !== null ? getLetterGrade(pct) : { letter: '—', color: 'text-muted-foreground' }
            const isInvalid = bs.score !== '' && !isNaN(scoreNum) && (scoreNum < 0 || scoreNum > maxScoreNum)

            return (
              <div
                key={student.id}
                className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                  bs.skip
                    ? 'opacity-50 bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800'
                    : 'bg-white dark:bg-card border-slate-200 dark:border-slate-700 hover:border-violet-300 dark:hover:border-violet-700'
                }`}
              >
                <span className="text-xs text-muted-foreground font-mono w-6 shrink-0">{idx + 1}</span>
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarImage src={student.user.avatar || ''} />
                  <AvatarFallback className="bg-violet-100 dark:bg-violet-900 text-violet-700 dark:text-violet-300 text-xs font-bold">
                    {student.user.fullName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <span className="flex-1 font-medium text-sm truncate">{student.user.fullName}</span>

                {/* Score input */}
                <div className="flex items-center gap-2 shrink-0">
                  <Input
                    type="number"
                    min="0"
                    max={maxScoreNum}
                    placeholder={`0-${maxScoreNum}`}
                    value={bs.score}
                    onChange={e => updateBulkScore(student.id, 'score', e.target.value)}
                    disabled={bs.skip}
                    className={`w-24 text-center font-bold ${isInvalid ? 'border-red-400 focus:border-red-500' : ''}`}
                  />
                  {pct !== null && !bs.skip && (
                    <span className={`text-sm font-bold w-8 text-center ${color}`}>{letter}</span>
                  )}
                  {pct !== null && !bs.skip && (
                    <span className="text-xs text-muted-foreground w-14 text-right">{pct.toFixed(0)}%</span>
                  )}
                </div>

                {/* Skip toggle */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => updateBulkScore(student.id, 'skip', !bs.skip)}
                  className={`h-8 w-8 p-0 shrink-0 ${bs.skip ? 'text-muted-foreground' : 'text-slate-400 hover:text-orange-500'}`}
                  title={bs.skip ? 'Kiritishga qaytarish' : 'O\'tkazib yuborish'}
                >
                  {bs.skip ? <Check className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                </Button>
              </div>
            )
          })}
        </div>

        {/* Submit */}
        <div className="flex items-center justify-between pt-3 border-t">
          <div className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{filledCount}</span> ta natija saqlanadi
            {skippedCount > 0 && <span className="ml-2">({skippedCount} ta o'tkazilgan)</span>}
          </div>
          <div className="flex gap-3">
            <Button variant="outline" asChild>
              <Link href="/admin/test-results">Bekor qilish</Link>
            </Button>
            <Button
              onClick={onSubmit}
              disabled={loading || filledCount === 0}
              className="bg-violet-600 hover:bg-violet-700 min-w-[160px]"
            >
              {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              {filledCount} ta Natijani Saqlash
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
