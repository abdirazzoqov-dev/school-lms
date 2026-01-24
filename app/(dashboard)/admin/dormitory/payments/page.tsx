import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Building2, Bed, DollarSign, TrendingUp, Users, Calendar, CheckCircle2, Clock, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { DormitoryPaymentsTable } from './dormitory-payments-table'
import { DormitoryPaymentsFilters } from './filters'

export const dynamic = 'force-dynamic'
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function DormitoryPaymentsPage({
  searchParams,
}: {
  searchParams: { month?: string; year?: string; building?: string; status?: string }
}) {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'ADMIN') {
    redirect('/unauthorized')
  }

  const tenantId = session.user.tenantId!

  // Get current date for filtering
  const currentDate = new Date()
  const selectedMonth = searchParams.month ? parseInt(searchParams.month) : undefined
  const selectedYear = searchParams.year ? parseInt(searchParams.year) : undefined
  const selectedBuilding = searchParams.building
  const selectedStatus = searchParams.status as 'PENDING' | 'PARTIALLY_PAID' | 'COMPLETED' | undefined

  // Get all dormitory payments
  const payments = await db.payment.findMany({
    where: {
      tenantId,
      paymentType: 'DORMITORY',
      ...(selectedMonth ? { paymentMonth: selectedMonth } : {}),
      ...(selectedYear ? { paymentYear: selectedYear } : {}),
      ...(selectedStatus && ['PENDING', 'PARTIALLY_PAID', 'COMPLETED'].includes(selectedStatus) 
        ? { status: selectedStatus } 
        : {}),
    },
    include: {
      student: {
        include: {
          user: true,
          dormitoryAssignment: {
            include: {
              room: {
                include: {
                  building: true,
                },
              },
              bed: true,
            },
          },
        },
      },
      parent: {
        include: {
          user: true,
        },
      },
    },
    orderBy: [
      { status: 'asc' },
      { dueDate: 'asc' },
    ],
  })

  // Filter by building if selected
  const filteredPayments = selectedBuilding
    ? payments.filter(
        (p) => p.student?.dormitoryAssignment?.room?.buildingId === selectedBuilding
      )
    : payments

  // Get all buildings for filter
  const buildings = await db.dormitoryBuilding.findMany({
    where: { tenantId },
    orderBy: { name: 'asc' },
  })

  // Calculate statistics
  const totalPayments = filteredPayments.length
  const completedPayments = filteredPayments.filter((p) => p.status === 'COMPLETED').length
  const pendingPayments = filteredPayments.filter((p) => p.status === 'PENDING').length
  const overduePayments = filteredPayments.filter(
    (p) => p.status === 'PENDING' && new Date(p.dueDate) < currentDate
  ).length

  const totalAmount = filteredPayments.reduce((sum, p) => sum + Number(p.amount), 0)
  const paidAmount = filteredPayments.reduce((sum, p) => sum + Number(p.paidAmount || 0), 0)
  const remainingAmount = filteredPayments.reduce((sum, p) => sum + Number(p.remainingAmount || 0), 0)

  const paymentRate = totalAmount > 0 ? (paidAmount / totalAmount) * 100 : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Yotoqxona To&apos;lovlari</h1>
          <p className="text-muted-foreground mt-1">
            Yotoqxonada yashaydigan o&apos;quvchilarning to&apos;lovlarini boshqaring
          </p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Jami To&apos;lovlar</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPayments}</div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
              <CheckCircle2 className="h-3 w-3 text-green-600" />
              {completedPayments} to&apos;langan
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Jami Summa</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalAmount.toLocaleString('uz-UZ')} so&apos;m
            </div>
            <Progress value={paymentRate} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {paymentRate.toFixed(1)}% to&apos;langan
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">To&apos;langan</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {paidAmount.toLocaleString('uz-UZ')} so&apos;m
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {completedPayments} ta to&apos;lov
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Qarzdorlik</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {remainingAmount.toLocaleString('uz-UZ')} so&apos;m
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
              <Clock className="h-3 w-3 text-amber-600" />
              {overduePayments} muddati o&apos;tgan
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <DormitoryPaymentsFilters
        selectedMonth={selectedMonth}
        selectedYear={selectedYear}
        selectedBuilding={selectedBuilding}
        selectedStatus={selectedStatus}
        buildings={buildings}
      />

      {/* Payments Table */}
      <Card>
        <CardHeader>
          <CardTitle>To&apos;lovlar Ro&apos;yxati</CardTitle>
        </CardHeader>
        <CardContent>
          <DormitoryPaymentsTable payments={filteredPayments} />
        </CardContent>
      </Card>
    </div>
  )
}

