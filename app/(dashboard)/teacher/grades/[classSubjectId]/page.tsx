import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { GradeEntryForm } from './grade-entry-form'

export default async function GradeEntryPage({
  params,
}: {
  params: { classSubjectId: string }
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

  // Get class-subject with students
  const classSubject = await db.classSubject.findFirst({
    where: {
      id: params.classSubjectId,
      teacherId: teacher.id,
      tenantId
    },
    include: {
      class: {
        include: {
          students: {
            where: { status: 'ACTIVE' },
            include: {
              user: {
                select: {
                  fullName: true,
                  email: true
                }
              }
            },
            orderBy: {
              user: { fullName: 'asc' }
            }
          }
        }
      },
      subject: true
    }
  })

  if (!classSubject) {
    redirect('/teacher/grades')
  }

  // Get recent grades for this class-subject
  const recentGrades = await db.grade.findMany({
    where: {
      subjectId: classSubject.subjectId,
      student: {
        classId: classSubject.classId
      }
    },
    take: 20,
    orderBy: { date: 'desc' },
    include: {
      student: {
        include: {
          user: {
            select: { fullName: true }
          }
        }
      }
    }
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/teacher/grades">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Orqaga
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">
            {classSubject.class.name} - {classSubject.subject.name}
          </h1>
          <p className="text-muted-foreground">
            {classSubject.class.students.length} ta o'quvchi
          </p>
        </div>
      </div>

      {/* Grade Entry Form */}
      <Card>
        <CardHeader>
          <CardTitle>Baho kiriting</CardTitle>
        </CardHeader>
        <CardContent>
          <GradeEntryForm
            classSubject={classSubject}
            students={classSubject.class.students}
          />
        </CardContent>
      </Card>

      {/* Recent Grades */}
      {recentGrades.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Oxirgi baholar</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border overflow-x-auto">
              <table className="w-full">
                <thead className="border-b bg-muted/50">
                  <tr>
                    <th className="p-4 text-left text-sm font-medium">O'quvchi</th>
                    <th className="p-4 text-left text-sm font-medium">Turi</th>
                    <th className="p-4 text-left text-sm font-medium">Ball</th>
                    <th className="p-4 text-left text-sm font-medium">Foiz</th>
                    <th className="p-4 text-left text-sm font-medium">Sana</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {recentGrades.map((grade) => {
                    const percentage = (grade.score / grade.maxScore) * 100
                    return (
                      <tr key={grade.id} className="hover:bg-muted/50">
                        <td className="p-4">
                          <div className="font-medium">{grade.student.user?.fullName || 'N/A'}</div>
                        </td>
                        <td className="p-4">
                          <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                            {grade.gradeType}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className="font-mono">{grade.score}/{grade.maxScore}</span>
                        </td>
                        <td className="p-4">
                          <span className={`font-bold ${
                            percentage >= 70 ? 'text-green-600' :
                            percentage >= 40 ? 'text-orange-600' :
                            'text-red-600'
                          }`}>
                            {percentage.toFixed(0)}%
                          </span>
                        </td>
                        <td className="p-4 text-sm text-muted-foreground">
                          {new Date(grade.date).toLocaleDateString('uz-UZ')}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

