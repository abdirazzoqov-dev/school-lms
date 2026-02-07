import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, DollarSign, TrendingUp, AlertCircle } from 'lucide-react'
import Link from 'next/link'

export const revalidate = 0

const MONTHS = ['Yan', 'Fev', 'Mar', 'Apr', 'May', 'Iyun', 'Iyul', 'Avg', 'Sen', 'Okt', 'Noy', 'Dek']

export default async function TeacherSalaryOverviewPage() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'TEACHER') redirect('/unauthorized')

  const tenantId = session.user.tenantId!
  const currentYear = new Date().getFullYear()

  // Get teacher
  const teacher = await db.teacher.findUnique({
    where: { userId: session.user.id },
    include: {
      user: { select: { fullName: true, email: true } },
      salaryPayments: {
        where: { year: currentYear },
        select: { month: true, type: true, status: true, paidAmount: true, remainingAmount: true, description: true }
      }
    }
  })

  if (!teacher) redirect('/unauthorized')

  const monthlySalary = Number(teacher.monthlySalary) || 0
  
  // Process payments
  const payments = teacher.salaryPayments.map(p => ({
    month: p.month || 0,
    type: p.type,
    status: p.status,
    paidAmount: Number(p.paidAmount) || 0,
    remainingAmount: Number(p.remainingAmount) || 0,
    description: p.description
  }))

  // Calculate totals
  const totalPaid = payments.filter(p => p.status === 'PAID').reduce((s, p) => s + p.paidAmount, 0)
  const totalDebt = payments.filter(p => p.status !== 'PAID' && p.status !== 'CANCELLED').reduce((s, p) => s + p.remainingAmount, 0)
  const monthsPaid = payments.filter(p => p.type === 'FULL_SALARY' && p.status === 'PAID').length
  const totalDeductions = payments.filter(p => p.type === 'DEDUCTION').reduce((s, p) => s + p.paidAmount, 0)
  const totalBonuses = payments.filter(p => p.type === 'BONUS').reduce((s, p) => s + p.paidAmount, 0)

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

        <Card className="border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-orange-100">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Qarz
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-orange-600">{(totalDebt / 1000000).toFixed(1)}M</p>
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

      {/* Monthly Timeline */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle>12 Oylik Ko'rinish</CardTitle>
          <CardDescription>
            Har bir oy uchun to'lov holati va tafsilotlari
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Month Cards */}
          {MONTHS.map((month, i) => {
            // Get ALL payments for this month
            const monthPayments = payments.filter(p => p.month === i + 1)
            
            // Check if there's FULL_SALARY payment that is PAID
            const hasFullSalaryPaid = monthPayments.some(p => 
              p.type === 'FULL_SALARY' && p.status === 'PAID'
            )
            
            // Calculate total paid for this month
            const totalPaidThisMonth = monthPayments
              .filter(p => p.status === 'PAID' || p.status === 'PARTIALLY_PAID')
              .reduce((sum, p) => sum + p.paidAmount, 0)
            
            // Get deductions for this month
            const monthDeductions = monthPayments
              .filter(p => p.type === 'DEDUCTION')
              .reduce((sum, p) => sum + p.paidAmount, 0)
            
            // Get bonuses for this month
            const monthBonuses = monthPayments
              .filter(p => p.type === 'BONUS')
              .reduce((sum, p) => sum + p.paidAmount, 0)
            
            // Check if there's any pending payment
            const hasPending = monthPayments.some(p => p.status === 'PENDING')
            
            // Determine status
            // If FULL_SALARY is paid, month is considered fully paid (even with deductions)
            const isPaid = hasFullSalaryPaid || totalPaidThisMonth >= monthlySalary
            const isPartial = !hasFullSalaryPaid && totalPaidThisMonth > 0 && totalPaidThisMonth < monthlySalary
            const isPending = hasPending && totalPaidThisMonth === 0
            
            return (
              <div
                key={i}
                className={`p-4 rounded-lg border-2 ${
                  isPaid ? 'bg-green-50 border-green-200' :
                  isPartial ? 'bg-yellow-50 border-yellow-200' :
                  isPending ? 'bg-orange-50 border-orange-200' :
                  'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold text-white ${
                      isPaid ? 'bg-green-500' :
                      isPartial ? 'bg-yellow-500' :
                      isPending ? 'bg-orange-500' :
                      'bg-gray-400'
                    }`}>
                      {i + 1}
                    </div>
                    <div>
                      <p className="font-bold text-lg">{month} {currentYear}</p>
                      <p className="text-sm text-muted-foreground">
                        {isPaid ? '✓ To\'langan' : 
                         isPartial ? `~ Qisman (${(totalPaidThisMonth/1000000).toFixed(1)}M / ${(monthlySalary/1000000).toFixed(1)}M)` :
                         isPending ? '⏳ Kutilmoqda' : 
                         '– Berilmagan'}
                      </p>
                    </div>
                  </div>
                  
                  {/* Status Badge */}
                  <Badge variant={isPaid ? 'default' : isPartial ? 'secondary' : 'outline'}>
                    {isPaid ? '100%' : isPartial ? `${Math.round((totalPaidThisMonth / monthlySalary) * 100)}%` : '0%'}
                  </Badge>
                </div>

                {/* Details */}
                {monthPayments.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3">
                    <div className="bg-white p-2 rounded border">
                      <p className="text-xs text-muted-foreground">To'langan</p>
                      <p className="text-sm font-bold text-green-600">{(totalPaidThisMonth / 1000000).toFixed(1)}M</p>
                    </div>
                    <div className="bg-white p-2 rounded border">
                      <p className="text-xs text-muted-foreground">Qolgan</p>
                      <p className="text-sm font-bold text-orange-600">
                        {(Math.max(0, monthlySalary - totalPaidThisMonth) / 1000000).toFixed(1)}M
                      </p>
                    </div>
                    {monthBonuses > 0 && (
                      <div className="bg-white p-2 rounded border">
                        <p className="text-xs text-muted-foreground">🎁 Mukofot</p>
                        <p className="text-sm font-bold text-green-600">+{(monthBonuses / 1000000).toFixed(1)}M</p>
                      </div>
                    )}
                    {monthDeductions > 0 && (
                      <div className="bg-white p-2 rounded border border-red-200">
                        <p className="text-xs text-red-600">⛔ Ushlab qolish</p>
                        <p className="text-sm font-bold text-red-600">-{(monthDeductions / 1000000).toFixed(1)}M</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Payment descriptions */}
                {monthPayments.filter(p => p.description).length > 0 && (
                  <div className="mt-3 space-y-1">
                    {monthPayments.filter(p => p.description).map((payment, idx) => (
                      <p key={idx} className="text-xs text-muted-foreground">
                        📝 {payment.description}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </CardContent>
      </Card>
    </div>
  )
}
