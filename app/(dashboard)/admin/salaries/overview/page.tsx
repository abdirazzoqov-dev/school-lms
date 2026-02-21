import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, User, Users, DollarSign, AlertCircle, CheckCircle2, TrendingUp, Award, MinusCircle } from 'lucide-react'
import Link from 'next/link'
import { SalaryOverviewClient } from './overview-client'

export const revalidate = 0

const MONTHS = ['Yan', 'Fev', 'Mar', 'Apr', 'May', 'Iyun', 'Iyul', 'Avg', 'Sen', 'Okt', 'Noy', 'Dek']

export default async function SalariesOverviewPage() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'MODERATOR')) redirect('/unauthorized')

  const tenantId = session.user.tenantId!
  const currentYear = new Date().getFullYear()

  const teachers = await db.teacher.findMany({
    where: { tenantId },
    include: {
      user: { select: { fullName: true, email: true } },
      salaryPayments: {
        where: { year: currentYear },
        select: { 
          month: true, 
          type: true, 
          status: true, 
          paidAmount: true, 
          remainingAmount: true,
          bonusAmount: true,
          deductionAmount: true
        }
      }
    }
  })

  const staff = await db.staff.findMany({
    where: { tenantId },
    include: {
      user: { select: { fullName: true, email: true } },
      salaryPayments: {
        where: { year: currentYear },
        select: { 
          month: true, 
          type: true, 
          status: true, 
          paidAmount: true, 
          remainingAmount: true,
          bonusAmount: true,
          deductionAmount: true
        }
      }
    }
  })

  const allEmployees = [
    ...teachers.map(t => ({
      id: t.id,
      name: t.user.fullName,
      email: t.user.email,
      salary: Number(t.monthlySalary) || 0,
      payments: t.salaryPayments.map(p => ({
        month: p.month || 0,
        type: p.type,
        status: p.status,
        paidAmount: Number(p.paidAmount) || 0,
        remainingAmount: Number(p.remainingAmount) || 0,
        bonusAmount: Number(p.bonusAmount) || 0,
        deductionAmount: Number(p.deductionAmount) || 0
      }))
    })),
    ...staff.map(s => ({
      id: s.id,
      name: s.user.fullName,
      email: s.user.email,
      salary: Number(s.monthlySalary) || 0,
      payments: s.salaryPayments.map(p => ({
        month: p.month || 0,
        type: p.type,
        status: p.status,
        paidAmount: Number(p.paidAmount) || 0,
        remainingAmount: Number(p.remainingAmount) || 0,
        bonusAmount: Number(p.bonusAmount) || 0,
        deductionAmount: Number(p.deductionAmount) || 0
      }))
    }))
  ]

  // Calculate totals for summary
  let totalEmployees = allEmployees.length
  let totalSalaryBudget = 0
  let totalPaidAmount = 0
  let totalDebtAmount = 0
  let totalBonuses = 0
  let totalDeductions = 0
  let fullyPaidCount = 0

  allEmployees.forEach(emp => {
    const paid = emp.payments.filter(p => p.status === 'PAID').reduce((s, p) => s + Number(p.paidAmount), 0)
    const debt = emp.payments.filter(p => p.status !== 'PAID' && p.status !== 'CANCELLED').reduce((s, p) => s + Number(p.remainingAmount), 0)
    const bonuses = emp.payments.reduce((s, p) => s + Number(p.bonusAmount), 0)
    const deductions = emp.payments.reduce((s, p) => s + Number(p.deductionAmount), 0)
    const monthsPaid = emp.payments.filter(p => p.type === 'FULL_SALARY' && p.status === 'PAID').length
    
    totalSalaryBudget += emp.salary * 12
    totalPaidAmount += paid
    totalDebtAmount += debt
    totalBonuses += bonuses
    totalDeductions += deductions
    if (monthsPaid === 12 && debt === 0) fullyPaidCount++
  })

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/salaries">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Ortga
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Xodimlar Umumiy Ko'rinish</h1>
            <p className="text-sm text-muted-foreground">{currentYear} yil</p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4">
        <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Jami Xodimlar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-blue-600">{totalEmployees}</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Yillik Byudjet
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-purple-600">{(totalSalaryBudget / 1000000).toFixed(1)}M</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-green-100">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              To'langan
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">{(totalPaidAmount / 1000000).toFixed(1)}M</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-amber-100">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Award className="h-4 w-4" />
              Bonuslar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-amber-600">{(totalBonuses / 1000000).toFixed(1)}M</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-red-200 bg-gradient-to-br from-red-50 to-red-100">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <MinusCircle className="h-4 w-4" />
              Ushlab Qolish
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">{(totalDeductions / 1000000).toFixed(1)}M</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-orange-100">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Qarz
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-orange-600">{(totalDebtAmount / 1000000).toFixed(1)}M</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-emerald-100">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              To'liq To'langan
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-emerald-600">{fullyPaidCount}</p>
          </CardContent>
        </Card>
      </div>

      {/* Client Component for Search, Filter, Sort, Pagination */}
      <SalaryOverviewClient employees={allEmployees} currentYear={currentYear} months={MONTHS} />
    </div>
  )
}
