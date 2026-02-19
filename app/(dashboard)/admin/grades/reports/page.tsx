import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, BarChart3, TrendingUp, Award } from 'lucide-react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'

export const revalidate = 30 // Optimized for faster loads
export const dynamic = 'auto' // Optimized for better caching

export default async function GradesReportsPage() {
  const session = await getServerSession(authOptions)

  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'MODERATOR')) {
    redirect('/unauthorized')
  }

  const tenantId = session.user.tenantId!

  // Current academic year
  const currentYear = new Date().getFullYear()
  const currentMonth = new Date().getMonth()
  const academicYear = `${currentMonth >= 8 ? currentYear : currentYear - 1}-${currentMonth >= 8 ? currentYear + 1 : currentYear}`

  // Get all grades for current year
  const grades = await db.grade.findMany({
    where: {
      tenantId,
      academicYear,
    },
    include: {
      student: {
        include: {
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
        },
      },
    },
  })

  // Overall statistics
  const totalGrades = grades.length
  const averageScore = totalGrades > 0
    ? grades.reduce((sum, g) => sum + Number(g.score), 0) / totalGrades
    : 0
  const averagePercentage = totalGrades > 0
    ? grades.reduce((sum, g) => sum + Number(g.percentage), 0) / totalGrades
    : 0

  const excellentGrades = grades.filter(g => Number(g.percentage) >= 90).length
  const goodGrades = grades.filter(g => Number(g.percentage) >= 70 && Number(g.percentage) < 90).length
  const satisfactoryGrades = grades.filter(g => Number(g.percentage) >= 60 && Number(g.percentage) < 70).length
  const failingGrades = grades.filter(g => Number(g.percentage) < 60).length

  // Group by class
  const byClass = grades.reduce((acc, grade) => {
    const className = grade.student.class?.name || 'No Class'
    if (!acc[className]) {
      acc[className] = {
        total: 0,
        totalScore: 0,
        totalPercentage: 0,
        excellent: 0,
        good: 0,
        satisfactory: 0,
        failing: 0,
      }
    }
    
    const percentage = Number(grade.percentage)
    acc[className].total++
    acc[className].totalScore += Number(grade.score)
    acc[className].totalPercentage += percentage
    
    if (percentage >= 90) acc[className].excellent++
    else if (percentage >= 70) acc[className].good++
    else if (percentage >= 60) acc[className].satisfactory++
    else acc[className].failing++
    
    return acc
  }, {} as Record<string, any>)

  // Group by subject
  const bySubject = grades.reduce((acc, grade) => {
    const subjectName = grade.subject.name
    if (!acc[subjectName]) {
      acc[subjectName] = {
        total: 0,
        totalScore: 0,
        totalPercentage: 0,
        excellent: 0,
        good: 0,
        satisfactory: 0,
        failing: 0,
      }
    }
    
    const percentage = Number(grade.percentage)
    acc[subjectName].total++
    acc[subjectName].totalScore += Number(grade.score)
    acc[subjectName].totalPercentage += percentage
    
    if (percentage >= 90) acc[subjectName].excellent++
    else if (percentage >= 70) acc[subjectName].good++
    else if (percentage >= 60) acc[subjectName].satisfactory++
    else acc[subjectName].failing++
    
    return acc
  }, {} as Record<string, any>)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/grades">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <BarChart3 className="h-8 w-8 text-blue-500" />
            Baholar Hisoboti
          </h1>
          <p className="text-muted-foreground mt-1">
            {academicYear} o'quv yili
          </p>
        </div>
      </div>

      {/* Overall Statistics */}
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
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-800">
              A'lo (5)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-700">{excellentGrades}</div>
            <p className="text-xs text-green-600">
              {totalGrades > 0 ? ((excellentGrades / totalGrades) * 100).toFixed(1) : 0}%
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-800">
              Yaxshi (4)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-700">{goodGrades}</div>
            <p className="text-xs text-blue-600">
              {totalGrades > 0 ? ((goodGrades / totalGrades) * 100).toFixed(1) : 0}%
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-800">
              Qoniqarli (3)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-700">{satisfactoryGrades}</div>
            <p className="text-xs text-orange-600">
              {totalGrades > 0 ? ((satisfactoryGrades / totalGrades) * 100).toFixed(1) : 0}%
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-800">
              O'rtacha Foiz
            </CardTitle>
            <TrendingUp className="h-5 w-5 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-700">
              {averagePercentage.toFixed(1)}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* By Class */}
      <Card>
        <CardHeader>
          <CardTitle>Sinflar Bo'yicha</CardTitle>
          <CardDescription>
            Har bir sinf bo'yicha baholash statistikasi
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(byClass)
              .sort((a, b) => (b[1].totalPercentage / b[1].total) - (a[1].totalPercentage / a[1].total))
              .map(([className, stats]: [string, any]) => {
                const avgPercentage = stats.total > 0 ? stats.totalPercentage / stats.total : 0

                return (
                  <div key={className} className="p-4 border rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-lg">{className}</h3>
                      <div className="flex items-center gap-4 text-sm">
                        <Badge className="bg-green-500">{stats.excellent} (5)</Badge>
                        <Badge className="bg-blue-500">{stats.good} (4)</Badge>
                        <Badge className="bg-orange-500">{stats.satisfactory} (3)</Badge>
                        {stats.failing > 0 && (
                          <Badge className="bg-red-500">{stats.failing} (2)</Badge>
                        )}
                        <span className="font-bold ml-4">{avgPercentage.toFixed(1)}%</span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className={`h-3 rounded-full ${
                          avgPercentage >= 90 ? 'bg-green-500' :
                          avgPercentage >= 70 ? 'bg-blue-500' :
                          avgPercentage >= 60 ? 'bg-orange-500' :
                          'bg-red-500'
                        }`}
                        style={{ width: `${avgPercentage}%` }}
                      />
                    </div>
                  </div>
                )
              })}
          </div>
        </CardContent>
      </Card>

      {/* By Subject */}
      <Card>
        <CardHeader>
          <CardTitle>Fanlar Bo'yicha</CardTitle>
          <CardDescription>
            Har bir fan bo'yicha baholash statistikasi
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(bySubject)
              .sort((a, b) => (b[1].totalPercentage / b[1].total) - (a[1].totalPercentage / a[1].total))
              .map(([subjectName, stats]: [string, any]) => {
                const avgPercentage = stats.total > 0 ? stats.totalPercentage / stats.total : 0

                return (
                  <div key={subjectName} className="p-4 border rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-lg">{subjectName}</h3>
                      <div className="flex items-center gap-4 text-sm">
                        <Badge className="bg-green-500">{stats.excellent} (5)</Badge>
                        <Badge className="bg-blue-500">{stats.good} (4)</Badge>
                        <Badge className="bg-orange-500">{stats.satisfactory} (3)</Badge>
                        {stats.failing > 0 && (
                          <Badge className="bg-red-500">{stats.failing} (2)</Badge>
                        )}
                        <span className="font-bold ml-4">{avgPercentage.toFixed(1)}%</span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className={`h-3 rounded-full ${
                          avgPercentage >= 90 ? 'bg-green-500' :
                          avgPercentage >= 70 ? 'bg-blue-500' :
                          avgPercentage >= 60 ? 'bg-orange-500' :
                          'bg-red-500'
                        }`}
                        style={{ width: `${avgPercentage}%` }}
                      />
                    </div>
                  </div>
                )
              })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

