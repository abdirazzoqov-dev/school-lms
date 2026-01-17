import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Users, GraduationCap, BookOpen, TrendingUp, MapPin } from 'lucide-react'
import Link from 'next/link'
import { getCurrentAcademicYear } from '@/lib/utils'
import { SearchBar } from '@/components/search-bar'
import { FilterSelect } from '@/components/filter-select'
import { ClearFilters } from '@/components/clear-filters'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'

export const revalidate = 60
export const dynamic = 'force-dynamic'

export default async function ClassesPage({
  searchParams,
}: {
  searchParams: { search?: string; gradeLevel?: string }
}) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      redirect('/unauthorized')
    }

    const tenantId = session.user.tenantId!
    const academicYear = getCurrentAcademicYear()

    const whereClause: any = { tenantId, academicYear }

    if (searchParams.search) {
      whereClause.OR = [
        { name: { contains: searchParams.search, mode: 'insensitive' } },
        { roomNumber: { contains: searchParams.search, mode: 'insensitive' } },
      ]
    }

    if (searchParams.gradeLevel) {
      whereClause.gradeLevel = parseInt(searchParams.gradeLevel)
    }

      const classes = await db.class.findMany({
        where: whereClause,
        orderBy: { gradeLevel: 'asc' },
        include: {
          classTeacher: {
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
              classSubjects: true
            }
          }
        }
      }).catch(() => [])

  return (
    <div className="space-y-4 md:space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Sinflar</h1>
          <p className="text-sm md:text-base text-muted-foreground mt-1">
            {academicYear} o'quv yili • {classes.length} ta sinf
          </p>
        </div>
        <Button asChild className="w-full md:w-auto">
          <Link href="/admin/classes/create">
            <Plus className="mr-2 h-4 w-4" />
            Yangi Sinf
          </Link>
        </Button>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardContent className="pt-4 md:pt-6">
          <div className="flex flex-col gap-3 md:gap-4 md:flex-row">
            <SearchBar 
              placeholder="Sinf qidirish..." 
              className="flex-1"
            />
            <FilterSelect
              paramName="gradeLevel"
              options={[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(g => ({
                label: `${g}-sinf`,
                value: g.toString()
              }))}
              placeholder="Barcha darajalar"
              className="w-full md:w-[200px]"
            />
            <ClearFilters className="w-full md:w-auto" />
          </div>
        </CardContent>
      </Card>

      {/* Classes Grid */}
      <div className="grid gap-3 md:gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {classes.map((classItem) => {
          const capacity = (classItem._count.students / classItem.maxStudents) * 100
          const isFull = capacity >= 100
          
          return (
            <Link key={classItem.id} href={`/admin/classes/${classItem.id}`}>
              <Card className="h-full hover:shadow-lg transition-all hover:scale-[1.02] cursor-pointer border-l-4 border-l-blue-500">
                <CardHeader className="p-4 md:p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-xl md:text-2xl mb-1">{classItem.name}</CardTitle>
                      <div className="flex flex-wrap items-center gap-2 text-xs md:text-sm text-muted-foreground">
                        <Badge variant="outline">{classItem.gradeLevel}-sinf</Badge>
                        {classItem.roomNumber && (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            <span>{classItem.roomNumber}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    {isFull && (
                      <Badge variant="secondary" className="bg-orange-100 text-orange-800 text-xs">
                        To'lgan
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 md:space-y-4 p-4 md:p-6 pt-0">
                  {/* O'quvchilar */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-blue-600" />
                        <span className="font-medium">O'quvchilar</span>
                      </div>
                      <span className="text-sm font-bold">
                        {classItem._count.students}/{classItem.maxStudents}
                      </span>
                    </div>
                    <Progress value={capacity} className="h-2" />
                    <p className="text-xs text-muted-foreground">
                      {capacity.toFixed(0)}% to'lgan
                    </p>
                  </div>

                  {/* Sinf rahbari */}
                  <div className="p-2.5 md:p-3 rounded-lg bg-muted/50">
                    {classItem.classTeacher ? (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Sinf rahbari:</p>
                        <div className="flex items-center gap-2">
                          <GraduationCap className="h-4 w-4 text-green-600" />
                          <p className="text-sm font-medium">
                            {classItem.classTeacher.user.fullName}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-orange-600">
                        <GraduationCap className="h-4 w-4" />
                        <p className="text-sm font-medium">Rahbar tayinlanmagan</p>
                      </div>
                    )}
                  </div>

                  {/* Fanlar */}
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <BookOpen className="h-4 w-4" />
                      <span>Fanlar</span>
                    </div>
                    <span className="font-bold">{classItem._count.classSubjects}</span>
                  </div>

                  {/* Action Button */}
                  <Button 
                    className="w-full" 
                    variant="outline"
                    size="sm"
                    asChild
                  >
                    <Link href={`/admin/classes/${classItem.id}`}>
                      <Users className="mr-2 h-4 w-4" />
                      O'quvchilarni ko'rish
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>

      {/* Empty State */}
      {classes.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <BookOpen className="h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-xl font-medium text-muted-foreground mb-2">
              {searchParams.search || searchParams.gradeLevel
                ? 'Hech narsa topilmadi'
                : 'Hozircha sinflar yo\'q'}
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              {searchParams.search || searchParams.gradeLevel
                ? 'Boshqa parametrlar bilan qidirib ko\'ring'
                : 'Birinchi sinfni yarating va o\'quvchilarni qo\'shing'}
            </p>
            {(searchParams.search || searchParams.gradeLevel) ? (
              <ClearFilters />
            ) : (
              <Button asChild size="lg">
                <Link href="/admin/classes/create">
                  <Plus className="mr-2 h-5 w-5" />
                  Birinchi sinfni yarating
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Summary Stats */}
      {classes.length > 0 && (
        <div className="grid gap-3 md:gap-4 grid-cols-2 md:grid-cols-4">
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="pt-4 md:pt-6 p-3 md:p-6">
              <div className="flex items-center gap-2 md:gap-3">
                <div className="p-1.5 md:p-2 bg-blue-100 rounded-lg">
                  <BookOpen className="h-4 w-4 md:h-5 md:w-5 text-blue-600" />
                </div>
                <div>
                  <div className="text-xl md:text-2xl font-bold">{classes.length}</div>
                  <p className="text-xs md:text-sm text-muted-foreground">Jami sinflar</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardContent className="pt-4 md:pt-6 p-3 md:p-6">
              <div className="flex items-center gap-2 md:gap-3">
                <div className="p-1.5 md:p-2 bg-green-100 rounded-lg">
                  <Users className="h-4 w-4 md:h-5 md:w-5 text-green-600" />
                </div>
                <div>
                  <div className="text-xl md:text-2xl font-bold text-green-600">
                    {classes.reduce((acc, c) => acc + c._count.students, 0)}
                  </div>
                  <p className="text-xs md:text-sm text-muted-foreground">Jami o'quvchilar</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500">
            <CardContent className="pt-4 md:pt-6 p-3 md:p-6">
              <div className="flex items-center gap-2 md:gap-3">
                <div className="p-1.5 md:p-2 bg-purple-100 rounded-lg">
                  <GraduationCap className="h-4 w-4 md:h-5 md:w-5 text-purple-600" />
                </div>
                <div>
                  <div className="text-xl md:text-2xl font-bold text-purple-600">
                    {classes.filter(c => c.classTeacher).length}
                  </div>
                  <p className="text-xs md:text-sm text-muted-foreground">Rahbar tayinlangan</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-amber-500">
            <CardContent className="pt-4 md:pt-6 p-3 md:p-6">
              <div className="flex items-center gap-2 md:gap-3">
                <div className="p-1.5 md:p-2 bg-amber-100 rounded-lg">
                  <TrendingUp className="h-4 w-4 md:h-5 md:w-5 text-amber-600" />
                </div>
                <div>
                  <div className="text-xl md:text-2xl font-bold text-amber-600">
                    {classes.reduce((acc, c) => acc + c._count.classSubjects, 0)}
                  </div>
                  <p className="text-xs md:text-sm text-muted-foreground">Jami fanlar</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Classes page error:', error)
    }
    throw error
  }
}
