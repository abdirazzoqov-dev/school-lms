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
  TrendingUp,
  PieChart
} from 'lucide-react'
import { Progress } from '@/components/ui/progress'

interface PaymentMethod {
  method: string
  amount: number
}

interface IncomeDetailsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  totalIncome: number
  cashIncome: number
  cardIncome: number
  paymentMethods: PaymentMethod[]
  completedPayments: number
}

export function IncomeDetailsModal({
  open,
  onOpenChange,
  totalIncome,
  cashIncome,
  cardIncome,
  paymentMethods,
  completedPayments
}: IncomeDetailsModalProps) {
  const cashPercentage = totalIncome > 0 ? (cashIncome / totalIncome) * 100 : 0
  const cardPercentage = totalIncome > 0 ? (cardIncome / totalIncome) * 100 : 0

  // Get individual card methods breakdown
  const clickAmount = paymentMethods.find(pm => pm.method === 'CLICK')?.amount || 0
  const paymeAmount = paymentMethods.find(pm => pm.method === 'PAYME')?.amount || 0
  const uzumAmount = paymentMethods.find(pm => pm.method === 'UZUM')?.amount || 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
            <div>
              <DialogTitle className="text-2xl">Kirim Tafsilotlari</DialogTitle>
              <DialogDescription>
                Bu oydagi barcha kirim to'lovlarining batafsil analitikasi
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Total Income Card */}
          <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-muted-foreground">Jami Kirim</span>
                <Wallet className="h-5 w-5 text-green-600" />
              </div>
              <div className="text-3xl font-bold text-green-600 mb-2">
                +{formatNumber(totalIncome)} so'm
              </div>
              <p className="text-sm text-muted-foreground">
                {completedPayments} ta to'lov qabul qilindi
              </p>
            </CardContent>
          </Card>

          {/* Payment Methods Breakdown */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <PieChart className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-semibold">To'lov Usullari Bo'yicha</h3>
            </div>

            {/* Cash Payment */}
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
                        Terminal orqali qabul qilingan
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-amber-600">
                      {formatNumber(cashIncome)} so'm
                    </div>
                    <div className="text-xs text-muted-foreground font-medium">
                      {cashPercentage.toFixed(1)}%
                    </div>
                  </div>
                </div>
                <Progress value={cashPercentage} className="h-2 bg-amber-100" />
              </CardContent>
            </Card>

            {/* Card Payments */}
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
                        Click, Payme, Uzum orqali
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-blue-600">
                      {formatNumber(cardIncome)} so'm
                    </div>
                    <div className="text-xs text-muted-foreground font-medium">
                      {cardPercentage.toFixed(1)}%
                    </div>
                  </div>
                </div>
                <Progress value={cardPercentage} className="h-2 bg-blue-100" />

                {/* Individual Card Methods */}
                {cardIncome > 0 && (
                  <div className="mt-4 space-y-2 pt-3 border-t border-blue-100">
                    {clickAmount > 0 && (
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <span className="text-muted-foreground">Click</span>
                        </div>
                        <span className="font-semibold">{formatNumber(clickAmount)} so'm</span>
                      </div>
                    )}
                    {paymeAmount > 0 && (
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-cyan-500 rounded-full"></div>
                          <span className="text-muted-foreground">Payme</span>
                        </div>
                        <span className="font-semibold">{formatNumber(paymeAmount)} so'm</span>
                      </div>
                    )}
                    {uzumAmount > 0 && (
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                          <span className="text-muted-foreground">Uzum</span>
                        </div>
                        <span className="font-semibold">{formatNumber(uzumAmount)} so'm</span>
                      </div>
                    )}
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
