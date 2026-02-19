import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Award, Download, ArrowLeft, TrendingUp, BarChart3
} from 'lucide-react'
import Link from 'next/link'

export const revalidate = 0
export const dynamic = 'force-dynamic'

export default async function GradesReportPage({
  searchParams
}: {
  searchParams: { classId?: string; subjectId?: string }
}) {
  const session = await getServerSession(authOptions)

  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'MODERATOR')) {
    redirect('/unauthorized')
  }

  const tenantId = session.user.tenantId!
  
  // Build where clause
  const where: any = { tenantId }
  if (searchParams.classId) where.student = { classId: searchParams.classId }
  if (searchParams.subjectId) where.subjectId = searchParams.subjectId

  // Get grades
  const grades = await db.grade.findMany({
    where,
    include: {
      student: {
        include: {
          user: {
            select: {
              fullName: true
            }
          },
          class: {
            select: {
              name: true
            }
          }
        }
      },
      subject: {
        select: {
          name: true
        }
      },
      teacher: {
        include: {
          user: {
            select: {
              fullName: true
            }
          }
        }
      }
    },
    orderBy: {
      date: 'desc'
    }
  })

  // Get classes and subjects for filters
  const [classes, subjects] = await Promise.all([
    db.class.findMany({
      where: { tenantId },
      select: { id: true, name: true, gradeLevel: true },
      orderBy: { gradeLevel: 'asc' }
    }),
    db.subject.findMany({
      where: { tenantId },
      select: { id: true, name: true },
      orderBy: { name: 'asc' }
    })
  ])

  // Calculate statistics
  const totalGrades = grades.length
  const avgScore = grades.length > 0 
    ? grades.reduce((sum, g) => sum + Number(g.score), 0) / grades.length
    : 0

  // Grade distribution
  const grade5 = grades.filter(g => Number(g.score) === 5).length
  const grade4 = grades.filter(g => Number(g.score) === 4).length
  const grade3 = grades.filter(g => Number(g.score) === 3).length
  const grade2 = grades.filter(g => Number(g.score) === 2).length

  const excellentRate = totalGrades > 0 ? (grade5 / totalGrades) * 100 : 0
  const qualityRate = totalGrades > 0 ? ((grade5 + grade4) / totalGrades) * 100 : 0

  // Group by subject
  const subjectStats = new Map<string, {
    subjectName: string
    count: number
    avgScore: number
    scores: number[]
  }>()

  grades.forEach(grade => {
    const subjectName = grade.subject.name
    const current = subjectStats.get(subjectName) || {
      subjectName,
      count: 0,
      avgScore: 0,
      scores: []
    }
    
    current.count++
    current.scores.push(Number(grade.score))
    
    subjectStats.set(subjectName, current)
  })

  const subjectAnalytics = Array.from(subjectStats.values()).map(stat => ({
    ...stat,
    avgScore: stat.scores.reduce((a, b) => a + b, 0) / stat.scores.length
  })).sort((a, b) => b.avgScore - a.avgScore)

  // Group by class
  const classStats = new Map<string, {
    className: string
    count: number
    avgScore: number
  }>()

  grades.forEach(grade => {
    const className = grade.student.class?.name || 'N/A'
    const current = classStats.get(className) || {
      className,
      count: 0,
      avgScore: 0
    }
    
    current.count++
    current.avgScore += Number(grade.score)
    
    classStats.set(className, current)
  })

  const classAnalytics = Array.from(classStats.values()).map(stat => ({
    ...stat,
    avgScore: stat.avgScore / stat.count
  })).sort((a, b) => b.avgScore - a.avgScore)

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/reports">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">Baholar Hisoboti</h1>
          <p className="text-muted-foreground">
            O'quvchilar baholari va o'rtacha ko'rsatkichlar
          </p>
        </div>
        <Button asChild className="bg-purple-600 hover:bg-purple-700">
          <Link href={`/api/admin/reports/grades/export?classId=${searchParams.classId || ''}&subjectId=${searchParams.subjectId || ''}`}>
            <Download className="mr-2 h-4 w-4" />
            Excel
          </Link>
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Jami Baholar</p>
                <p className="text-3xl font-bold text-purple-600">{totalGrades}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <Award className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">O'rtacha Baho</p>
                <p className="text-3xl font-bold text-blue-600">{avgScore.toFixed(2)}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-green-100">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">A'lo Ko'rsatkich</p>
                <p className="text-3xl font-bold text-green-600">{excellentRate.toFixed(1)}%</p>
                <p className="text-xs text-muted-foreground mt-1">{grade5} ta "5"</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <Award className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-orange-100">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Sifat Ko'rsatkich</p>
                <p className="text-3xl font-bold text-orange-600">{qualityRate.toFixed(1)}%</p>
                <p className="text-xs text-muted-foreground mt-1">"4" va "5"</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <BarChart3 className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Grade Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Baholar Taqsimoti</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold">5 (A'lo)</span>
                <Badge className="bg-green-600">{grade5} ({totalGrades > 0 ? ((grade5/totalGrades)*100).toFixed(1) : 0}%)</Badge>
              </div>
              <Progress value={totalGrades > 0 ? (grade5/totalGrades)*100 : 0} className="h-3 bg-gray-200" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold">4 (Yaxshi)</span>
                <Badge className="bg-blue-600">{grade4} ({totalGrades > 0 ? ((grade4/totalGrades)*100).toFixed(1) : 0}%)</Badge>
              </div>
              <Progress value={totalGrades > 0 ? (grade4/totalGrades)*100 : 0} className="h-3 bg-gray-200" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold">3 (Qoniqarli)</span>
                <Badge className="bg-yellow-600">{grade3} ({totalGrades > 0 ? ((grade3/totalGrades)*100).toFixed(1) : 0}%)</Badge>
              </div>
              <Progress value={totalGrades > 0 ? (grade3/totalGrades)*100 : 0} className="h-3 bg-gray-200" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold">2 (Qoniqarsiz)</span>
                <Badge className="bg-red-600">{grade2} ({totalGrades > 0 ? ((grade2/totalGrades)*100).toFixed(1) : 0}%)</Badge>
              </div>
              <Progress value={totalGrades > 0 ? (grade2/totalGrades)*100 : 0} className="h-3 bg-gray-200" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtrlar</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div>
              <p className="text-sm font-medium mb-2">Sinflar:</p>
              <div className="flex gap-2 flex-wrap">
                <Link href="/admin/reports/grades">
                  <Button variant={!searchParams.classId ? "default" : "outline"} size="sm">
                    Barchasi
                  </Button>
                </Link>
                {classes.map(cls => (
                  <Link key={cls.id} href={`/admin/reports/grades?classId=${cls.id}`}>
                    <Button variant={searchParams.classId === cls.id ? "default" : "outline"} size="sm">
                      {cls.name}
                    </Button>
                  </Link>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm font-medium mb-2">Fanlar:</p>
              <div className="flex gap-2 flex-wrap">
                {subjects.map(subject => (
                  <Link key={subject.id} href={`/admin/reports/grades?subjectId=${subject.id}`}>
                    <Button variant={searchParams.subjectId === subject.id ? "default" : "outline"} size="sm">
                      {subject.name}
                    </Button>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Subject Analytics */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Fanlar bo'yicha o'rtacha</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {subjectAnalytics.map(stat => (
                <div key={stat.subjectName} className="flex items-center justify-between">
                  <span className="font-medium">{stat.subjectName}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{stat.count} ta</Badge>
                    <Badge className={
                      stat.avgScore >= 4.5 ? 'bg-green-600' :
                      stat.avgScore >= 3.5 ? 'bg-blue-600' :
                      stat.avgScore >= 2.5 ? 'bg-yellow-600' : 'bg-red-600'
                    }>
                      {stat.avgScore.toFixed(2)}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sinflar bo'yicha o'rtacha</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {classAnalytics.map(stat => (
                <div key={stat.className} className="flex items-center justify-between">
                  <span className="font-medium">{stat.className}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{stat.count} ta</Badge>
                    <Badge className={
                      stat.avgScore >= 4.5 ? 'bg-green-600' :
                      stat.avgScore >= 3.5 ? 'bg-blue-600' :
                      stat.avgScore >= 2.5 ? 'bg-yellow-600' : 'bg-red-600'
                    }>
                      {stat.avgScore.toFixed(2)}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
