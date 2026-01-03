import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Users, Download, FileText, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { ExportButtons } from './export-buttons'

// Cache for 5 minutes (reports change slowly) ⚡
export const revalidate = 300

export default async function StudentsReportPage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'ADMIN') {
    redirect('/unauthorized')
  }

  const tenantId = session.user.tenantId!

  // Get all students
  const students = await db.student.findMany({
    where: { tenantId },
    include: {
      user: {
        select: { fullName: true, email: true, phone: true, isActive: true }
      },
      class: {
        select: { name: true, gradeLevel: true }
      },
      parents: {
        include: {
          parent: {
            include: {
              user: {
                select: { fullName: true, phone: true }
              }
            }
          }
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  // Statistics
  const totalStudents = students.length
  const activeStudents = students.filter(s => s.user?.isActive).length
  const inactiveStudents = totalStudents - activeStudents
  const withParents = students.filter(s => s.parents.length > 0).length
  const withoutParents = totalStudents - withParents

  // Group by class
  const byClass = students.reduce((acc, student) => {
    const className = student.class?.name || 'Sinfga biriktirilmagan'
    if (!acc[className]) {
      acc[className] = 0
    }
    acc[className]++
    return acc
  }, {} as Record<string, number>)

  // Group by grade level
  const byGrade = students.reduce((acc, student) => {
    const grade = student.class?.gradeLevel || 0
    if (!acc[grade]) {
      acc[grade] = 0
    }
    acc[grade]++
    return acc
  }, {} as Record<number, number>)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">O'quvchilar Hisoboti</h1>
          <p className="text-muted-foreground">
            To'liq statistika va tahlil
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
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{totalStudents}</div>
                <p className="text-sm text-muted-foreground">Jami</p>
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
                <div className="text-2xl font-bold">{activeStudents}</div>
                <p className="text-sm text-muted-foreground">Faol</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-red-100 rounded-lg">
                <Users className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{inactiveStudents}</div>
                <p className="text-sm text-muted-foreground">Nofaol</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{withParents}</div>
                <p className="text-sm text-muted-foreground">Ota-onasi bor</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* By Class */}
      <Card>
        <CardHeader>
          <CardTitle>Sinflar bo'yicha</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(byClass).map(([className, count]) => (
              <div key={className} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-muted-foreground" />
                  <span className="font-medium">{className}</span>
                </div>
                <Badge variant="secondary">{count} o'quvchi</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* By Grade Level */}
      <Card>
        <CardHeader>
          <CardTitle>Daraja bo'yicha</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-4">
            {Object.entries(byGrade)
              .sort(([a], [b]) => Number(a) - Number(b))
              .map(([grade, count]) => (
                <div key={grade} className="p-4 border rounded-lg text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-1">
                    {grade === '0' ? '-' : grade}
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    {grade === '0' ? 'Biriktirilmagan' : `${grade}-sinf`}
                  </p>
                  <Badge variant="secondary">{count} ta</Badge>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Eksport qilish</CardTitle>
        </CardHeader>
        <CardContent>
          <ExportButtons
            students={students}
            byClass={byClass}
            byGrade={byGrade}
            stats={{
              total: totalStudents,
              active: activeStudents,
              inactive: inactiveStudents,
              withParents: withParents
            }}
          />
          <p className="text-sm text-muted-foreground mt-3">
            Hisobotni PDF yoki CSV formatida yuklab oling
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

