import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  ClipboardCheck, ArrowLeft, Printer, BarChart3, ScanLine,
  BookOpen, Calendar, Clock, Users, CheckCircle2, FileText, Plus
} from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function ExamDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'MODERATOR')) {
    redirect('/unauthorized')
  }
  const tenantId = session.user.tenantId!

  const exam = await db.exam.findUnique({
    where: { id: params.id, tenantId },
    include: {
      subjects: { orderBy: { order: 'asc' } },
      results: {
        include: { student: { include: { user: { select: { fullName: true } }, class: { select: { name: true } } } } },
        orderBy: { totalScore: 'desc' },
        take: 10
      },
      _count: { select: { results: true } }
    }
  })

  if (!exam) redirect('/admin/exams')

  const totalQ = exam.subjects.reduce((s, sub) => s + sub.questionCount, 0)
  const totalMax = exam.subjects.reduce((s, sub) => s + sub.questionCount * Number(sub.pointsPerQ), 0)
  const avgScore = exam._count.results > 0
    ? exam.results.reduce((s, r) => s + Number(r.totalScore), 0) / exam._count.results
    : 0
  const passCount = exam.results.filter(r => Number(r.percentage) >= 60).length

  const statusColors: Record<string, string> = {
    DRAFT: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400',
    PUBLISHED: 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300',
    COMPLETED: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300',
    ARCHIVED: 'bg-gray-100 dark:bg-gray-800 text-gray-500',
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-blue-600 to-cyan-600 p-8 text-white shadow-2xl">
        <div className="absolute inset-0 bg-black/10" />
        <div className="relative z-10">
          <Button asChild variant="ghost" size="sm" className="text-white/80 hover:text-white hover:bg-white/20 -ml-2 mb-3">
            <Link href="/admin/exams"><ArrowLeft className="h-4 w-4 mr-1" /> Barcha imtihonlar</Link>
          </Button>
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                  <ClipboardCheck className="h-8 w-8" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold">{exam.title}</h1>
                  {exam.description && <p className="text-blue-100 mt-0.5">{exam.description}</p>}
                </div>
              </div>
              <div className="flex flex-wrap gap-3 mt-3">
                <Badge className={`${statusColors[exam.status]} border-0`}>{exam.status}</Badge>
                {exam.date && (
                  <div className="flex items-center gap-1.5 text-sm text-blue-100">
                    <Calendar className="h-4 w-4" />
                    {new Date(exam.date).toLocaleDateString('uz-UZ', { day: '2-digit', month: 'long', year: 'numeric' })}
                  </div>
                )}
                {exam.duration && (
                  <div className="flex items-center gap-1.5 text-sm text-blue-100">
                    <Clock className="h-4 w-4" /> {exam.duration} daqiqa
                  </div>
                )}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="secondary" className="bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/40">
                <Link href={`/admin/exams/${exam.id}/booklet`}>
                  <BookOpen className="h-4 w-4 mr-2" /> Kitobcha
                </Link>
              </Button>
              <Button asChild variant="secondary" className="bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/40">
                <Link href={`/admin/exams/${exam.id}/answer-sheet`}>
                  <Printer className="h-4 w-4 mr-2" /> Titul
                </Link>
              </Button>
              <Button asChild variant="secondary" className="bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/40">
                <Link href={`/admin/exams/${exam.id}/results`}>
                  <BarChart3 className="h-4 w-4 mr-2" /> Natijalar
                </Link>
              </Button>
              <Button asChild className="bg-white text-blue-600 hover:bg-blue-50">
                <Link href={`/admin/exams/${exam.id}/scan`}>
                  <ScanLine className="h-4 w-4 mr-2" /> Skanerlash
                </Link>
              </Button>
            </div>
          </div>
        </div>
        <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-2 border-indigo-200 dark:border-indigo-800 bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-950 dark:to-indigo-900/80">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-1">
              <FileText className="h-4 w-4 text-indigo-500" />
              <span className="text-xs text-indigo-600 dark:text-indigo-400">Savollar</span>
            </div>
            <p className="text-2xl font-bold text-indigo-700 dark:text-indigo-300">{totalQ} ta</p>
            <p className="text-xs text-indigo-600/70 dark:text-indigo-400/70">{totalMax} maks. ball</p>
          </CardContent>
        </Card>
        <Card className="border-2 border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900/80">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-1">
              <Users className="h-4 w-4 text-blue-500" />
              <span className="text-xs text-blue-600 dark:text-blue-400">Qatnashchilar</span>
            </div>
            <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{exam._count.results} ta</p>
          </CardContent>
        </Card>
        <Card className="border-2 border-green-200 dark:border-green-800 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900/80">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span className="text-xs text-green-600 dark:text-green-400">O'rtacha ball</span>
            </div>
            <p className="text-2xl font-bold text-green-700 dark:text-green-300">{avgScore.toFixed(1)}</p>
          </CardContent>
        </Card>
        <Card className="border-2 border-amber-200 dark:border-amber-800 bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950 dark:to-amber-900/80">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-1">
              <BarChart3 className="h-4 w-4 text-amber-500" />
              <span className="text-xs text-amber-600 dark:text-amber-400">O'tish</span>
            </div>
            <p className="text-2xl font-bold text-amber-700 dark:text-amber-300">{passCount} ta</p>
            <p className="text-xs text-amber-600/70 dark:text-amber-400/70">≥60%</p>
          </CardContent>
        </Card>
      </div>

      {/* Subjects */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <div className="h-6 w-1 bg-indigo-500 rounded-full" /> Fanlar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {exam.subjects.map((sub, i) => (
              <div key={sub.id} className="p-4 rounded-xl border-2 border-indigo-200 dark:border-indigo-800 bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-950/40 dark:to-blue-950/40">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-6 w-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">{i + 1}</div>
                  <span className="font-semibold">{sub.subjectName}</span>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>{sub.questionCount} savol</span>
                  <span>{Number(sub.pointsPerQ)} ball/savol</span>
                  <span className="font-bold text-indigo-600 dark:text-indigo-400">{sub.questionCount * Number(sub.pointsPerQ)} ball</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent results */}
      {exam.results.length > 0 && (
        <Card className="border-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <div className="h-6 w-1 bg-indigo-500 rounded-full" /> Top Natijalar
              </CardTitle>
              <Button asChild variant="outline" size="sm">
                <Link href={`/admin/exams/${exam.id}/results`}>Barchasini ko'rish</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {exam.results.slice(0, 5).map((r, idx) => (
                <div key={r.id} className="flex items-center gap-3 p-3 rounded-xl border bg-card">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                    idx === 0 ? 'bg-amber-400 text-white' : idx === 1 ? 'bg-slate-300 text-slate-700' : idx === 2 ? 'bg-orange-400 text-white' : 'bg-slate-100 dark:bg-slate-800 text-muted-foreground'
                  }`}>{idx + 1}</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{r.student.user?.fullName ?? '—'}</p>
                    <p className="text-xs text-muted-foreground">{r.student.class?.name}</p>
                  </div>
                  <div className="text-right text-sm">
                    <span className="font-bold">{Number(r.totalScore)}/{Number(r.totalMax)}</span>
                    <span className="text-muted-foreground ml-1 text-xs">{Number(r.percentage).toFixed(1)}%</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
