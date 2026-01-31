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
  TrendingDown,
  PieChart,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react'
import { Progress } from '@/components/ui/progress'

interface BalanceDetailsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  totalBalance: number
  cashIncome: number
  cashExpense: number
  cardIncome: number
  cardExpense: number
}

export function BalanceDetailsModal({
  open,
  onOpenChange,
  totalBalance,
  cashIncome,
  cashExpense,
  cardIncome,
  cardExpense
}: BalanceDetailsModalProps) {
  const cashBalance = cashIncome - cashExpense
  const cardBalance = cardIncome - cardExpense
  
  const totalIncome = cashIncome + cardIncome
  const totalExpense = cashExpense + cardExpense
  
  const cashPercentage = totalBalance !== 0 ? Math.abs((cashBalance / totalBalance) * 100) : 0
  const cardPercentage = totalBalance !== 0 ? Math.abs((cardBalance / totalBalance) * 100) : 0

  const isPositive = totalBalance >= 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-xl ${isPositive ? 'bg-gradient-to-br from-blue-500 to-indigo-600' : 'bg-gradient-to-br from-orange-500 to-red-600'}`}>
              {isPositive ? (
                <ArrowUpRight className="h-6 w-6 text-white" />
              ) : (
                <ArrowDownRight className="h-6 w-6 text-white" />
              )}
            </div>
            <div>
              <DialogTitle className="text-2xl">Balans Tafsilotlari</DialogTitle>
              <DialogDescription>
                Bu oydagi naqd va plastik pul balansi
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Total Balance Card */}
          <Card className={`border-2 ${isPositive ? 'border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50' : 'border-orange-200 bg-gradient-to-br from-orange-50 to-red-50'}`}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-muted-foreground">Jami Balans</span>
                <Wallet className={`h-5 w-5 ${isPositive ? 'text-blue-600' : 'text-orange-600'}`} />
              </div>
              <div className={`text-3xl font-bold mb-2 ${isPositive ? 'text-blue-600' : 'text-orange-600'}`}>
                {isPositive ? '+' : ''}{formatNumber(totalBalance)} so'm
              </div>
              <p className="text-sm text-muted-foreground">
                Kirim - Xarajat = Balans
              </p>
            </CardContent>
          </Card>

          {/* Summary Stats Row */}
          <div className="grid grid-cols-2 gap-3">
            <Card className="border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
              <CardContent className="pt-4 text-center">
                <TrendingUp className="h-6 w-6 text-green-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-green-600">
                  +{formatNumber(totalIncome)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Jami Kirim</p>
              </CardContent>
            </Card>
            <Card className="border-red-200 bg-gradient-to-br from-red-50 to-rose-50">
              <CardContent className="pt-4 text-center">
                <TrendingDown className="h-6 w-6 text-red-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-red-600">
                  -{formatNumber(totalExpense)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Jami Xarajat</p>
              </CardContent>
            </Card>
          </div>

          {/* Payment Methods Breakdown */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <PieChart className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-semibold">To'lov Usullari Bo'yicha Balans</h3>
            </div>

            {/* Cash Balance */}
            <Card className={`border-l-4 ${cashBalance >= 0 ? 'border-l-blue-500' : 'border-l-orange-500'} hover:shadow-md transition-shadow`}>
              <CardContent className="pt-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${cashBalance >= 0 ? 'bg-blue-100' : 'bg-orange-100'}`}>
                      <Banknote className={`h-5 w-5 ${cashBalance >= 0 ? 'text-blue-600' : 'text-orange-600'}`} />
                    </div>
                    <div>
                      <h4 className="font-semibold text-base">Naqd Pul</h4>
                      <p className="text-xs text-muted-foreground">
                        Terminal orqali qabul qilingan
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-xl font-bold ${cashBalance >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                      {cashBalance >= 0 ? '+' : ''}{formatNumber(cashBalance)} so'm
                    </div>
                    <div className="text-xs text-muted-foreground font-medium">
                      {totalBalance !== 0 ? cashPercentage.toFixed(1) : '0'}%
                    </div>
                  </div>
                </div>
                <Progress 
                  value={totalBalance !== 0 ? Math.abs(cashPercentage) : 0} 
                  className={`h-2 ${cashBalance >= 0 ? 'bg-blue-100' : 'bg-orange-100'}`} 
                />
                
                {/* Cash breakdown */}
                <div className="mt-4 grid grid-cols-2 gap-2 pt-3 border-t">
                  <div className="text-sm">
                    <span className="text-muted-foreground">Kirim:</span>
                    <span className="font-semibold text-green-600 ml-2">
                      +{formatNumber(cashIncome)}
                    </span>
                  </div>
                  <div className="text-sm text-right">
                    <span className="text-muted-foreground">Xarajat:</span>
                    <span className="font-semibold text-red-600 ml-2">
                      -{formatNumber(cashExpense)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Card Balance */}
            <Card className={`border-l-4 ${cardBalance >= 0 ? 'border-l-blue-500' : 'border-l-orange-500'} hover:shadow-md transition-shadow`}>
              <CardContent className="pt-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${cardBalance >= 0 ? 'bg-blue-100' : 'bg-orange-100'}`}>
                      <CreditCard className={`h-5 w-5 ${cardBalance >= 0 ? 'text-blue-600' : 'text-orange-600'}`} />
                    </div>
                    <div>
                      <h4 className="font-semibold text-base">Plastik Karta</h4>
                      <p className="text-xs text-muted-foreground">
                        Terminal orqali plastik karta
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-xl font-bold ${cardBalance >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                      {cardBalance >= 0 ? '+' : ''}{formatNumber(cardBalance)} so'm
                    </div>
                    <div className="text-xs text-muted-foreground font-medium">
                      {totalBalance !== 0 ? cardPercentage.toFixed(1) : '0'}%
                    </div>
                  </div>
                </div>
                <Progress 
                  value={totalBalance !== 0 ? Math.abs(cardPercentage) : 0} 
                  className={`h-2 ${cardBalance >= 0 ? 'bg-blue-100' : 'bg-orange-100'}`} 
                />
                
                {/* Card breakdown */}
                <div className="mt-4 grid grid-cols-2 gap-2 pt-3 border-t">
                  <div className="text-sm">
                    <span className="text-muted-foreground">Kirim:</span>
                    <span className="font-semibold text-green-600 ml-2">
                      +{formatNumber(cardIncome)}
                    </span>
                  </div>
                  <div className="text-sm text-right">
                    <span className="text-muted-foreground">Xarajat:</span>
                    <span className="font-semibold text-red-600 ml-2">
                      -{formatNumber(cardExpense)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Summary Percentage Cards */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <Card className={`${cashBalance >= 0 ? 'bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200' : 'bg-gradient-to-br from-orange-50 to-red-50 border-orange-200'}`}>
              <CardContent className="pt-4 text-center">
                <Banknote className={`h-6 w-6 mx-auto mb-2 ${cashBalance >= 0 ? 'text-blue-600' : 'text-orange-600'}`} />
                <div className={`text-2xl font-bold ${cashBalance >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>
                  {totalBalance !== 0 ? cashPercentage.toFixed(0) : '0'}%
                </div>
                <p className="text-xs text-muted-foreground mt-1">Naqd</p>
              </CardContent>
            </Card>
            <Card className={`${cardBalance >= 0 ? 'bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200' : 'bg-gradient-to-br from-orange-50 to-red-50 border-orange-200'}`}>
              <CardContent className="pt-4 text-center">
                <CreditCard className={`h-6 w-6 mx-auto mb-2 ${cardBalance >= 0 ? 'text-blue-600' : 'text-orange-600'}`} />
                <div className={`text-2xl font-bold ${cardBalance >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>
                  {totalBalance !== 0 ? cardPercentage.toFixed(0) : '0'}%
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
