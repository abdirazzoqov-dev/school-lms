'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Calendar, Info } from 'lucide-react'
import { formatNumber } from '@/lib/utils'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { useState } from 'react'
import { Button } from '@/components/ui/button'

interface PaymentCardProps {
  payment: {
    id: string
    amount: number
    paidAmount: number | null
    remainingAmount: number | null
    paymentType: string
    paymentMonth: number | null
    paymentYear: number | null
    paidDate: Date | null
    notes: string | null
    status: string
  }
  monthNames: string[]
}

export function PaymentCard({ payment, monthNames }: PaymentCardProps) {
  const [isOpen, setIsOpen] = useState(false)
  
  const paidAmount = Number(payment.paidAmount || 0)
  const totalAmount = Number(payment.amount)
  const remainingAmount = Number(payment.remainingAmount || 0)
  const percentage = totalAmount > 0 ? Math.round((paidAmount / totalAmount) * 100) : 0
  
  // Calculate installments (if partially paid)
  const hasPartialPayment = percentage > 0 && percentage < 100
  
  return (
    <Card className="border-2 hover:shadow-lg transition-all">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-4 mb-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap mb-2">
                {/* Type Badge */}
                {payment.paymentType === 'TUITION' && (
                  <Badge className="bg-blue-600">📚 O'qish haqi</Badge>
                )}
                {payment.paymentType === 'BOOKS' && (
                  <Badge className="bg-purple-600">📖 Darsliklar</Badge>
                )}
                {payment.paymentType === 'UNIFORM' && (
                  <Badge className="bg-green-600">👔 Forma</Badge>
                )}
                {payment.paymentType === 'OTHER' && (
                  <Badge className="bg-gray-600">📦 Boshqa</Badge>
                )}

                {/* Status Badge */}
                {percentage === 100 && remainingAmount === 0 && (
                  <Badge className="bg-green-600">✓ To'langan</Badge>
                )}
                {hasPartialPayment && (
                  <Badge className="bg-orange-600">⚡ Bo'lib-bo'lib</Badge>
                )}
                {percentage === 0 && (
                  <Badge className="bg-amber-600">⏳ Kutilmoqda</Badge>
                )}

                {/* Month Badge */}
                {payment.paymentMonth && payment.paymentYear && (
                  <Badge variant="outline" className="text-xs">
                    <Calendar className="h-3 w-3 mr-1" />
                    {monthNames[payment.paymentMonth - 1]} {payment.paymentYear}
                  </Badge>
                )}
              </div>

              {payment.notes && (
                <p className="text-sm text-muted-foreground mb-2">
                  📝 {payment.notes}
                </p>
              )}
            </div>

            <div className="text-right">
              <p className="text-xl font-bold text-green-600">
                {formatNumber(paidAmount)}
              </p>
              <p className="text-sm text-muted-foreground">
                / {formatNumber(totalAmount)} so'm
              </p>
              {hasPartialPayment && (
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="mt-1 h-6 text-xs">
                    <Info className="h-3 w-3 mr-1" />
                    {isOpen ? 'Yashirish' : 'Batafsil'}
                  </Button>
                </CollapsibleTrigger>
              )}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground">To'lov holati</span>
              <span className="text-xs font-bold text-blue-600">{percentage}%</span>
            </div>
            <Progress value={percentage} className="h-2" />
          </div>

          {/* Expanded Details */}
          <CollapsibleContent className="space-y-3">
            {hasPartialPayment && (
              <div className="p-3 bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 bg-orange-100 rounded">
                    <Info className="h-4 w-4 text-orange-600" />
                  </div>
                  <p className="font-semibold text-orange-900">Bo'lib-bo'lib to'lov</p>
                </div>
                <p className="text-sm text-orange-700 mb-3">
                  Bu to'lov qisman to'langan. Qolgan summani to'lash uchun administrator bilan bog'laning.
                </p>
                
                {/* Payment breakdown */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Umumiy summa:</span>
                    <span className="font-bold">{formatNumber(totalAmount)} so'm</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-green-600">✓ To'langan:</span>
                    <span className="font-bold text-green-700">{formatNumber(paidAmount)} so'm</span>
                  </div>
                  <div className="flex items-center justify-between text-sm border-t pt-2">
                    <span className="text-orange-600">⏳ Qolgan:</span>
                    <span className="font-bold text-orange-700">{formatNumber(remainingAmount)} so'm</span>
                  </div>
                </div>
              </div>
            )}

            {/* Payment Date */}
            {payment.paidDate && (
              <div className="text-xs text-muted-foreground flex items-center gap-2 p-2 bg-blue-50 rounded">
                <Calendar className="h-3 w-3" />
                <span>
                  To'langan: {new Date(payment.paidDate).toLocaleDateString('uz-UZ', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric'
                  })}
                </span>
              </div>
            )}
          </CollapsibleContent>

          {/* Quick Summary (always visible) */}
          {!isOpen && (
            <div className="grid grid-cols-2 gap-2 mt-3">
              <div className="bg-green-50 border border-green-200 rounded px-3 py-2">
                <p className="text-xs text-green-600">To'landi</p>
                <p className="text-sm font-bold text-green-700">
                  {formatNumber(paidAmount)} so'm
                </p>
              </div>
              {remainingAmount > 0 && (
                <div className="bg-orange-50 border border-orange-200 rounded px-3 py-2">
                  <p className="text-xs text-orange-600">Qoldi</p>
                  <p className="text-sm font-bold text-orange-700">
                    {formatNumber(remainingAmount)} so'm
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Collapsible>
    </Card>
  )
}

