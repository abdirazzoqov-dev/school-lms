import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Users } from 'lucide-react'
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
            phone: true
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">O'quvchilar</h1>
          <p className="text-muted-foreground">
            Barcha o'quvchilarni boshqaring
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/admin/students/migrate">
              <Users className="mr-2 h-4 w-4" />
              Migration
            </Link>
          </Button>
          <Button asChild>
            <Link href="/admin/students/create">
              <Plus className="mr-2 h-4 w-4" />
              Yangi O'quvchi
            </Link>
          </Button>
        </div>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-4 md:flex-row">
              <SearchBar 
                placeholder="O'quvchi qidirish (ism, kod)..." 
                className="flex-1"
              />
              <FilterSelect
                paramName="status"
                options={[
                  { label: 'Faol', value: 'ACTIVE' },
                  { label: 'Bitirgan', value: 'GRADUATED' },
                  { label: 'Chiqarilgan', value: 'EXPELLED' },
                ]}
                placeholder="Barcha statuslar"
                className="w-full md:w-[200px]"
              />
              <FilterSelect
                paramName="classId"
                options={classes.map(c => ({ label: c.name, value: c.id }))}
                placeholder="Barcha sinflar"
                className="w-full md:w-[200px]"
              />
              <FilterSelect
                paramName="trialStatus"
                options={[
                  { label: 'Sinov muddatida', value: 'trial' },
                  { label: 'Asosiy o\'quvchilar', value: 'regular' },
                ]}
                placeholder="Barcha o'quvchilar"
                className="w-full md:w-[200px]"
              />
              <ClearFilters />
            </div>
            <div className="flex justify-between items-center">
              <PageSizeSelector currentPageSize={pageSize} />
              <div className="text-sm text-muted-foreground">
                Jami: <span className="font-medium">{totalStudents}</span> ta o'quvchi
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
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-muted-foreground mb-2">
              {searchParams.search || searchParams.status || searchParams.classId
                ? 'Hech narsa topilmadi'
                : 'Hozircha o\'quvchilar yo\'q'}
            </p>
            {(searchParams.search || searchParams.status || searchParams.classId) && (
              <ClearFilters />
            )}
            {!searchParams.search && !searchParams.status && !searchParams.classId && (
              <Button asChild>
                <Link href="/admin/students/create">
                  <Plus className="mr-2 h-4 w-4" />
                  Birinchi o'quvchini qo'shing
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
            <div className="text-2xl font-bold">{students.length}</div>
            <p className="text-sm text-muted-foreground">
              {searchParams.search || searchParams.status || searchParams.classId
                ? 'Topilgan natijalar'
                : 'Jami o\'quvchilar'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">
              {students.filter(s => s.status === 'ACTIVE').length}
            </div>
            <p className="text-sm text-muted-foreground">Faol o'quvchilar</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-orange-600">
              {students.filter(s => !s.classId).length}
            </div>
            <p className="text-sm text-muted-foreground">Sinfga biriktirilmagan</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Students page error:', error)
    }
    throw error
  }
}
