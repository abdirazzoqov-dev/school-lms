'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { 
  CheckCircle2, Clock, XCircle, AlertTriangle, 
  TrendingUp, Calendar, Phone, 
  DollarSign, History, ChevronDown, ChevronUp,
  Mail
} from 'lucide-react'
import Link from 'next/link'

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
  const [isExpanded, setIsExpanded] = useState(false)

  const totalPaid = payments
    .filter(p => p.year === currentYear && p.status === 'PAID')
    .reduce((sum, p) => sum + Number(p.paidAmount), 0)

  const totalDebt = payments
    .filter(p => p.status !== 'PAID' && p.status !== 'CANCELLED')
    .reduce((sum, p) => sum + Number(p.remainingAmount), 0)

  const currentMonth = new Date().getMonth() + 1
  const expectedTotal = monthlySalary * currentMonth
  const progressPercentage = expectedTotal > 0 ? (totalPaid / expectedTotal) * 100 : 0

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

  const currentMonthPayment = payments.find(p => 
    p.month === currentMonth && 
    p.year === currentYear &&
    p.status !== 'PAID'
  )

  return (
    <Card className="border-2 hover:shadow-xl transition-all overflow-hidden">
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-start gap-3 sm:gap-4 mb-4">
          <Avatar className="h-12 w-12 sm:h-14 sm:w-14 border-2 border-blue-200 shrink-0">
            <AvatarImage src={employee.avatar || undefined} />
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold text-base sm:text-lg">
              {employee.name.charAt(0)}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base sm:text-lg truncate">{employee.name}</h3>
            <p className="text-xs sm:text-sm text-muted-foreground truncate">{employee.email}</p>
            <div className="flex flex-wrap gap-1 sm:gap-2 mt-1">
              {employee.position && (
                <Badge variant="outline" className="text-xs">
                  {employee.position}
                </Badge>
              )}
              {employee.code && (
                <Badge variant="secondary" className="text-xs">
                  {employee.code}
                </Badge>
              )}
            </div>
          </div>

          {totalDebt > 0 && (
            <Badge variant="destructive" className="text-xs shrink-0">
              <AlertTriangle className="h-3 w-3 sm:mr-1" />
              <span className="hidden sm:inline">Qarz: </span>
              {(totalDebt / 1000000).toFixed(1)}M
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
          <Button
            size="sm"
            variant="outline"
            className="w-full text-xs sm:text-sm"
            asChild
          >
            <a href={`tel:${employee.email}`}>
              <Phone className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
              <span className="hidden sm:inline">Qo'ng'iroq</span>
              <span className="sm:hidden">Tel</span>
            </a>
          </Button>
          
          <Button
            size="sm"
            variant="outline"
            className="w-full text-xs sm:text-sm"
            asChild
          >
            <a href={`mailto:${employee.email}`}>
              <Mail className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
              <span className="hidden sm:inline">Email</span>
              <span className="sm:hidden">Mail</span>
            </a>
          </Button>

          <Button
            size="sm"
            variant="default"
            className="w-full text-xs sm:text-sm bg-green-600 hover:bg-green-700"
            asChild
          >
            <Link href={`/admin/salaries/create?employee=${employee.id}`}>
              <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
              <span className="hidden sm:inline">To'lash</span>
              <span className="sm:hidden">Pay</span>
            </Link>
          </Button>

          <Button
            size="sm"
            variant="outline"
            className="w-full text-xs sm:text-sm"
            asChild
          >
            <Link href={`/admin/salaries?search=${employee.name}`}>
              <History className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
              <span className="hidden sm:inline">Tarix</span>
              <span className="sm:hidden">Log</span>
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-4">
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-2 sm:p-3 rounded-lg border border-green-200">
            <p className="text-[10px] sm:text-xs text-muted-foreground mb-0.5 sm:mb-1">To'landi</p>
            <p className="font-bold text-sm sm:text-base text-green-600">
              {(totalPaid / 1000000).toFixed(1)}M
            </p>
            <p className="text-[10px] sm:text-xs text-muted-foreground">so'm</p>
          </div>

          <div className="bg-gradient-to-br from-orange-50 to-amber-50 p-2 sm:p-3 rounded-lg border border-orange-200">
            <p className="text-[10px] sm:text-xs text-muted-foreground mb-0.5 sm:mb-1">Qolgan</p>
            <p className="font-bold text-sm sm:text-base text-orange-600">
              {(totalDebt / 1000000).toFixed(1)}M
            </p>
            <p className="text-[10px] sm:text-xs text-muted-foreground">so'm</p>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-2 sm:p-3 rounded-lg border border-blue-200">
            <p className="text-[10px] sm:text-xs text-muted-foreground mb-0.5 sm:mb-1">Oylik</p>
            <p className="font-bold text-sm sm:text-base text-blue-600">
              {(monthlySalary / 1000000).toFixed(1)}M
            </p>
            <p className="text-[10px] sm:text-xs text-muted-foreground">so'm</p>
          </div>
        </div>

        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs sm:text-sm font-medium">Yillik Progress</span>
            <span className="text-sm sm:text-base font-bold text-blue-600">
              {progressPercentage.toFixed(0)}%
            </span>
          </div>
          <Progress value={progressPercentage} className="h-2 sm:h-3" />
          <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
            {(totalPaid / 1000000).toFixed(1)}M / {(expectedTotal / 1000000).toFixed(1)}M so'm
          </p>
        </div>

        <div className="space-y-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full flex items-center justify-between hover:bg-gray-50 p-2 rounded-lg transition-colors"
          >
            <span className="text-xs sm:text-sm font-medium flex items-center gap-2">
              <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
              {currentYear} yil oylar holati
            </span>
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
          
          {isExpanded && (
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5 sm:gap-2">
              {MONTHS.map((month, index) => {
                const status = getMonthStatus(index)
                
                return (
                  <div
                    key={month}
                    className={`
                      p-1.5 sm:p-2 rounded-md sm:rounded-lg border sm:border-2 text-center transition-all cursor-pointer active:scale-95 sm:hover:scale-105
                      ${status === 'paid' ? 'bg-green-100 border-green-300 active:bg-green-200 sm:hover:bg-green-200' : ''}
                      ${status === 'partial' ? 'bg-yellow-100 border-yellow-300 active:bg-yellow-200 sm:hover:bg-yellow-200' : ''}
                      ${status === 'pending' ? 'bg-orange-100 border-orange-300 active:bg-orange-200 sm:hover:bg-orange-200' : ''}
                      ${status === 'unpaid' ? 'bg-red-100 border-red-300 active:bg-red-200 sm:hover:bg-red-200' : ''}
                      ${status === 'future' ? 'bg-gray-100 border-gray-300' : ''}
                    `}
                  >
                    <p className="text-[10px] sm:text-xs font-bold truncate">{month.slice(0, 3)}</p>
                    <div className="flex justify-center mt-0.5 sm:mt-1">
                      {status === 'paid' && <CheckCircle2 className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-green-600" />}
                      {status === 'partial' && <TrendingUp className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-yellow-600" />}
                      {status === 'pending' && <Clock className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-orange-600" />}
                      {status === 'unpaid' && <XCircle className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-red-600" />}
                      {status === 'future' && <span className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-gray-400 text-xs">•</span>}
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="flex flex-wrap gap-2 sm:gap-3 mt-2 sm:mt-3 text-[10px] sm:text-xs">
              <div className="flex items-center gap-0.5 sm:gap-1">
                <CheckCircle2 className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-green-600" />
                <span>To'langan</span>
              </div>
              <div className="flex items-center gap-0.5 sm:gap-1">
                <TrendingUp className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-yellow-600" />
                <span>Qisman</span>
              </div>
              <div className="flex items-center gap-0.5 sm:gap-1">
                <Clock className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-orange-600" />
                <span>Kutilmoqda</span>
              </div>
              <div className="flex items-center gap-0.5 sm:gap-1">
                <XCircle className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-red-600" />
                <span>Berilmagan</span>
              </div>
            </div>
          )}
        </div>

        {currentMonthPayment && (
          <div className="mt-4 p-2 sm:p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border sm:border-2 border-blue-200 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-semibold text-blue-900 truncate">
                  {MONTHS[currentMonth - 1]} oylik to'lanmagan
                </p>
                <p className="text-[10px] sm:text-xs text-blue-700">
                  Qolgan: {(currentMonthPayment.remainingAmount / 1000000).toFixed(1)}M so'm
                </p>
              </div>
              <Button
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-xs sm:text-sm shrink-0"
                asChild
              >
                <Link href={`/admin/salaries/create?employee=${employee.id}`}>
                  <DollarSign className="h-3 w-3 sm:mr-1" />
                  <span className="hidden sm:inline">To'lash</span>
                </Link>
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
