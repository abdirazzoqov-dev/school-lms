'use client'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  CheckCircle2, Clock, XCircle, AlertTriangle, 
  TrendingUp, TrendingDown, Calendar 
} from 'lucide-react'

interface SalaryOverviewCardProps {
  employee: {
    id: string
    name: string
    email: string
    avatar?: string | null
    position?: string
    code?: string
  }
  monthlySalary: number
  currentYear: number
  payments: {
    month: number
    year: number
    type: string
    status: string
    amount: number
    paidAmount: number
    remainingAmount: number
  }[]
}

const MONTHS = [
  'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun',
  'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'
]

export function SalaryOverviewCard({ employee, monthlySalary, currentYear, payments }: SalaryOverviewCardProps) {
  // Calculate total paid this year
  const totalPaid = payments
    .filter(p => p.year === currentYear && p.status === 'PAID')
    .reduce((sum, p) => sum + Number(p.paidAmount), 0)

  // Calculate total debt
  const totalDebt = payments
    .filter(p => p.status !== 'PAID' && p.status !== 'CANCELLED')
    .reduce((sum, p) => sum + Number(p.remainingAmount), 0)

  // Expected total for year (current month included)
  const currentMonth = new Date().getMonth() + 1
  const expectedTotal = monthlySalary * currentMonth

  // Payment progress
  const progressPercentage = expectedTotal > 0 ? (totalPaid / expectedTotal) * 100 : 0

  // Month statuses
  const getMonthStatus = (monthIndex: number) => {
    const monthPayments = payments.filter(p => 
      p.month === monthIndex + 1 && 
      p.year === currentYear &&
      p.type === 'FULL_SALARY'
    )

    if (monthPayments.length === 0) {
      return monthIndex < currentMonth ? 'unpaid' : 'future'
    }

    const isPaid = monthPayments.some(p => p.status === 'PAID')
    const isPartial = monthPayments.some(p => p.status === 'PARTIALLY_PAID')

    if (isPaid) return 'paid'
    if (isPartial) return 'partial'
    return 'pending'
  }

  // Get upcoming payment
  const currentMonthPayment = payments.find(p => 
    p.month === currentMonth && 
    p.year === currentYear &&
    p.status !== 'PAID'
  )

  return (
    <Card className="border-2 hover:shadow-xl transition-all">
      <CardContent className="pt-6">
        {/* Employee Info */}
        <div className="flex items-start gap-4 mb-6">
          <Avatar className="h-14 w-14 border-2 border-blue-200">
            <AvatarImage src={employee.avatar || undefined} />
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold text-lg">
              {employee.name.charAt(0)}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1">
            <h3 className="font-semibold text-lg">{employee.name}</h3>
            <p className="text-sm text-muted-foreground">{employee.email}</p>
            {employee.position && (
              <Badge variant="outline" className="mt-1">
                {employee.position}
              </Badge>
            )}
            {employee.code && (
              <Badge variant="secondary" className="mt-1 ml-2">
                {employee.code}
              </Badge>
            )}
          </div>

          {/* Debt/Credit Badge */}
          {totalDebt > 0 && (
            <Badge variant="destructive" className="text-xs">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Qarz: {totalDebt.toLocaleString('uz-UZ')} so'm
            </Badge>
          )}
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-3 rounded-lg border border-green-200">
            <p className="text-xs text-muted-foreground mb-1">To'landi</p>
            <p className="font-bold text-green-600">
              {totalPaid.toLocaleString('uz-UZ')}
            </p>
            <p className="text-xs text-muted-foreground">so'm</p>
          </div>

          <div className="bg-gradient-to-br from-orange-50 to-amber-50 p-3 rounded-lg border border-orange-200">
            <p className="text-xs text-muted-foreground mb-1">Qolgan</p>
            <p className="font-bold text-orange-600">
              {totalDebt.toLocaleString('uz-UZ')}
            </p>
            <p className="text-xs text-muted-foreground">so'm</p>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-3 rounded-lg border border-blue-200">
            <p className="text-xs text-muted-foreground mb-1">Oylik</p>
            <p className="font-bold text-blue-600">
              {monthlySalary.toLocaleString('uz-UZ')}
            </p>
            <p className="text-xs text-muted-foreground">so'm</p>
          </div>
        </div>

        {/* Progress */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Yillik Progress</span>
            <span className="text-sm font-bold text-blue-600">
              {progressPercentage.toFixed(0)}%
            </span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
          <p className="text-xs text-muted-foreground mt-1">
            {totalPaid.toLocaleString('uz-UZ')} / {expectedTotal.toLocaleString('uz-UZ')} so'm
          </p>
        </div>

        {/* Monthly Timeline */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              {currentYear} yil oylar holati
            </span>
          </div>
          
          <div className="grid grid-cols-6 gap-2">
            {MONTHS.map((month, index) => {
              const status = getMonthStatus(index)
              
              return (
                <div
                  key={month}
                  className={`
                    p-2 rounded-lg border-2 text-center transition-all cursor-pointer hover:scale-105
                    ${status === 'paid' ? 'bg-green-100 border-green-300 hover:bg-green-200' : ''}
                    ${status === 'partial' ? 'bg-yellow-100 border-yellow-300 hover:bg-yellow-200' : ''}
                    ${status === 'pending' ? 'bg-orange-100 border-orange-300 hover:bg-orange-200' : ''}
                    ${status === 'unpaid' ? 'bg-red-100 border-red-300 hover:bg-red-200' : ''}
                    ${status === 'future' ? 'bg-gray-100 border-gray-300' : ''}
                  `}
                >
                  <p className="text-xs font-bold truncate">{month.slice(0, 3)}</p>
                  <div className="flex justify-center mt-1">
                    {status === 'paid' && <CheckCircle2 className="h-3 w-3 text-green-600" />}
                    {status === 'partial' && <TrendingUp className="h-3 w-3 text-yellow-600" />}
                    {status === 'pending' && <Clock className="h-3 w-3 text-orange-600" />}
                    {status === 'unpaid' && <XCircle className="h-3 w-3 text-red-600" />}
                    {status === 'future' && <span className="h-3 w-3 text-gray-400">•</span>}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-3 mt-3 text-xs">
            <div className="flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3 text-green-600" />
              <span>To'langan</span>
            </div>
            <div className="flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-yellow-600" />
              <span>Qisman</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3 text-orange-600" />
              <span>Kutilmoqda</span>
            </div>
            <div className="flex items-center gap-1">
              <XCircle className="h-3 w-3 text-red-600" />
              <span>Berilmagan</span>
            </div>
          </div>
        </div>

        {/* Next Payment Alert */}
        {currentMonthPayment && (
          <div className="mt-4 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-sm font-semibold text-blue-900">
                  {MONTHS[currentMonth - 1]} oylik to'lanmagan
                </p>
                <p className="text-xs text-blue-700">
                  Qolgan: {currentMonthPayment.remainingAmount.toLocaleString('uz-UZ')} so'm
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
