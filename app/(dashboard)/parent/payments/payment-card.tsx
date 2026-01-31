'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Calendar, Info, Receipt } from 'lucide-react'
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
    transactions?: Array<{
      id: string
      amount: any
      paymentMethod: string
      transactionDate: Date
      receiptNumber: string | null
      notes: string | null
      receivedBy: {
        fullName: string
      } | null
    }>
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
              {(hasPartialPayment || (payment.transactions && payment.transactions.length > 0)) && (
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="mt-1 h-6 text-xs">
                    <Receipt className="h-3 w-3 mr-1" />
                    {isOpen ? 'Yashirish' : 'To\'lovlar tarixi'}
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

            {/* Payment Transactions History - Receipt Style */}
            {payment.transactions && payment.transactions.length > 0 && (
              <div className="bg-white border-2 border-dashed border-gray-400 rounded-lg shadow-lg overflow-hidden">
                {/* Receipt Header */}
                <div className="bg-gradient-to-r from-gray-800 to-gray-900 text-white p-4 text-center border-b-2 border-dashed border-gray-400">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Receipt className="h-6 w-6" />
                    <h3 className="text-lg font-bold uppercase tracking-wider">To'lovlar Kvitansiyasi</h3>
                  </div>
                  <p className="text-xs opacity-80">
                    {payment.paymentType === 'TUITION' && "O'qish haqi"}
                    {payment.paymentType === 'BOOKS' && 'Kitoblar'}
                    {payment.paymentType === 'UNIFORM' && 'Forma'}
                    {payment.paymentType === 'OTHER' && 'Boshqa'}
                    {payment.paymentMonth && payment.paymentYear && 
                      ` - ${monthNames[payment.paymentMonth - 1]} ${payment.paymentYear}`
                    }
                  </p>
                </div>

                {/* Receipt Content */}
                <div className="p-4 space-y-3 bg-gray-50">
                  {/* Payment Summary */}
                  <div className="bg-white border border-gray-300 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2 pb-2 border-b border-dashed border-gray-300">
                      <span className="text-sm font-semibold text-gray-700">Umumiy summa:</span>
                      <span className="text-base font-bold text-gray-900">{formatNumber(totalAmount)} so'm</span>
                    </div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-semibold text-green-600">✓ To'langan:</span>
                      <span className="text-base font-bold text-green-600">{formatNumber(paidAmount)} so'm</span>
                    </div>
                    {remainingAmount > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-orange-600">⏳ Qoldiq:</span>
                        <span className="text-base font-bold text-orange-600">{formatNumber(remainingAmount)} so'm</span>
                      </div>
                    )}
                  </div>

                  {/* Transactions List */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-400 to-transparent"></div>
                      <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">To'lovlar ro'yxati</span>
                      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-400 to-transparent"></div>
                    </div>
                    
                    {payment.transactions.map((transaction, index) => (
                      <div 
                        key={transaction.id}
                        className="bg-white border border-gray-300 rounded-lg p-3 hover:shadow-md transition-shadow"
                      >
                        {/* Transaction Number and Amount */}
                        <div className="flex items-center justify-between mb-2 pb-2 border-b border-dashed border-gray-300">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold">
                              {index + 1}
                            </div>
                            <span className="text-xs font-semibold text-gray-600">
                              {(() => {
                                const date = new Date(transaction.transactionDate)
                                const day = String(date.getDate()).padStart(2, '0')
                                const month = String(date.getMonth() + 1).padStart(2, '0')
                                const year = date.getFullYear()
                                return `${day}.${month}.${year}`
                              })()}
                            </span>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-green-600">
                              {formatNumber(Number(transaction.amount))} so'm
                            </p>
                          </div>
                        </div>

                        {/* Transaction Details */}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-500 font-medium">📅 Sana va vaqt:</span>
                            <span className="font-semibold text-gray-700">
                              {(() => {
                                const date = new Date(transaction.transactionDate)
                                const day = date.getDate()
                                const monthNames = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr']
                                const month = monthNames[date.getMonth()]
                                const year = date.getFullYear()
                                const hours = String(date.getHours()).padStart(2, '0')
                                const minutes = String(date.getMinutes()).padStart(2, '0')
                                return `${day} ${month} ${year}, ${hours}:${minutes}`
                              })()}
                            </span>
                          </div>
                          
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-500 font-medium">💳 To'lov usuli:</span>
                            <span className="font-bold text-gray-800">
                              {transaction.paymentMethod === 'CASH' && '💵 Naqd pul'}
                              {transaction.paymentMethod === 'CLICK' && '💳 Click'}
                              {transaction.paymentMethod === 'PAYME' && '💳 Payme'}
                              {transaction.paymentMethod === 'UZUM' && '💳 Uzum'}
                            </span>
                          </div>
                          
                          {transaction.receivedBy && (
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-gray-500 font-medium">👤 Qabul qildi:</span>
                              <span className="font-semibold text-gray-700 text-right max-w-[150px] truncate">
                                {transaction.receivedBy.fullName}
                              </span>
                            </div>
                          )}
                          
                          {transaction.notes && (
                            <div className="mt-2 pt-2 border-t border-gray-200">
                              <p className="text-xs text-gray-500 font-medium mb-1">📝 Izoh:</p>
                              <p className="text-xs font-medium text-gray-700 bg-amber-50 p-2 rounded border border-amber-200">
                                {transaction.notes}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Receipt Footer */}
                <div className="bg-gradient-to-r from-green-600 to-emerald-700 text-white p-4 border-t-2 border-dashed border-gray-400">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs opacity-90">Jami to'lovlar soni:</p>
                      <p className="text-lg font-bold">{payment.transactions.length} ta</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs opacity-90">Jami to'langan:</p>
                      <p className="text-2xl font-bold">
                        {formatNumber(payment.transactions.reduce((sum, t) => sum + Number(t.amount), 0))} so'm
                      </p>
                    </div>
                  </div>
                  {percentage === 100 && (
                    <div className="mt-3 pt-3 border-t border-green-500 text-center">
                      <p className="text-sm font-bold">✓ To'lov to'liq amalga oshirildi!</p>
                      <p className="text-xs opacity-90">Rahmat! Barcha to'lovlar o'z vaqtida to'landi.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Payment Date */}
            {payment.paidDate && (
              <div className="text-xs text-muted-foreground flex items-center gap-2 p-2 bg-blue-50 rounded">
                <Calendar className="h-3 w-3" />
                <span>
                  To'langan: {(() => {
                    const date = new Date(payment.paidDate)
                    const day = date.getDate()
                    const year = date.getFullYear()
                    const monthNames = [
                      'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun',
                      'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'
                    ]
                    const month = monthNames[date.getMonth()]
                    return `${day} ${month} ${year}`
                  })()}
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

