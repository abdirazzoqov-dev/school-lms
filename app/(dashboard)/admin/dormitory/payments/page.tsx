import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Building2, Bed, DollarSign, TrendingUp, Users, Calendar, CheckCircle2, Clock, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { DormitoryPaymentsTable } from './dormitory-payments-table'

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
  const selectedMonth = searchParams.month ? parseInt(searchParams.month) : currentDate.getMonth() + 1
  const selectedYear = searchParams.year ? parseInt(searchParams.year) : currentDate.getFullYear()
  const selectedBuilding = searchParams.building
  const selectedStatus = searchParams.status

  // Get all dormitory payments
  const payments = await db.payment.findMany({
    where: {
      tenantId,
      paymentType: 'DORMITORY',
      ...(selectedMonth && selectedYear
        ? {
            paymentMonth: selectedMonth,
            paymentYear: selectedYear,
          }
        : {}),
      ...(selectedStatus ? { status: selectedStatus } : {}),
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
        (p) => p.student.dormitoryAssignment?.room.buildingId === selectedBuilding
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

  // Generate month and year options
  const months = [
    { value: '1', label: 'Yanvar' },
    { value: '2', label: 'Fevral' },
    { value: '3', label: 'Mart' },
    { value: '4', label: 'Aprel' },
    { value: '5', label: 'May' },
    { value: '6', label: 'Iyun' },
    { value: '7', label: 'Iyul' },
    { value: '8', label: 'Avgust' },
    { value: '9', label: 'Sentyabr' },
    { value: '10', label: 'Oktyabr' },
    { value: '11', label: 'Noyabr' },
    { value: '12', label: 'Dekabr' },
  ]

  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i)

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
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtrlash</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Oy</label>
              <Select value={selectedMonth.toString()} onValueChange={(value) => {
                const params = new URLSearchParams(searchParams)
                params.set('month', value)
                window.location.href = `?${params.toString()}`
              }}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {months.map((month) => (
                    <SelectItem key={month.value} value={month.value}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Yil</label>
              <Select value={selectedYear.toString()} onValueChange={(value) => {
                const params = new URLSearchParams(searchParams)
                params.set('year', value)
                window.location.href = `?${params.toString()}`
              }}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Bino</label>
              <Select value={selectedBuilding || 'all'} onValueChange={(value) => {
                const params = new URLSearchParams(searchParams)
                if (value === 'all') {
                  params.delete('building')
                } else {
                  params.set('building', value)
                }
                window.location.href = `?${params.toString()}`
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Barcha binolar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Barcha binolar</SelectItem>
                  {buildings.map((building) => (
                    <SelectItem key={building.id} value={building.id}>
                      {building.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Status</label>
              <Select value={selectedStatus || 'all'} onValueChange={(value) => {
                const params = new URLSearchParams(searchParams)
                if (value === 'all') {
                  params.delete('status')
                } else {
                  params.set('status', value)
                }
                window.location.href = `?${params.toString()}`
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Barcha statuslar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Barcha statuslar</SelectItem>
                  <SelectItem value="PENDING">Kutilmoqda</SelectItem>
                  <SelectItem value="COMPLETED">To&apos;langan</SelectItem>
                  <SelectItem value="OVERDUE">Muddati o&apos;tgan</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

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

