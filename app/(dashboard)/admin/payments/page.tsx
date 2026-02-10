import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, DollarSign, CheckCircle2, Clock, XCircle, Users } from 'lucide-react'
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
export const revalidate = 0 // Always fetch fresh data
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

  // Debug: Log where clause
  console.log('[Payments Page] Where clause:', JSON.stringify(whereClause, null, 2))

  // Get total count for pagination
  const totalPayments = await db.payment.count({ where: whereClause })
  const totalPages = Math.ceil(totalPayments / pageSize)

  console.log(`[Payments Page] Total payments found: ${totalPayments}`)

  const payments = await db.payment.findMany({
    where: whereClause,
    orderBy: getOrderBy(),
    skip,
    take: pageSize,
    include: {
      student: {
        select: {
          id: true,
          studentCode: true,
          monthlyTuitionFee: true,
          enrollmentDate: true,
          user: {
            select: {
              fullName: true
            }
          },
          class: {
            select: {
              id: true,
              name: true
            }
          }
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
      },
      transactions: {
        orderBy: {
          transactionDate: 'desc'
        },
        include: {
          receivedBy: {
            select: {
              fullName: true,
              email: true
            }
          }
        }
      }
    }
  })

  const totalRevenue = payments
    .filter(p => Number(p.paidAmount) > 0)
    .reduce((sum, p) => sum + Number(p.paidAmount), 0)

  // ✅ Barcha PENDING to'lovlar summasi (filter qo'llanmasdan)
  const allPendingPayments = await db.payment.findMany({
    where: {
      tenantId,
      status: 'PENDING'
    },
    select: {
      remainingAmount: true
    }
  })

  const pendingAmount = allPendingPayments.reduce((sum, p) => sum + Number(p.remainingAmount), 0)

  // ✅ Barcha COMPLETED to'lovlar soni (filter qo'llanmasdan)
  const totalCompletedPayments = await db.payment.count({
    where: {
      tenantId,
      status: 'COMPLETED'
    }
  })

  // ✅ Barcha PENDING to'lovlar soni (filter qo'llanmasdan)
  const totalPendingPayments = await db.payment.count({
    where: {
      tenantId,
      status: 'PENDING'
    }
  })

  // Debug: Count payment types
  const paymentTypeStats = payments.reduce((acc: any, p) => {
    acc[p.paymentType] = (acc[p.paymentType] || 0) + 1
    return acc
  }, {})
  console.log('[Payments Page] Payment types:', paymentTypeStats)

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
      select: {
        id: true,
        studentCode: true,
        monthlyTuitionFee: true,
        enrollmentDate: true,
        user: {
          select: {
            fullName: true,
            email: true,
            phone: true,
            avatar: true
          }
        },
        class: {
          select: {
            id: true,
            name: true
          }
        }
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
      totalPaid: allStudentPayments.reduce((sum, p) => sum + Number(p.paidAmount), 0),
      totalPending: allStudentPayments.reduce((sum, p) => sum + Number(p.remainingAmount), 0),
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
    select: {
      id: true,
      studentCode: true,
      monthlyTuitionFee: true,
      user: {
        select: {
          fullName: true
        }
      },
      class: {
        select: {
          id: true,
          name: true
        }
      }
    },
    orderBy: { user: { fullName: 'asc' } }
  })

  return (
    <div className="space-y-4 md:space-y-6 p-3 sm:p-4 md:p-6 pb-20 sm:pb-24 md:pb-6">
      {/* Modern Gradient Header - Enhanced Mobile */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-green-600 via-emerald-600 to-teal-600 p-4 sm:p-6 md:p-8 text-white shadow-2xl">
        <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,transparent,black)]" />
        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 sm:p-3 bg-white/20 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-lg">
                <DollarSign className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight">To'lovlar</h1>
                <p className="text-green-100 text-xs sm:text-sm md:text-base mt-0.5 sm:mt-1">
                  Barcha to'lovlarni boshqaring
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button 
                asChild 
                size="lg" 
                variant="secondary"
                className="bg-white/20 hover:bg-white/30 backdrop-blur-sm border-2 border-white/40"
              >
                <Link href="/admin/payments/student-overview">
                  <Users className="mr-2 h-5 w-5" />
                  To'lov Panoramasi
                </Link>
              </Button>
              <div className="text-sm sm:text-base bg-white/10 backdrop-blur-sm px-3 sm:px-4 py-2 rounded-lg border border-white/20">
                <span className="text-white/80">Jami: </span>
                <span className="font-bold">{totalPayments} ta</span>
              </div>
            </div>
          </div>
        </div>
        <div className="absolute -right-8 -top-8 h-32 w-32 sm:h-40 sm:w-40 rounded-full bg-white/10 blur-3xl"></div>
        <div className="absolute -left-8 -bottom-8 h-32 w-32 sm:h-40 sm:w-40 rounded-full bg-white/10 blur-3xl"></div>
      </div>

      {/* Modern Search and Filter - Mobile Optimized */}
      <Card className="border-2 shadow-lg">
        <CardContent className="p-3 sm:p-4 md:pt-6">
          <div className="space-y-3 sm:space-y-4">
            {/* Search Bar - Mobile First */}
            <div className="flex flex-col gap-2 sm:gap-3">
              <SearchBar 
                placeholder="Invoice, O'quvchi, Kod..." 
                className="w-full text-base"
              />
              <ClearFilters className="w-full sm:w-auto" />
            </div>

            {/* Filters - Mobile Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
              <FilterSelect
                paramName="status"
                options={[
                  { label: 'To\'langan', value: 'COMPLETED' },
                  { label: 'Qisman', value: 'PARTIALLY_PAID' },
                  { label: 'Kutilmoqda', value: 'PENDING' },
                  { label: 'Xato', value: 'FAILED' },
                  { label: 'Qaytarilgan', value: 'REFUNDED' },
                ]}
                placeholder="Status"
                className="w-full"
              />
              <FilterSelect
                paramName="paymentType"
                options={[
                  { label: 'O\'qish', value: 'TUITION' },
                  { label: 'Yotoqxona', value: 'DORMITORY' },
                  { label: 'Kitob', value: 'BOOKS' },
                  { label: 'Forma', value: 'UNIFORM' },
                  { label: 'Boshqa', value: 'OTHER' },
                ]}
                placeholder="Turi"
                className="w-full"
              />
              <FilterSelect
                paramName="classId"
                options={classes.map(c => ({ label: c.name, value: c.id }))}
                placeholder="Sinf"
                className="w-full"
              />
              <FilterSelect
                paramName="studentId"
                options={students.map(s => ({ 
                  label: `${s.user?.fullName || s.studentCode}`, 
                  value: s.id 
                }))}
                placeholder="O'quvchi"
                className="w-full"
              />
            </div>

            {/* Info Row - Mobile Optimized */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-3 pt-3 sm:pt-4 border-t">
              <PageSizeSelector currentPageSize={pageSize} />
              <div className="text-xs sm:text-sm text-muted-foreground">
                <span className="font-bold text-gray-900 text-sm sm:text-base">{totalPayments}</span> ta to'lov
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Student Statistics (if filtered) */}
      {studentStats && (
        <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-lg">
          <CardContent className="p-4 md:p-6">
            <div className="flex flex-col sm:flex-row items-start justify-between gap-3 mb-6">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg md:text-xl shadow-lg shrink-0">
                  {studentStats.student?.user?.fullName?.charAt(0) || '?'}
                </div>
                <div>
                  <h3 className="text-lg md:text-xl font-bold text-blue-900">
                    {studentStats.student?.user?.fullName || studentStats.student?.studentCode}
                  </h3>
                  <p className="text-sm text-blue-700">
                    {studentStats.student?.class?.name || 'Sinfsiz'} • {studentStats.student?.studentCode}
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm" asChild className="w-full sm:w-auto bg-white hover:bg-blue-50">
                <Link href="/admin/payments">
                  <XCircle className="h-4 w-4 mr-2" />
                  <span>Filterni tozalash</span>
                </Link>
              </Button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
              <div className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-l-blue-500 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs md:text-sm text-muted-foreground font-medium">Oylik to'lov</p>
                  <div className="p-1.5 bg-blue-100 rounded-lg">
                    <DollarSign className="h-4 w-4 text-blue-600" />
                  </div>
                </div>
                <p className="text-xl md:text-2xl font-bold text-blue-600 mb-1">
                  {formatNumber(studentStats.monthlyTuitionFee)}
                </p>
                <p className="text-xs text-blue-500">{studentStats.monthsEnrolled} oy</p>
              </div>

              <div className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-l-purple-500 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs md:text-sm text-muted-foreground font-medium">To'lashi kerak</p>
                  <div className="p-1.5 bg-purple-100 rounded-lg">
                    <Clock className="h-4 w-4 text-purple-600" />
                  </div>
                </div>
                <p className="text-xl md:text-2xl font-bold text-purple-600 mb-1">
                  {formatNumber(studentStats.expectedTotal)}
                </p>
                <p className="text-xs text-purple-500">Jami ({studentStats.monthsEnrolled} oy)</p>
              </div>
              
              <div className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-l-green-500 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs md:text-sm text-muted-foreground font-medium">To'langan</p>
                  <div className="p-1.5 bg-green-100 rounded-lg">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  </div>
                </div>
                <p className="text-xl md:text-2xl font-bold text-green-600 mb-1">
                  {formatNumber(studentStats.totalPaid)}
                </p>
                <p className="text-xs text-green-500">{studentStats.completedCount} ta to'lov</p>
              </div>
              
              <div className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-l-red-500 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs md:text-sm text-muted-foreground font-medium">Qarzi</p>
                  <div className={`p-1.5 rounded-lg ${
                    (studentStats.expectedTotal - studentStats.totalPaid) > 0 
                      ? 'bg-red-100' 
                      : 'bg-green-100'
                  }`}>
                    <XCircle className={`h-4 w-4 ${
                      (studentStats.expectedTotal - studentStats.totalPaid) > 0 
                        ? 'text-red-600' 
                        : 'text-green-600'
                    }`} />
                  </div>
                </div>
                <p className={`text-xl md:text-2xl font-bold mb-1 ${
                  (studentStats.expectedTotal - studentStats.totalPaid) > 0 
                    ? 'text-red-600' 
                    : 'text-green-600'
                }`}>
                  {formatNumber(Math.max(0, studentStats.expectedTotal - studentStats.totalPaid))}
                </p>
                <p className={`text-xs ${
                  (studentStats.expectedTotal - studentStats.totalPaid) > 0 
                    ? 'text-red-500' 
                    : 'text-green-500'
                }`}>
                  {(studentStats.expectedTotal - studentStats.totalPaid) > 0 
                    ? 'To\'lash kerak' 
                    : 'To\'liq to\'langan'}
                </p>
              </div>
            </div>

            {/* Monthly payments breakdown */}
            <div className="bg-white rounded-xl p-4 md:p-6 shadow-sm">
              <h4 className="font-bold text-base md:text-lg text-blue-900 mb-4 flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Oylik To'lovlar Taqsimoti
              </h4>
              <div className="space-y-3">
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
                    const isCompleted = pendingSum === 0
                    
                    return (
                      <div key={month} className={`flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border-2 rounded-xl transition-all ${
                        isCompleted 
                          ? 'border-green-200 bg-green-50 hover:bg-green-100' 
                          : 'border-orange-200 bg-orange-50 hover:bg-orange-100'
                      }`}>
                        <div className="mb-3 sm:mb-0">
                          <p className="font-semibold text-sm md:text-base text-gray-900">{month}</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                            <DollarSign className="h-3 w-3" />
                            {data.completed.length + data.pending.length} ta to'lov
                          </p>
                        </div>
                        <div className="flex items-center gap-4 w-full sm:w-auto">
                          <div className="text-left sm:text-right flex-1 sm:flex-none">
                            <p className="text-base md:text-lg font-bold text-green-600">
                              {formatNumber(completedSum)}
                            </p>
                            <p className="text-xs text-green-600">To'langan</p>
                          </div>
                          {pendingSum > 0 ? (
                            <div className="text-left sm:text-right flex-1 sm:flex-none">
                              <p className="text-base md:text-lg font-bold text-red-600">
                                {formatNumber(pendingSum)}
                              </p>
                              <p className="text-xs text-red-600">Qarzi</p>
                            </div>
                          ) : (
                            <div className="text-left sm:text-right flex-1 sm:flex-none">
                              <div className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 rounded-full">
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                                <span className="text-xs font-medium text-green-700">To'liq</span>
                              </div>
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

      {/* Modern Summary Stats - Mobile Enhanced */}
      <div className="grid gap-2 sm:gap-3 md:gap-4 grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-green-500 hover:shadow-xl transition-all hover:-translate-y-1">
          <CardContent className="p-3 sm:p-4 md:p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 sm:p-2.5 bg-green-100 rounded-lg sm:rounded-xl shadow-md">
                <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl md:text-3xl font-bold text-green-600 mb-1 truncate">
              {formatNumber(totalRevenue)}
            </div>
            <p className="text-[10px] sm:text-xs md:text-sm text-muted-foreground font-medium">To'langan summa</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500 hover:shadow-xl transition-all hover:-translate-y-1">
          <CardContent className="p-3 sm:p-4 md:p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 sm:p-2.5 bg-orange-100 rounded-lg sm:rounded-xl shadow-md">
                <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl md:text-3xl font-bold text-orange-600 mb-1 truncate">
              {formatNumber(pendingAmount)}
            </div>
            <p className="text-[10px] sm:text-xs md:text-sm text-muted-foreground font-medium">Kutilayotgan</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500 hover:shadow-xl transition-all hover:-translate-y-1">
          <CardContent className="p-3 sm:p-4 md:p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 sm:p-2.5 bg-blue-100 rounded-lg sm:rounded-xl shadow-md">
                <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl md:text-3xl font-bold text-blue-600 mb-1">
              {totalCompletedPayments}
            </div>
            <p className="text-[10px] sm:text-xs md:text-sm text-muted-foreground font-medium">To'langan</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500 hover:shadow-xl transition-all hover:-translate-y-1">
          <CardContent className="p-3 sm:p-4 md:p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 sm:p-2.5 bg-red-100 rounded-lg sm:rounded-xl shadow-md">
                <XCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-600" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl md:text-3xl font-bold text-red-600 mb-1">
              {totalPendingPayments}
            </div>
            <p className="text-[10px] sm:text-xs md:text-sm text-muted-foreground font-medium">Kutilmoqda</p>
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
        <Card className="border-2 border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 md:py-20">
            <div className="p-4 md:p-6 bg-green-50 rounded-full mb-4 md:mb-6">
              <DollarSign className="h-12 w-12 md:h-16 md:w-16 text-green-600" />
            </div>
            <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-2">
              {searchParams.search || searchParams.status || searchParams.paymentType
                ? 'Hech narsa topilmadi'
                : 'Hozircha to\'lovlar yo\'q'}
            </h3>
            <p className="text-sm md:text-base text-muted-foreground text-center mb-6 max-w-md">
              {searchParams.search || searchParams.status || searchParams.paymentType
                ? 'Qidiruv natijalariga mos to\'lov topilmadi. Filterni o\'zgartiring yoki tozalang.'
                : 'To\'lovlar ro\'yxati bo\'sh. To\'lovlar avtomatik yaratiladi yoki qo\'lda qo\'shiladi.'}
            </p>
            {(searchParams.search || searchParams.status || searchParams.paymentType) && (
              <ClearFilters />
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
