import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, BookOpen, Award } from 'lucide-react'
import Link from 'next/link'

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

  // Get recent grades
  const recentGrades = await db.grade.findMany({
    where: { 
      teacherId: teacher.id,
      tenantId 
    },
    take: 10,
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
                <div className="text-2xl font-bold">{recentGrades.length}</div>
                <p className="text-sm text-muted-foreground">Oxirgi baholar</p>
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

      {/* Classes and Subjects */}
      <Card>
        <CardHeader>
          <CardTitle>Mening sinf-fanlarim</CardTitle>
        </CardHeader>
        <CardContent>
          {teacher.classSubjects.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Sizga hech qanday sinf-fan biriktirilmagan
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {teacher.classSubjects.map((cs) => (
                <Card key={cs.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-lg">{cs.class.name}</h3>
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          {cs.class._count.students} o'quvchi
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{cs.subject.name}</p>
                      <div className="flex gap-2 mt-4">
                        <Link href={`/teacher/grades/${cs.id}`} className="flex-1">
                          <Button className="w-full" size="sm">
                            <Award className="mr-2 h-4 w-4" />
                            Baho kiriting
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Grades */}
      {recentGrades.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Oxirgi kiritilgan baholar</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border overflow-x-auto">
              <table className="w-full">
                <thead className="border-b bg-muted/50">
                  <tr>
                    <th className="p-4 text-left text-sm font-medium">O'quvchi</th>
                    <th className="p-4 text-left text-sm font-medium">Sinf</th>
                    <th className="p-4 text-left text-sm font-medium">Fan</th>
                    <th className="p-4 text-left text-sm font-medium">Turi</th>
                    <th className="p-4 text-left text-sm font-medium">Ball</th>
                    <th className="p-4 text-left text-sm font-medium">Sana</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {recentGrades.map((grade) => (
                    <tr key={grade.id} className="hover:bg-muted/50">
                      <td className="p-4">
                        <div className="font-medium">{grade.student.user?.fullName || 'N/A'}</div>
                      </td>
                      <td className="p-4">{grade.student.class?.name || '-'}</td>
                      <td className="p-4">{grade.subject.name}</td>
                      <td className="p-4">
                        <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                          {grade.gradeType}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`font-bold ${
                          (Number(grade.score) / Number(grade.maxScore)) >= 0.7 ? 'text-green-600' :
                          (Number(grade.score) / Number(grade.maxScore)) >= 0.4 ? 'text-orange-600' :
                          'text-red-600'
                        }`}>
                          {Number(grade.score)}/{Number(grade.maxScore)}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-muted-foreground">
                        {new Date(grade.date).toLocaleDateString('uz-UZ')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

