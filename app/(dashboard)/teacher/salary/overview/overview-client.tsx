'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Calendar, Award, DollarSign } from 'lucide-react'
import { formatNumber } from '@/lib/utils'

interface Payment {
  id: string
  month: number
  type: string
  status: string
  paidAmount: number
  remainingAmount: number
  description: string | null
  baseSalary: number
  bonusAmount: number
  deductionAmount: number
  paymentDate: Date | null
  createdAt: Date
}

interface Props {
  payments: Payment[]
  monthlySalary: number
  currentYear: number
  months: string[]
}

export function TeacherMonthlyOverviewClient({ payments, monthlySalary, currentYear, months }: Props) {
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null)
  const [showModal, setShowModal] = useState(false)

  const handleMonthClick = (monthIndex: number) => {
    setSelectedMonth(monthIndex + 1)
    setShowModal(true)
  }

  const getMonthPayments = (monthNum: number) => {
    return payments.filter(p => p.month === monthNum)
  }

  const selectedMonthPayments = selectedMonth ? getMonthPayments(selectedMonth) : []

  // Calculate totals for selected month
  const selectedMonthStats = selectedMonth ? (() => {
    const monthPayments = getMonthPayments(selectedMonth)
    
    const totalPaid = monthPayments
      .filter(p => p.status === 'PAID' || p.status === 'PARTIALLY_PAID')
      .reduce((s, p) => s + p.paidAmount, 0)
    
    const bonuses = monthPayments.reduce((s, p) => {
      if (p.type === 'BONUS') return s + p.paidAmount
      if (p.type === 'FULL_SALARY' && p.bonusAmount) return s + p.bonusAmount
      return s
    }, 0)
    
    const deductions = monthPayments.reduce((s, p) => {
      if (p.type === 'DEDUCTION') return s + p.paidAmount
      if (p.type === 'FULL_SALARY' && p.deductionAmount) return s + p.deductionAmount
      return s
    }, 0)

    const advances = monthPayments
      .filter(p => p.type === 'ADVANCE')
      .reduce((s, p) => s + p.paidAmount, 0)

    const hasFullSalary = monthPayments.some(p => p.type === 'FULL_SALARY')

    return {
      totalPaid,
      bonuses,
      deductions,
      advances,
      hasFullSalary,
      remaining: Math.max(0, monthlySalary - totalPaid)
    }
  })() : null

  return (
    <>
      <Card className="border-2">
        <CardHeader>
          <CardTitle>12 Oylik Ko'rinish</CardTitle>
          <CardDescription>
            Oyni bosing - batafsil ma'lumot ko'rish uchun
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {months.map((month, i) => {
              const monthPayments = getMonthPayments(i + 1)
              
              const totalPaidThisMonth = monthPayments
                .filter(p => p.status === 'PAID' || p.status === 'PARTIALLY_PAID')
                .reduce((s, p) => s + p.paidAmount, 0)
              
              const hasFullSalaryPaid = monthPayments.some(p => 
                p.type === 'FULL_SALARY' && p.status === 'PAID'
              )
              
              const hasPending = monthPayments.some(p => p.status === 'PENDING')
              
              const isPaid = hasFullSalaryPaid || totalPaidThisMonth >= monthlySalary
              const isPartial = !hasFullSalaryPaid && totalPaidThisMonth > 0 && totalPaidThisMonth < monthlySalary
              const isPending = hasPending && totalPaidThisMonth === 0
              
              return (
                <button
                  key={i}
                  onClick={() => handleMonthClick(i)}
                  className={`p-4 rounded-lg border-2 text-center transition-all hover:scale-105 hover:shadow-lg ${
                    isPaid ? 'bg-green-500 border-green-600 text-white' :
                    isPartial ? 'bg-yellow-500 border-yellow-600 text-white' :
                    isPending ? 'bg-orange-500 border-orange-600 text-white' :
                    'bg-gray-100 border-gray-300 text-gray-500'
                  }`}
                >
                  <p className="text-sm font-bold mb-1">{month}</p>
                  <p className="text-2xl font-bold">{i + 1}</p>
                  <p className="text-xs mt-1">
                    {isPaid ? '✓' : isPartial ? '~' : isPending ? '⏳' : '–'}
                  </p>
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Month Detail Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <Calendar className="h-6 w-6" />
              {selectedMonth && months[selectedMonth - 1]} {currentYear}
            </DialogTitle>
            <DialogDescription>
              To'lovlar tafsiloti va statistika
            </DialogDescription>
          </DialogHeader>

          {selectedMonth && selectedMonthStats && (
            <div className="space-y-4">
              {/* Summary Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Card className="border-2 border-blue-200 bg-blue-50">
                  <CardContent className="pt-4 pb-3">
                    <p className="text-xs text-muted-foreground mb-1">💰 Oylik</p>
                    <p className="text-xl font-bold text-blue-600">
                      {(monthlySalary / 1000000).toFixed(1)}M
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-2 border-green-200 bg-green-50">
                  <CardContent className="pt-4 pb-3">
                    <p className="text-xs text-muted-foreground mb-1">✅ To'langan</p>
                    <p className="text-xl font-bold text-green-600">
                      {(selectedMonthStats.totalPaid / 1000000).toFixed(1)}M
                    </p>
                  </CardContent>
                </Card>

                {selectedMonthStats.bonuses > 0 && (
                  <Card className="border-2 border-green-200 bg-green-50">
                    <CardContent className="pt-4 pb-3">
                      <p className="text-xs text-muted-foreground mb-1">🎁 Bonus</p>
                      <p className="text-xl font-bold text-green-600">
                        +{(selectedMonthStats.bonuses / 1000000).toFixed(1)}M
                      </p>
                    </CardContent>
                  </Card>
                )}

                {selectedMonthStats.deductions > 0 && (
                  <Card className="border-2 border-red-300 bg-red-50">
                    <CardContent className="pt-4 pb-3">
                      <p className="text-xs text-red-600 mb-1">⛔ Ushlab qolish</p>
                      <p className="text-xl font-bold text-red-600">
                        -{(selectedMonthStats.deductions / 1000000).toFixed(1)}M
                      </p>
                    </CardContent>
                  </Card>
                )}

                {selectedMonthStats.remaining > 0 && (
                  <Card className="border-2 border-orange-200 bg-orange-50">
                    <CardContent className="pt-4 pb-3">
                      <p className="text-xs text-muted-foreground mb-1">📊 Qolgan</p>
                      <p className="text-xl font-bold text-orange-600">
                        {(selectedMonthStats.remaining / 1000000).toFixed(1)}M
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Payment List */}
              <div className="space-y-3">
                <h3 className="font-semibold text-lg">To'lovlar ro'yxati ({selectedMonthPayments.length})</h3>
                
                {selectedMonthPayments.map((payment) => (
                  <Card key={payment.id} className="border-2">
                    <CardContent className="pt-4">
                      <div className="space-y-3">
                        {/* Header */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 flex-wrap">
                            {payment.type === 'FULL_SALARY' && (
                              <Badge className="bg-blue-600">💼 To'liq Oylik</Badge>
                            )}
                            {payment.type === 'ADVANCE' && (
                              <Badge className="bg-purple-600">💰 Avans</Badge>
                            )}
                            {payment.type === 'BONUS' && (
                              <Badge className="bg-green-600">🎁 Mukofot</Badge>
                            )}
                            {payment.type === 'DEDUCTION' && (
                              <Badge className="bg-red-600">⛔ Ushlab qolish</Badge>
                            )}
                            
                            {payment.status === 'PAID' && (
                              <Badge className="bg-green-600">✓ To'langan</Badge>
                            )}
                            {payment.status === 'PENDING' && (
                              <Badge className="bg-amber-600">⏳ Kutilmoqda</Badge>
                            )}
                            {payment.status === 'PARTIALLY_PAID' && (
                              <Badge className="bg-orange-600">⚡ Qisman</Badge>
                            )}
                          </div>
                          
                          {payment.paymentDate && (
                            <p className="text-sm text-muted-foreground">
                              📅 {new Date(payment.paymentDate).toLocaleDateString('uz-UZ')}
                            </p>
                          )}
                        </div>

                        {/* Amount Details */}
                        <div className="grid grid-cols-2 gap-2">
                          <div className="bg-green-50 border border-green-200 rounded p-2">
                            <p className="text-xs text-green-600">To'landi</p>
                            <p className="text-lg font-bold text-green-700">
                              {formatNumber(payment.paidAmount)} so'm
                            </p>
                          </div>
                          <div className="bg-gray-50 border border-gray-200 rounded p-2">
                            <p className="text-xs text-muted-foreground">Jami</p>
                            <p className="text-lg font-bold text-gray-700">
                              {formatNumber(payment.paidAmount)} so'm
                            </p>
                          </div>
                        </div>

                        {/* Bonus & Deduction for FULL_SALARY */}
                        {payment.type === 'FULL_SALARY' && (payment.bonusAmount > 0 || payment.deductionAmount > 0) && (
                          <div className="grid grid-cols-2 gap-2">
                            {payment.bonusAmount > 0 && (
                              <div className="bg-green-50 border border-green-200 rounded p-2">
                                <p className="text-xs text-green-600">🎁 Bonus</p>
                                <p className="text-lg font-bold text-green-700">
                                  +{formatNumber(payment.bonusAmount)} so'm
                                </p>
                              </div>
                            )}
                            {payment.deductionAmount > 0 && (
                              <div className="bg-red-50 border-2 border-red-300 rounded p-2">
                                <p className="text-xs text-red-600">⛔ Ushlab qolish</p>
                                <p className="text-lg font-bold text-red-700">
                                  -{formatNumber(payment.deductionAmount)} so'm
                                </p>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Description */}
                        {payment.description && (
                          <div className="bg-blue-50 border border-blue-200 rounded p-2">
                            <p className="text-xs text-blue-600 mb-1">📝 Izoh</p>
                            <p className="text-sm">{payment.description}</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {selectedMonthPayments.length === 0 && (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <DollarSign className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                      <p className="text-lg font-semibold text-muted-foreground">
                        Bu oyda to'lovlar yo'q
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
