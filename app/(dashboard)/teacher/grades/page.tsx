import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { Card, CardContent } from '@/components/ui/card'
import { Award, Users, TrendingUp, BookOpen } from 'lucide-react'
import { TeacherGradesFilters } from './teacher-grades-filters'
import { TeacherGradesTable } from './teacher-grades-table'
import { getCurrentAcademicYear } from '@/lib/utils'

type SearchParams = {
  date?: string
  period?: 'day' | 'week' | 'month'
  classId?: string
  subjectId?: string
  timeSlot?: string
}

export default async function TeacherGradesPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'TEACHER') {
    redirect('/unauthorized')
  }

  const tenantId = session.user.tenantId!

  // Get teacher
  const teacher = await db.teacher.findFirst({
    where: { userId: session.user.id }
  })

  if (!teacher) {
    redirect('/unauthorized')
  }

  // Get teacher's classes and subjects from Schedule (constructor-based)
  const teacherSchedules = await db.schedule.findMany({
    where: {
      tenantId,
      teacherId: teacher.id,
      academicYear: getCurrentAcademicYear(),
      type: 'LESSON'
    },
    include: {
      class: true,
      subject: true
    },
    distinct: ['classId', 'subjectId']
  })

  // Extract unique classes and subjects (filter out nulls)
  const classes = Array.from(
    new Map(
      teacherSchedules
        .filter(s => s.class !== null)
        .map(s => [s.classId, s.class!])
    ).values()
  )

  const subjects = Array.from(
    new Map(
      teacherSchedules
        .filter(s => s.subject !== null)
        .map(s => [s.subjectId, s.subject!])
    ).values()
  )

  // Get unique time slots from teacher's schedule
  const timeSlots = await db.schedule.findMany({
    where: {
      tenantId,
      teacherId: teacher.id,
      academicYear: getCurrentAcademicYear(),
      type: 'LESSON'
    },
    select: {
      startTime: true,
      endTime: true
    },
    distinct: ['startTime', 'endTime'],
    orderBy: { startTime: 'asc' }
  })

  // Parse filters
  const period = searchParams.period || 'day'
  const selectedDate = searchParams.date ? new Date(searchParams.date) : new Date()
  selectedDate.setHours(0, 0, 0, 0)

  // Calculate date range based on period
  let startDate = new Date(selectedDate)
  let endDate = new Date(selectedDate)

  if (period === 'week') {
    const dayOfWeek = startDate.getDay()
    const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1
    startDate.setDate(startDate.getDate() - diff)
    endDate = new Date(startDate)
    endDate.setDate(endDate.getDate() + 6)
  } else if (period === 'month') {
    startDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1)
    endDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0)
  }

  endDate.setHours(23, 59, 59, 999)

  // Build where clause for grades
  const whereClause: any = {
    tenantId,
    teacherId: teacher.id,
    date: {
      gte: startDate,
      lte: endDate
    }
  }

  if (searchParams.classId && searchParams.classId !== 'all') {
    whereClause.student = {
      classId: searchParams.classId
    }
  }

  if (searchParams.subjectId && searchParams.subjectId !== 'all') {
    whereClause.subjectId = searchParams.subjectId
  }

  if (searchParams.timeSlot && searchParams.timeSlot !== 'all') {
    whereClause.startTime = searchParams.timeSlot
  }

  // Get grade records
  const gradeRecords = await db.grade.findMany({
    where: whereClause,
    include: {
      student: {
        include: {
          user: {
            select: { fullName: true, avatar: true }
          },
          class: {
            select: { name: true }
          }
        }
      },
      subject: {
        select: { name: true }
      }
    },
    orderBy: [
      { date: 'desc' },
      { startTime: 'asc' }
    ]
  })

  // Filter out records with null user or class (safety check)
  type GradeWithRelations = typeof gradeRecords[0] & {
    student: {
      user: { fullName: string; avatar: string | null }
      class: { name: string }
    } & typeof gradeRecords[0]['student']
  }

  const gradesFiltered = gradeRecords.filter(
    (record): record is GradeWithRelations => 
      record.student.user !== null && record.student.class !== null
  )

  // Convert Decimal to number for client component
  const grades = gradesFiltered.map(grade => ({
    ...grade,
    score: Number(grade.score),
    maxScore: Number(grade.maxScore),
    percentage: Number(grade.percentage),
    type: grade.type || 'ORAL',
    comments: grade.comments || null
  }))

  // Calculate statistics
  const totalRecords = grades.length
  const averageScore = totalRecords > 0 
    ? (grades.reduce((sum, g) => sum + g.percentage, 0) / totalRecords).toFixed(1)
    : '0'
  const excellentCount = grades.filter(g => g.percentage >= 85).length
  const goodCount = grades.filter(g => g.percentage >= 70 && g.percentage < 85).length

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          Baholar
        </h1>
        <p className="text-lg text-muted-foreground">
          O'quvchilar baholarini boshqaring va hisobot oling
        </p>
      </div>

      {/* Filters */}
      <TeacherGradesFilters 
        classes={classes}
        subjects={subjects}
        timeSlots={timeSlots}
      />

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-none shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 card-hover">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg">
                <BookOpen className="h-6 w-6" />
              </div>
              <div>
                <div className="text-3xl font-bold text-blue-600">{totalRecords}</div>
                <p className="text-sm text-muted-foreground font-medium">Jami baholar</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 card-hover">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-lg">
                <Award className="h-6 w-6" />
              </div>
              <div>
                <div className="text-3xl font-bold text-green-600">{excellentCount}</div>
                <p className="text-sm text-muted-foreground font-medium">A'lo (85%+)</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20 card-hover">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-600 text-white shadow-lg">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <div className="text-3xl font-bold text-yellow-600">{goodCount}</div>
                <p className="text-sm text-muted-foreground font-medium">Yaxshi (70-84%)</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 card-hover">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 text-white shadow-lg">
                <TrendingUp className="h-6 w-6" />
              </div>
              <div>
                <div className="text-3xl font-bold text-purple-600">{averageScore}%</div>
                <p className="text-sm text-muted-foreground font-medium">O'rtacha</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Grades Table */}
      <TeacherGradesTable 
        grades={grades}
        startDate={startDate}
        endDate={endDate}
      />
    </div>
  )
}

