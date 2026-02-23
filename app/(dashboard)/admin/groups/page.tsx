import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Users, BookOpen, MapPin, Code } from 'lucide-react'
import Link from 'next/link'
import { getCurrentAcademicYear } from '@/lib/utils'
import { SearchBar } from '@/components/search-bar'
import { ClearFilters } from '@/components/clear-filters'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { PermissionGate } from '@/components/admin/permission-gate'

export const revalidate = 60
export const dynamic = 'force-dynamic'

export default async function GroupsPage({
  searchParams,
}: {
  searchParams: { search?: string }
}) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'MODERATOR')) {
      redirect('/unauthorized')
    }

    const tenantId = session.user.tenantId!
    const academicYear = getCurrentAcademicYear()

    const whereClause: any = { tenantId, academicYear }

    if (searchParams.search) {
      whereClause.OR = [
        { name: { contains: searchParams.search, mode: 'insensitive' } },
        { code: { contains: searchParams.search, mode: 'insensitive' } },
        { description: { contains: searchParams.search, mode: 'insensitive' } },
        { roomNumber: { contains: searchParams.search, mode: 'insensitive' } },
      ]
    }

    const groups = await db.group.findMany({
      where: whereClause,
      orderBy: { name: 'asc' },
      include: {
        groupTeacher: {
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
            students: { where: { status: 'ACTIVE' } },
            groupSubjects: true
          }
        }
      }
    }).catch(() => [])

    // Summary statistics
    const totalGroups = groups.length
    const totalStudents = groups.reduce((sum, g) => sum + g._count.students, 0)
    const groupsWithTeacher = groups.filter(g => g.groupTeacherId).length
    const averageStudentsPerGroup = totalGroups > 0 
      ? (totalStudents / totalGroups).toFixed(1) 
      : '0'

    return (
      <div className="space-y-4 md:space-y-6 p-4 md:p-6">
        {/* Header */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Guruhlar</h1>
            <p className="text-sm md:text-base text-muted-foreground mt-1">
              {academicYear} o'quv yili • {totalGroups} ta guruh
            </p>
          </div>
          <PermissionGate resource="groups" action="CREATE">
            <Button asChild className="w-full md:w-auto">
              <Link href="/admin/groups/create">
                <Plus className="mr-2 h-4 w-4" />
                Yangi Guruh
              </Link>
            </Button>
          </PermissionGate>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="pt-4 md:pt-6">
            <div className="flex flex-col gap-3 md:gap-4 md:flex-row">
              <SearchBar 
                placeholder="Guruh qidirish (nom, kod, tavsif)..." 
                className="flex-1"
              />
              <ClearFilters className="w-full md:w-auto" />
            </div>
          </CardContent>
        </Card>

        {/* Groups Grid */}
        {groups.length > 0 ? (
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {groups.map((group) => {
              const fillPercentage = (group._count.students / group.maxStudents) * 100

              return (
                <Card key={group.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg flex items-center gap-2">
                          {group.name}
                          {group.code && (
                            <Badge variant="secondary" className="text-xs font-normal">
                              <Code className="h-3 w-3 mr-1" />
                              {group.code}
                            </Badge>
                          )}
                        </CardTitle>
                        {group.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {group.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* Group Teacher */}
                    {group.groupTeacher ? (
                      <div className="flex items-center gap-2 text-sm">
                        <Users className="h-4 w-4 text-green-600" />
                        <span className="font-medium">Guruh rahbari:</span>
                        <span className="text-muted-foreground">
                          {group.groupTeacher.user.fullName}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-sm text-orange-600">
                        <Users className="h-4 w-4" />
                        <span>Rahbar tayinlanmagan</span>
                      </div>
                    )}

                    {/* Room Number */}
                    {group.roomNumber && (
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-blue-600" />
                        <span className="font-medium">Xona:</span>
                        <span className="text-muted-foreground">{group.roomNumber}</span>
                      </div>
                    )}

                    {/* Subjects Count */}
                    <div className="flex items-center gap-2 text-sm">
                      <BookOpen className="h-4 w-4 text-purple-600" />
                      <span className="font-medium">Fanlar:</span>
                      <span className="text-muted-foreground">
                        {group._count.groupSubjects} ta
                      </span>
                    </div>

                    {/* Students Progress */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">O'quvchilar</span>
                        <span className="text-muted-foreground">
                          {group._count.students} / {group.maxStudents}
                        </span>
                      </div>
                      <Progress 
                        value={fillPercentage} 
                        className="h-2"
                        indicatorClassName={
                          fillPercentage >= 90 ? 'bg-red-500' :
                          fillPercentage >= 75 ? 'bg-yellow-500' :
                          'bg-green-500'
                        }
                      />
                      <p className="text-xs text-muted-foreground">
                        {fillPercentage >= 100 ? 'To\'liq' :
                         fillPercentage >= 90 ? 'Deyarli to\'liq' :
                         fillPercentage >= 75 ? 'Ko\'p joy band' :
                         fillPercentage > 0 ? 'Bo\'sh joylar bor' :
                         'Bo\'sh'}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      <PermissionGate resource="groups" action="READ">
                        <Button asChild variant="outline" size="sm" className="flex-1">
                          <Link href={`/admin/groups/${group.id}`}>
                            Ko'rish
                          </Link>
                        </Button>
                      </PermissionGate>
                      <PermissionGate resource="groups" action="UPDATE">
                        <Button asChild variant="default" size="sm" className="flex-1">
                          <Link href={`/admin/groups/${group.id}/edit`}>
                            Tahrirlash
                          </Link>
                        </Button>
                      </PermissionGate>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Users className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {searchParams.search ? 'Hech narsa topilmadi' : 'Guruhlar yo\'q'}
              </h3>
              <p className="text-sm text-muted-foreground mb-4 max-w-md">
                {searchParams.search 
                  ? 'Boshqa qidiruv so\'rovi bilan urinib ko\'ring'
                  : 'Hali birorta guruh yaratilmagan. Yangi guruh qo\'shing va o\'quvchilarni guruhga qo\'shing.'}
              </p>
              {searchParams.search ? (
                <ClearFilters />
              ) : (
                <PermissionGate resource="groups" action="CREATE">
                  <Button asChild>
                    <Link href="/admin/groups/create">
                      <Plus className="mr-2 h-4 w-4" />
                      Birinchi guruhni yarating
                    </Link>
                  </Button>
                </PermissionGate>
              )}
            </CardContent>
          </Card>
        )}

        {/* Summary Stats */}
        {groups.length > 0 && (
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{totalGroups}</div>
                <p className="text-sm text-muted-foreground">
                  {searchParams.search ? 'Topilgan guruhlar' : 'Jami guruhlar'}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-blue-600">{totalStudents}</div>
                <p className="text-sm text-muted-foreground">O'quvchilar soni</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-green-600">{groupsWithTeacher}</div>
                <p className="text-sm text-muted-foreground">Rahbarli guruhlar</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-purple-600">{averageStudentsPerGroup}</div>
                <p className="text-sm text-muted-foreground">O'rtacha o'quvchilar</p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    )
  } catch (error) {
    console.error('Groups page error:', error)
    return (
      <div className="p-6">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-600">Xatolik yuz berdi. Iltimos, qaytadan urinib ko'ring.</p>
          </CardContent>
        </Card>
      </div>
    )
  }
}

