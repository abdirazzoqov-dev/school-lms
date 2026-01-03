import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  DollarSign, Users, TrendingUp, AlertCircle, Plus,
  CreditCard, CheckCircle2, Clock
} from 'lucide-react'
import Link from 'next/link'
import { Progress } from '@/components/ui/progress'
import { currentMonth, currentYear, monthNames } from '@/lib/validations/salary'
import { SalarySearchFilter } from '@/components/salary-search-filter'
import { SalariesTableClient } from './salaries-table-client'

export const revalidate = 0
export const dynamic = 'force-dynamic'

export default async function SalariesPage({
  searchParams
}: {
  searchParams: { month?: string; year?: string; type?: string; status?: string; search?: string }
}) {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'ADMIN') {
    redirect('/unauthorized')
  }

  const tenantId = session.user.tenantId!
  
  // Parse filters
  const selectedMonth = searchParams.month ? parseInt(searchParams.month) : currentMonth
  const selectedYear = searchParams.year ? parseInt(searchParams.year) : currentYear
  const selectedType = searchParams.type
  const selectedStatus = searchParams.status
  const searchQuery = searchParams.search

  // Build where clause
  const where: any = { tenantId }
  if (selectedMonth && selectedYear) {
    where.month = selectedMonth
    where.year = selectedYear
  }
  if (selectedType) where.type = selectedType
  if (selectedStatus) where.status = selectedStatus
  
  // Search by employee name
  if (searchQuery) {
    where.OR = [
      {
        teacher: {
          user: {
            fullName: {
              contains: searchQuery,
              mode: 'insensitive'
            }
          }
        }
      },
      {
        staff: {
          fullName: {
            contains: searchQuery,
            mode: 'insensitive'
          }
        }
      }
    ]
  }

  // Get salary payments with notes for payment history
  const salaryPayments = await db.salaryPayment.findMany({
    where,
    include: {
      teacher: {
        include: {
          user: {
            select: {
              fullName: true,
              avatar: true,
              email: true,
              phone: true
            }
          }
        }
      },
      staff: {
        select: {
          fullName: true,
          avatar: true,
          email: true,
          phone: true,
          role: true
        }
      },
      paidBy: {
        select: {
          fullName: true
        }
      }
    },
    orderBy: [
      { status: 'asc' },
      { createdAt: 'desc' }
    ]
  })

  // Calculate statistics
  const totalPaid = salaryPayments
    .filter(p => p.status === 'PAID')
    .reduce((sum, p) => sum + Number(p.paidAmount), 0)

  const totalPending = salaryPayments
    .filter(p => p.status === 'PENDING' || p.status === 'PARTIALLY_PAID')
    .reduce((sum, p) => sum + Number(p.remainingAmount), 0)

  const totalAdvances = salaryPayments
    .filter(p => p.type === 'ADVANCE')
    .reduce((sum, p) => sum + Number(p.paidAmount), 0)

  const totalBonuses = salaryPayments
    .filter(p => p.type === 'BONUS')
    .reduce((sum, p) => sum + Number(p.paidAmount), 0)

  const paidCount = salaryPayments.filter(p => p.status === 'PAID').length
  const pendingCount = salaryPayments.filter(p => p.status === 'PENDING' || p.status === 'PARTIALLY_PAID').length
  

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <DollarSign className="h-8 w-8 text-green-600" />
            Xodimlar Maoshi
          </h1>
          <p className="text-muted-foreground mt-1">
            O'qituvchilar va xodimlar oylik maoshi, avans va mukofotlarni boshqarish
          </p>
        </div>
        <Button asChild size="lg" className="shadow-md">
          <Link href="/admin/salaries/create">
            <Plus className="mr-2 h-5 w-5" />
            Maosh To'lash
          </Link>
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">To'langan</p>
                <p className="text-2xl font-bold text-green-600">
                  {totalPaid.toLocaleString('uz-UZ')} so'm
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {paidCount} ta to'lov
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Kutilmoqda</p>
                <p className="text-2xl font-bold text-amber-600">
                  {totalPending.toLocaleString('uz-UZ')} so'm
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {pendingCount} ta to'lov
                </p>
              </div>
              <div className="p-3 bg-amber-100 rounded-full">
                <Clock className="h-6 w-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avanslar</p>
                <p className="text-2xl font-bold text-blue-600">
                  {totalAdvances.toLocaleString('uz-UZ')} so'm
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <CreditCard className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Mukofotlar</p>
                <p className="text-2xl font-bold text-purple-600">
                  {totalBonuses.toLocaleString('uz-UZ')} so'm
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search & Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Qidiruv va Filtrlar</CardTitle>
          <CardDescription>Xodimlarni ism-familiya bo'yicha qidiring va oylar kesimida ko'ring</CardDescription>
        </CardHeader>
        <CardContent>
          <SalarySearchFilter />
        </CardContent>
      </Card>

      {/* Payments List */}
      <Card>
        <CardHeader>
          <CardTitle>To'lovlar Ro'yxati</CardTitle>
          <CardDescription>
            {salaryPayments.length} ta to'lov topildi
          </CardDescription>
        </CardHeader>
        <CardContent>
          {salaryPayments.length > 0 ? (
            <SalariesTableClient 
              salaryPayments={salaryPayments as any} 
              groupedByEmployee={true}
            />
          ) : (
            <div className="text-center py-12">
              <AlertCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-lg font-semibold text-muted-foreground mb-2">
                To'lovlar topilmadi
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                Tanlangan filtrlar bo'yicha hech qanday to'lov topilmadi
              </p>
              <Button asChild>
                <Link href="/admin/salaries/create">
                  <Plus className="mr-2 h-4 w-4" />
                  Yangi to'lov qo'shish
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

