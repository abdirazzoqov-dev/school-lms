import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, DollarSign, TrendingUp, AlertCircle, Award } from 'lucide-react'
import Link from 'next/link'
import { TeacherMonthlyOverviewClient } from './overview-client'

export const revalidate = 0

const MONTHS = ['Yan', 'Fev', 'Mar', 'Apr', 'May', 'Iyun', 'Iyul', 'Avg', 'Sen', 'Okt', 'Noy', 'Dek']

export default async function TeacherSalaryOverviewPage() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'TEACHER') redirect('/unauthorized')

  const tenantId = session.user.tenantId!
  const currentYear = new Date().getFullYear()

  // Get teacher with full payment details
  const teacher = await db.teacher.findUnique({
    where: { userId: session.user.id },
    include: {
      user: { select: { fullName: true, email: true } },
      salaryPayments: {
        where: { year: currentYear },
        select: { 
          id: true,
          month: true, 
          type: true, 
          status: true, 
          paidAmount: true, 
          remainingAmount: true, 
          description: true,
          baseSalary: true,
          bonusAmount: true,
          deductionAmount: true,
          paymentDate: true,
          createdAt: true
        }
      }
    }
  })

  if (!teacher) redirect('/unauthorized')

  const monthlySalary = Number(teacher.monthlySalary) || 0
  
  // Process payments
  const payments = teacher.salaryPayments.map(p => ({
    id: p.id,
    month: p.month || 0,
    type: p.type,
    status: p.status,
    paidAmount: Number(p.paidAmount) || 0,
    remainingAmount: Number(p.remainingAmount) || 0,
    description: p.description,
    baseSalary: Number(p.baseSalary) || 0,
    bonusAmount: Number(p.bonusAmount) || 0,
    deductionAmount: Number(p.deductionAmount) || 0,
    paymentDate: p.paymentDate,
    createdAt: p.createdAt
  }))

  // Calculate totals with bonus/deduction from FULL_SALARY
  const totalPaid = payments.filter(p => p.status === 'PAID').reduce((s, p) => s + p.paidAmount, 0)
  const totalDebt = payments.filter(p => p.status !== 'PAID' && p.status !== 'CANCELLED').reduce((s, p) => s + p.remainingAmount, 0)
  const monthsPaid = payments.filter(p => p.type === 'FULL_SALARY' && p.status === 'PAID').length
  
  const totalDeductions = payments.reduce((s, p) => {
    if (p.type === 'DEDUCTION') return s + p.paidAmount
    if (p.type === 'FULL_SALARY' && p.deductionAmount) return s + p.deductionAmount
    return s
  }, 0)
  
  const totalBonuses = payments.reduce((s, p) => {
    if (p.type === 'BONUS') return s + p.paidAmount
    if (p.type === 'FULL_SALARY' && p.bonusAmount) return s + p.bonusAmount
    return s
  }, 0)

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" asChild>
          <Link href="/teacher/salary">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Ortga
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Yillik Maosh Ko'rinishi</h1>
          <p className="text-sm text-muted-foreground">{currentYear} yil - {teacher.user.fullName}</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Oylik Maosh
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-blue-600">{(monthlySalary / 1000000).toFixed(1)}M</p>
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
            <p className="text-2xl font-bold text-green-600">{(totalPaid / 1000000).toFixed(1)}M</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-green-100">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Award className="h-4 w-4" />
              Bonuslar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">{(totalBonuses / 1000000).toFixed(1)}M</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-red-200 bg-gradient-to-br from-red-50 to-red-100">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2 text-xs">
              ⛔ Ushlab qolish
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">{(totalDeductions / 1000000).toFixed(1)}M</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">Oylar</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-purple-600">{monthsPaid}/12</p>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Timeline - Interactive */}
      <TeacherMonthlyOverviewClient
        payments={payments}
        monthlySalary={monthlySalary}
        currentYear={currentYear}
        months={MONTHS}
      />
    </div>
  )
}
