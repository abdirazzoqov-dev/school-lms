import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Users, TrendingDown, ArrowLeft, Download } from 'lucide-react'
import Link from 'next/link'
import { SalaryOverviewCard } from '@/components/salary-overview-card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

export const revalidate = 0

export default async function SalariesOverviewPage({
  searchParams
}: {
  searchParams: { search?: string; filter?: string }
}) {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'ADMIN') {
    redirect('/unauthorized')
  }

  const tenantId = session.user.tenantId!
  const currentYear = new Date().getFullYear()
  const searchQuery = searchParams.search
  const filterType = searchParams.filter // 'debt', 'paid', 'all'

  // Get all teachers with salary info
  const teachers = await db.teacher.findMany({
    where: {
      tenantId,
      ...(searchQuery && {
        user: {
          fullName: {
            contains: searchQuery,
            mode: 'insensitive'
          }
        }
      })
    },
    include: {
      user: {
        select: {
          fullName: true,
          email: true,
          avatar: true,
        }
      },
      salaryPayments: {
        where: {
          year: currentYear
        },
        select: {
          month: true,
          year: true,
          type: true,
          status: true,
          amount: true,
          paidAmount: true,
          remainingAmount: true,
        }
      }
    },
    orderBy: {
      user: {
        fullName: 'asc'
      }
    }
  })

  // Get all staff with salary info
  const staff = await db.staff.findMany({
    where: {
      tenantId,
      ...(searchQuery && {
        user: {
          fullName: {
            contains: searchQuery,
            mode: 'insensitive'
          }
        }
      })
    },
    include: {
      user: {
        select: {
          fullName: true,
          email: true,
          avatar: true,
        }
      },
      salaryPayments: {
        where: {
          year: currentYear
        },
        select: {
          month: true,
          year: true,
          type: true,
          status: true,
          amount: true,
          paidAmount: true,
          remainingAmount: true,
        }
      }
    },
    orderBy: {
      user: {
        fullName: 'asc'
      }
    }
  })

  // Combine and format employees
  const employees = [
    ...teachers.map(t => ({
      id: t.id,
      name: t.user.fullName,
      email: t.user.email,
      avatar: t.user.avatar,
      code: t.teacherCode,
      position: 'O\'qituvchi',
      monthlySalary: Number(t.monthlySalary) || 0,
      payments: t.salaryPayments.map(p => ({
        month: p.month || 0,
        year: p.year || currentYear,
        type: p.type,
        status: p.status,
        amount: Number(p.amount),
        paidAmount: Number(p.paidAmount),
        remainingAmount: Number(p.remainingAmount),
      }))
    })),
    ...staff.map(s => ({
      id: s.id,
      name: s.user.fullName,
      email: s.user.email,
      avatar: s.user.avatar,
      code: s.staffCode,
      position: s.position,
      monthlySalary: Number(s.monthlySalary) || 0,
      payments: s.salaryPayments.map(p => ({
        month: p.month || 0,
        year: p.year || currentYear,
        type: p.type,
        status: p.status,
        amount: Number(p.amount),
        paidAmount: Number(p.paidAmount),
        remainingAmount: Number(p.remainingAmount),
      }))
    }))
  ]

  // Apply filter
  let filteredEmployees = employees
  if (filterType === 'debt') {
    filteredEmployees = employees.filter(e => 
      e.payments.some(p => p.status !== 'PAID' && p.remainingAmount > 0)
    )
  } else if (filterType === 'paid') {
    filteredEmployees = employees.filter(e => 
      e.payments.every(p => p.status === 'PAID')
    )
  }

  // Calculate statistics
  const totalDebt = employees.reduce((sum, e) => 
    sum + e.payments
      .filter(p => p.status !== 'PAID')
      .reduce((s, p) => s + p.remainingAmount, 0), 
    0
  )

  const employeesWithDebt = employees.filter(e => 
    e.payments.some(p => p.status !== 'PAID' && p.remainingAmount > 0)
  ).length

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 p-8 text-white shadow-2xl">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <Button
                  asChild
                  variant="secondary"
                  size="sm"
                  className="bg-white/20 hover:bg-white/30 backdrop-blur-sm"
                >
                  <Link href="/admin/salaries">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Ortga
                  </Link>
                </Button>
              </div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                  <Users className="h-8 w-8" />
                </div>
                <h1 className="text-4xl font-bold">Xodimlar Umumiy Ko'rinish</h1>
              </div>
              <p className="text-indigo-50 text-lg">
                Har bir xodim uchun oylik-oylik to'lov holati va qarzlar
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Jami Xodimlar</p>
                <p className="text-3xl font-bold text-blue-600">{employees.length}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-red-200 bg-gradient-to-br from-red-50 to-orange-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Qarzdorlar</p>
                <p className="text-3xl font-bold text-red-600">{employeesWithDebt}</p>
              </div>
              <TrendingDown className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Jami Qarz</p>
                <p className="text-2xl font-bold text-orange-600">
                  {totalDebt.toLocaleString('uz-UZ')}
                </p>
                <p className="text-xs text-muted-foreground">so'm</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Qidiruv va Filtrlar</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <form method="GET">
                <Input
                  name="search"
                  placeholder="Xodim ismi bo'yicha qidirish..."
                  defaultValue={searchQuery}
                  className="w-full"
                />
              </form>
            </div>
            <div className="flex gap-2">
              <Button
                asChild
                variant={!filterType || filterType === 'all' ? 'default' : 'outline'}
                size="sm"
              >
                <Link href="/admin/salaries/overview">
                  Barchasi ({employees.length})
                </Link>
              </Button>
              <Button
                asChild
                variant={filterType === 'debt' ? 'destructive' : 'outline'}
                size="sm"
              >
                <Link href="/admin/salaries/overview?filter=debt">
                  Qarzdorlar ({employeesWithDebt})
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Employees Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredEmployees.map(employee => (
          <SalaryOverviewCard
            key={employee.id}
            employee={{
              id: employee.id,
              name: employee.name,
              email: employee.email,
              avatar: employee.avatar,
              position: employee.position,
              code: employee.code,
            }}
            monthlySalary={employee.monthlySalary}
            currentYear={currentYear}
            payments={employee.payments}
          />
        ))}
      </div>

      {filteredEmployees.length === 0 && (
        <Card>
          <CardContent className="py-16 text-center">
            <Users className="h-16 w-16 text-muted-foreground opacity-50 mx-auto mb-4" />
            <p className="text-lg font-semibold text-muted-foreground">
              Xodimlar topilmadi
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
