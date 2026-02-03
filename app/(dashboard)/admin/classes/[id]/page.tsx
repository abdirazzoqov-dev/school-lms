import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  ArrowLeft, Users, BookOpen, GraduationCap, MapPin, 
  Calendar, Phone, Mail, TrendingUp, Award, Clock,
  Edit, UserPlus, FileText, Plus
} from 'lucide-react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { formatNumber } from '@/lib/utils'

export const revalidate = 30
export const dynamic = 'force-dynamic'

interface PageProps {
  params: {
    id: string
  }
}

export default async function ClassDetailPage({ params }: PageProps) {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'ADMIN') {
    redirect('/unauthorized')
  }

  const tenantId = session.user.tenantId!

  // ✅ Fetch class with all details
  const classItem = await db.class.findFirst({
    where: {
      id: params.id,
      tenantId
    },
    include: {
      classTeacher: {
        include: {
          user: {
            select: {
              fullName: true,
              email: true,
              phone: true
            }
          }
        }
      },
      classSubjects: {
        include: {
          subject: true,
          teacher: {
            include: {
              user: {
                select: {
                  fullName: true,
                  email: true
                }
              }
            }
          }
        },
        orderBy: {
          subject: {
            name: 'asc'
          }
        }
      },
      schedules: {
        where: {
          type: 'LESSON', // Faqat darslar
          subjectId: { not: null },
          teacherId: { not: null }
        },
        include: {
          subject: true,
          teacher: {
            include: {
              user: {
                select: {
                  fullName: true,
                  email: true
                }
              }
            }
          }
        }
      },
      students: {
        where: {
          status: 'ACTIVE'
        },
        include: {
          user: {
            select: {
              fullName: true,
              email: true,
              phone: true,
              avatar: true
            }
          },
          parents: {
            where: {
              hasAccess: true
            },
            include: {
              parent: {
                include: {
                  user: {
                    select: {
                      fullName: true,
                      phone: true
                    }
                  }
                }
              }
            },
            take: 1
          },
          _count: {
            select: {
              payments: {
                where: {
                  status: 'PENDING'
                }
              },
              grades: true,
              attendances: {
                where: {
                  status: 'PRESENT'
                }
              }
            }
          }
        },
        orderBy: {
          user: {
            fullName: 'asc'
          }
        }
      },
      _count: {
        select: {
          students: true,
          classSubjects: true,
          attendances: true,
          assignments: true
        }
      }
    }
  })

  if (!classItem) {
    notFound()
  }

  // Calculate stats
  const activeStudentsCount = classItem.students.length
  const capacityPercentage = (activeStudentsCount / classItem.maxStudents) * 100
  const totalAttendance = classItem._count.attendances
  const avgAttendanceRate = activeStudentsCount > 0 && totalAttendance > 0
    ? (totalAttendance / (activeStudentsCount * 30)) * 100 // Approximate monthly rate
    : 0

  // ✅ Auto-generate subjects from schedule
  const subjectsFromSchedule = classItem.schedules
    .filter(schedule => schedule.subject && schedule.teacher) // Null check
    .reduce((acc, schedule) => {
      const key = `${schedule.subjectId}-${schedule.teacherId}`
      if (!acc.has(key)) {
        acc.set(key, {
          subjectId: schedule.subjectId!,
          subjectName: schedule.subject!.name,
          teacherId: schedule.teacherId!,
          teacherName: schedule.teacher!.user.fullName,
          teacherEmail: schedule.teacher!.user.email,
          hoursPerWeek: 1 // Count hours
        })
      } else {
        // Increment hours if already exists
        const existing = acc.get(key)!
        existing.hoursPerWeek += 1
      }
      return acc
    }, new Map<string, any>())

  const autoSubjects = Array.from(subjectsFromSchedule.values()).sort((a, b) => 
    a.subjectName.localeCompare(b.subjectName)
  )

  // Debug log (remove in production)
  if (process.env.NODE_ENV === 'development') {
    console.log('Class ID:', params.id)
    console.log('Total schedules:', classItem.schedules.length)
    console.log('Auto subjects:', autoSubjects.length)
    console.log('Auto subjects data:', autoSubjects)
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/admin/classes">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{classItem.name}</h1>
            <p className="text-muted-foreground">
              {classItem.gradeLevel}-sinf • {classItem.academicYear}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href={`/admin/students/create?classId=${classItem.id}`}>
              <UserPlus className="mr-2 h-4 w-4" />
              O'quvchi qo'shish
            </Link>
          </Button>
          <Button asChild>
            <Link href={`/admin/classes/${classItem.id}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              Tahrirlash
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                O'quvchilar
              </CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeStudentsCount}</div>
            <div className="mt-2">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-muted-foreground">Sig'im</span>
                <span className="font-medium">{capacityPercentage.toFixed(0)}%</span>
              </div>
              <Progress value={capacityPercentage} className="h-1.5" />
              <p className="text-xs text-muted-foreground mt-1">
                {classItem.maxStudents} maksimal
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Fanlar
              </CardTitle>
              <BookOpen className="h-4 w-4 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{autoSubjects.length}</div>
            <p className="text-xs text-muted-foreground mt-2">
              Dars jadvalidagi fanlar
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Davomat
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgAttendanceRate.toFixed(0)}%</div>
            <p className="text-xs text-muted-foreground mt-2">
              O'rtacha davomat darajasi
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Vazifalar
              </CardTitle>
              <FileText className="h-4 w-4 text-orange-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{classItem._count.assignments}</div>
            <p className="text-xs text-muted-foreground mt-2">
              Berilgan topshiriqlar
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Class Info & Teacher */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Class Teacher */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              Sinf Rahbari
            </CardTitle>
          </CardHeader>
          <CardContent>
            {classItem.classTeacher ? (
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                    <GraduationCap className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">{classItem.classTeacher.user.fullName}</p>
                    <p className="text-sm text-muted-foreground">
                      {classItem.classTeacher.specialization}
                    </p>
                  </div>
                </div>
                <div className="space-y-2 pt-2 border-t">
                  {classItem.classTeacher.user.email && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">{classItem.classTeacher.user.email}</span>
                    </div>
                  )}
                  {classItem.classTeacher.user.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">{classItem.classTeacher.user.phone}</span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-sm text-muted-foreground mb-3">
                  Sinf rahbari tayinlanmagan
                </p>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/admin/classes/${classItem.id}/edit`}>
                    Tayinlash
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Class Details */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Sinf Ma'lumotlari
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Xona raqami</p>
                  <p className="text-lg font-semibold">
                    {classItem.roomNumber || 'Belgilanmagan'}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">O'quv yili</p>
                  <p className="text-lg font-semibold">{classItem.academicYear}</p>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Daraja</p>
                  <p className="text-lg font-semibold">{classItem.gradeLevel}-sinf</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Maksimal o'quvchilar</p>
                  <p className="text-lg font-semibold">{classItem.maxStudents} ta</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Students Table - MAIN FEATURE */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                O'quvchilar Ro'yxati
              </CardTitle>
              <CardDescription>
                {activeStudentsCount} ta o'quvchi • Alifbo tartibida
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/admin/students?classId=${classItem.id}`}>
                Batafsil ko'rish
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {activeStudentsCount > 0 ? (
            <div className="rounded-md border">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr className="border-b">
                      <th className="px-4 py-3 text-left text-sm font-medium">№</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">O'quvchi</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Kod</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Ota-ona</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Telefon</th>
                      <th className="px-4 py-3 text-center text-sm font-medium">Baholar</th>
                      <th className="px-4 py-3 text-center text-sm font-medium">To'lovlar</th>
                      <th className="px-4 py-3 text-center text-sm font-medium">Holat</th>
                      <th className="px-4 py-3 text-center text-sm font-medium">Amallar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {classItem.students.map((student, index) => {
                      const primaryParent = student.parents[0]?.parent
                      const hasPendingPayments = student._count.payments > 0
                      
                      return (
                        <tr key={student.id} className="hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-3 text-sm text-muted-foreground">
                            {index + 1}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold text-sm">
                                {student.user?.fullName?.charAt(0) || '?'}
                              </div>
                              <div>
                                <p className="font-medium">
                                  {student.user?.fullName || 'Noma\'lum'}
                                </p>
                                {student.user?.email && (
                                  <p className="text-xs text-muted-foreground">
                                    {student.user.email}
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant="outline">{student.studentCode}</Badge>
                          </td>
                          <td className="px-4 py-3">
                            {primaryParent ? (
                              <div className="text-sm">
                                <p className="font-medium">{primaryParent.user.fullName}</p>
                                <p className="text-xs text-muted-foreground">
                                  {primaryParent.guardianType === 'FATHER' && 'Ota'}
                                  {primaryParent.guardianType === 'MOTHER' && 'Ona'}
                                  {primaryParent.guardianType === 'OTHER' && primaryParent.customRelationship}
                                </p>
                              </div>
                            ) : (
                              <span className="text-sm text-muted-foreground">-</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {primaryParent?.user.phone || student.user?.phone || (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <Award className="h-4 w-4 text-yellow-600" />
                              <span className="text-sm font-medium">
                                {student._count.grades}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            {hasPendingPayments ? (
                              <Badge variant="destructive" className="text-xs">
                                {student._count.payments} kutilmoqda
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="text-xs">
                                Holat yaxshi
                              </Badge>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <Badge 
                              variant={student.status === 'ACTIVE' ? 'default' : 'secondary'}
                              className="text-xs"
                            >
                              {student.status === 'ACTIVE' ? 'Faol' : student.status}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-center gap-1">
                              <Button variant="ghost" size="sm" asChild>
                                <Link href={`/admin/students/${student.id}`}>
                                  Ko'rish
                                </Link>
                              </Button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium text-muted-foreground mb-2">
                Hozircha o'quvchilar yo'q
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                Sinfga birinchi o'quvchini qo'shing
              </p>
              <Button asChild>
                <Link href={`/admin/students/create?classId=${classItem.id}`}>
                  <UserPlus className="mr-2 h-4 w-4" />
                  O'quvchi qo'shish
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Subjects - Auto from Schedule */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                O'qitiladigan Fanlar
              </CardTitle>
              <CardDescription>
                {autoSubjects.length} ta fan • Dars jadvalidan avtomatik
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/admin/schedules?type=class&classId=${classItem.id}`}>
                <Calendar className="h-4 w-4 mr-2" />
                Dars jadvali
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {autoSubjects.length > 0 ? (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {autoSubjects.map((subject) => (
                <div
                  key={`${subject.subjectId}-${subject.teacherId}`}
                  className="flex items-center justify-between p-4 rounded-lg border bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 hover:shadow-md transition-all"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                      <p className="font-semibold text-sm">{subject.subjectName}</p>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {subject.teacherName}
                    </p>
                    {subject.teacherEmail && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {subject.teacherEmail}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <div className="flex items-center gap-1 text-sm font-medium text-blue-600">
                      <Clock className="h-3.5 w-3.5" />
                      <span>{subject.hoursPerWeek}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">soat/hafta</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 rounded-lg">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium text-muted-foreground mb-2">
                Dars jadvali yaratilmagan
              </p>
              <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
                Dars jadvali yaratilganda fanlar va o'qituvchilar avtomatik bu yerda ko'rinadi
              </p>
              <Button asChild>
                <Link href={`/admin/schedules?type=class&classId=${classItem.id}`}>
                  <Calendar className="h-4 w-4 mr-2" />
                  Dars jadvali yaratish
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
