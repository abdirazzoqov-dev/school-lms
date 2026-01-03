import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Users, BookOpen, Calendar } from 'lucide-react'
import Link from 'next/link'

export default async function TeacherClassesPage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'TEACHER') {
    redirect('/unauthorized')
  }

  const tenantId = session.user.tenantId!

  const teacher = await db.teacher.findUnique({
    where: { userId: session.user.id },
    include: {
      classSubjects: {
        include: {
          class: {
            include: {
              students: {
                include: {
                  user: {
                    select: {
                      fullName: true
                    }
                  }
                }
              },
              _count: {
                select: {
                  students: true
                }
              }
            }
          },
          subject: true
        }
      }
    }
  })

  if (!teacher) {
    return <div>O'qituvchi ma'lumotlari topilmadi</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Mening Sinflarim</h1>
        <p className="text-muted-foreground">
          Siz o'qitayotgan barcha sinflar va o'quvchilar
        </p>
      </div>

      <div className="grid gap-6">
        {teacher.classSubjects.map((cs) => (
          <Card key={cs.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl">{cs.class.name}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {cs.subject.name} • {cs.hoursPerWeek} soat/hafta
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/teacher/attendance?classId=${cs.classId}&subjectId=${cs.subjectId}`}>
                      <Calendar className="mr-2 h-4 w-4" />
                      Davomat
                    </Link>
                  </Button>
                  <Button asChild size="sm">
                    <Link href={`/teacher/grades?classId=${cs.classId}&subjectId=${cs.subjectId}`}>
                      <BookOpen className="mr-2 h-4 w-4" />
                      Baholar
                    </Link>
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Class Stats */}
                <div className="flex gap-4">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      <span className="font-semibold">{cs.class._count.students}</span> o'quvchi
                    </span>
                  </div>
                  {cs.class.roomNumber && (
                    <div className="text-sm text-muted-foreground">
                      Xona: {cs.class.roomNumber}
                    </div>
                  )}
                </div>

                {/* Students List */}
                <div>
                  <h4 className="text-sm font-medium mb-3">O'quvchilar:</h4>
                  <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                    {cs.class.students.map((student) => (
                      <div
                        key={student.id}
                        className="flex items-center gap-2 rounded-md border p-2 text-sm"
                      >
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-white">
                          {student.user?.fullName?.split(' ').map(n => n[0]).join('').toUpperCase() || '?'}
                        </div>
                        <div className="flex-1 overflow-hidden">
                          <p className="truncate font-medium">
                            {student.user?.fullName || 'Noma\'lum'}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {student.studentCode}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                  {cs.class.students.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Bu sinfda hozircha o'quvchilar yo'q
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {teacher.classSubjects.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-muted-foreground mb-2">
              Sizga hozircha sinflar biriktirilmagan
            </p>
            <p className="text-sm text-muted-foreground">
              Administrator bilan bog'laning
            </p>
          </CardContent>
        </Card>
      )}

      {/* Summary Stats */}
      {teacher.classSubjects.length > 0 && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{teacher.classSubjects.length}</div>
              <p className="text-sm text-muted-foreground">Jami sinflar</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-green-600">
                {teacher.classSubjects.reduce((acc, cs) => acc + cs.class._count.students, 0)}
              </div>
              <p className="text-sm text-muted-foreground">Jami o'quvchilar</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-blue-600">
                {teacher.classSubjects.reduce((acc, cs) => acc + cs.hoursPerWeek, 0)}
              </div>
              <p className="text-sm text-muted-foreground">Soat/hafta</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

