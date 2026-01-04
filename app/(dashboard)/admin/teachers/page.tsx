import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, GraduationCap, BookOpen } from 'lucide-react'
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
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">O'qituvchilar</h1>
          <p className="text-muted-foreground">
            Barcha o'qituvchilarni boshqaring
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/teachers/create">
            <Plus className="mr-2 h-4 w-4" />
            Yangi O'qituvchi
          </Link>
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <SearchBar 
                placeholder="O'qituvchi qidirish (ism, email, kod, fan)..." 
                className="flex-1"
              />
              <ClearFilters />
            </div>
            <div className="flex justify-between items-center">
              <PageSizeSelector currentPageSize={pageSize} />
              <div className="text-sm text-muted-foreground">
                Jami: <span className="font-medium">{totalTeachers}</span> ta o'qituvchi
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
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <GraduationCap className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-muted-foreground mb-2">
              {searchParams.search
                ? 'Hech narsa topilmadi'
                : 'Hozircha o\'qituvchilar yo\'q'}
            </p>
            {searchParams.search && <ClearFilters />}
            {!searchParams.search && (
              <Button asChild>
                <Link href="/admin/teachers/create">
                  <Plus className="mr-2 h-4 w-4" />
                  Birinchi o'qituvchini qo'shing
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{teachers.length}</div>
            <p className="text-sm text-muted-foreground">
              {searchParams.search ? 'Topilgan natijalar' : 'Jami o\'qituvchilar'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">
              {teachers.filter(t => t._count.classSubjects > 0).length}
            </div>
            <p className="text-sm text-muted-foreground">Faol o'qituvchilar</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-orange-600">
              {teachers.filter(t => t._count.classSubjects === 0).length}
            </div>
            <p className="text-sm text-muted-foreground">Sinfga biriktirilmagan</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Teachers page error:', error)
    }
    throw error
  }
}
