'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingDown } from 'lucide-react'
import { formatNumber } from '@/lib/utils'
import { ExpenseDetailsModal } from './expense-details-modal'

interface ExpenseMethod {
  method: string
  amount: number
}

interface ExpenseCategory {
  name: string
  amount: number
  color: string
}

interface DashboardExpenseCardProps {
  totalExpenses: number
  expenseCash: number
  expenseCard: number
  expensePaymentMethods: ExpenseMethod[]
  expenseCategories: ExpenseCategory[]
}

export function DashboardExpenseCard({
  totalExpenses,
  expenseCash,
  expenseCard,
  expensePaymentMethods,
  expenseCategories
}: DashboardExpenseCardProps) {
  const [showModal, setShowModal] = useState(false)

  return (
    <>
      <Card 
        className="border-l-4 border-l-red-500 hover:shadow-md transition-all cursor-pointer group"
        onClick={() => setShowModal(true)}
      >
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Xarajatlar (Bu oy)
            </CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600 group-hover:scale-110 transition-transform" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">
            -{formatNumber(totalExpenses)}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Umumiy va oshxona xarajatlari
          </p>
          <div className="mt-3 pt-3 border-t border-gray-100">
            <p className="text-xs text-blue-600 font-medium group-hover:underline">
              Batafsil ko'rish →
            </p>
          </div>
        </CardContent>
      </Card>

      <ExpenseDetailsModal
        open={showModal}
        onOpenChange={setShowModal}
        totalExpenses={totalExpenses}
        expenseCash={expenseCash}
        expenseCard={expenseCard}
        expensePaymentMethods={expensePaymentMethods}
        expenseCategories={expenseCategories}
      />
    </>
  )
}
