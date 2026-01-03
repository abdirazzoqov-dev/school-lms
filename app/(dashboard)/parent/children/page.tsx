import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Award, Calendar, DollarSign, User, BookOpen } from 'lucide-react'
import Link from 'next/link'

export default async function ParentChildrenPage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'PARENT') {
    redirect('/unauthorized')
  }

  const tenantId = session.user.tenantId!

  const parent = await db.parent.findUnique({
    where: { userId: session.user.id },
    include: {
      students: {
        include: {
          student: {
            include: {
              user: {
                select: {
                  fullName: true,
                  email: true
                }
              },
              class: {
                include: {
                  classTeacher: {
                    include: {
                      user: {
                        select: {
                          fullName: true,
                          phone: true
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  })

  if (!parent || parent.students.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Farzandlarim</h1>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <User className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-muted-foreground">
              Farzandlar ma'lumotlari topilmadi
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Get statistics for each child
  const childrenStats = await Promise.all(
    parent.students.map(async ({ student }) => {
      const [
        recentGrades,
        attendanceThisWeek,
        pendingPayments,
        averageGrade
      ] = await Promise.all([
        db.grade.findMany({
          where: {
            tenantId,
            studentId: student.id
          },
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: {
            subject: true
          }
        }),
        db.attendance.count({
          where: {
            tenantId,
            studentId: student.id,
            date: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
            },
            status: 'PRESENT'
          }
        }),
        db.payment.count({
          where: {
            tenantId,
            studentId: student.id,
            status: 'PENDING'
          }
        }),
        db.grade.findMany({
          where: {
            tenantId,
            studentId: student.id
          },
          select: {
            score: true,
            maxScore: true
          }
        })
      ])

      const avgGrade = averageGrade.length > 0
        ? averageGrade.reduce((acc, g) => {
            return acc + (Number(g.score) / Number(g.maxScore)) * 100
          }, 0) / averageGrade.length
        : 0

      return {
        student,
        recentGrades,
        attendanceThisWeek,
        pendingPayments,
        averageGrade: avgGrade
      }
    })
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Farzandlarim</h1>
        <p className="text-muted-foreground">
          Farzandlaringiz haqida batafsil ma'lumot
        </p>
      </div>

      <div className="grid gap-6">
        {childrenStats.map(({ student, recentGrades, attendanceThisWeek, pendingPayments, averageGrade }) => (
          <Card key={student.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-xl font-bold text-white">
                    {student.user?.fullName?.split(' ').map(n => n[0]).join('').toUpperCase() || '?'}
                  </div>
                  <div>
                    <CardTitle className="text-xl">{student.user?.fullName}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {student.class?.name || 'Sinf biriktirilmagan'} • {student.studentCode}
                    </p>
                    <div className="mt-2">
                      <span className={`inline-block rounded-full px-2 py-1 text-xs font-semibold ${
                        student.status === 'ACTIVE' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {student.status}
                      </span>
                    </div>
                  </div>
                </div>
                <Button asChild>
                  <Link href={`/parent/children/${student.id}`}>
                    Batafsil
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Quick Stats */}
              <div className="grid gap-4 md:grid-cols-4 mb-6">
                <div className="flex items-center gap-3 rounded-lg border p-3">
                  <Award className="h-8 w-8 text-green-600" />
                  <div>
                    <p className="text-2xl font-bold text-green-600">
                      {averageGrade.toFixed(1)}%
                    </p>
                    <p className="text-xs text-muted-foreground">O'rtacha</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-lg border p-3">
                  <Calendar className="h-8 w-8 text-blue-600" />
                  <div>
                    <p className="text-2xl font-bold">{attendanceThisWeek}</p>
                    <p className="text-xs text-muted-foreground">Bu hafta</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-lg border p-3">
                  <DollarSign className="h-8 w-8 text-orange-600" />
                  <div>
                    <p className="text-2xl font-bold text-orange-600">{pendingPayments}</p>
                    <p className="text-xs text-muted-foreground">To'lanmagan</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-lg border p-3">
                  <BookOpen className="h-8 w-8 text-purple-600" />
                  <div>
                    <p className="text-2xl font-bold">{recentGrades.length}</p>
                    <p className="text-xs text-muted-foreground">Oxirgi baho</p>
                  </div>
                </div>
              </div>

              {/* Recent Grades */}
              <div>
                <h4 className="text-sm font-medium mb-3">Oxirgi baholar:</h4>
                <div className="space-y-2">
                  {recentGrades.map((grade) => (
                    <div
                      key={grade.id}
                      className="flex items-center justify-between rounded-md border p-2 text-sm"
                    >
                      <span>{grade.subject.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">
                          {Number(grade.score)}/{Number(grade.maxScore)}
                        </span>
                        <span className={`inline-block h-2 w-2 rounded-full ${
                          (Number(grade.score) / Number(grade.maxScore)) >= 0.8
                            ? 'bg-green-500'
                            : (Number(grade.score) / Number(grade.maxScore)) >= 0.6
                            ? 'bg-yellow-500'
                            : 'bg-red-500'
                        }`} />
                      </div>
                    </div>
                  ))}
                  {recentGrades.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Hozircha baholar yo'q
                    </p>
                  )}
                </div>
              </div>

              {/* Class Teacher */}
              {student.class?.classTeacher && (
                <div className="mt-4 rounded-lg bg-muted p-3">
                  <p className="text-xs font-medium text-muted-foreground mb-1">
                    Sinf rahbari:
                  </p>
                  <p className="font-medium">
                    {student.class.classTeacher.user.fullName}
                  </p>
                  {student.class.classTeacher.user.phone && (
                    <p className="text-sm text-muted-foreground">
                      {student.class.classTeacher.user.phone}
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

