import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { Card, CardContent } from '@/components/ui/card'
import { DollarSign } from 'lucide-react'
import { SearchBar } from '@/components/search-bar'
import { FilterSelect } from '@/components/filter-select'
import { ClearFilters } from '@/components/clear-filters'
import { Pagination } from '@/components/pagination'
import { PageSizeSelector } from '@/components/page-size-selector'
import { SuperAdminPaymentsTable } from './super-admin-payments-table'

// No cache - always fresh! ⚡
export const revalidate = 120 // Cache for 2 minutes
export const dynamic = 'auto' // Optimized for better caching

export default async function SuperAdminPaymentsPage({
  searchParams,
}: {
  searchParams: { 
    search?: string
    status?: string
    paymentType?: string
    tenantId?: string
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
      { invoiceNumber: { contains: searchParams.search, mode: 'insensitive' } },
      { receiptNumber: { contains: searchParams.search, mode: 'insensitive' } },
      { student: { studentCode: { contains: searchParams.search, mode: 'insensitive' } } },
      { student: { user: { fullName: { contains: searchParams.search, mode: 'insensitive' } } } },
      { tenant: { name: { contains: searchParams.search, mode: 'insensitive' } } },
    ]
  }

  // Status filter
  if (searchParams.status) {
    whereClause.status = searchParams.status
  }

  // Payment type filter
  if (searchParams.paymentType) {
    whereClause.paymentType = searchParams.paymentType
  }

  // Sorting
  const sortBy = searchParams.sortBy || 'createdAt'
  const order = searchParams.order || 'desc'
  
  const getOrderBy = () => {
    switch (sortBy) {
      case 'tenant':
        return { tenant: { name: order } }
      case 'student':
        return { student: { user: { fullName: order } } }
      case 'amount':
        return { amount: order }
      case 'dueDate':
        return { dueDate: order }
      case 'status':
        return { status: order }
      case 'type':
        return { paymentType: order }
      default:
        return { createdAt: order }
    }
  }

  // Get total count for pagination
  const totalPayments = await db.payment.count({ where: whereClause })
  const totalPages = Math.ceil(totalPayments / pageSize)

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

  const payments = await db.payment.findMany({
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
        include: {
          user: {
            select: {
              fullName: true
            }
          },
          class: true
        }
      },
      parent: {
        include: {
          user: {
            select: {
              fullName: true,
              phone: true
            }
          }
        }
      },
      receivedBy: {
        select: {
          fullName: true
        }
      }
    }
  })

  // Calculate statistics across all filtered payments
  const stats = await db.payment.groupBy({
    by: ['status'],
    where: whereClause,
    _sum: {
      amount: true,
    },
    _count: true,
  })

  const totalRevenue = stats.find(s => s.status === 'COMPLETED')?._sum?.amount || 0
  const pendingAmount = stats.find(s => s.status === 'PENDING')?._sum?.amount || 0
  const completedCount = stats.find(s => s.status === 'COMPLETED')?._count || 0
  
  // Count overdue payments
  const overdueCount = await db.payment.count({
    where: {
      ...whereClause,
      status: 'PENDING',
      dueDate: {
        lt: new Date(),
      }
    }
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Barcha To'lovlar</h1>
          <p className="text-muted-foreground">
            Barcha maktablardan kelib tushgan to'lovlarni ko'ring
          </p>
        </div>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-4 md:flex-row">
              <SearchBar 
                placeholder="To'lov qidirish (invoice, o'quvchi, maktab)..." 
                className="flex-1"
              />
              <FilterSelect
                paramName="tenantId"
                options={tenants.map(t => ({ label: t.name, value: t.id }))}
                placeholder="Barcha maktablar"
                className="w-full md:w-[200px]"
              />
              <FilterSelect
                paramName="status"
                options={[
                  { label: 'To\'langan', value: 'COMPLETED' },
                  { label: 'Kutilmoqda', value: 'PENDING' },
                  { label: 'Muvaffaqiyatsiz', value: 'FAILED' },
                  { label: 'Qaytarilgan', value: 'REFUNDED' },
                ]}
                placeholder="Barcha statuslar"
                className="w-full md:w-[180px]"
              />
              <FilterSelect
                paramName="paymentType"
                options={[
                  { label: 'O\'qish haqi', value: 'TUITION' },
                  { label: 'Kitoblar', value: 'BOOKS' },
                  { label: 'Forma', value: 'UNIFORM' },
                  { label: 'Transport', value: 'TRANSPORT' },
                  { label: 'Ovqat', value: 'MEALS' },
                  { label: 'Boshqa', value: 'OTHER' },
                ]}
                placeholder="Barcha turlar"
                className="w-full md:w-[180px]"
              />
              <ClearFilters />
            </div>
            <div className="flex justify-between items-center">
              <PageSizeSelector currentPageSize={pageSize} />
              <div className="text-sm text-muted-foreground">
                Jami: <span className="font-medium">{totalPayments}</span> ta to'lov
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">
              {Number(totalRevenue).toLocaleString()}
            </div>
            <p className="text-sm text-muted-foreground">To'langan (so'm)</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-orange-600">
              {Number(pendingAmount).toLocaleString()}
            </div>
            <p className="text-sm text-muted-foreground">Kutilmoqda (so'm)</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {completedCount}
            </div>
            <p className="text-sm text-muted-foreground">To'langan to'lovlar</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-red-600">
              {overdueCount}
            </div>
            <p className="text-sm text-muted-foreground">Muddati o'tgan</p>
          </CardContent>
        </Card>
      </div>

      {/* Payments Table */}
      {payments.length > 0 ? (
        <SuperAdminPaymentsTable payments={payments} />
      ) : null}

      {/* Pagination */}
      {payments.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalPayments}
          itemsPerPage={pageSize}
        />
      )}

      {payments.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <DollarSign className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-muted-foreground mb-2">
              {searchParams.search || searchParams.status || searchParams.paymentType || searchParams.tenantId
                ? 'Hech narsa topilmadi'
                : 'Hozircha to\'lovlar yo\'q'}
            </p>
            {(searchParams.search || searchParams.status || searchParams.paymentType || searchParams.tenantId) && (
              <ClearFilters />
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

