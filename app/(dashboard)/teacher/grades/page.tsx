import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BookOpen, Award, Plus } from 'lucide-react'
import { GradesTable } from '@/components/teacher/grades-table'

export default async function TeacherGradesPage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'TEACHER') {
    redirect('/unauthorized')
  }

  const tenantId = session.user.tenantId!

  // Get teacher
  const teacher = await db.teacher.findFirst({
    where: { userId: session.user.id },
    include: {
      classSubjects: {
        include: {
          class: {
            include: {
              _count: {
                select: { students: true }
              }
            }
          },
          subject: true
        }
      }
    }
  })

  if (!teacher) {
    redirect('/unauthorized')
  }

  // Get all grades
  const gradesFromDb = await db.grade.findMany({
    where: { 
      teacherId: teacher.id,
      tenantId 
    },
    orderBy: { createdAt: 'desc' },
    include: {
      student: {
        include: {
          user: {
            select: { fullName: true }
          },
          class: {
            select: { name: true }
          }
        }
      },
      subject: {
        select: { name: true }
      }
    }
  })

  // Convert Decimal to number for client component
  const allGrades = gradesFromDb.map(grade => ({
    ...grade,
    score: Number(grade.score),
    maxScore: Number(grade.maxScore),
    percentage: Number(grade.percentage)
  }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Baholar</h1>
          <p className="text-muted-foreground">
            O'quvchilar baholarini kiriting va ko'ring
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <BookOpen className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{teacher.classSubjects.length}</div>
                <p className="text-sm text-muted-foreground">Sinf-fanlar</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <Award className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{allGrades.length}</div>
                <p className="text-sm text-muted-foreground">Jami baholar</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Plus className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {teacher.classSubjects.reduce((sum, cs) => sum + cs.class._count.students, 0)}
                </div>
                <p className="text-sm text-muted-foreground">Jami o'quvchilar</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* All Grades with Filters */}
      {allGrades.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Kiritilgan baholar</CardTitle>
          </CardHeader>
          <CardContent>
            <GradesTable grades={allGrades} />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Hali hech qanday baho kiritilmagan
          </CardContent>
        </Card>
      )}
    </div>
  )
}

