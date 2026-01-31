import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  DollarSign, Users, TrendingUp, AlertCircle, Plus,
  CreditCard, CheckCircle2, Clock, Download
} from 'lucide-react'
import Link from 'next/link'
import { Progress } from '@/components/ui/progress'
import { currentMonth, currentYear, monthNames } from '@/lib/validations/salary'
import { SalarySearchFilter } from '@/components/salary-search-filter'
import { SalariesTableClient } from './salaries-table-client'
import { formatNumber } from '@/lib/utils'

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
          user: {
            fullName: {
              contains: searchQuery,
              mode: 'insensitive'
            }
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
        select: {
          id: true,
          monthlySalary: true,  // ✅ O'qituvchining asosiy oylik maoshi
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
          staffCode: true,
          position: true,
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
      {/* Header - Modern Gradient */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-600 via-emerald-600 to-teal-600 p-8 text-white shadow-2xl">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                  <DollarSign className="h-8 w-8" />
                </div>
                <h1 className="text-4xl font-bold">Xodimlar Maoshi</h1>
              </div>
              <p className="text-green-50 text-lg">
                O'qituvchilar va xodimlar oylik maoshi, avans va mukofotlarni boshqarish
              </p>
            </div>
            <Button 
              asChild 
              size="lg" 
              className="bg-white text-green-600 hover:bg-green-50 shadow-lg hover:shadow-xl transition-all"
            >
              <Link href="/admin/salaries/create">
                <Plus className="mr-2 h-5 w-5" />
                Maosh To'lash
              </Link>
            </Button>
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10 blur-2xl"></div>
        <div className="absolute -left-8 -bottom-8 h-40 w-40 rounded-full bg-white/10 blur-2xl"></div>
      </div>

      {/* Statistics Cards - Modern Design */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="relative overflow-hidden border-2 border-green-200 bg-gradient-to-br from-green-50 via-emerald-50 to-green-100 hover:shadow-lg transition-all group">
          <div className="absolute inset-0 bg-gradient-to-br from-green-400/10 to-emerald-400/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <CardContent className="pt-6 relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">To'langan</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatNumber(totalPaid)} so'm
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {paidCount} ta to'lov
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-full group-hover:scale-110 transition-transform">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-2 border-orange-200 bg-gradient-to-br from-orange-50 via-amber-50 to-orange-100 hover:shadow-lg transition-all group">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-400/10 to-amber-400/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <CardContent className="pt-6 relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Qolgan (Kutilmoqda)</p>
                <p className="text-2xl font-bold text-orange-600">
                  {formatNumber(totalPending)} so'm
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {pendingCount} ta to'lov
                </p>
              </div>
              <div className="p-3 bg-orange-100 rounded-full group-hover:scale-110 transition-transform">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-2 border-blue-200 bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-100 hover:shadow-lg transition-all group">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-400/10 to-cyan-400/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <CardContent className="pt-6 relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avanslar</p>
                <p className="text-2xl font-bold text-blue-600">
                  {formatNumber(totalAdvances)} so'm
                </p>
                <p className="text-xs text-blue-600/70 mt-1 font-medium">
                  Oldindan to'langan
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full group-hover:scale-110 transition-transform">
                <CreditCard className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-2 border-purple-200 bg-gradient-to-br from-purple-50 via-pink-50 to-purple-100 hover:shadow-lg transition-all group">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-400/10 to-pink-400/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <CardContent className="pt-6 relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Mukofotlar</p>
                <p className="text-2xl font-bold text-purple-600">
                  {formatNumber(totalBonuses)} so'm
                </p>
                <p className="text-xs text-purple-600/70 mt-1 font-medium">
                  Qo'shimcha to'lovlar
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full group-hover:scale-110 transition-transform">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search & Filters - Modern Design */}
      <Card className="border-2 bg-gradient-to-br from-slate-50 to-gray-50">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <div className="h-8 w-1 bg-gradient-to-b from-green-600 to-emerald-600 rounded-full"></div>
            Qidiruv va Filtrlar
          </CardTitle>
          <CardDescription>Xodimlarni ism-familiya bo'yicha qidiring va oylar kesimida ko'ring</CardDescription>
        </CardHeader>
        <CardContent>
          <SalarySearchFilter />
        </CardContent>
      </Card>

      {/* Payments List - Modern Design */}
      <Card className="border-2">
        <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <div className="h-8 w-1 bg-gradient-to-b from-green-600 to-emerald-600 rounded-full"></div>
                To'lovlar Ro'yxati
              </CardTitle>
              <CardDescription className="mt-1">
                {salaryPayments.length} ta to'lov topildi • Avans va qolgan summalar bilan
              </CardDescription>
            </div>
            {salaryPayments.length > 0 && (
              <Button
                asChild
                variant="outline"
                className="border-green-600 text-green-600 hover:bg-green-600 hover:text-white"
              >
                <Link href={`/api/admin/salaries/export?month=${selectedMonth}&year=${selectedYear}${selectedType ? `&type=${selectedType}` : ''}${selectedStatus ? `&status=${selectedStatus}` : ''}${searchQuery ? `&search=${searchQuery}` : ''}`}>
                  <Download className="mr-2 h-4 w-4" />
                  Excel
                </Link>
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {salaryPayments.length > 0 ? (
            <SalariesTableClient 
              salaryPayments={salaryPayments as any} 
              groupedByEmployee={true}
            />
          ) : (
            <div className="text-center py-12">
              <div className="inline-block p-4 bg-gradient-to-br from-gray-100 to-slate-100 rounded-full mb-4">
                <AlertCircle className="h-16 w-16 text-muted-foreground opacity-50" />
              </div>
              <p className="text-lg font-semibold text-muted-foreground mb-2">
                To'lovlar topilmadi
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                Tanlangan filtrlar bo'yicha hech qanday to'lov topilmadi
              </p>
              <Button asChild className="bg-green-600 hover:bg-green-700">
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

