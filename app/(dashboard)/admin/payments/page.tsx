import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, DollarSign, CheckCircle2, Clock, XCircle } from 'lucide-react'
import Link from 'next/link'
import { SearchBar } from '@/components/search-bar'
import { FilterSelect } from '@/components/filter-select'
import { ClearFilters } from '@/components/clear-filters'
import { Pagination } from '@/components/pagination'
import { PageSizeSelector } from '@/components/page-size-selector'
import { PaymentsTable } from './payments-table'
import { formatNumber } from '@/lib/utils'

import { PAGE_CACHE_CONFIG } from '@/lib/cache-config'

// ✅ Advanced caching: Optimized for payment list
export const revalidate = PAGE_CACHE_CONFIG.payments.revalidate
export const dynamic = 'force-dynamic' // Always show latest payments

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: { 
    search?: string
    status?: string
    paymentType?: string
    classId?: string
    studentId?: string
    page?: string
    pageSize?: string
    sortBy?: string
    order?: 'asc' | 'desc'
  }
}) {
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
      { invoiceNumber: { contains: searchParams.search, mode: 'insensitive' } },
      { receiptNumber: { contains: searchParams.search, mode: 'insensitive' } },
      { student: { studentCode: { contains: searchParams.search, mode: 'insensitive' } } },
      { student: { user: { fullName: { contains: searchParams.search, mode: 'insensitive' } } } },
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

  // Class filter
  if (searchParams.classId) {
    whereClause.student = {
      ...whereClause.student,
      classId: searchParams.classId
    }
  }

  // Student filter
  if (searchParams.studentId) {
    whereClause.studentId = searchParams.studentId
  }

  // Sorting
  const sortBy = searchParams.sortBy || 'createdAt'
  const order = searchParams.order || 'desc'
  
  const getOrderBy = () => {
    switch (sortBy) {
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

  const payments = await db.payment.findMany({
    where: whereClause,
    orderBy: getOrderBy(),
    skip,
    take: pageSize,
    include: {
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

  const totalRevenue = payments
    .filter(p => p.status === 'COMPLETED')
    .reduce((sum, p) => sum + Number(p.amount), 0)

  const pendingAmount = payments
    .filter(p => p.status === 'PENDING')
    .reduce((sum, p) => sum + Number(p.amount), 0)

  // Student statistics (if student filter is active)
  let studentStats = null
  if (searchParams.studentId) {
    const allStudentPayments = await db.payment.findMany({
      where: {
        tenantId,
        studentId: searchParams.studentId
      },
      orderBy: { dueDate: 'asc' }
    })

    const student = await db.student.findFirst({
      where: { id: searchParams.studentId },
      include: {
        user: true,
        class: true
      }
    })

    // Calculate months between enrollment and now
    const enrollmentDate = student?.enrollmentDate ? new Date(student.enrollmentDate) : new Date()
    const now = new Date()
    const monthsDiff = (now.getFullYear() - enrollmentDate.getFullYear()) * 12 + 
                       (now.getMonth() - enrollmentDate.getMonth()) + 1

    // Expected total based on monthly tuition fee
    const monthlyFee = student?.monthlyTuitionFee ? Number(student.monthlyTuitionFee) : 0
    const expectedTotal = monthlyFee * monthsDiff

    studentStats = {
      student,
      monthlyTuitionFee: monthlyFee,
      monthsEnrolled: monthsDiff,
      expectedTotal,
      totalPaid: allStudentPayments.filter(p => p.status === 'COMPLETED').reduce((sum, p) => sum + Number(p.amount), 0),
      totalPending: allStudentPayments.filter(p => p.status === 'PENDING').reduce((sum, p) => sum + Number(p.amount), 0),
      completedCount: allStudentPayments.filter(p => p.status === 'COMPLETED').length,
      pendingCount: allStudentPayments.filter(p => p.status === 'PENDING').length,
      allPayments: allStudentPayments
    }
  }

  // Get classes and students for filters
  const classes = await db.class.findMany({
    where: { tenantId },
    orderBy: { name: 'asc' }
  })

  const students = await db.student.findMany({
    where: { 
      tenantId,
      ...(searchParams.classId ? { classId: searchParams.classId } : {})
    },
    include: {
      user: true,
      class: true
    },
    orderBy: { user: { fullName: 'asc' } }
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">To'lovlar</h1>
          <p className="text-muted-foreground">
            Barcha to'lovlarni boshqaring
          </p>
        </div>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-4 md:flex-row">
              <SearchBar 
                placeholder="To'lov qidirish (invoice, o'quvchi)..." 
                className="flex-1"
              />
              <FilterSelect
                paramName="status"
                options={[
                  { label: 'To\'langan', value: 'COMPLETED' },
                  { label: 'Qisman to\'langan', value: 'PARTIALLY_PAID' },
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
                  { label: 'Boshqa', value: 'OTHER' },
                ]}
                placeholder="Barcha turlar"
                className="w-full md:w-[180px]"
              />
              <FilterSelect
                paramName="classId"
                options={classes.map(c => ({ label: c.name, value: c.id }))}
                placeholder="Barcha sinflar"
                className="w-full md:w-[180px]"
              />
              <FilterSelect
                paramName="studentId"
                options={students.map(s => ({ 
                  label: `${s.user?.fullName || s.studentCode} - ${s.class?.name || 'Sinfsiz'}`, 
                  value: s.id 
                }))}
                placeholder="Barcha o'quvchilar"
                className="w-full md:w-[200px]"
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

      {/* Student Statistics (if filtered) */}
      {studentStats && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-blue-900">
                  {studentStats.student?.user?.fullName || studentStats.student?.studentCode}
                </h3>
                <p className="text-sm text-blue-700">
                  {studentStats.student?.class?.name || 'Sinfsiz'} • {studentStats.student?.studentCode}
                </p>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/admin/payments">
                  <span className="text-blue-600">Filterni tozalash ✕</span>
                </Link>
              </Button>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="bg-white rounded-lg p-4">
                <p className="text-sm text-muted-foreground">Oylik to'lov</p>
                <p className="text-2xl font-bold text-blue-600">
                  {formatNumber(studentStats.monthlyTuitionFee)}
                </p>
                <p className="text-xs text-blue-600">{studentStats.monthsEnrolled} oy o'qiydi</p>
              </div>

              <div className="bg-white rounded-lg p-4">
                <p className="text-sm text-muted-foreground">To'lashi kerak</p>
                <p className="text-2xl font-bold text-purple-600">
                  {formatNumber(studentStats.expectedTotal)}
                </p>
                <p className="text-xs text-purple-600">Jami ({studentStats.monthsEnrolled} oy)</p>
              </div>
              
              <div className="bg-white rounded-lg p-4">
                <p className="text-sm text-muted-foreground">To'langan</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatNumber(studentStats.totalPaid)}
                </p>
                <p className="text-xs text-green-600">{studentStats.completedCount} ta to'lov</p>
              </div>
              
              <div className="bg-white rounded-lg p-4">
                <p className="text-sm text-muted-foreground">Qarzi</p>
                <p className={`text-2xl font-bold ${
                  (studentStats.expectedTotal - studentStats.totalPaid) > 0 
                    ? 'text-red-600' 
                    : 'text-green-600'
                }`}>
                  {formatNumber(Math.max(0, studentStats.expectedTotal - studentStats.totalPaid))}
                </p>
                <p className={`text-xs ${
                  (studentStats.expectedTotal - studentStats.totalPaid) > 0 
                    ? 'text-red-600' 
                    : 'text-green-600'
                }`}>
                  {(studentStats.expectedTotal - studentStats.totalPaid) > 0 
                    ? 'To\'lash kerak' 
                    : 'To\'liq to\'langan'}
                </p>
              </div>
            </div>

            {/* Monthly payments breakdown */}
            <div className="bg-white rounded-lg p-4">
              <h4 className="font-semibold text-sm text-blue-900 mb-3">Oylik To'lovlar</h4>
              <div className="space-y-2">
                {(() => {
                  // Group payments by month
                  const paymentsByMonth = studentStats.allPayments.reduce((acc: any, payment: any) => {
                    const monthKey = new Date(payment.dueDate).toLocaleDateString('uz-UZ', { 
                      year: 'numeric', 
                      month: 'long' 
                    })
                    if (!acc[monthKey]) {
                      acc[monthKey] = {
                        completed: [],
                        pending: [],
                        total: 0
                      }
                    }
                    if (payment.status === 'COMPLETED') {
                      acc[monthKey].completed.push(payment)
                    } else {
                      acc[monthKey].pending.push(payment)
                    }
                    acc[monthKey].total += Number(payment.amount)
                    return acc
                  }, {})

                  return Object.entries(paymentsByMonth).map(([month, data]: [string, any]) => {
                    const completedSum = data.completed.reduce((sum: number, p: any) => sum + Number(p.amount), 0)
                    const pendingSum = data.pending.reduce((sum: number, p: any) => sum + Number(p.amount), 0)
                    
                    return (
                      <div key={month} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                        <div>
                          <p className="font-medium text-sm">{month}</p>
                          <p className="text-xs text-muted-foreground">
                            {data.completed.length + data.pending.length} ta to'lov
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-sm font-semibold text-green-600">
                              {formatNumber(completedSum)}
                            </p>
                            <p className="text-xs text-green-600">To'langan</p>
                          </div>
                          {pendingSum > 0 && (
                            <div className="text-right">
                              <p className="text-sm font-semibold text-red-600">
                                {formatNumber(pendingSum)}
                              </p>
                              <p className="text-xs text-red-600">Qarzi</p>
                            </div>
                          )}
                          {pendingSum === 0 && (
                            <div className="text-right">
                              <p className="text-sm font-semibold text-gray-400">✓</p>
                              <p className="text-xs text-gray-400">To'liq</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })
                })()}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">
              {formatNumber(totalRevenue)}
            </div>
            <p className="text-sm text-muted-foreground">To'langan (so'm)</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-orange-600">
              {formatNumber(pendingAmount)}
            </div>
            <p className="text-sm text-muted-foreground">Kutilmoqda (so'm)</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {payments.filter(p => p.status === 'COMPLETED').length}
            </div>
            <p className="text-sm text-muted-foreground">To'langan to'lovlar</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-orange-600">
              {payments.filter(p => p.status === 'PENDING' && p.dueDate < new Date()).length}
            </div>
            <p className="text-sm text-muted-foreground">Muddati o'tgan</p>
          </CardContent>
        </Card>
      </div>

      {/* Payments Table */}
      {payments.length > 0 ? (
        <PaymentsTable payments={payments} />
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
              {searchParams.search || searchParams.status || searchParams.paymentType
                ? 'Hech narsa topilmadi'
                : 'Hozircha to\'lovlar yo\'q'}
            </p>
            {(searchParams.search || searchParams.status || searchParams.paymentType) && (
              <ClearFilters />
            )}
            {!searchParams.search && !searchParams.status && !searchParams.paymentType && (
              <Button asChild>
                <Link href="/admin/payments/create">
                  <Plus className="mr-2 h-4 w-4" />
                  Birinchi to'lovni qabul qiling
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
