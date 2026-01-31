'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp } from 'lucide-react'
import { formatNumber } from '@/lib/utils'
import { IncomeDetailsModal } from './income-details-modal'
import { Button } from './ui/button'

interface PaymentMethod {
  method: string
  amount: number
}

interface DashboardIncomeCardProps {
  income: number
  cashIncome: number
  cardIncome: number
  completedPayments: number
  paymentMethods: PaymentMethod[]
}

export function DashboardIncomeCard({
  income,
  cashIncome,
  cardIncome,
  completedPayments,
  paymentMethods
}: DashboardIncomeCardProps) {
  const [showModal, setShowModal] = useState(false)

  return (
    <>
      <Card 
        className="border-l-4 border-l-green-500 hover:shadow-md transition-all cursor-pointer group"
        onClick={() => setShowModal(true)}
      >
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Kirim (Bu oy)
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600 group-hover:scale-110 transition-transform" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            +{formatNumber(income)}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {completedPayments} ta to'lov qabul qilindi
          </p>
          <div className="mt-3 pt-3 border-t border-gray-100">
            <p className="text-xs text-blue-600 font-medium group-hover:underline">
              Batafsil ko'rish →
            </p>
          </div>
        </CardContent>
      </Card>

      <IncomeDetailsModal
        open={showModal}
        onOpenChange={setShowModal}
        totalIncome={income}
        cashIncome={cashIncome}
        cardIncome={cardIncome}
        completedPayments={completedPayments}
        paymentMethods={paymentMethods}
      />
    </>
  )
}
