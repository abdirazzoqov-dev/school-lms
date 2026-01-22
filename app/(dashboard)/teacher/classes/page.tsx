import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Users, BookOpen, Clock, GraduationCap, ArrowRight, UserCheck } from 'lucide-react'
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

  const gradients = [
    'from-blue-500 to-indigo-600',
    'from-purple-500 to-pink-600',
    'from-green-500 to-emerald-600',
    'from-orange-500 to-red-600',
    'from-cyan-500 to-blue-600',
    'from-violet-500 to-purple-600',
  ]

  const totalStudents = teacher.classSubjects.reduce((acc, cs) => acc + cs.class._count.students, 0)
  const totalHours = teacher.classSubjects.reduce((acc, cs) => acc + cs.hoursPerWeek, 0)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Mening Sinflarim
        </h1>
        <p className="text-lg text-muted-foreground">
          Siz o'qitayotgan barcha sinflar va o'quvchilar
        </p>
      </div>

      {/* Summary Stats */}
      {teacher.classSubjects.length > 0 && (
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="border-none shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-blue-500 text-white shadow-lg">
                  <GraduationCap className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-3xl font-bold text-blue-600">{teacher.classSubjects.length}</div>
                  <p className="text-sm text-muted-foreground font-medium">Sinf-fanlar</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-green-500 text-white shadow-lg">
                  <UserCheck className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-3xl font-bold text-green-600">{totalStudents}</div>
                  <p className="text-sm text-muted-foreground font-medium">Jami o'quvchilar</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-purple-500 text-white shadow-lg">
                  <Clock className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-3xl font-bold text-purple-600">{totalHours}</div>
                  <p className="text-sm text-muted-foreground font-medium">Soat/hafta</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Classes Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {teacher.classSubjects.map((cs, index) => (
          <Card 
            key={cs.id}
            className="group relative overflow-hidden border-none shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
          >
            {/* Gradient Header */}
            <div className={`h-32 bg-gradient-to-br ${gradients[index % gradients.length]} p-6 relative`}>
              <div className="absolute inset-0 bg-black/10" />
              <div className="relative z-10 flex flex-col h-full">
                <Badge className="self-start bg-white/20 backdrop-blur-sm text-white border-white/30 hover:bg-white/30">
                  {cs.subject.name}
                </Badge>
                <div className="mt-auto">
                  <h3 className="text-3xl font-bold text-white">{cs.class.name}</h3>
                </div>
              </div>
              {/* Decorative circles */}
              <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-white/10 rounded-full" />
              <div className="absolute -right-4 -top-4 w-20 h-20 bg-white/10 rounded-full" />
            </div>

            <CardContent className="p-6 space-y-4">
              {/* Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/20">
                    <Users className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-lg font-bold">{cs.class._count.students}</div>
                    <p className="text-xs text-muted-foreground">O'quvchi</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-950/20">
                    <Clock className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <div className="text-lg font-bold">{cs.hoursPerWeek}</div>
                    <p className="text-xs text-muted-foreground">Soat/hafta</p>
                  </div>
                </div>
              </div>

              {/* Students Preview */}
              {cs.class.students.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">O'quvchilar:</p>
                  <div className="flex -space-x-2">
                    {cs.class.students.slice(0, 5).map((student) => (
                      <div
                        key={student.id}
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-xs font-semibold text-white ring-2 ring-white dark:ring-gray-900"
                        title={student.user?.fullName}
                      >
                        {student.user?.fullName?.split(' ').map(n => n[0]).join('').toUpperCase() || '?'}
                      </div>
                    ))}
                    {cs.class.students.length > 5 && (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-800 text-xs font-semibold ring-2 ring-white dark:ring-gray-900">
                        +{cs.class.students.length - 5}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Action Button */}
              <Link href={`/teacher/classes/${cs.classId}`} className="block">
                <Button 
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg group-hover:shadow-xl transition-all"
                  size="lg"
                >
                  Darsga kirish
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {teacher.classSubjects.length === 0 && (
        <Card className="border-dashed border-2">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="p-4 rounded-full bg-blue-50 dark:bg-blue-950/20 mb-4">
              <BookOpen className="h-12 w-12 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">
              Sizga hozircha sinflar biriktirilmagan
            </h3>
            <p className="text-muted-foreground text-center max-w-md">
              Administrator sizga sinflar biriktirgandan keyin, ular shu yerda ko'rinadi
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

