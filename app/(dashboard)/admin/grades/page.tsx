import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Award, Plus, TrendingUp, BarChart3, GraduationCap, FileText } from 'lucide-react'
import Link from 'next/link'
import { GradesFilters } from './grades-filters'
import { GradesTable } from './grades-table'

interface SearchParams {
  date?: string
  period?: 'day' | 'week' | 'month'
  classId?: string
  groupId?: string
  subjectId?: string
  quarter?: string
  gradeType?: string
  timeSlot?: string
}

// Optimized caching: Cache for 30 seconds for grades data ⚡
export const revalidate = 30
export const dynamic = 'auto' // Allows Next.js to optimize route caching

export default async function GradesPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const session = await getServerSession(authOptions)

  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'MODERATOR')) {
    redirect('/unauthorized')
  }

  const tenantId = session.user.tenantId!
  const timeSlot = searchParams.timeSlot

  // Default to today
  const selectedDate = searchParams.date || new Date().toISOString().split('T')[0]
  const period = searchParams.period || 'day'

  // Calculate date range based on period
  let startDate: Date
  let endDate: Date

  const baseDate = new Date(selectedDate)
  
  if (period === 'week') {
    // Get week start (Monday)
    const day = baseDate.getDay()
    const diff = baseDate.getDate() - day + (day === 0 ? -6 : 1)
    startDate = new Date(baseDate.setDate(diff))
    endDate = new Date(startDate)
    endDate.setDate(startDate.getDate() + 6)
  } else if (period === 'month') {
    startDate = new Date(baseDate.getFullYear(), baseDate.getMonth(), 1)
    endDate = new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, 0)
  } else {
    startDate = baseDate
    endDate = baseDate
  }

  // Build where clause
  const whereClause: any = {
    tenantId,
    date: {
      gte: startDate,
      lte: endDate,
    },
  }

  if (searchParams.classId) {
    whereClause.student = { classId: searchParams.classId }
  }

  if (searchParams.groupId) {
    whereClause.groupId = searchParams.groupId
  }

  if (searchParams.subjectId) {
    whereClause.subjectId = searchParams.subjectId
  }

  if (searchParams.quarter) {
    whereClause.quarter = parseInt(searchParams.quarter)
  }

  if (searchParams.gradeType) {
    whereClause.gradeType = searchParams.gradeType
  }

  // Get unique dates in range for day/week/month view
  const uniqueDates: string[] = []
  if (period === 'day') {
    uniqueDates.push(selectedDate)
  } else if (period === 'week') {
    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate)
      date.setDate(startDate.getDate() + i)
      uniqueDates.push(date.toISOString().split('T')[0])
    }
  } else {
    const daysInMonth = new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, 0).getDate()
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(baseDate.getFullYear(), baseDate.getMonth(), i)
      uniqueDates.push(date.toISOString().split('T')[0])
    }
  }

  // Get grades
  const [grades, classes, groups, subjects, schedules] = await Promise.all([
    db.grade.findMany({
      where: whereClause,
      include: {
        student: {
          include: {
            user: {
              select: {
                fullName: true,
              },
            },
            class: {
              select: {
                name: true,
              },
            },
          },
        },
        subject: {
          select: {
            name: true,
            code: true,
          },
        },
        teacher: {
          include: {
            user: {
              select: {
                fullName: true,
              },
            },
          },
        },
        group: {
          select: {
            name: true,
          },
        },
      },
      orderBy: [
        { date: 'desc' },
        { student: { user: { fullName: 'asc' } } },
      ],
    }),
    db.class.findMany({
      where: { tenantId },
      select: {
        id: true,
        name: true,
        _count: { select: { students: true } },
      },
      orderBy: { name: 'asc' },
    }),
    db.group.findMany({
      where: { tenantId },
      select: {
        id: true,
        name: true,
        _count: { select: { students: true } },
      },
      orderBy: { name: 'asc' },
    }),
    db.subject.findMany({
      where: { tenantId },
      select: {
        id: true,
        name: true,
        code: true,
      },
      orderBy: { name: 'asc' },
    }),
    db.schedule.findMany({
      where: { tenantId, type: 'LESSON' },
      select: { id: true, startTime: true, endTime: true },
      distinct: ['startTime', 'endTime'],
      orderBy: { startTime: 'asc' },
    }),
  ])

  // Process time slots from schedules
  const uniqueTimeSlots = Array.from(new Set(schedules.map(s => `${s.startTime}-${s.endTime}`)))
    .sort()
    .map((slot, index) => ({
      label: slot,
      value: slot,
      lessonNumber: index + 1,
    }))

  // Filter grades by time slot if selected
  let filteredGrades = grades
  if (timeSlot) {
    const [startTime, endTime] = timeSlot.split('-')
    filteredGrades = grades.filter(grade => 
      grade.startTime === startTime && grade.endTime === endTime
    )
  }

  // Calculate statistics
  const totalGrades = filteredGrades.length
  const averageScore = totalGrades > 0
    ? filteredGrades.reduce((sum, g) => sum + Number(g.score), 0) / totalGrades
    : 0
  
  const excellentGrades = filteredGrades.filter(g => Number(g.percentage) >= 90).length
  const goodGrades = filteredGrades.filter(g => Number(g.percentage) >= 70 && Number(g.percentage) < 90).length
  const satisfactoryGrades = filteredGrades.filter(g => Number(g.percentage) >= 60 && Number(g.percentage) < 70).length
  const failingGrades = filteredGrades.filter(g => Number(g.percentage) < 60).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Award className="h-8 w-8 text-yellow-500" />
            Baholash Tizimi
          </h1>
          <p className="text-muted-foreground mt-1">
            O'quvchilar baholari va akademik ko'rsatkichlar
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/admin/grades/mark">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Baho Qo'yish
            </Button>
          </Link>
          <Link href="/admin/grades/reports">
            <Button variant="outline" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Hisobotlar
            </Button>
          </Link>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-800">
              Jami Baholar
            </CardTitle>
            <Award className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-700">{totalGrades}</div>
            <p className="text-xs text-blue-600 mt-1">
              {period === 'day' ? selectedDate : period === 'week' ? 'Haftalik' : 'Oylik'}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-800">
              A'lo (5)
            </CardTitle>
            <GraduationCap className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-700">{excellentGrades}</div>
            <p className="text-xs text-green-600 mt-1">
              {totalGrades > 0 ? ((excellentGrades / totalGrades) * 100).toFixed(1) : 0}%
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-800">
              Yaxshi (4)
            </CardTitle>
            <GraduationCap className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-700">{goodGrades}</div>
            <p className="text-xs text-blue-600 mt-1">
              {totalGrades > 0 ? ((goodGrades / totalGrades) * 100).toFixed(1) : 0}%
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-800">
              Qoniqarli (3)
            </CardTitle>
            <GraduationCap className="h-5 w-5 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-700">{satisfactoryGrades}</div>
            <p className="text-xs text-orange-600 mt-1">
              {totalGrades > 0 ? ((satisfactoryGrades / totalGrades) * 100).toFixed(1) : 0}%
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-800">
              O'rtacha Ball
            </CardTitle>
            <TrendingUp className="h-5 w-5 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-700">
              {averageScore.toFixed(1)}
            </div>
            <p className="text-xs text-purple-600 mt-1">
              100 balldan
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <GradesFilters
        classes={classes}
        groups={groups}
        subjects={subjects}
        timeSlots={uniqueTimeSlots}
        searchParams={searchParams}
        selectedDate={selectedDate}
        period={period}
      />

      {/* Grades Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Baholar Ro'yxati</CardTitle>
              <CardDescription>
                Barcha baholar va ko'rsatkichlar
              </CardDescription>
            </div>
            {grades.length > 0 && (
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span>A'lo (90-100%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                  <span>Yaxshi (70-89%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-orange-500" />
                  <span>Qoniqarli (60-69%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <span>Qoniqarsiz ({'<'}60%)</span>
                </div>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <GradesTable grades={filteredGrades} />
        </CardContent>
      </Card>
    </div>
  )
}

