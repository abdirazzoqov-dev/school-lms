'use client'

import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CheckCircle2, Clock, AlertCircle, DollarSign } from 'lucide-react'
import { formatMoney, getMonthNameUz } from '@/lib/utils/payment-helper'
import Link from 'next/link'

interface MonthlyPaymentProgressProps {
  month: number
  year: number
  monthlyTuitionFee: number
  totalPaid: number
  remainingAmount: number
  percentagePaid: number
  isFullyPaid: boolean
  dueDate: Date
  paymentCount?: number
  paymentId?: string | null // ✅ Allow null
  studentId: string // ✅ Student ID for new payment
}

export function MonthlyPaymentProgress({
  month,
  year,
  monthlyTuitionFee,
  totalPaid,
  remainingAmount,
  percentagePaid,
  isFullyPaid,
  dueDate,
  paymentCount = 0,
  paymentId,
  studentId
}: MonthlyPaymentProgressProps) {
  const monthName = getMonthNameUz(month)
  const isOverdue = new Date() > dueDate && !isFullyPaid
  
  return (
    <div className="space-y-3 p-4 border rounded-lg">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-semibold text-sm">
            {monthName} {year}
          </h4>
          <p className="text-xs text-muted-foreground">
            Muddat: {dueDate.toLocaleDateString('uz-UZ')}
          </p>
        </div>
        {isFullyPaid ? (
          <Badge className="bg-green-500">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            To'landi
          </Badge>
        ) : isOverdue ? (
          <Badge variant="destructive">
            <AlertCircle className="h-3 w-3 mr-1" />
            Kechikkan
          </Badge>
        ) : (
          <Badge variant="secondary">
            <Clock className="h-3 w-3 mr-1" />
            Kutilmoqda
          </Badge>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>To'langan:</span>
          <span className="font-semibold">
            {formatMoney(totalPaid)} so'm
          </span>
        </div>
        
        <Progress value={percentagePaid} className="h-2" />
        
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">
            {percentagePaid}% to'landi
          </span>
          <span className="text-muted-foreground">
            {formatMoney(monthlyTuitionFee)} so'm
          </span>
        </div>

        {!isFullyPaid && (
          <div className="flex justify-between text-sm pt-2 border-t">
            <span className="text-orange-600 font-medium">Qarz:</span>
            <span className="text-orange-600 font-semibold">
              {formatMoney(remainingAmount)} so'm
            </span>
          </div>
        )}

        {paymentCount > 1 && (
          <p className="text-xs text-muted-foreground">
            {paymentCount} ta to'lov amalga oshirildi
          </p>
        )}
      </div>

      {/* ✅ To'lov qilish tugmasi */}
      {!isFullyPaid && (
        paymentId ? (
          <Link href={`/admin/payments/${paymentId}/edit`}>
            <Button size="sm" className="w-full" variant="default">
              <DollarSign className="h-4 w-4 mr-2" />
              To'lov qilish
            </Button>
          </Link>
        ) : (
          <Link href={`/admin/payments/create?studentId=${studentId}&month=${month}&year=${year}`}>
            <Button size="sm" className="w-full" variant="outline">
              <DollarSign className="h-4 w-4 mr-2" />
              To'lov yaratish
            </Button>
          </Link>
        )
      )}
    </div>
  )
}

