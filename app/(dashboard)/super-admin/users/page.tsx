import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { Card, CardContent } from '@/components/ui/card'
import { Users } from 'lucide-react'
import { SearchBar } from '@/components/search-bar'
import { FilterSelect } from '@/components/filter-select'
import { ClearFilters } from '@/components/clear-filters'
import { Pagination } from '@/components/pagination'
import { PageSizeSelector } from '@/components/page-size-selector'
import { SuperAdminUsersTable } from './super-admin-users-table'

// No cache - always fresh! ⚡
export const revalidate = 120 // Cache for 2 minutes
export const dynamic = 'auto' // Optimized for better caching

export default async function SuperAdminUsersPage({
  searchParams,
}: {
  searchParams: { 
    search?: string
    role?: string
    tenantId?: string
    isActive?: string
    page?: string
    pageSize?: string
    sortBy?: string
    order?: 'asc' | 'desc'
  }
}) {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'SUPER_ADMIN') {
    redirect('/unauthorized')
  }

  // Pagination
  const currentPage = parseInt(searchParams.page || '1')
  const pageSize = parseInt(searchParams.pageSize || '25')
  const skip = (currentPage - 1) * pageSize

  // Build where clause
  const whereClause: any = {}

  // Tenant filter
  if (searchParams.tenantId) {
    whereClause.tenantId = searchParams.tenantId
  }

  // Search filter
  if (searchParams.search) {
    whereClause.OR = [
      { fullName: { contains: searchParams.search, mode: 'insensitive' } },
      { email: { contains: searchParams.search, mode: 'insensitive' } },
      { phone: { contains: searchParams.search, mode: 'insensitive' } },
      { tenant: { name: { contains: searchParams.search, mode: 'insensitive' } } },
    ]
  }

  // Role filter
  if (searchParams.role) {
    whereClause.role = searchParams.role
  }

  // Active status filter
  if (searchParams.isActive) {
    whereClause.isActive = searchParams.isActive === 'true'
  }

  // Sorting
  const sortBy = searchParams.sortBy || 'createdAt'
  const order = searchParams.order || 'desc'
  
  const getOrderBy = () => {
    switch (sortBy) {
      case 'tenant':
        return { tenant: { name: order } }
      case 'fullName':
        return { fullName: order }
      case 'email':
        return { email: order }
      case 'role':
        return { role: order }
      case 'lastLogin':
        return { lastLogin: order }
      default:
        return { createdAt: order }
    }
  }

  // Get total count for pagination
  const totalUsers = await db.user.count({ where: whereClause })
  const totalPages = Math.ceil(totalUsers / pageSize)

  // Get all tenants for filter dropdown
  const tenants = await db.tenant.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
    },
    orderBy: {
      name: 'asc',
    },
  })

  const users = await db.user.findMany({
    where: whereClause,
    orderBy: getOrderBy(),
    skip,
    take: pageSize,
    include: {
      tenant: {
        select: {
          id: true,
          name: true,
          slug: true,
        }
      },
      student: {
        select: {
          id: true,
          studentCode: true,
        }
      },
      teacher: {
        select: {
          id: true,
          teacherCode: true,
        }
      },
    }
  })

  // Calculate statistics
  const stats = await db.user.groupBy({
    by: ['role'],
    where: whereClause,
    _count: true,
  })

  const totalAdmins = stats.find(s => s.role === 'ADMIN')?._count || 0
  const totalTeachers = stats.find(s => s.role === 'TEACHER')?._count || 0
  const totalParents = stats.find(s => s.role === 'PARENT')?._count || 0
  const totalStudents = stats.find(s => s.role === 'STUDENT')?._count || 0

  // Count active users
  const activeUsers = await db.user.count({
    where: {
      ...whereClause,
      isActive: true,
    }
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Barcha Foydalanuvchilar</h1>
          <p className="text-muted-foreground">
            Barcha maktablardagi foydalanuvchilarni ko'ring
          </p>
        </div>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-4 md:flex-row">
              <SearchBar 
                placeholder="Foydalanuvchi qidirish (ism, email, telefon)..." 
                className="flex-1"
              />
              <FilterSelect
                paramName="tenantId"
                options={tenants.map(t => ({ label: t.name, value: t.id }))}
                placeholder="Barcha maktablar"
                className="w-full md:w-[200px]"
              />
              <FilterSelect
                paramName="role"
                options={[
                  { label: 'Admin', value: 'ADMIN' },
                  { label: 'O\'qituvchi', value: 'TEACHER' },
                  { label: 'Ota-ona', value: 'PARENT' },
                  { label: 'O\'quvchi', value: 'STUDENT' },
                ]}
                placeholder="Barcha rollar"
                className="w-full md:w-[180px]"
              />
              <FilterSelect
                paramName="isActive"
                options={[
                  { label: 'Faol', value: 'true' },
                  { label: 'Nofaol', value: 'false' },
                ]}
                placeholder="Barcha statuslar"
                className="w-full md:w-[180px]"
              />
              <ClearFilters />
            </div>
            <div className="flex justify-between items-center">
              <PageSizeSelector currentPageSize={pageSize} />
              <div className="text-sm text-muted-foreground">
                Jami: <span className="font-medium">{totalUsers}</span> ta foydalanuvchi
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">
              {activeUsers}
            </div>
            <p className="text-sm text-muted-foreground">Faol foydalanuvchilar</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-purple-600">
              {totalAdmins}
            </div>
            <p className="text-sm text-muted-foreground">Adminlar</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600">
              {totalTeachers}
            </div>
            <p className="text-sm text-muted-foreground">O'qituvchilar</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-orange-600">
              {totalParents}
            </div>
            <p className="text-sm text-muted-foreground">Ota-onalar</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {totalStudents}
            </div>
            <p className="text-sm text-muted-foreground">O'quvchilar</p>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      {users.length > 0 ? (
        <SuperAdminUsersTable users={users} />
      ) : null}

      {/* Pagination */}
      {users.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalUsers}
          itemsPerPage={pageSize}
        />
      )}

      {users.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-muted-foreground mb-2">
              {searchParams.search || searchParams.role || searchParams.tenantId || searchParams.isActive
                ? 'Hech narsa topilmadi'
                : 'Hozircha foydalanuvchilar yo\'q'}
            </p>
            {(searchParams.search || searchParams.role || searchParams.tenantId || searchParams.isActive) && (
              <ClearFilters />
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

