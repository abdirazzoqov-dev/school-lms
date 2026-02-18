import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Users, GraduationCap, UserCheck, AlertCircle, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { SearchBar } from '@/components/search-bar'
import { FilterSelect } from '@/components/filter-select'
import { ClearFilters } from '@/components/clear-filters'
import { Pagination } from '@/components/pagination'
import { PageSizeSelector } from '@/components/page-size-selector'
import { StudentsTable } from './students-table'

// Optimized caching: Cache for 60 seconds - faster page loads ⚡
export const revalidate = 60
export const dynamic = 'auto' // Allows Next.js to optimize route caching

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: { 
    search?: string
    status?: string
    classId?: string
    trialStatus?: string
    page?: string
    pageSize?: string
    sortBy?: string
    order?: 'asc' | 'desc'
  }
}) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      redirect('/unauthorized')
    }

    const tenantId = session.user.tenantId!

  // Pagination
  const currentPage = parseInt(searchParams.page || '1')
  const pageSize = parseInt(searchParams.pageSize || '25')
  const skip = (currentPage - 1) * pageSize

  // Build where clause
  const whereClause: any = { tenantId }

  // Search filter
  if (searchParams.search) {
    whereClause.OR = [
      { studentCode: { contains: searchParams.search, mode: 'insensitive' } },
      { user: { fullName: { contains: searchParams.search, mode: 'insensitive' } } },
    ]
  }

  // Status filter
  if (searchParams.status) {
    whereClause.status = searchParams.status
  }

  // Class filter
  if (searchParams.classId) {
    whereClause.classId = searchParams.classId
  }

  // Trial status filter
  if (searchParams.trialStatus) {
    if (searchParams.trialStatus === 'trial') {
      whereClause.trialEnabled = true
    } else if (searchParams.trialStatus === 'regular') {
      whereClause.trialEnabled = false
    }
    // 'all' case: no filter added
  }

  // Sorting
  const sortBy = searchParams.sortBy || 'createdAt'
  const order = searchParams.order || 'desc'
  
  const getOrderBy = () => {
    switch (sortBy) {
      case 'name':
        return { user: { fullName: order } }
      case 'code':
        return { studentCode: order }
      case 'class':
        return { class: { name: order } }
      case 'status':
        return { status: order }
      default:
        return { createdAt: order }
    }
  }

    // Get total count for pagination
    const totalStudents = await db.student.count({ where: whereClause }).catch(() => 0)
    const totalPages = Math.ceil(totalStudents / pageSize)

    const students = await db.student.findMany({
      where: whereClause,
      orderBy: getOrderBy(),
      skip,
      take: pageSize,
      include: {
        user: {
          select: {
            fullName: true,
            email: true,
            phone: true,
            avatar: true,
          }
        },
        class: true,
        parents: {
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
          }
        }
      }
    }).catch(() => [])

    // Get all classes for filter
    const classes = await db.class.findMany({
      where: { tenantId },
      select: { id: true, name: true },
      orderBy: { name: 'asc' }
    }).catch(() => [])

  // Calculate statistics
  const activeCount = await db.student.count({ 
    where: { tenantId, status: 'ACTIVE' } 
  }).catch(() => 0)
  
  const graduatedCount = await db.student.count({ 
    where: { tenantId, status: 'GRADUATED' } 
  }).catch(() => 0)
  
  const unassignedCount = await db.student.count({ 
    where: { tenantId, classId: null, status: 'ACTIVE' } 
  }).catch(() => 0)

  return (
    <div className="space-y-6">
      {/* Header with Gradient */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 p-8 text-white shadow-2xl">
        <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,transparent,black)]" />
        <div className="relative">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                  <Users className="h-8 w-8" />
                </div>
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
                    O'quvchilar
                  </h1>
                  <p className="text-blue-100 text-sm md:text-base">
                    Barcha o'quvchilarni boshqaring va kuzating
                  </p>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="secondary" 
                asChild 
                className="flex-1 sm:flex-none bg-white/20 hover:bg-white/30 backdrop-blur-sm border-white/30 text-white"
              >
                <Link href="/admin/students/migrate">
                  <Users className="mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">Migration</span>
                  <span className="sm:hidden">Migrate</span>
                </Link>
              </Button>
              <Button 
                asChild 
                className="flex-1 sm:flex-none bg-white text-indigo-700 hover:bg-white/90 shadow-lg"
              >
                <Link href="/admin/students/create">
                  <Plus className="mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">Yangi O'quvchi</span>
                  <span className="sm:hidden">Yangi</span>
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="relative overflow-hidden group hover:-translate-y-1 transition-all duration-300 hover:shadow-xl">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-indigo-600 opacity-10 group-hover:opacity-20 transition-opacity" />
          <CardContent className="pt-6 relative">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  Jami O'quvchilar
                </p>
                <div className="flex items-baseline gap-2">
                  <p className="text-3xl font-bold bg-gradient-to-br from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    {totalStudents}
                  </p>
                  <span className="text-xs text-muted-foreground">ta</span>
                </div>
              </div>
              <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl text-white shadow-lg">
                <Users className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden group hover:-translate-y-1 transition-all duration-300 hover:shadow-xl">
          <div className="absolute inset-0 bg-gradient-to-br from-green-500 to-emerald-600 opacity-10 group-hover:opacity-20 transition-opacity" />
          <CardContent className="pt-6 relative">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  Faol O'quvchilar
                </p>
                <div className="flex items-baseline gap-2">
                  <p className="text-3xl font-bold bg-gradient-to-br from-green-600 to-emerald-600 bg-clip-text text-transparent">
                    {activeCount}
                  </p>
                  <span className="text-xs text-green-600 font-medium">
                    {totalStudents > 0 ? `${Math.round((activeCount / totalStudents) * 100)}%` : '0%'}
                  </span>
                </div>
              </div>
              <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl text-white shadow-lg">
                <UserCheck className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden group hover:-translate-y-1 transition-all duration-300 hover:shadow-xl">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-600 opacity-10 group-hover:opacity-20 transition-opacity" />
          <CardContent className="pt-6 relative">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  Bitirganlar
                </p>
                <div className="flex items-baseline gap-2">
                  <p className="text-3xl font-bold bg-gradient-to-br from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    {graduatedCount}
                  </p>
                  <span className="text-xs text-muted-foreground">ta</span>
                </div>
              </div>
              <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl text-white shadow-lg">
                <GraduationCap className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden group hover:-translate-y-1 transition-all duration-300 hover:shadow-xl">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500 to-red-600 opacity-10 group-hover:opacity-20 transition-opacity" />
          <CardContent className="pt-6 relative">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  Biriktirilmagan
                </p>
                <div className="flex items-baseline gap-2">
                  <p className="text-3xl font-bold bg-gradient-to-br from-orange-600 to-red-600 bg-clip-text text-transparent">
                    {unassignedCount}
                  </p>
                  <span className="text-xs text-muted-foreground">ta</span>
                </div>
              </div>
              <div className="p-3 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl text-white shadow-lg">
                <AlertCircle className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter Card with Gradient */}
      <Card className="relative overflow-hidden border-2 shadow-lg">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950/20 dark:via-indigo-950/20 dark:to-purple-950/20" />
        <CardContent className="pt-6 relative">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-3 md:gap-4 md:flex-row">
              <SearchBar 
                placeholder="O'quvchi qidirish (ism, kod)..." 
                className="flex-1 bg-white dark:bg-gray-950"
              />
              <div className="grid grid-cols-2 md:flex gap-2">
                <FilterSelect
                  paramName="status"
                  options={[
                    { label: 'Faol', value: 'ACTIVE' },
                    { label: 'Bitirgan', value: 'GRADUATED' },
                    { label: 'Chiqarilgan', value: 'EXPELLED' },
                  ]}
                  placeholder="Barcha statuslar"
                  className="w-full md:w-[200px] bg-white dark:bg-gray-950"
                />
                <FilterSelect
                  paramName="classId"
                  options={classes.map(c => ({ label: c.name, value: c.id }))}
                  placeholder="Barcha sinflar"
                  className="w-full md:w-[200px] bg-white dark:bg-gray-950"
                />
                <FilterSelect
                  paramName="trialStatus"
                  options={[
                    { label: 'Sinov muddatida', value: 'trial' },
                    { label: 'Asosiy o\'quvchilar', value: 'regular' },
                  ]}
                  placeholder="Barcha o'quvchilar"
                  className="w-full md:w-[200px] col-span-2 md:col-span-1 bg-white dark:bg-gray-950"
                />
                <ClearFilters className="col-span-2 md:col-span-1" />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 pt-2 border-t">
              <PageSizeSelector currentPageSize={pageSize} />
              <div className="flex items-center gap-2 text-sm">
                <TrendingUp className="h-4 w-4 text-blue-600" />
                <span className="text-muted-foreground">
                  Jami: <span className="font-bold text-blue-600">{totalStudents}</span> ta o'quvchi
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Students Table */}
      {students.length > 0 ? (
        <StudentsTable students={students} />
      ) : null}

      {/* Pagination */}
      {students.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalStudents}
          itemsPerPage={pageSize}
        />
      )}

      {students.length === 0 && (
        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800" />
          <CardContent className="flex flex-col items-center justify-center py-16 relative">
            <div className="p-4 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full text-white mb-4">
              <Users className="h-12 w-12" />
            </div>
            <p className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              {searchParams.search || searchParams.status || searchParams.classId
                ? 'Hech narsa topilmadi'
                : 'Hozircha o\'quvchilar yo\'q'}
            </p>
            <p className="text-sm text-muted-foreground mb-6 text-center max-w-md">
              {searchParams.search || searchParams.status || searchParams.classId
                ? 'Boshqa qidiruv parametrlarini sinab ko\'ring'
                : 'Yangi o\'quvchi qo\'shish uchun yuqoridagi tugmani bosing'}
            </p>
            {(searchParams.search || searchParams.status || searchParams.classId) && (
              <ClearFilters />
            )}
            {!searchParams.search && !searchParams.status && !searchParams.classId && (
              <Button asChild className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg">
                <Link href="/admin/students/create">
                  <Plus className="mr-2 h-4 w-4" />
                  Birinchi o'quvchini qo'shing
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Students page error:', error)
    }
    throw error
  }
}
