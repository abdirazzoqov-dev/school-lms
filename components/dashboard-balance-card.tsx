'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { formatNumber } from '@/lib/utils'
import { BalanceDetailsModal } from './balance-details-modal'

interface DashboardBalanceCardProps {
  balance: number
  cashIncome: number
  cashExpense: number
  cardIncome: number
  cardExpense: number
}

export function DashboardBalanceCard({
  balance,
  cashIncome,
  cashExpense,
  cardIncome,
  cardExpense
}: DashboardBalanceCardProps) {
  const [showModal, setShowModal] = useState(false)
  const isPositive = balance >= 0

  return (
    <>
      <Card 
        className={`border-l-4 ${isPositive ? 'border-l-blue-500' : 'border-l-orange-500'} hover:shadow-md transition-all cursor-pointer group`}
        onClick={() => setShowModal(true)}
      >
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Balans (Bu oy)
            </CardTitle>
            {isPositive ? (
              <ArrowUpRight className="h-4 w-4 text-blue-600 group-hover:scale-110 transition-transform" />
            ) : (
              <ArrowDownRight className="h-4 w-4 text-orange-600 group-hover:scale-110 transition-transform" />
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${isPositive ? 'text-blue-600' : 'text-orange-600'}`}>
            {isPositive ? '+' : ''}{formatNumber(balance)}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Kirim - Xarajat
          </p>
          <div className="mt-3 pt-3 border-t border-gray-100">
            <p className="text-xs text-blue-600 font-medium group-hover:underline">
              Batafsil ko'rish →
            </p>
          </div>
        </CardContent>
      </Card>

      <BalanceDetailsModal
        open={showModal}
        onOpenChange={setShowModal}
        totalBalance={balance}
        cashIncome={cashIncome}
        cashExpense={cashExpense}
        cardIncome={cardIncome}
        cardExpense={cardExpense}
      />
    </>
  )
}
