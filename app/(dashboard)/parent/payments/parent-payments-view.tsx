'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import {
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle2,
  Calendar,
  User,
  CreditCard,
  Receipt,
  Info,
  Sparkles,
  Target,
  Wallet,
  ArrowRight,
  AlertCircle
} from 'lucide-react'
import { formatNumber } from '@/lib/utils'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"

interface Transaction {
  id: string
  amount: number
  paymentMethod: string
  transactionDate: Date
  receiptNumber: string | null
  notes: string | null
  receivedBy: {
    fullName: string
  } | null
}

interface Payment {
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
  transactions: Transaction[]
}

interface Student {
  id: string
  studentCode: string
  user: {
    fullName: string
    avatar: string | null
  } | null
  class: {
    name: string
  } | null
  payments: Payment[]
}

interface Props {
  students: Student[]
  selectedChildId?: string
}

export function ParentPaymentsView({ students, selectedChildId }: Props) {
  const filteredChildren = selectedChildId
    ? students.filter(c => c.id === selectedChildId)
    : students

  // Calculate overall statistics
  const allPayments = filteredChildren.flatMap(child => child.payments)
  
  const totalAmount = allPayments.reduce((sum, p) => sum + p.amount, 0)
  const totalPaid = allPayments.reduce((sum, p) => sum + (p.paidAmount || 0), 0)
  const totalRemaining = allPayments.reduce((sum, p) => sum + (p.remainingAmount || 0), 0)

  const completedPayments = allPayments.filter(p => p.status === 'COMPLETED' && (p.remainingAmount || 0) === 0).length
  const pendingPayments = allPayments.filter(p => p.status === 'PENDING' || (p.remainingAmount || 0) > 0).length

  const overallProgress = totalAmount > 0 ? (totalPaid / totalAmount) * 100 : 0

  const monthNames = [
    'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun',
    'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-500 via-green-600 to-teal-600 p-8 md:p-12 text-white shadow-2xl">
        {/* Animated Background */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-emerald-300/20 rounded-full blur-3xl animate-pulse delay-700"></div>
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-4 bg-white/20 backdrop-blur-sm rounded-2xl shadow-lg">
              <Wallet className="h-10 w-10" />
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl font-bold">Farzandlarim To'lovlari</h1>
              <p className="text-emerald-100 text-lg mt-1">
                To'lovlar tarixi va hisobotlar
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-none shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 hover:shadow-xl transition-all group">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg group-hover:scale-110 transition-transform">
                <DollarSign className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-medium">Jami Summa</p>
                <div className="text-3xl font-bold text-blue-600">{formatNumber(totalAmount)}</div>
                <p className="text-xs text-muted-foreground">so'm</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 hover:shadow-xl transition-all group">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-lg group-hover:scale-110 transition-transform">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-medium">To'langan</p>
                <div className="text-3xl font-bold text-green-600">{formatNumber(totalPaid)}</div>
                <p className="text-xs text-muted-foreground">so'm</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20 hover:shadow-xl transition-all group">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 text-white shadow-lg group-hover:scale-110 transition-transform">
                <Clock className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-medium">Qolgan</p>
                <div className="text-3xl font-bold text-orange-600">{formatNumber(totalRemaining)}</div>
                <p className="text-xs text-muted-foreground">so'm</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 hover:shadow-xl transition-all group">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 text-white shadow-lg group-hover:scale-110 transition-transform">
                <Target className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-medium">To'lovlar</p>
                <div className="text-3xl font-bold text-purple-600">{allPayments.length}</div>
                <p className="text-xs text-muted-foreground">
                  {completedPayments} to'landi • {pendingPayments} kutilmoqda
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Overall Progress */}
      <Card className="border-none shadow-lg bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Sparkles className="h-6 w-6" />
              <div>
                <h3 className="text-2xl font-bold">Umumiy To'lov Holati</h3>
                <p className="text-indigo-100 text-sm">Barcha farzandlar bo'yicha</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold">{overallProgress.toFixed(1)}%</div>
              <p className="text-indigo-100 text-sm">bajarildi</p>
            </div>
          </div>
          <Progress value={overallProgress} className="h-3 bg-white/20" />
          <div className="flex justify-between text-xs mt-2 text-indigo-100">
            <span>0%</span>
            <span>50%</span>
            <span>100%</span>
          </div>
        </CardContent>
      </Card>

      {/* Student Selector */}
      {students.length > 1 && (
        <Card className="border-none shadow-lg">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-950/20 dark:to-slate-950/20">
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Farzandni tanlang
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="flex flex-wrap gap-3">
              <Link href="/parent/payments">
                <Button
                  variant={!selectedChildId ? "default" : "outline"}
                  size="lg"
                  className="gap-2 rounded-xl"
                >
                  <User className="h-4 w-4" />
                  Barchasi
                </Button>
              </Link>
              {students.map(child => (
                <Link key={child.id} href={`/parent/payments?childId=${child.id}`}>
                  <Button
                    variant={selectedChildId === child.id ? "default" : "outline"}
                    size="lg"
                    className="gap-2 rounded-xl"
                  >
                    <User className="h-4 w-4" />
                    {child.user?.fullName || 'N/A'}
                  </Button>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payments by Child */}
      <div className="space-y-6">
        {filteredChildren.map(child => {
          const childPayments = child.payments
          const childTotalAmount = childPayments.reduce((sum, p) => sum + p.amount, 0)
          const childTotalPaid = childPayments.reduce((sum, p) => sum + (p.paidAmount || 0), 0)
          const childTotalRemaining = childPayments.reduce((sum, p) => sum + (p.remainingAmount || 0), 0)
          const childProgress = childTotalAmount > 0 ? (childTotalPaid / childTotalAmount) * 100 : 0

          return (
            <Card key={child.id} className="border-none shadow-xl overflow-hidden">
              {/* Student Header */}
              <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-6 text-white">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl">
                      <User className="h-6 w-6" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold">{child.user?.fullName || 'N/A'}</h2>
                      <p className="text-blue-100">{child.class?.name || 'N/A'} • {childPayments.length} ta to'lov</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold">{formatNumber(childTotalPaid)}</div>
                    <p className="text-blue-100 text-sm">/ {formatNumber(childTotalAmount)} so'm</p>
                  </div>
                </div>

                {/* Progress */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-blue-100">Umumiy to'lov</span>
                    <span className="text-lg font-bold">{childProgress.toFixed(1)}%</span>
                  </div>
                  <Progress value={childProgress} className="h-3 bg-white/20" />
                </div>
              </div>

              {/* Payments List */}
              <CardContent className="p-6 bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-950/20 dark:to-slate-950/20">
                <div className="space-y-4">
                  {childPayments.map(payment => (
                    <PaymentCardModern key={payment.id} payment={payment} monthNames={monthNames} />
                  ))}

                  {childPayments.length === 0 && (
                    <div className="text-center py-12">
                      <div className="inline-flex p-4 bg-gradient-to-br from-gray-100 to-slate-100 rounded-full mb-4">
                        <Receipt className="h-12 w-12 text-muted-foreground opacity-50" />
                      </div>
                      <h3 className="text-lg font-semibold text-muted-foreground mb-2">To'lovlar topilmadi</h3>
                      <p className="text-sm text-muted-foreground">Bu farzand uchun hozircha to'lovlar yo'q</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {filteredChildren.length === 0 && (
        <Card className="border-dashed border-2">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <AlertCircle className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">Farzandlar topilmadi</h3>
            <p className="text-muted-foreground text-center max-w-md">
              Sizga biriktirilgan farzandlar yo'q
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// Modern Payment Card Component
function PaymentCardModern({ payment, monthNames }: { payment: Payment; monthNames: string[] }) {
  const [isOpen, setIsOpen] = useState(false)
  
  const paidAmount = payment.paidAmount || 0
  const totalAmount = payment.amount
  const remainingAmount = payment.remainingAmount || 0
  const percentage = totalAmount > 0 ? (paidAmount / totalAmount) * 100 : 0
  
  const hasPartialPayment = percentage > 0 && percentage < 100

  const getPaymentTypeInfo = (type: string) => {
    const types = {
      'TUITION': { icon: '📚', label: 'O\'qish haqi', color: 'from-blue-500 to-indigo-600' },
      'BOOKS': { icon: '📖', label: 'Darsliklar', color: 'from-purple-500 to-pink-600' },
      'UNIFORM': { icon: '👔', label: 'Forma', color: 'from-green-500 to-emerald-600' },
      'OTHER': { icon: '📦', label: 'Boshqa', color: 'from-gray-500 to-slate-600' },
    }
    return types[type as keyof typeof types] || types.OTHER
  }

  const typeInfo = getPaymentTypeInfo(payment.paymentType)

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="border-2 hover:shadow-xl transition-all overflow-hidden group">
        {/* Header Stripe */}
        <div className={`h-2 bg-gradient-to-r ${typeInfo.color}`} />
        
        <CardContent className="p-5">
          {/* Top Section */}
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap mb-3">
                <Badge className={`bg-gradient-to-r ${typeInfo.color} text-white border-none px-3 py-1`}>
                  {typeInfo.icon} {typeInfo.label}
                </Badge>

                {percentage === 100 && remainingAmount === 0 && (
                  <Badge className="bg-green-600 hover:bg-green-700 border-none">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    To'langan
                  </Badge>
                )}
                {hasPartialPayment && (
                  <Badge className="bg-orange-600 hover:bg-orange-700 border-none">
                    <CreditCard className="h-3 w-3 mr-1" />
                    Bo'lib-bo'lib
                  </Badge>
                )}
                {percentage === 0 && (
                  <Badge className="bg-amber-600 hover:bg-amber-700 border-none">
                    <Clock className="h-3 w-3 mr-1" />
                    Kutilmoqda
                  </Badge>
                )}

                {payment.paymentMonth && payment.paymentYear && (
                  <Badge variant="outline" className="border-2">
                    <Calendar className="h-3 w-3 mr-1" />
                    {monthNames[payment.paymentMonth - 1]} {payment.paymentYear}
                  </Badge>
                )}
              </div>

              {payment.notes && (
                <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-900">
                  <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-blue-900 dark:text-blue-100">{payment.notes}</p>
                </div>
              )}
            </div>

            <div className="text-right">
              <div className="text-2xl font-bold text-green-600">
                {formatNumber(paidAmount)}
              </div>
              <p className="text-sm text-muted-foreground">
                / {formatNumber(totalAmount)} so'm
              </p>
              {payment.transactions && payment.transactions.length > 0 && (
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="mt-2 gap-1">
                    <Receipt className="h-4 w-4" />
                    {isOpen ? 'Yashirish' : 'Batafsil'}
                    <ArrowRight className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
                  </Button>
                </CollapsibleTrigger>
              )}
            </div>
          </div>

          {/* Progress Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">To'lov holati</span>
              <span className="text-sm font-bold text-blue-600">{percentage.toFixed(1)}%</span>
            </div>
            <Progress value={percentage} className="h-2.5" />
          </div>

          {/* Quick Stats (when collapsed) */}
          {!isOpen && (
            <div className="grid grid-cols-2 gap-3 mt-4">
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-2 border-green-200 dark:border-green-900 rounded-xl px-4 py-3">
                <p className="text-xs text-green-600 dark:text-green-400 font-medium mb-1">To'landi</p>
                <p className="text-lg font-bold text-green-700 dark:text-green-300">
                  {formatNumber(paidAmount)}
                </p>
              </div>
              {remainingAmount > 0 && (
                <div className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20 border-2 border-orange-200 dark:border-orange-900 rounded-xl px-4 py-3">
                  <p className="text-xs text-orange-600 dark:text-orange-400 font-medium mb-1">Qoldi</p>
                  <p className="text-lg font-bold text-orange-700 dark:text-orange-300">
                    {formatNumber(remainingAmount)}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Expanded Content */}
          <CollapsibleContent className="mt-4 space-y-4">
            {hasPartialPayment && (
              <div className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20 border-2 border-orange-200 dark:border-orange-900 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                    <Info className="h-5 w-5 text-orange-600" />
                  </div>
                  <h4 className="font-bold text-orange-900 dark:text-orange-100">Bo'lib-bo'lib to'lov</h4>
                </div>
                <p className="text-sm text-orange-700 dark:text-orange-300 mb-4">
                  Bu to'lov qisman to'langan. Qolgan summani to'lash uchun administrator bilan bog'laning.
                </p>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Umumiy summa:</span>
                    <span className="font-bold">{formatNumber(totalAmount)} so'm</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-green-600">✓ To'langan:</span>
                    <span className="font-bold text-green-700">{formatNumber(paidAmount)} so'm</span>
                  </div>
                  <div className="flex justify-between text-sm border-t pt-2">
                    <span className="text-orange-600">⏳ Qolgan:</span>
                    <span className="font-bold text-orange-700">{formatNumber(remainingAmount)} so'm</span>
                  </div>
                </div>
              </div>
            )}

            {/* Transactions */}
            {payment.transactions && payment.transactions.length > 0 && (
              <div className="bg-white dark:bg-gray-900 border-2 rounded-xl shadow-lg overflow-hidden">
                <div className="bg-gradient-to-r from-gray-800 to-gray-900 text-white p-4 border-b-2">
                  <div className="flex items-center justify-center gap-2">
                    <Receipt className="h-5 w-5" />
                    <h3 className="text-lg font-bold">To'lovlar Kvitansiyasi</h3>
                  </div>
                </div>

                <div className="p-4 space-y-3">
                  {payment.transactions.map((transaction, index) => (
                    <div
                      key={transaction.id}
                      className="bg-gray-50 dark:bg-gray-800 border-2 rounded-lg p-4 hover:shadow-md transition-all"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold">
                            {index + 1}
                          </div>
                          <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                            {new Date(transaction.transactionDate).toLocaleDateString('uz-UZ', {
                              day: '2-digit',
                              month: 'long',
                              year: 'numeric'
                            })}
                          </span>
                        </div>
                        <div className="text-xl font-bold text-green-600">
                          {formatNumber(transaction.amount)} so'm
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-gray-500 dark:text-gray-400 mb-1">💳 To'lov usuli:</p>
                          <p className="font-semibold">
                            {transaction.paymentMethod === 'CASH' && '💵 Naqd pul'}
                            {transaction.paymentMethod === 'CLICK' && '💳 Click'}
                            {transaction.paymentMethod === 'PAYME' && '💳 Payme'}
                            {transaction.paymentMethod === 'UZUM' && '💳 Uzum'}
                          </p>
                        </div>
                        {transaction.receivedBy && (
                          <div>
                            <p className="text-gray-500 dark:text-gray-400 mb-1">👤 Qabul qildi:</p>
                            <p className="font-semibold truncate">{transaction.receivedBy.fullName}</p>
                          </div>
                        )}
                      </div>

                      {transaction.notes && (
                        <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-lg">
                          <p className="text-xs text-amber-700 dark:text-amber-300">
                            <Info className="h-3 w-3 inline mr-1" />
                            {transaction.notes}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {percentage === 100 && (
                  <div className="bg-gradient-to-r from-green-600 to-emerald-700 text-white p-4 border-t-2 text-center">
                    <CheckCircle2 className="h-6 w-6 mx-auto mb-2" />
                    <p className="font-bold">To'lov to'liq amalga oshirildi!</p>
                    <p className="text-sm text-green-100">Rahmat! Barcha to'lovlar o'z vaqtida to'landi.</p>
                  </div>
                )}
              </div>
            )}
          </CollapsibleContent>
        </CardContent>
      </Card>
    </Collapsible>
  )
}

