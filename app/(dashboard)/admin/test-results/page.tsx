import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ClipboardList, Plus, TrendingUp, Award, Target, BarChart3, Users } from 'lucide-react'
import Link from 'next/link'
import { PermissionGate } from '@/components/admin/permission-gate'
import { TestResultsTable } from './test-results-table'
import { formatNumber } from '@/lib/utils'

export const revalidate = 0
export const dynamic = 'force-dynamic'

export default async function TestResultsPage({
  searchParams
}: {
  searchParams: {
    search?: string
    subjectId?: string
    classId?: string
    groupId?: string
    quarter?: string
    gradeType?: string
    month?: string
    year?: string
  }
}) {
  const session = await getServerSession(authOptions)

  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'MODERATOR')) {
    redirect('/unauthorized')
  }

  const tenantId = session.user.tenantId!
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1

  // Build where clause
  const where: any = {
    tenantId,
    gradeType: { in: ['TEST', 'EXAM'] }
  }

  if (searchParams.gradeType && (searchParams.gradeType === 'TEST' || searchParams.gradeType === 'EXAM')) {
    where.gradeType = searchParams.gradeType
  }
  if (searchParams.subjectId) where.subjectId = searchParams.subjectId
  if (searchParams.quarter) where.quarter = parseInt(searchParams.quarter)
  if (searchParams.classId) {
    where.student = { classId: searchParams.classId }
  }
  if (searchParams.groupId) {
    where.groupId = searchParams.groupId
  }
  if (searchParams.year) {
    where.academicYear = searchParams.year
  }
  if (searchParams.search) {
    where.student = {
      ...where.student,
      user: {
        fullName: { contains: searchParams.search, mode: 'insensitive' }
      }
    }
  }

  const [testResults, subjects, classes, groups] = await Promise.all([
    db.grade.findMany({
      where,
      include: {
        student: {
          include: {
            user: { select: { fullName: true, avatar: true } },
            class: { select: { id: true, name: true } }
          }
        },
        subject: { select: { id: true, name: true, color: true } },
        teacher: {
          include: { user: { select: { fullName: true } } }
        }
      },
      orderBy: { date: 'desc' },
      take: 500
    }),
    db.subject.findMany({ where: { tenantId }, select: { id: true, name: true }, orderBy: { name: 'asc' } }),
    db.class.findMany({ where: { tenantId }, select: { id: true, name: true }, orderBy: { name: 'asc' } }),
    db.group.findMany({ where: { tenantId }, select: { id: true, name: true }, orderBy: { name: 'asc' } }),
  ])

  // Stats
  const totalTests = testResults.length
  const avgScore = totalTests > 0
    ? testResults.reduce((sum, g) => sum + (g.percentage ? Number(g.percentage) : (Number(g.score) / Number(g.maxScore) * 100)), 0) / totalTests
    : 0

  const passCount = testResults.filter(g => {
    const pct = g.percentage ? Number(g.percentage) : (Number(g.score) / Number(g.maxScore) * 100)
    return pct >= 60
  }).length
  const passRate = totalTests > 0 ? (passCount / totalTests) * 100 : 0

  const thisMonthCount = testResults.filter(g => {
    const d = new Date(g.date)
    return d.getFullYear() === currentYear && d.getMonth() + 1 === currentMonth
  }).length

  const excellentCount = testResults.filter(g => {
    const pct = g.percentage ? Number(g.percentage) : (Number(g.score) / Number(g.maxScore) * 100)
    return pct >= 90
  }).length

  // Serialize for client
  const serialized = testResults.map(g => ({
    ...g,
    score: Number(g.score),
    maxScore: Number(g.maxScore),
    percentage: g.percentage ? Number(g.percentage) : null,
    date: g.date.toISOString(),
    createdAt: g.createdAt.toISOString(),
    updatedAt: g.updatedAt.toISOString(),
  }))

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-600 p-8 text-white shadow-2xl">
        <div className="absolute inset-0 bg-black/10" />
        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                <ClipboardList className="h-8 w-8" />
              </div>
              <h1 className="text-4xl font-bold">Test Natijalari</h1>
            </div>
            <p className="text-violet-100 text-lg">
              O'quvchilarning test va imtihon natijalarini boshqarish va kuzatish
            </p>
          </div>
          <PermissionGate resource="grades" action="CREATE">
            <Button
              asChild
              size="lg"
              className="bg-white text-violet-600 hover:bg-violet-50 shadow-lg hover:shadow-xl transition-all"
            >
              <Link href="/admin/test-results/create">
                <Plus className="mr-2 h-5 w-5" />
                Natija Kiritish
              </Link>
            </Button>
          </PermissionGate>
        </div>
        <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -left-8 -bottom-8 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-2 border-violet-200 dark:border-violet-800 bg-gradient-to-br from-violet-50 to-violet-100 dark:from-violet-950 dark:to-violet-900/80 hover:shadow-lg transition-all group">
          <CardContent className="pt-5">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2.5 bg-violet-500 rounded-xl group-hover:scale-110 transition-transform">
                <ClipboardList className="h-5 w-5 text-white" />
              </div>
              <Badge className="bg-violet-100 dark:bg-violet-900/60 text-violet-700 dark:text-violet-300 border-0 text-xs">
                Jami
              </Badge>
            </div>
            <p className="text-sm text-violet-600 dark:text-violet-400 font-medium">Jami Natijalar</p>
            <p className="text-3xl font-bold text-violet-700 dark:text-violet-300">{formatNumber(totalTests)}</p>
            <p className="text-xs text-violet-600/70 dark:text-violet-400/70 mt-1">ta test / imtihon</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900/80 hover:shadow-lg transition-all group">
          <CardContent className="pt-5">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2.5 bg-blue-500 rounded-xl group-hover:scale-110 transition-transform">
                <BarChart3 className="h-5 w-5 text-white" />
              </div>
              <Badge className="bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 border-0 text-xs">
                O'rtacha
              </Badge>
            </div>
            <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">O'rtacha Ball</p>
            <p className="text-3xl font-bold text-blue-700 dark:text-blue-300">{avgScore.toFixed(1)}%</p>
            <p className="text-xs text-blue-600/70 dark:text-blue-400/70 mt-1">barcha natijalar bo'yicha</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-green-200 dark:border-green-800 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900/80 hover:shadow-lg transition-all group">
          <CardContent className="pt-5">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2.5 bg-green-500 rounded-xl group-hover:scale-110 transition-transform">
                <Target className="h-5 w-5 text-white" />
              </div>
              <Badge className="bg-green-100 dark:bg-green-900/60 text-green-700 dark:text-green-300 border-0 text-xs">
                O'tish
              </Badge>
            </div>
            <p className="text-sm text-green-600 dark:text-green-400 font-medium">O'tish Foizi</p>
            <p className="text-3xl font-bold text-green-700 dark:text-green-300">{passRate.toFixed(1)}%</p>
            <p className="text-xs text-green-600/70 dark:text-green-400/70 mt-1">{passCount} ta o'tdi (≥60%)</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-amber-200 dark:border-amber-800 bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950 dark:to-amber-900/80 hover:shadow-lg transition-all group">
          <CardContent className="pt-5">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2.5 bg-amber-500 rounded-xl group-hover:scale-110 transition-transform">
                <Award className="h-5 w-5 text-white" />
              </div>
              <Badge className="bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 border-0 text-xs">
                A'lo
              </Badge>
            </div>
            <p className="text-sm text-amber-600 dark:text-amber-400 font-medium">A'lo Natijalar</p>
            <p className="text-3xl font-bold text-amber-700 dark:text-amber-300">{excellentCount}</p>
            <p className="text-xs text-amber-600/70 dark:text-amber-400/70 mt-1">ta natija (≥90%)</p>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card className="border-2">
        <CardHeader className="bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <div className="h-8 w-1 bg-gradient-to-b from-violet-600 to-purple-600 rounded-full" />
                Test Natijalari Ro'yxati
              </CardTitle>
              <CardDescription className="mt-1">
                {totalTests} ta natija • Test va imtihon natijalari
              </CardDescription>
            </div>
            <PermissionGate resource="grades" action="CREATE">
              <Button asChild size="sm" className="bg-violet-600 hover:bg-violet-700">
                <Link href="/admin/test-results/create">
                  <Plus className="mr-1.5 h-4 w-4" />
                  Yangi Natija
                </Link>
              </Button>
            </PermissionGate>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <TestResultsTable
            results={serialized as any}
            subjects={subjects}
            classes={classes}
            groups={groups}
          />
        </CardContent>
      </Card>
    </div>
  )
}
