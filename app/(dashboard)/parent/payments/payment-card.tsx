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

            {/* Payment Transactions History - Modern Design */}
            {payment.transactions && payment.transactions.length > 0 && (
              <div className="p-4 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border-2 border-blue-300 rounded-xl shadow-sm">
                <div className="flex items-center gap-3 mb-4 pb-3 border-b-2 border-blue-200">
                  <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-md">
                    <Receipt className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-base font-bold text-blue-900">
                      To'lovlar Tarixi
                    </p>
                    <p className="text-xs text-blue-600 font-medium">
                      {payment.transactions.length} ta to'lov amalga oshirilgan
                    </p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  {payment.transactions.map((transaction, index) => (
                    <div 
                      key={transaction.id}
                      className="p-3 bg-white border-2 border-blue-200 rounded-xl shadow-sm hover:shadow-md transition-all hover:scale-[1.01]"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <Badge className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-bold px-3 py-1 shadow-sm">
                          To'lov #{index + 1}
                        </Badge>
                        <div className="text-right">
                          <p className="text-lg font-bold text-green-600">
                            {formatNumber(Number(transaction.amount))}
                          </p>
                          <p className="text-xs text-muted-foreground">so'm</p>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between py-2 px-3 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-blue-600" />
                            <span className="text-xs text-muted-foreground font-medium">Sana</span>
                          </div>
                          <span className="text-sm font-bold text-gray-700">
                            {new Date(transaction.transactionDate).toLocaleDateString('uz-UZ', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric'
                            })}
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between py-2 px-3 bg-gradient-to-r from-gray-50 to-green-50 rounded-lg">
                          <span className="text-xs text-muted-foreground font-medium">To'lov usuli</span>
                          <Badge variant="outline" className="text-xs font-semibold border-2">
                            {transaction.paymentMethod === 'CASH' && '💵 Naqd pul'}
                            {transaction.paymentMethod === 'CLICK' && '💳 Click'}
                            {transaction.paymentMethod === 'PAYME' && '💳 Payme'}
                            {transaction.paymentMethod === 'UZUM' && '💳 Uzum'}
                          </Badge>
                        </div>
                        
                        {transaction.receivedBy && (
                          <div className="flex items-center justify-between py-2 px-3 bg-gradient-to-r from-gray-50 to-purple-50 rounded-lg">
                            <span className="text-xs text-muted-foreground font-medium">Qabul qilgan</span>
                            <span className="text-sm font-semibold text-gray-700 text-right max-w-[180px] truncate">
                              {transaction.receivedBy.fullName}
                            </span>
                          </div>
                        )}
                        
                        {transaction.notes && (
                          <div className="mt-3 pt-3 border-t-2 border-gray-200">
                            <div className="flex items-center gap-2 mb-2">
                              <Info className="h-4 w-4 text-amber-600" />
                              <p className="text-xs text-muted-foreground font-semibold">Izoh</p>
                            </div>
                            <p className="text-sm font-medium text-gray-700 bg-gradient-to-r from-amber-50 to-yellow-50 p-3 rounded-lg border border-amber-200">
                              {transaction.notes}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Summary Footer */}
                <div className="mt-4 pt-4 border-t-2 border-blue-200">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold text-blue-900">Jami to'langan:</span>
                    <span className="text-lg font-bold text-green-600">
                      {formatNumber(payment.transactions.reduce((sum, t) => sum + Number(t.amount), 0))} so'm
                    </span>
                  </div>
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

