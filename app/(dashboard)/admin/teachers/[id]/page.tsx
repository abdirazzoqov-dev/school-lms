import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, GraduationCap, Edit, BookOpen, Users, Calendar, Mail, Phone } from 'lucide-react'
import Link from 'next/link'

// Optimized caching: Cache for 30 seconds for detail pages ⚡
export const revalidate = 30
export const dynamic = 'auto' // Allows Next.js to optimize route caching

export default async function TeacherDetailPage({ params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'MODERATOR')) {
      redirect('/unauthorized')
    }

    const tenantId = session.user.tenantId!

    const teacher = await db.teacher.findFirst({
      where: { id: params.id, tenantId },
      include: {
        user: {
          select: {
            fullName: true,
            email: true,
            phone: true,
            createdAt: true,
          }
        },
        classSubjects: {
          include: {
            class: true,
            subject: true,
          }
        },
        classTeacher: {
          include: {
            _count: {
              select: {
                students: true
              }
            }
          }
        },
        grades: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            student: {
              include: {
                user: {
                  select: {
                    fullName: true
                  }
                }
              }
            },
            subject: true,
          }
        }
      }
    }).catch(() => null)

    if (!teacher) {
      redirect('/admin/teachers')
    }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/teachers">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h2 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              <GraduationCap className="h-8 w-8" />
              {teacher.user.fullName}
            </h2>
            <p className="text-muted-foreground">ID: {teacher.teacherCode}</p>
          </div>
        </div>
        <Link href={`/admin/teachers/${teacher.id}/edit`}>
          <Button>
            <Edit className="mr-2 h-4 w-4" />
            Tahrirlash
          </Button>
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Basic Information */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Asosiy Ma'lumotlar</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground">O'qituvchi Kodi</p>
                <p className="font-mono font-medium">{teacher.teacherCode}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Mutaxassislik</p>
                <p className="font-medium text-lg">{teacher.specialization}</p>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{teacher.user.email}</p>
                </div>
              </div>
              {teacher.user.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Telefon</p>
                    <p className="font-medium">{teacher.user.phone}</p>
                  </div>
                </div>
              )}
              {teacher.experienceYears !== null && (
                <div>
                  <p className="text-sm text-muted-foreground">Tajriba</p>
                  <p className="font-medium">{teacher.experienceYears} yil</p>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Qo'shilgan</p>
                  <p className="font-medium">
                    {new Date(teacher.user.createdAt).toLocaleDateString('uz-UZ')}
                  </p>
                </div>
              </div>
            </div>
            {teacher.education && (
              <div>
                <p className="text-sm text-muted-foreground">Ta'lim</p>
                <p className="font-medium">{teacher.education}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <BookOpen className="h-8 w-8 text-purple-600" />
                <div>
                  <p className="text-2xl font-bold">{teacher.classSubjects.length}</p>
                  <p className="text-sm text-muted-foreground">Dars beradi</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Users className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold">{teacher.classTeacher.length}</p>
                  <p className="text-sm text-muted-foreground">Sinf rahbari</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <GraduationCap className="h-8 w-8 text-green-600" />
                <div>
                  <p className="text-2xl font-bold">{teacher.grades.length}</p>
                  <p className="text-sm text-muted-foreground">Baholar</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Classes as Class Teacher */}
      {teacher.classTeacher.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Sinf Rahbari</CardTitle>
            <CardDescription>Mas'ul bo'lgan sinflar</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {teacher.classTeacher.map((cls) => (
                <Link key={cls.id} href={`/admin/classes/${cls.id}`}>
                  <div className="p-4 rounded-lg border hover:border-primary transition-colors">
                    <p className="font-bold text-lg">{cls.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {cls._count.students} o'quvchi
                    </p>
                    {cls.roomNumber && (
                      <p className="text-xs text-muted-foreground">Xona: {cls.roomNumber}</p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Teaching Classes/Subjects */}
      <Card>
        <CardHeader>
          <CardTitle>Dars Beradigan Sinflar</CardTitle>
          <CardDescription>Biriktirilgan fan va sinflar</CardDescription>
        </CardHeader>
        <CardContent>
          {teacher.classSubjects.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b bg-muted/50">
                  <tr>
                    <th className="p-3 text-left text-sm font-medium">Sinf</th>
                    <th className="p-3 text-left text-sm font-medium">Fan</th>
                    <th className="p-3 text-left text-sm font-medium">Haftalik Soat</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {teacher.classSubjects.map((cs) => (
                    <tr key={cs.id} className="hover:bg-muted/50">
                      <td className="p-3">
                        <Link href={`/admin/classes/${cs.class.id}`} className="font-medium hover:text-primary">
                          {cs.class.name}
                        </Link>
                      </td>
                      <td className="p-3">{cs.subject.name}</td>
                      <td className="p-3 text-muted-foreground">
                        {cs.hoursPerWeek || 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              Hozircha sinf va fanlar biriktirilmagan
            </p>
          )}
        </CardContent>
      </Card>

      {/* Recent Grades Given */}
      <Card>
        <CardHeader>
          <CardTitle>So'nggi Berilgan Baholar</CardTitle>
          <CardDescription>Oxirgi 10 ta baho</CardDescription>
        </CardHeader>
        <CardContent>
          {teacher.grades.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b">
                  <tr>
                    <th className="p-3 text-left text-sm font-medium">O'quvchi</th>
                    <th className="p-3 text-left text-sm font-medium">Fan</th>
                    <th className="p-3 text-left text-sm font-medium">Baho</th>
                    <th className="p-3 text-left text-sm font-medium">Turi</th>
                    <th className="p-3 text-left text-sm font-medium">Sana</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {teacher.grades.map((grade) => (
                    <tr key={grade.id}>
                      <td className="p-3">
                        <Link href={`/admin/students/${grade.student.id}`} className="hover:text-primary">
                          {grade.student.user?.fullName}
                        </Link>
                      </td>
                      <td className="p-3">{grade.subject.name}</td>
                      <td className="p-3">
                        <span className="font-bold text-lg">{Number(grade.score)}</span>
                        <span className="text-muted-foreground">/{Number(grade.maxScore)}</span>
                      </td>
                      <td className="p-3">
                        <span className="text-xs bg-slate-100 px-2 py-1 rounded">
                          {grade.gradeType}
                        </span>
                      </td>
                      <td className="p-3 text-sm text-muted-foreground">
                        {new Date(grade.createdAt).toLocaleDateString('uz-UZ')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              Hozircha baholar berilmagan
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Teacher detail page error:', error)
    }
    throw error
  }
}
