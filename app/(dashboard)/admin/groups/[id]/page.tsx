import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  ArrowLeft, Users, BookOpen, MapPin, 
  Calendar, Phone, Mail, Edit, UserPlus, Code
} from 'lucide-react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'

export const revalidate = 30
export const dynamic = 'force-dynamic'

interface PageProps {
  params: {
    id: string
  }
}

export default async function GroupDetailPage({ params }: PageProps) {
  const session = await getServerSession(authOptions)

  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'MODERATOR')) {
    redirect('/unauthorized')
  }

  const tenantId = session.user.tenantId!

  // Fetch group with all details
  const group = await db.group.findFirst({
    where: {
      id: params.id,
      tenantId
    },
    include: {
      groupTeacher: {
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
      groupSubjects: {
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
          groupSubjects: true
        }
      }
    }
  })

  if (!group) {
    notFound()
  }

  // Calculate stats
  const activeStudentsCount = group.students.length
  const capacityPercentage = (activeStudentsCount / group.maxStudents) * 100

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/groups">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-bold">{group.name}</h1>
            {group.code && (
              <Badge variant="secondary" className="text-sm">
                <Code className="h-3 w-3 mr-1" />
                {group.code}
              </Badge>
            )}
          </div>
          <p className="text-sm md:text-base text-muted-foreground mt-1">
            {group.academicYear} o'quv yili
          </p>
          {group.description && (
            <p className="text-sm text-muted-foreground mt-2">
              {group.description}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" className="hidden md:flex">
            <Link href={`/admin/groups/${group.id}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              Tahrirlash
            </Link>
          </Button>
          <Button asChild className="hidden md:flex">
            <Link href={`/admin/students/create?groupId=${group.id}`}>
              <UserPlus className="mr-2 h-4 w-4" />
              O'quvchi qo'shish
            </Link>
          </Button>
        </div>
      </div>

      {/* Mobile Actions */}
      <div className="flex gap-2 md:hidden">
        <Button asChild variant="outline" size="sm" className="flex-1">
          <Link href={`/admin/groups/${group.id}/edit`}>
            <Edit className="mr-2 h-4 w-4" />
            Tahrirlash
          </Link>
        </Button>
        <Button asChild size="sm" className="flex-1">
          <Link href={`/admin/students/create?groupId=${group.id}`}>
            <UserPlus className="mr-2 h-4 w-4" />
            O'quvchi qo'shish
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        {/* Left Column - Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Group Info Card */}
          <Card>
            <CardHeader>
              <CardTitle>Guruh Ma'lumotlari</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                {/* Group Teacher */}
                {group.groupTeacher ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <Users className="h-4 w-4" />
                      Guruh rahbari
                    </div>
                    <div>
                      <p className="font-medium">{group.groupTeacher.user.fullName}</p>
                      {group.groupTeacher.user.email && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                          <Mail className="h-3 w-3" />
                          <span>{group.groupTeacher.user.email}</span>
                        </div>
                      )}
                      {group.groupTeacher.user.phone && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                          <Phone className="h-3 w-3" />
                          <span>{group.groupTeacher.user.phone}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <Users className="h-4 w-4" />
                      Guruh rahbari
                    </div>
                    <p className="text-sm text-orange-600">Tayinlanmagan</p>
                  </div>
                )}

                {/* Room Number */}
                {group.roomNumber && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      Xona raqami
                    </div>
                    <p className="font-medium">{group.roomNumber}</p>
                  </div>
                )}

                {/* Academic Year */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    O'quv yili
                  </div>
                  <p className="font-medium">{group.academicYear}</p>
                </div>

                {/* Capacity */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Users className="h-4 w-4" />
                    Sig'im
                  </div>
                  <div>
                    <p className="font-medium">
                      {activeStudentsCount} / {group.maxStudents} o'quvchi
                    </p>
                    <Progress 
                      value={capacityPercentage} 
                      className="h-2 mt-2"
                      indicatorClassName={
                        capacityPercentage >= 90 ? 'bg-red-500' :
                        capacityPercentage >= 75 ? 'bg-yellow-500' :
                        'bg-green-500'
                      }
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {capacityPercentage >= 100 ? 'To\'liq' :
                       capacityPercentage >= 90 ? 'Deyarli to\'liq' :
                       capacityPercentage >= 75 ? 'Ko\'p joy band' :
                       capacityPercentage > 0 ? 'Bo\'sh joylar bor' :
                       'Bo\'sh'}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Group Subjects */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Fanlar</CardTitle>
                <CardDescription>
                  Bu guruhda o'qitiladigan fanlar
                </CardDescription>
              </div>
              <Badge variant="secondary">
                {group.groupSubjects.length} ta fan
              </Badge>
            </CardHeader>
            <CardContent>
              {group.groupSubjects.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Hozircha fanlar biriktirilmagan</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {group.groupSubjects.map((gs) => (
                    <div
                      key={gs.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <BookOpen className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{gs.subject.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {gs.teacher.user.fullName}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline">
                        {gs.hoursPerWeek} soat/hafta
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Students List */}
          <Card>
            <CardHeader>
              <CardTitle>O'quvchilar</CardTitle>
              <CardDescription>
                Bu guruhdagi barcha o'quvchilar
              </CardDescription>
            </CardHeader>
            <CardContent>
              {group.students.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="mb-4">Hozircha o'quvchilar yo'q</p>
                  <Button asChild size="sm">
                    <Link href={`/admin/students/create?groupId=${group.id}`}>
                      <UserPlus className="mr-2 h-4 w-4" />
                      O'quvchi qo'shish
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {group.students.map((student, index) => {
                    const parent = student.parents[0]?.parent

                    return (
                      <div
                        key={student.id}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                            {index + 1}
                          </div>
                          <div>
                            <Link 
                              href={`/admin/students/${student.id}`}
                              className="font-medium hover:underline"
                            >
                              {student.user?.fullName || 'No name'}
                            </Link>
                            {parent && (
                              <p className="text-sm text-muted-foreground">
                                Ota-ona: {parent.user.fullName}
                                {parent.user.phone && ` • ${parent.user.phone}`}
                              </p>
                            )}
                          </div>
                        </div>
                        <Button asChild variant="ghost" size="sm">
                          <Link href={`/admin/students/${student.id}`}>
                            Ko'rish
                          </Link>
                        </Button>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Stats */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Statistika</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Jami o'quvchilar</span>
                  <span className="font-bold text-xl">{activeStudentsCount}</span>
                </div>
                <Progress value={capacityPercentage} className="h-2" />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Maksimal sig'im</span>
                  <span className="font-semibold">{group.maxStudents}</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Bo'sh joylar</span>
                  <span className="font-semibold text-green-600">
                    {group.maxStudents - activeStudentsCount}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Fanlar soni</span>
                  <span className="font-semibold">{group._count.groupSubjects}</span>
                </div>
              </div>

              <div className="pt-4 border-t">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Band bo'lish</span>
                  <span className="font-bold text-lg">
                    {capacityPercentage.toFixed(0)}%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Tezkor harakatlar</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button asChild variant="outline" className="w-full justify-start">
                <Link href={`/admin/groups/${group.id}/edit`}>
                  <Edit className="mr-2 h-4 w-4" />
                  Guruhni tahrirlash
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start">
                <Link href={`/admin/students/create?groupId=${group.id}`}>
                  <UserPlus className="mr-2 h-4 w-4" />
                  O'quvchi qo'shish
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start">
                <Link href="/admin/subjects">
                  <BookOpen className="mr-2 h-4 w-4" />
                  Fanlarni boshqarish
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

