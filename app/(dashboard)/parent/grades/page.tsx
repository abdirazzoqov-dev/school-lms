import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Award, TrendingUp, TrendingDown, Minus } from 'lucide-react'

export default async function ParentGradesPage() {
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
                  fullName: true
                }
              },
              class: true,
              grades: {
                orderBy: { createdAt: 'desc' },
                include: {
                  subject: true,
                  teacher: {
                    include: {
                      user: {
                        select: {
                          fullName: true
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
        <h1 className="text-3xl font-bold">Baholar</h1>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Farzandlar topilmadi</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Group grades by subject for each student
  const studentsWithGrades = parent.students.map(({ student }) => {
    const gradesBySubject = student.grades.reduce((acc, grade) => {
      const subjectName = grade.subject.name
      if (!acc[subjectName]) {
        acc[subjectName] = []
      }
      acc[subjectName].push(grade)
      return acc
    }, {} as Record<string, typeof student.grades>)

    // Calculate averages per subject
    const subjectAverages = Object.entries(gradesBySubject).map(([subject, grades]) => {
      const average = grades.reduce((sum, g) => 
        sum + (Number(g.score) / Number(g.maxScore)) * 100, 0
      ) / grades.length

      return {
        subject,
        average,
        gradesCount: grades.length,
        lastGrade: grades[0]
      }
    })

    const overallAverage = subjectAverages.length > 0
      ? subjectAverages.reduce((sum, s) => sum + s.average, 0) / subjectAverages.length
      : 0

    return {
      student,
      gradesBySubject,
      subjectAverages,
      overallAverage
    }
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Baholar</h1>
        <p className="text-muted-foreground">
          Farzandlaringizning barcha baholari
        </p>
      </div>

      {studentsWithGrades.map(({ student, gradesBySubject, subjectAverages, overallAverage }) => (
        <div key={student.id} className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{student.user?.fullName}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {student.class?.name}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-primary">
                    {overallAverage.toFixed(1)}%
                  </div>
                  <p className="text-xs text-muted-foreground">Umumiy o'rtacha</p>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Grades by Subject */}
          <div className="grid gap-4 md:grid-cols-2">
            {subjectAverages.map(({ subject, average, gradesCount, lastGrade }) => {
              const getTrendIcon = () => {
                if (average >= 80) return <TrendingUp className="h-4 w-4 text-green-600" />
                if (average >= 60) return <Minus className="h-4 w-4 text-yellow-600" />
                return <TrendingDown className="h-4 w-4 text-red-600" />
              }

              const getAverageColor = () => {
                if (average >= 80) return 'text-green-600'
                if (average >= 60) return 'text-yellow-600'
                return 'text-red-600'
              }

              return (
                <Card key={subject}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{subject}</CardTitle>
                      {getTrendIcon()}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {/* Average */}
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">O'rtacha:</span>
                        <span className={`text-2xl font-bold ${getAverageColor()}`}>
                          {average.toFixed(1)}%
                        </span>
                      </div>

                      {/* Grades count */}
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Baholar soni:</span>
                        <span className="font-medium">{gradesCount}</span>
                      </div>

                      {/* Last grade */}
                      <div className="rounded-md bg-muted p-2">
                        <p className="text-xs text-muted-foreground mb-1">Oxirgi baho:</p>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">
                            {lastGrade.gradeType}
                          </span>
                          <span className="font-bold">
                            {Number(lastGrade.score)}/{Number(lastGrade.maxScore)}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(lastGrade.date).toLocaleDateString('uz-UZ')}
                        </p>
                      </div>

                      {/* All grades for this subject */}
                      <div className="space-y-1 max-h-32 overflow-y-auto">
                        {gradesBySubject[subject].map((grade) => (
                          <div
                            key={grade.id}
                            className="flex items-center justify-between border-b py-1 text-xs last:border-0"
                          >
                            <span className="text-muted-foreground">
                              {new Date(grade.date).toLocaleDateString('uz-UZ')}
                            </span>
                            <span className="font-medium">
                              {Number(grade.score)}/{Number(grade.maxScore)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
            {subjectAverages.length === 0 && (
              <Card className="col-span-full">
                <CardContent className="py-12 text-center">
                  <Award className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    {student.user?.fullName} uchun hozircha baholar yo'q
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

