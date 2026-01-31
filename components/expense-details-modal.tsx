'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Card, CardContent } from '@/components/ui/card'
import { formatNumber } from '@/lib/utils'
import { 
  Banknote, 
  CreditCard, 
  Wallet, 
  TrendingDown,
  PieChart
} from 'lucide-react'
import { Progress } from '@/components/ui/progress'

interface ExpenseMethod {
  method: string
  amount: number
}

interface ExpenseDetailsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  totalExpenses: number
  expenseCash: number
  expenseCard: number
  expensePaymentMethods: ExpenseMethod[]
}

export function ExpenseDetailsModal({
  open,
  onOpenChange,
  totalExpenses,
  expenseCash,
  expenseCard,
  expensePaymentMethods
}: ExpenseDetailsModalProps) {
  const cashPercentage = totalExpenses > 0 ? (expenseCash / totalExpenses) * 100 : 0
  const cardPercentage = totalExpenses > 0 ? (expenseCard / totalExpenses) * 100 : 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-red-500 to-rose-600 rounded-xl">
              <TrendingDown className="h-6 w-6 text-white" />
            </div>
            <div>
              <DialogTitle className="text-2xl">Xarajat Tafsilotlari</DialogTitle>
              <DialogDescription>
                Bu oydagi barcha xarajatlarning batafsil analitikasi
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Total Expenses Card */}
          <Card className="border-2 border-red-200 bg-gradient-to-br from-red-50 to-rose-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-muted-foreground">Jami Xarajat</span>
                <Wallet className="h-5 w-5 text-red-600" />
              </div>
              <div className="text-3xl font-bold text-red-600 mb-2">
                -{formatNumber(totalExpenses)} so'm
              </div>
              <p className="text-sm text-muted-foreground">
                Bu oydagi barcha xarajatlar
              </p>
            </CardContent>
          </Card>

          {/* Payment Methods Breakdown */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <PieChart className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-semibold">To'lov Usullari Bo'yicha</h3>
            </div>

            {/* Cash Expenses */}
            <Card className="border-l-4 border-l-amber-500 hover:shadow-md transition-shadow">
              <CardContent className="pt-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-100 rounded-lg">
                      <Banknote className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-base">Naqd Pul</h4>
                      <p className="text-xs text-muted-foreground">
                        Terminal orqali to'langan xarajatlar
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-amber-600">
                      {formatNumber(expenseCash)} so'm
                    </div>
                    <div className="text-xs text-muted-foreground font-medium">
                      {cashPercentage.toFixed(1)}%
                    </div>
                  </div>
                </div>
                <Progress value={cashPercentage} className="h-2 bg-amber-100" />
              </CardContent>
            </Card>

            {/* Card Expenses */}
            <Card className="border-l-4 border-l-blue-500 hover:shadow-md transition-shadow">
              <CardContent className="pt-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <CreditCard className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-base">Plastik Karta</h4>
                      <p className="text-xs text-muted-foreground">
                        Terminal orqali plastik karta to'lovlari
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-blue-600">
                      {formatNumber(expenseCard)} so'm
                    </div>
                    <div className="text-xs text-muted-foreground font-medium">
                      {cardPercentage.toFixed(1)}%
                    </div>
                  </div>
                </div>
                <Progress value={cardPercentage} className="h-2 bg-blue-100" />

                {/* Card payment details */}
                {expenseCard > 0 && (
                  <div className="mt-4 space-y-2 pt-3 border-t border-blue-100">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span className="text-muted-foreground">Plastik karta</span>
                      </div>
                      <span className="font-semibold">{formatNumber(expenseCard)} so'm</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
              <CardContent className="pt-4 text-center">
                <Banknote className="h-6 w-6 text-amber-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-amber-700">
                  {cashPercentage.toFixed(0)}%
                </div>
                <p className="text-xs text-muted-foreground mt-1">Naqd</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
              <CardContent className="pt-4 text-center">
                <CreditCard className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-blue-700">
                  {cardPercentage.toFixed(0)}%
                </div>
                <p className="text-xs text-muted-foreground mt-1">Plastik</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
