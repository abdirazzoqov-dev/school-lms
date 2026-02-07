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
  searchParams: { search?: string; filter?: string; sort?: string }
}) {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'ADMIN') {
    redirect('/unauthorized')
  }

  const tenantId = session.user.tenantId!
  const currentYear = new Date().getFullYear()
  const searchQuery = searchParams.search
  const filterType = searchParams.filter // 'debt', 'paid', 'all'
  const sortType = searchParams.sort || 'name' // 'name', 'debt', 'progress'

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

  // Apply sort
  filteredEmployees.sort((a, b) => {
    if (sortType === 'debt') {
      const aDebt = a.payments.filter(p => p.status !== 'PAID').reduce((s, p) => s + p.remainingAmount, 0)
      const bDebt = b.payments.filter(p => p.status !== 'PAID').reduce((s, p) => s + p.remainingAmount, 0)
      return bDebt - aDebt // Highest debt first
    } else if (sortType === 'progress') {
      const currentMonth = new Date().getMonth() + 1
      const aExpected = a.monthlySalary * currentMonth
      const aPaid = a.payments.filter(p => p.status === 'PAID').reduce((s, p) => s + p.paidAmount, 0)
      const aProgress = aExpected > 0 ? (aPaid / aExpected) * 100 : 0
      
      const bExpected = b.monthlySalary * currentMonth
      const bPaid = b.payments.filter(p => p.status === 'PAID').reduce((s, p) => s + p.paidAmount, 0)
      const bProgress = bExpected > 0 ? (bPaid / bExpected) * 100 : 0
      
      return bProgress - aProgress // Highest progress first
    }
    return a.name.localeCompare(b.name) // Name (default)
  })

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
    <div className="space-y-4 sm:space-y-6 p-3 sm:p-6">
      {/* Header - Mobile Optimized */}
      <div className="relative overflow-hidden rounded-xl sm:rounded-2xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 p-4 sm:p-8 text-white shadow-2xl">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10">
          <Button
            asChild
            variant="secondary"
            size="sm"
            className="bg-white/20 hover:bg-white/30 backdrop-blur-sm mb-3 sm:mb-4"
          >
            <Link href="/admin/salaries">
              <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              <span className="text-xs sm:text-sm">Ortga</span>
            </Link>
          </Button>
          
          <div className="flex items-start gap-2 sm:gap-3 mb-2">
            <div className="p-2 sm:p-3 bg-white/20 backdrop-blur-sm rounded-lg sm:rounded-xl">
              <Users className="h-5 w-5 sm:h-8 sm:w-8" />
            </div>
            <div>
              <h1 className="text-xl sm:text-3xl lg:text-4xl font-bold">
                Xodimlar Umumiy Ko'rinish
              </h1>
              <p className="text-indigo-50 text-xs sm:text-sm lg:text-lg mt-1">
                Har bir xodim uchun oylik-oylik to'lov holati va qarzlar
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics - Mobile Optimized */}
      <div className="grid gap-3 sm:gap-4 grid-cols-3">
        <Card className="border sm:border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
          <CardContent className="p-3 sm:pt-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between gap-2">
              <div>
                <p className="text-[10px] sm:text-sm font-medium text-muted-foreground">Jami</p>
                <p className="text-xl sm:text-3xl font-bold text-blue-600">{employees.length}</p>
              </div>
              <Users className="h-5 w-5 sm:h-8 sm:w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border sm:border-2 border-red-200 bg-gradient-to-br from-red-50 to-orange-50">
          <CardContent className="p-3 sm:pt-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between gap-2">
              <div>
                <p className="text-[10px] sm:text-sm font-medium text-muted-foreground">Qarzd.</p>
                <p className="text-xl sm:text-3xl font-bold text-red-600">{employeesWithDebt}</p>
              </div>
              <TrendingDown className="h-5 w-5 sm:h-8 sm:w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border sm:border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50">
          <CardContent className="p-3 sm:pt-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between gap-2">
              <div>
                <p className="text-[10px] sm:text-sm font-medium text-muted-foreground">Qarz</p>
                <p className="text-base sm:text-2xl font-bold text-orange-600">
                  {(totalDebt / 1000000).toFixed(1)}M
                </p>
                <p className="text-[10px] sm:text-xs text-muted-foreground">so'm</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters - Mobile Enhanced */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm sm:text-lg">Qidiruv va Filtrlar</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Search */}
          <form method="GET">
            <Input
              name="search"
              placeholder="Xodim ismi..."
              defaultValue={searchQuery}
              className="w-full text-sm"
            />
            <input type="hidden" name="filter" value={filterType || ''} />
            <input type="hidden" name="sort" value={sortType} />
          </form>

          {/* Filter Chips */}
          <div className="flex flex-wrap gap-2">
            <Button
              asChild
              variant={!filterType || filterType === 'all' ? 'default' : 'outline'}
              size="sm"
              className="text-xs sm:text-sm"
            >
              <Link href={`/admin/salaries/overview?sort=${sortType}`}>
                Barchasi ({employees.length})
              </Link>
            </Button>
            <Button
              asChild
              variant={filterType === 'debt' ? 'destructive' : 'outline'}
              size="sm"
              className="text-xs sm:text-sm"
            >
              <Link href={`/admin/salaries/overview?filter=debt&sort=${sortType}`}>
                Qarzdorlar ({employeesWithDebt})
              </Link>
            </Button>
          </div>

          {/* Sort Options */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <span className="text-xs text-muted-foreground whitespace-nowrap">Saralash:</span>
            <Button
              asChild
              variant={sortType === 'name' ? 'secondary' : 'ghost'}
              size="sm"
              className="text-xs"
            >
              <Link href={`/admin/salaries/overview?${filterType ? `filter=${filterType}&` : ''}sort=name`}>
                Ism
              </Link>
            </Button>
            <Button
              asChild
              variant={sortType === 'debt' ? 'secondary' : 'ghost'}
              size="sm"
              className="text-xs"
            >
              <Link href={`/admin/salaries/overview?${filterType ? `filter=${filterType}&` : ''}sort=debt`}>
                Qarz
              </Link>
            </Button>
            <Button
              asChild
              variant={sortType === 'progress' ? 'secondary' : 'ghost'}
              size="sm"
              className="text-xs"
            >
              <Link href={`/admin/salaries/overview?${filterType ? `filter=${filterType}&` : ''}sort=progress`}>
                Progress
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Employees Grid - Responsive */}
      <div className="grid gap-3 sm:gap-4 lg:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
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
