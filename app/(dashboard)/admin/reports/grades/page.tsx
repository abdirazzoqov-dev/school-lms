import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BarChart3, Download, FileText, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { GradeDistributionChart } from '@/components/charts/grade-distribution-chart'

// Cache for 5 minutes ⚡
export const revalidate = 300

export default async function GradesReportPage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'ADMIN') {
    redirect('/unauthorized')
  }

  const tenantId = session.user.tenantId!

  // Get grades data
  const grades = await db.grade.findMany({
    where: { tenantId },
    include: {
      student: {
        include: {
          user: { select: { fullName: true } },
          class: { select: { name: true } }
        }
      },
      teacher: {
        include: {
          user: { select: { fullName: true } }
        }
      },
      subject: {
        select: { name: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  // Statistics
  const totalGrades = grades.length
  const averageScore = totalGrades > 0
    ? (grades.reduce((sum, g) => sum + Number(g.score), 0) / totalGrades).toFixed(1)
    : '0'

  const grade5 = grades.filter(g => Number(g.score) >= 85).length
  const grade4 = grades.filter(g => Number(g.score) >= 70 && Number(g.score) < 85).length
  const grade3 = grades.filter(g => Number(g.score) >= 55 && Number(g.score) < 70).length
  const grade2 = grades.filter(g => Number(g.score) < 55).length

  // Chart data
  const gradeDistribution = [
    {
      range: '5 (85-100)',
      count: grade5,
      percentage: (grade5 / (totalGrades || 1)) * 100
    },
    {
      range: '4 (70-84)',
      count: grade4,
      percentage: (grade4 / (totalGrades || 1)) * 100
    },
    {
      range: '3 (55-69)',
      count: grade3,
      percentage: (grade3 / (totalGrades || 1)) * 100
    },
    {
      range: '2 (0-54)',
      count: grade2,
      percentage: (grade2 / (totalGrades || 1)) * 100
    },
  ]

  // By subject
  const bySubject = grades.reduce((acc, grade) => {
    const subjectName = grade.subject.name
    if (!acc[subjectName]) {
      acc[subjectName] = { count: 0, total: 0 }
    }
    acc[subjectName].count++
    acc[subjectName].total += Number(grade.score)
    return acc
  }, {} as Record<string, { count: number; total: number }>)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Baholar Hisoboti</h1>
          <p className="text-muted-foreground">
            To'liq baholar statistikasi
          </p>
        </div>
        <Link href="/admin/reports">
          <Button variant="outline">
            <FileText className="h-4 w-4 mr-2" />
            Orqaga
          </Button>
        </Link>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <BarChart3 className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{totalGrades}</div>
                <p className="text-sm text-muted-foreground">Jami baholar</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{averageScore}</div>
                <p className="text-sm text-muted-foreground">O'rtacha ball</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <BarChart3 className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{grade5}</div>
                <p className="text-sm text-muted-foreground">A'lo (5)</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-purple-100 rounded-lg">
                <BarChart3 className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{grade4}</div>
                <p className="text-sm text-muted-foreground">Yaxshi (4)</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      <GradeDistributionChart data={gradeDistribution} />

      {/* By Subject */}
      <Card>
        <CardHeader>
          <CardTitle>Fanlar bo'yicha</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(bySubject)
              .sort(([, a], [, b]) => (b.total / b.count) - (a.total / a.count))
              .map(([subject, data]) => {
                const average = (data.total / data.count).toFixed(1)
                return (
                  <div key={subject} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <BarChart3 className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <span className="font-medium">{subject}</span>
                        <p className="text-sm text-muted-foreground">{data.count} ta baho</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold">{average}</div>
                      <p className="text-sm text-muted-foreground">O'rtacha</p>
                    </div>
                  </div>
                )
              })}
          </div>
        </CardContent>
      </Card>

      {/* Grade Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Baholar taqsimoti</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="p-4 border rounded-lg bg-blue-50">
              <div className="text-3xl font-bold text-blue-600 mb-1">{grade5}</div>
              <p className="text-sm text-blue-800 mb-2">5 (A'lo)</p>
              <Badge className="bg-blue-600">{((grade5 / totalGrades) * 100).toFixed(1)}%</Badge>
            </div>
            <div className="p-4 border rounded-lg bg-green-50">
              <div className="text-3xl font-bold text-green-600 mb-1">{grade4}</div>
              <p className="text-sm text-green-800 mb-2">4 (Yaxshi)</p>
              <Badge className="bg-green-600">{((grade4 / totalGrades) * 100).toFixed(1)}%</Badge>
            </div>
            <div className="p-4 border rounded-lg bg-yellow-50">
              <div className="text-3xl font-bold text-yellow-600 mb-1">{grade3}</div>
              <p className="text-sm text-yellow-800 mb-2">3 (Qoniqarli)</p>
              <Badge className="bg-yellow-600">{((grade3 / totalGrades) * 100).toFixed(1)}%</Badge>
            </div>
            <div className="p-4 border rounded-lg bg-red-50">
              <div className="text-3xl font-bold text-red-600 mb-1">{grade2}</div>
              <p className="text-sm text-red-800 mb-2">2 (Qoniqarsiz)</p>
              <Badge className="bg-red-600">{((grade2 / totalGrades) * 100).toFixed(1)}%</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Eksport qilish</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Button>
              <Download className="h-4 w-4 mr-2" />
              PDF yuklab olish
            </Button>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Excel yuklab olish
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-3">
            Baholar hisobotini PDF yoki Excel formatida yuklab oling
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

