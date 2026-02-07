import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, User } from 'lucide-react'
import Link from 'next/link'

export const revalidate = 0

const MONTHS = ['Yan', 'Fev', 'Mar', 'Apr', 'May', 'Iyun', 'Iyul', 'Avg', 'Sen', 'Okt', 'Noy', 'Dek']

export default async function SalariesOverviewPage() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') redirect('/unauthorized')

  const tenantId = session.user.tenantId!
  const currentYear = new Date().getFullYear()

  const teachers = await db.teacher.findMany({
    where: { tenantId },
    include: {
      user: { select: { fullName: true, email: true } },
      salaryPayments: {
        where: { year: currentYear },
        select: { month: true, type: true, status: true, paidAmount: true, remainingAmount: true }
      }
    }
  })

  const staff = await db.staff.findMany({
    where: { tenantId },
    include: {
      user: { select: { fullName: true, email: true } },
      salaryPayments: {
        where: { year: currentYear },
        select: { month: true, type: true, status: true, paidAmount: true, remainingAmount: true }
      }
    }
  })

  const allEmployees = [
    ...teachers.map(t => ({
      name: t.user.fullName,
      email: t.user.email,
      salary: Number(t.monthlySalary) || 0,
      payments: t.salaryPayments
    })),
    ...staff.map(s => ({
      name: s.user.fullName,
      email: s.user.email,
      salary: Number(s.monthlySalary) || 0,
      payments: s.salaryPayments
    }))
  ]

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" asChild>
          <Link href="/admin/salaries">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Ortga
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Xodimlar Umumiy Ko'rinish</h1>
          <p className="text-sm text-muted-foreground">{currentYear} yil - {allEmployees.length} ta xodim</p>
        </div>
      </div>

      <div className="space-y-4">
        {allEmployees.map((emp, idx) => {
          const totalPaid = emp.payments.filter(p => p.status === 'PAID').reduce((s, p) => s + Number(p.paidAmount), 0)
          const totalDebt = emp.payments.filter(p => p.status !== 'PAID' && p.status !== 'CANCELLED').reduce((s, p) => s + Number(p.remainingAmount), 0)
          const monthsPaid = emp.payments.filter(p => p.type === 'FULL_SALARY' && p.status === 'PAID').length
          
          return (
            <Card key={idx} className="border-2">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold">
                      {emp.name.charAt(0)}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{emp.name}</CardTitle>
                      <p className="text-xs text-muted-foreground">{emp.email}</p>
                    </div>
                  </div>
                  {totalDebt > 0 && (
                    <Badge variant="destructive">
                      Qarz: {(totalDebt / 1000000).toFixed(1)}M so'm
                    </Badge>
                  )}
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-xs text-muted-foreground mb-1">Oylik</p>
                    <p className="text-xl font-bold text-blue-600">{(emp.salary / 1000000).toFixed(1)}M</p>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-xs text-muted-foreground mb-1">To'langan</p>
                    <p className="text-xl font-bold text-green-600">{(totalPaid / 1000000).toFixed(1)}M</p>
                  </div>
                  <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                    <p className="text-xs text-muted-foreground mb-1">Qolgan</p>
                    <p className="text-xl font-bold text-orange-600">{(totalDebt / 1000000).toFixed(1)}M</p>
                  </div>
                  <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                    <p className="text-xs text-muted-foreground mb-1">Oylar</p>
                    <p className="text-xl font-bold text-purple-600">{monthsPaid}/12</p>
                  </div>
                </div>

                <div className="flex gap-1 sm:gap-2 overflow-x-auto pb-2">
                  {MONTHS.map((month, i) => {
                    const monthPayment = emp.payments.find(p => p.month === i + 1 && p.type === 'FULL_SALARY')
                    const isPaid = monthPayment?.status === 'PAID'
                    const isPartial = monthPayment?.status === 'PARTIALLY_PAID'
                    const isPending = monthPayment && !isPaid && !isPartial
                    
                    return (
                      <div
                        key={i}
                        className={`flex-1 min-w-[60px] p-2 rounded-lg text-center border-2 ${
                          isPaid ? 'bg-green-500 border-green-600 text-white' :
                          isPartial ? 'bg-yellow-500 border-yellow-600 text-white' :
                          isPending ? 'bg-orange-500 border-orange-600 text-white' :
                          'bg-gray-100 border-gray-300 text-gray-500'
                        }`}
                        title={`${month} ${currentYear}`}
                      >
                        <p className="text-xs font-bold">{month}</p>
                        <p className="text-[10px] mt-1">
                          {isPaid ? '✓' : isPartial ? '~' : isPending ? '⏳' : '–'}
                        </p>
                      </div>
                    )
                  })}
                </div>

                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="px-2 py-1 bg-green-500 text-white rounded">✓ To'langan</span>
                  <span className="px-2 py-1 bg-yellow-500 text-white rounded">~ Qisman</span>
                  <span className="px-2 py-1 bg-orange-500 text-white rounded">⏳ Kutilmoqda</span>
                  <span className="px-2 py-1 bg-gray-100 text-gray-500 rounded">– Berilmagan</span>
                </div>
              </CardContent>
            </Card>
          )
        })}

        {allEmployees.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <User className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-lg font-semibold text-muted-foreground">Xodimlar topilmadi</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
