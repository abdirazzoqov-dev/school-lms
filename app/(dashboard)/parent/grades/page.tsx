import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { ParentGradesView } from './parent-grades-view'

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
                  fullName: true,
                  avatar: true
                }
              },
              class: {
                select: {
                  name: true
                }
              },
              grades: {
                orderBy: { date: 'desc' },
                include: {
                  subject: {
                    select: {
                      id: true,
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
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Baholar
          </h1>
          <p className="text-lg text-muted-foreground mt-2">
            Farzandlaringizning barcha baholari
          </p>
        </div>
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-muted-foreground">Farzandlar topilmadi</p>
        </div>
      </div>
    )
  }

  // Convert Decimal to number for client component
  const studentsData = parent.students.map(({ student }) => ({
    ...student,
    grades: student.grades.map(grade => ({
      ...grade,
      score: Number(grade.score),
      maxScore: Number(grade.maxScore),
      percentage: grade.percentage ? Number(grade.percentage) : null
    }))
  }))

  return <ParentGradesView students={studentsData} />
}
