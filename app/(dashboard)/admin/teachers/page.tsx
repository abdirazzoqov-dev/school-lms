import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, GraduationCap, BookOpen, UserCheck, AlertCircle, TrendingUp, Users } from 'lucide-react'
import Link from 'next/link'
import { SearchBar } from '@/components/search-bar'
import { ClearFilters } from '@/components/clear-filters'
import { Pagination } from '@/components/pagination'
import { PageSizeSelector } from '@/components/page-size-selector'
import { TeachersTable } from './teachers-table'

// Optimized caching: Cache for 60 seconds - faster page loads ⚡
export const revalidate = 60
export const dynamic = 'auto' // Allows Next.js to optimize route caching

export default async function TeachersPage({
  searchParams,
}: {
  searchParams: { 
    search?: string
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
        { teacherCode: { contains: searchParams.search, mode: 'insensitive' } },
        { specialization: { contains: searchParams.search, mode: 'insensitive' } },
        { user: { fullName: { contains: searchParams.search, mode: 'insensitive' } } },
        { user: { email: { contains: searchParams.search, mode: 'insensitive' } } },
      ]
    }

    // Sorting
    const sortBy = searchParams.sortBy || 'createdAt'
    const order = searchParams.order || 'desc'
    
    const getOrderBy = () => {
      switch (sortBy) {
        case 'name':
          return { user: { fullName: order } }
        case 'code':
          return { teacherCode: order }
        case 'specialization':
          return { specialization: order }
        case 'experience':
          return { experienceYears: order }
        default:
          return { createdAt: order }
      }
    }

    // Get total count for pagination
    const totalTeachers = await db.teacher.count({ where: whereClause }).catch(() => 0)
    const totalPages = Math.ceil(totalTeachers / pageSize)

    const teachers = await db.teacher.findMany({
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
            isActive: true,
            avatar: true,
          }
        },
        classSubjects: {
          include: {
            class: true,
            subject: true
          }
        },
        _count: {
          select: {
            classSubjects: true
          }
        }
      }
    }).catch(() => [])

  // Calculate statistics
  const activeCount = teachers.filter(t => t.user.isActive && t._count.classSubjects > 0).length
  const unassignedCount = teachers.filter(t => t._count.classSubjects === 0).length

  return (
    <div className="space-y-6">
      {/* Header with Gradient */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-purple-600 via-pink-600 to-red-600 p-8 text-white shadow-2xl">
        <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,transparent,black)]" />
        <div className="relative">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                  <GraduationCap className="h-8 w-8" />
                </div>
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
                    O'qituvchilar
                  </h1>
                  <p className="text-purple-100 text-sm md:text-base">
                    Barcha o'qituvchilarni boshqaring va kuzating
                  </p>
                </div>
              </div>
            </div>
            <Button 
              asChild 
              className="flex-1 sm:flex-none bg-white text-purple-700 hover:bg-white/90 shadow-lg"
            >
              <Link href="/admin/teachers/create">
                <Plus className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Yangi O'qituvchi</span>
                <span className="sm:hidden">Yangi</span>
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="relative overflow-hidden group hover:-translate-y-1 transition-all duration-300 hover:shadow-xl">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-600 opacity-10 group-hover:opacity-20 transition-opacity" />
          <CardContent className="pt-6 relative">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  Jami O'qituvchilar
                </p>
                <div className="flex items-baseline gap-2">
                  <p className="text-3xl font-bold bg-gradient-to-br from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    {totalTeachers}
                  </p>
                  <span className="text-xs text-muted-foreground">ta</span>
                </div>
              </div>
              <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl text-white shadow-lg">
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
                  Faol O'qituvchilar
                </p>
                <div className="flex items-baseline gap-2">
                  <p className="text-3xl font-bold bg-gradient-to-br from-green-600 to-emerald-600 bg-clip-text text-transparent">
                    {activeCount}
                  </p>
                  <span className="text-xs text-green-600 font-medium">
                    {totalTeachers > 0 ? `${Math.round((activeCount / totalTeachers) * 100)}%` : '0%'}
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
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-cyan-600 opacity-10 group-hover:opacity-20 transition-opacity" />
          <CardContent className="pt-6 relative">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  Jami Sinflar
                </p>
                <div className="flex items-baseline gap-2">
                  <p className="text-3xl font-bold bg-gradient-to-br from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                    {teachers.reduce((sum, t) => sum + (t._count.classSubjects || 0), 0)}
                  </p>
                  <span className="text-xs text-muted-foreground">ta</span>
                </div>
              </div>
              <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl text-white shadow-lg">
                <BookOpen className="h-6 w-6" />
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
        <div className="absolute inset-0 bg-gradient-to-r from-purple-50 via-pink-50 to-red-50 dark:from-purple-950/20 dark:via-pink-950/20 dark:to-red-950/20" />
        <CardContent className="pt-6 relative">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 md:gap-4">
              <SearchBar 
                placeholder="O'qituvchi qidirish..." 
                className="flex-1 bg-white dark:bg-gray-950"
              />
              <ClearFilters className="w-full md:w-auto" />
            </div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pt-2 border-t">
              <PageSizeSelector currentPageSize={pageSize} />
              <div className="flex items-center gap-2 text-sm">
                <TrendingUp className="h-4 w-4 text-purple-600" />
                <span className="text-muted-foreground">
                  Jami: <span className="font-bold text-purple-600">{totalTeachers}</span> ta o'qituvchi
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Teachers Table */}
      {teachers.length > 0 ? (
        <TeachersTable teachers={teachers} />
      ) : null}

      {/* Pagination */}
      {teachers.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalTeachers}
          itemsPerPage={pageSize}
        />
      )}

      {teachers.length === 0 && (
        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800" />
          <CardContent className="flex flex-col items-center justify-center py-16 relative">
            <div className="p-4 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full text-white mb-4">
              <GraduationCap className="h-12 w-12" />
            </div>
            <p className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              {searchParams.search
                ? 'Hech narsa topilmadi'
                : 'Hozircha o\'qituvchilar yo\'q'}
            </p>
            <p className="text-sm text-muted-foreground mb-6 text-center max-w-md">
              {searchParams.search
                ? 'Boshqa qidiruv parametrlarini sinab ko\'ring'
                : 'Yangi o\'qituvchi qo\'shish uchun yuqoridagi tugmani bosing'}
            </p>
            {searchParams.search && <ClearFilters />}
            {!searchParams.search && (
              <Button asChild className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg">
                <Link href="/admin/teachers/create">
                  <Plus className="mr-2 h-4 w-4" />
                  Birinchi o'qituvchini qo'shing
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
      console.error('Teachers page error:', error)
    }
    throw error
  }
}
