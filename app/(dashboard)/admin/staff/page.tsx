import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Users, UserCheck, Briefcase, TrendingUp, Building2 } from 'lucide-react'
import Link from 'next/link'
import { SearchBar } from '@/components/search-bar'
import { ClearFilters } from '@/components/clear-filters'
import { Pagination } from '@/components/pagination'
import { PageSizeSelector } from '@/components/page-size-selector'
import { StaffTable } from './staff-table'

// Optimized caching
export const revalidate = 60
export const dynamic = 'auto'

export default async function StaffPage({
  searchParams,
}: {
  searchParams: { 
    search?: string
    page?: string
    pageSize?: string
  }
}) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'MODERATOR')) {
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
        { staffCode: { contains: searchParams.search, mode: 'insensitive' } },
        { position: { contains: searchParams.search, mode: 'insensitive' } },
        { department: { contains: searchParams.search, mode: 'insensitive' } },
        { user: { fullName: { contains: searchParams.search, mode: 'insensitive' } } },
        { user: { email: { contains: searchParams.search, mode: 'insensitive' } } },
      ]
    }

    // Get total count for pagination
    const totalStaff = await db.staff.count({ where: whereClause }).catch(() => 0)
    const totalPages = Math.ceil(totalStaff / pageSize)

    // Get current month and year
    const now = new Date()
    const currentMonth = now.getMonth() + 1
    const currentYear = now.getFullYear()

    const staff = await db.staff.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
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
        salaryPayments: {
          where: {
            month: currentMonth,
            year: currentYear
          },
          select: {
            id: true,
            amount: true,
            paidAmount: true,
            remainingAmount: true,
            status: true,
            type: true
          }
        }
      }
    }).catch(() => [])

    // Calculate statistics
    const activeCount = staff.filter(s => s.user.isActive).length
    const departmentsCount = new Set(staff.filter(s => s.department).map(s => s.department)).size

    return (
      <div className="space-y-6">
        {/* Header with Gradient */}
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-cyan-600 via-blue-600 to-indigo-600 p-8 text-white shadow-2xl">
          <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,transparent,black)]" />
          <div className="relative">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                    <Briefcase className="h-8 w-8" />
                  </div>
                  <div>
                    <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
                      Xodimlar
                    </h1>
                    <p className="text-cyan-100 text-sm md:text-base">
                      Barcha xodimlarni boshqaring va kuzating
                    </p>
                  </div>
                </div>
              </div>
              <Button 
                asChild 
                className="flex-1 sm:flex-none bg-white text-cyan-700 hover:bg-white/90 shadow-lg"
              >
                <Link href="/admin/staff/create">
                  <Plus className="mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">Yangi Xodim</span>
                  <span className="sm:hidden">Yangi</span>
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card className="relative overflow-hidden group hover:-translate-y-1 transition-all duration-300 hover:shadow-xl">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500 to-blue-600 opacity-10 group-hover:opacity-20 transition-opacity" />
            <CardContent className="pt-6 relative">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    Jami Xodimlar
                  </p>
                  <div className="flex items-baseline gap-2">
                    <p className="text-3xl font-bold bg-gradient-to-br from-cyan-600 to-blue-600 bg-clip-text text-transparent">
                      {totalStaff}
                    </p>
                    <span className="text-xs text-muted-foreground">ta</span>
                  </div>
                </div>
                <div className="p-3 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl text-white shadow-lg">
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
                    Faol Xodimlar
                  </p>
                  <div className="flex items-baseline gap-2">
                    <p className="text-3xl font-bold bg-gradient-to-br from-green-600 to-emerald-600 bg-clip-text text-transparent">
                      {activeCount}
                    </p>
                    <span className="text-xs text-green-600 font-medium">
                      {totalStaff > 0 ? `${Math.round((activeCount / totalStaff) * 100)}%` : '0%'}
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
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-indigo-600 opacity-10 group-hover:opacity-20 transition-opacity" />
            <CardContent className="pt-6 relative">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    Bo'limlar
                  </p>
                  <div className="flex items-baseline gap-2">
                    <p className="text-3xl font-bold bg-gradient-to-br from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                      {departmentsCount}
                    </p>
                    <span className="text-xs text-muted-foreground">ta</span>
                  </div>
                </div>
                <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl text-white shadow-lg">
                  <Building2 className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter Card */}
        <Card className="relative overflow-hidden border-2 shadow-lg">
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-50 via-blue-50 to-indigo-50 dark:from-cyan-950/20 dark:via-blue-950/20 dark:to-indigo-950/20" />
          <CardContent className="pt-6 relative">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 md:gap-4">
                <SearchBar 
                  placeholder="Xodim qidirish..." 
                  className="flex-1 bg-white dark:bg-gray-950"
                />
                <ClearFilters className="w-full md:w-auto" />
              </div>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pt-2 border-t">
                <PageSizeSelector currentPageSize={pageSize} />
                <div className="flex items-center gap-2 text-sm">
                  <TrendingUp className="h-4 w-4 text-cyan-600" />
                  <span className="text-muted-foreground">
                    Jami: <span className="font-bold text-cyan-600">{totalStaff}</span> ta xodim
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Staff Table */}
        {staff.length > 0 ? (
          <StaffTable staff={staff} />
        ) : null}

        {/* Pagination */}
        {staff.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalStaff}
            itemsPerPage={pageSize}
          />
        )}

        {staff.length === 0 && (
          <Card className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800" />
            <CardContent className="flex flex-col items-center justify-center py-16 relative">
              <div className="p-4 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full text-white mb-4">
                <Briefcase className="h-12 w-12" />
              </div>
              <p className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                {searchParams.search
                  ? 'Hech narsa topilmadi'
                  : 'Hozircha xodimlar yo\'q'}
              </p>
              <p className="text-sm text-muted-foreground mb-6 text-center max-w-md">
                {searchParams.search
                  ? 'Boshqa qidiruv parametrlarini sinab ko\'ring'
                  : 'Yangi xodim qo\'shish uchun yuqoridagi tugmani bosing'}
              </p>
              {searchParams.search && <ClearFilters />}
              {!searchParams.search && (
                <Button asChild className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 shadow-lg">
                  <Link href="/admin/staff/create">
                    <Plus className="mr-2 h-4 w-4" />
                    Birinchi xodimni qo'shing
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
      console.error('Staff page error:', error)
    }
    throw error
  }
}
