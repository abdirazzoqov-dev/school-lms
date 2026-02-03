'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Receipt, ChevronDown, ChevronUp } from 'lucide-react'
import { bulkDeletePayments, bulkChangePaymentStatus } from '@/app/actions/payment'
import { Checkbox } from '@/components/ui/checkbox'
import { BulkActionsToolbar } from '@/components/bulk-actions-toolbar'
import { exportToCSV, formatPaymentsForExport } from '@/lib/export'
import { formatNumber } from '@/lib/utils'
import { Progress } from '@/components/ui/progress'
import { AddPartialPaymentModal } from '@/components/add-partial-payment-modal'
import { ResponsiveTableWrapper } from '@/components/responsive-table-wrapper'
import { Card, CardContent } from '@/components/ui/card'
import { useToast } from '@/components/ui/use-toast'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"

interface Payment {
  id: string
  invoiceNumber: string
  amount: any
  paidAmount: any | null
  remainingAmount: any | null
  paymentType: string
  paymentMethod: string
  status: string
  dueDate: Date
  paidDate: Date | null
  paymentMonth: number | null
  paymentYear: number | null
  student: {
    user: {
      fullName: string
    } | null
    monthlyTuitionFee: any | null
  }
  transactions?: Array<{
    id: string
    amount: any
    paymentMethod: string
    transactionDate: Date
    receiptNumber: string | null
    notes: string | null
    receivedBy: {
      fullName: string
      email: string | null
    } | null
  }>
}

export function PaymentsTable({ payments }: { payments: Payment[] }) {
  const router = useRouter()
  const { toast } = useToast()
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [expandedPayments, setExpandedPayments] = useState<Set<string>>(new Set())
  const [partialPaymentModal, setPartialPaymentModal] = useState<{
    open: boolean
    payment: Payment | null
  }>({
    open: false,
    payment: null
  })

  const toggleExpanded = (paymentId: string) => {
    setExpandedPayments(prev => {
      const newSet = new Set(prev)
      if (newSet.has(paymentId)) {
        newSet.delete(paymentId)
      } else {
        newSet.add(paymentId)
      }
      return newSet
    })
  }

  const getPaymentTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      'TUITION': 'O\'qish',
      'DORMITORY': 'Yotoqxona',
      'BOOKS': 'Kitob',
      'UNIFORM': 'Forma',
      'OTHER': 'Boshqa'
    }
    return types[type] || type
  }

  const handleAddPartialPayment = (payment: Payment) => {
    setPartialPaymentModal({
      open: true,
      payment
    })
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(payments.map(p => p.id))
    } else {
      setSelectedIds([])
    }
  }

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds([...selectedIds, id])
    } else {
      setSelectedIds(selectedIds.filter(pid => pid !== id))
    }
  }


  const handleExport = () => {
    try {
      const selectedPayments = payments.filter(p => selectedIds.includes(p.id))
      const formatted = formatPaymentsForExport(selectedPayments)
      exportToCSV(formatted, 'payments')
      
      toast({
        title: 'Muvaffaqiyatli!',
        description: `${selectedPayments.length} ta to'lov eksport qilindi`,
      })
    } catch (error) {
      toast({
        title: 'Xato!',
        description: 'Eksport qilishda xatolik yuz berdi',
        variant: 'destructive',
      })
    }
  }

  const handleBulkDelete = async () => {
    try {
      const result = await bulkDeletePayments(selectedIds)
      
      if (result.success) {
        toast({
          title: 'Muvaffaqiyatli!',
          description: `${result.deleted} ta to'lov o'chirildi${result.skipped ? `, ${result.skipped} ta to'lovni o'chirib bo'lmadi` : ''}`,
        })
        setSelectedIds([])
        router.refresh()
      } else {
        toast({
          title: 'Xato!',
          description: result.error || 'To\'lovlarni o\'chirishda xatolik',
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: 'Xato!',
        description: 'Kutilmagan xatolik yuz berdi',
        variant: 'destructive',
      })
    }
  }

  const handleBulkStatusChange = async (status: string) => {
    try {
      const result = await bulkChangePaymentStatus(selectedIds, status as any)
      
      if (result.success) {
        toast({
          title: 'Muvaffaqiyatli!',
          description: `${result.updated} ta to'lov statusi yangilandi`,
        })
        setSelectedIds([])
        router.refresh()
      } else {
        toast({
          title: 'Xato!',
          description: result.error || 'To\'lovlar statusini o\'zgartirishda xatolik',
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: 'Xato!',
        description: 'Kutilmagan xatolik yuz berdi',
        variant: 'destructive',
      })
    }
  }

  const statusOptions = [
    { label: 'Kutilmoqda', value: 'PENDING' },
    { label: 'Qisman to\'langan', value: 'PARTIALLY_PAID' },
    { label: 'To\'langan', value: 'COMPLETED' },
    { label: 'Muvaffaqiyatsiz', value: 'FAILED' },
    { label: 'Qaytarilgan', value: 'REFUNDED' },
  ]

  // Calculate payment progress
  const calculateProgress = (payment: Payment) => {
    const totalAmount = Number(payment.amount) || 0
    const paidAmount = Number(payment.paidAmount) || 0
    
    if (totalAmount === 0) return { percentage: 0, paid: 0, total: 0, remaining: 0 }
    
    const percentage = Math.min(Math.round((paidAmount / totalAmount) * 100), 100)
    
    return {
      percentage,
      paid: paidAmount,
      total: totalAmount,
      remaining: totalAmount - paidAmount
    }
  }

  // Get progress color based on percentage
  const getProgressColor = (percentage: number) => {
    if (percentage === 0) return 'bg-red-500'
    if (percentage < 100) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  // Get progress text color
  const getProgressTextColor = (percentage: number) => {
    if (percentage === 0) return 'text-red-700'
    if (percentage < 100) return 'text-yellow-700'
    return 'text-green-700'
  }

  const renderDesktopTable = () => (
    <div className="rounded-md border overflow-x-auto">
      <div className="min-w-[1200px]">
        <table className="w-full">
          <thead className="border-b bg-muted/50">
            <tr>
              <th className="p-4 text-left w-12">
                <Checkbox
                  checked={selectedIds.length === payments.length && payments.length > 0}
                  onCheckedChange={handleSelectAll}
                />
              </th>
              <th className="p-4 text-left text-sm font-medium w-[140px]">Invoice</th>
              <th className="p-4 text-left text-sm font-medium w-[180px]">O'quvchi</th>
              <th className="p-4 text-left text-sm font-medium w-[140px]">Summasi</th>
              <th className="p-4 text-left text-sm font-medium w-[320px]">To'lov Holati</th>
              <th className="p-4 text-left text-sm font-medium w-[120px]">Usuli</th>
              <th className="p-4 text-left text-sm font-medium w-[120px]">Muddat</th>
              <th className="p-4 text-left text-sm font-medium w-[120px]">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {payments.map((payment) => {
              const progress = calculateProgress(payment)
              
              return (
                <tr key={payment.id} className="hover:bg-muted/50">
                  <td className="p-4">
                    <Checkbox
                      checked={selectedIds.includes(payment.id)}
                      onCheckedChange={(checked) => handleSelectOne(payment.id, checked as boolean)}
                    />
                  </td>
                  <td className="p-4">
                    <code className="text-sm">{payment.invoiceNumber}</code>
                  </td>
                  <td className="p-4">
                    <div className="font-medium">
                      {payment.student?.user?.fullName || 'N/A'}
                    </div>
                  </td>
                  <td className="p-4">
                    <div>
                      <div className="font-medium">
                        {formatNumber(Number(payment.amount))} so'm
                      </div>
                      {payment.paidAmount && Number(payment.paidAmount) > 0 && (
                        <div className="text-sm text-muted-foreground">
                          To'langan: {formatNumber(Number(payment.paidAmount))}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="space-y-2 max-w-[320px]">
                      {/* Progress Bar */}
                      <div className="flex items-center gap-2">
                        <div className="flex-1">
                          <Progress 
                            value={progress.percentage} 
                            className="h-2"
                            indicatorClassName={getProgressColor(progress.percentage)}
                          />
                        </div>
                        <span className={`text-sm font-semibold ${getProgressTextColor(progress.percentage)}`}>
                          {progress.percentage}%
                        </span>
                      </div>
                      
                      {/* Amount Display */}
                      <div className="flex items-center justify-between text-xs">
                        <span className={`font-medium ${getProgressTextColor(progress.percentage)}`}>
                          {formatNumber(progress.paid)} so'm
                        </span>
                        <span className="text-muted-foreground">/ {formatNumber(progress.total)} so'm</span>
                      </div>
                      
                      {/* Remaining Amount (if partial) */}
                      {progress.percentage > 0 && progress.percentage < 100 && (
                        <div className="flex items-center gap-1 text-xs text-orange-600">
                          <span>Qoldi:</span>
                          <span className="font-semibold">{formatNumber(progress.remaining)} so'm</span>
                        </div>
                      )}
                      
                      {/* Status Indicator */}
                      {progress.percentage === 0 && (
                        <div className="text-xs text-red-600 font-medium">
                          ⚠️ To'lov kutilmoqda
                        </div>
                      )}
                      {progress.percentage === 100 && (
                        <div className="text-xs text-green-600 font-medium">
                          ✓ To'liq to'langan
                        </div>
                      )}
                      {progress.percentage > 0 && progress.percentage < 100 && (
                        <div className="text-xs text-yellow-600 font-medium">
                          ⏳ Qisman to'langan
                        </div>
                      )}
                      
                      {/* Add Payment Button */}
                      {progress.percentage < 100 && (
                        <Button 
                          variant="default" 
                          size="sm"
                          onClick={() => handleAddPartialPayment(payment)}
                          className="bg-green-600 hover:bg-green-700 w-full mt-2"
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          To'lov qo'shish
                        </Button>
                      )}
                      
                      {/* Transactions History Toggle */}
                      {payment.transactions && payment.transactions.length > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleExpanded(payment.id)}
                          className="w-full mt-2 text-xs"
                        >
                          <Receipt className="h-3 w-3 mr-1" />
                          {expandedPayments.has(payment.id) ? 'Yashirish' : `Tarixi (${payment.transactions.length})`}
                          {expandedPayments.has(payment.id) ? (
                            <ChevronUp className="h-3 w-3 ml-1" />
                          ) : (
                            <ChevronDown className="h-3 w-3 ml-1" />
                          )}
                        </Button>
                      )}
                    </div>
                    
                    {/* Transactions Expanded - Compact Design */}
                    {expandedPayments.has(payment.id) && payment.transactions && payment.transactions.length > 0 && (
                      <div className="mt-3 p-2 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg space-y-1.5 max-w-[300px]">
                        <div className="flex items-center gap-1.5 mb-1.5 pb-1.5 border-b border-blue-200">
                          <Receipt className="h-3.5 w-3.5 text-blue-600" />
                          <p className="text-[10px] font-semibold text-blue-900">
                            Tarixi ({payment.transactions.length})
                          </p>
                        </div>
                        {payment.transactions.map((transaction, index) => (
                          <div 
                            key={transaction.id}
                            className="p-1.5 bg-white border border-blue-200 rounded space-y-1"
                          >
                            <div className="flex items-center justify-between gap-1">
                              <Badge className="bg-blue-600 text-white text-[9px] px-1.5 py-0.5 h-4">
                                #{index + 1}
                              </Badge>
                              <span className="text-xs font-bold text-green-600">
                                {formatNumber(Number(transaction.amount))}
                              </span>
                            </div>
                            <div className="space-y-0.5 text-[10px]">
                              <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Sana:</span>
                                <span className="font-medium">
                                  {new Date(transaction.transactionDate).toLocaleDateString('uz-UZ', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: '2-digit'
                                  })}
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Usul:</span>
                                <span className="font-medium">
                                  {transaction.paymentMethod === 'CASH' && 'Naqd'}
                                  {transaction.paymentMethod === 'CLICK' && 'Click'}
                                  {transaction.paymentMethod === 'PAYME' && 'Payme'}
                                  {transaction.paymentMethod === 'UZUM' && 'Uzum'}
                                </span>
                              </div>
                              {transaction.receivedBy && (
                                <div className="flex items-center justify-between">
                                  <span className="text-muted-foreground">Admin:</span>
                                  <span className="font-medium truncate max-w-[120px]" title={transaction.receivedBy.fullName}>
                                    {transaction.receivedBy.fullName}
                                  </span>
                                </div>
                              )}
                              {transaction.notes && (
                                <div className="pt-1 border-t border-gray-200">
                                  <p className="text-[9px] text-muted-foreground mb-0.5">Izoh:</p>
                                  <p className="text-[10px] font-medium line-clamp-2">{transaction.notes}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="p-4">
                    <div>
                      <div className="text-sm">{getPaymentTypeLabel(payment.paymentType)}</div>
                      <div className="text-xs text-muted-foreground">
                        {payment.paymentMethod}
                      </div>
                    </div>
                  </td>
                <td className="p-4">
                  <div className="text-sm">
                    {new Date(payment.dueDate).toLocaleDateString('uz-UZ')}
                  </div>
                  {payment.paidDate && (
                    <div className="text-xs text-muted-foreground">
                      To'langan: {new Date(payment.paidDate).toLocaleDateString('uz-UZ')}
                    </div>
                  )}
                </td>
                <td className="p-4">
                  <Badge variant={
                    payment.status === 'COMPLETED' ? 'default' : 
                    payment.status === 'PARTIALLY_PAID' ? 'outline' :
                    payment.status === 'PENDING' ? 'secondary' : 
                    'destructive'
                  }>
                    {payment.status === 'COMPLETED' ? 'To\'langan' :
                     payment.status === 'PARTIALLY_PAID' ? 'Qisman to\'langan' :
                     payment.status === 'PENDING' ? 'Kutilmoqda' : 
                     payment.status === 'REFUNDED' ? 'Qaytarilgan' :
                     'Muvaffaqiyatsiz'}
                  </Badge>
                </td>
              </tr>
            )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )

  const renderMobileCards = () => (
    <div className="space-y-3 sm:space-y-4 pb-20">
      {payments.map((payment) => {
        const progress = calculateProgress(payment)
        const isOverdue = payment.status === 'PENDING' && new Date(payment.dueDate) < new Date()
        
        return (
          <Card 
            key={payment.id} 
            className={`border-2 transition-all hover:shadow-xl overflow-visible ${
              progress.percentage === 100 
                ? 'border-green-200 bg-gradient-to-br from-green-50 to-emerald-50' 
                : progress.percentage > 0 
                  ? 'border-yellow-200 bg-gradient-to-br from-yellow-50 to-amber-50'
                  : isOverdue
                    ? 'border-red-300 bg-gradient-to-br from-red-50 to-rose-50'
                    : 'border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50'
            }`}
          >
            <CardContent className="p-3 sm:p-4 md:p-5">
              {/* Header with checkbox and status - Compact */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start gap-2">
                  <Checkbox
                    checked={selectedIds.includes(payment.id)}
                    onCheckedChange={(checked) => handleSelectOne(payment.id, checked as boolean)}
                    className="mt-0.5"
                  />
                  <div className="flex-1">
                    <code className="text-[10px] sm:text-xs bg-white/80 backdrop-blur-sm px-2 py-1 rounded border font-mono font-semibold">
                      {payment.invoiceNumber}
                    </code>
                  </div>
                </div>
                <Badge 
                  variant={
                    payment.status === 'COMPLETED' ? 'default' : 
                    payment.status === 'PARTIALLY_PAID' ? 'outline' :
                    payment.status === 'PENDING' ? 'secondary' : 
                    'destructive'
                  } 
                  className={`text-[10px] sm:text-xs font-bold ${
                    payment.status === 'COMPLETED' ? 'bg-green-500' :
                    payment.status === 'PARTIALLY_PAID' ? 'bg-yellow-500 text-white border-yellow-600' :
                    payment.status === 'PENDING' ? 'bg-orange-500' :
                    ''
                  }`}
                >
                  {payment.status === 'COMPLETED' ? '✓' :
                   payment.status === 'PARTIALLY_PAID' ? '⏳' :
                   payment.status === 'PENDING' ? '⚠️' : 
                   payment.status === 'REFUNDED' ? '↩️' :
                   '✖'}
                </Badge>
              </div>

              {/* Student Name - Compact */}
              <div className="mb-3 pb-3 border-b">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-white font-bold text-base sm:text-lg shadow-lg ${
                    progress.percentage === 100 ? 'bg-gradient-to-br from-green-500 to-emerald-600' :
                    progress.percentage > 0 ? 'bg-gradient-to-br from-yellow-500 to-amber-600' :
                    'bg-gradient-to-br from-blue-500 to-cyan-600'
                  }`}>
                    {payment.student?.user?.fullName?.charAt(0) || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-sm sm:text-base text-gray-900 truncate">
                      {payment.student?.user?.fullName || 'N/A'}
                    </h3>
                    <p className="text-[10px] sm:text-xs text-gray-600">
                      {getPaymentTypeLabel(payment.paymentType)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Amount Display - Compact for Mobile */}
              <div className={`mb-3 p-3 sm:p-4 rounded-xl border-2 ${
                progress.percentage === 100 
                  ? 'bg-green-100/50 border-green-300' 
                  : progress.percentage > 0
                    ? 'bg-yellow-100/50 border-yellow-300'
                    : 'bg-red-100/50 border-red-300'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs sm:text-sm text-gray-600 font-medium">Jami:</span>
                  <span className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">
                    {formatNumber(progress.total)} <span className="text-xs sm:text-sm">so'm</span>
                  </span>
                </div>
                
                {/* Progress Bar - Compact */}
                <div className="my-2">
                  <Progress 
                    value={progress.percentage} 
                    className="h-2.5 sm:h-3"
                    indicatorClassName={getProgressColor(progress.percentage)}
                  />
                </div>
                
                {/* Paid/Remaining - Compact */}
                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className={`p-1.5 sm:p-2 rounded-lg ${
                    progress.percentage === 100 ? 'bg-green-500' :
                    progress.percentage > 0 ? 'bg-yellow-500' :
                    'bg-gray-400'
                  }`}>
                    <p className="text-[10px] sm:text-xs text-white/90">To'langan</p>
                    <p className="text-sm sm:text-base md:text-lg font-bold text-white">
                      {formatNumber(progress.paid)}
                    </p>
                  </div>
                  <div className={`p-1.5 sm:p-2 rounded-lg ${
                    progress.remaining > 0 ? 'bg-red-500' : 'bg-gray-300'
                  }`}>
                    <p className="text-[10px] sm:text-xs text-white/90">Qoldi</p>
                    <p className="text-sm sm:text-base md:text-lg font-bold text-white">
                      {formatNumber(progress.remaining)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Payment Button - Responsive */}
              {progress.percentage < 100 && (
                <Button 
                  variant="default" 
                  size="lg"
                  onClick={() => handleAddPartialPayment(payment)}
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all h-12 sm:h-14 text-sm sm:text-base md:text-lg font-bold mb-2"
                >
                  <Plus className="h-4 w-4 sm:h-5 sm:w-5 mr-1.5 sm:mr-2" />
                  <span className="truncate">To'lov qo'shish ({formatNumber(progress.remaining)})</span>
                </Button>
              )}

              {/* Completed Badge */}
              {progress.percentage === 100 && (
                <div className="flex items-center justify-center gap-2 p-3 sm:p-4 bg-green-100 border-2 border-green-300 rounded-xl mb-2">
                  <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
                  <span className="text-sm sm:text-base font-bold text-green-700">To'liq to'langan ✓</span>
                </div>
              )}

              {/* Additional Info - Ultra Compact */}
              <div className="mt-2 pt-2 border-t grid grid-cols-2 gap-2 text-[10px] sm:text-xs">
                <div className="space-y-0.5">
                  <p className="text-gray-500">💳 Usul:</p>
                  <p className="font-semibold text-gray-900 text-xs sm:text-sm">{payment.paymentMethod}</p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-gray-500">📅 Muddat:</p>
                  <p className={`font-semibold text-xs sm:text-sm ${isOverdue ? 'text-red-600' : 'text-gray-900'}`}>
                    {new Date(payment.dueDate).toLocaleDateString('uz-UZ', {
                      day: '2-digit',
                      month: 'short'
                    })}
                  </p>
                </div>
              </div>

              {/* Transactions History Toggle */}
              {payment.transactions && payment.transactions.length > 0 && (
                <div className="mt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleExpanded(payment.id)}
                    className="w-full border-2 hover:bg-blue-50 h-9 text-xs sm:text-sm"
                  >
                    <Receipt className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    {expandedPayments.has(payment.id) ? 'Yashirish' : `Tarix (${payment.transactions.length})`}
                    {expandedPayments.has(payment.id) ? (
                      <ChevronUp className="h-3 w-3 sm:h-4 sm:w-4 ml-auto" />
                    ) : (
                      <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4 ml-auto" />
                    )}
                  </Button>
                  
                  {/* Expanded Transactions */}
                  {expandedPayments.has(payment.id) && (
                    <div className="mt-2 space-y-2">
                      {payment.transactions.map((transaction, index) => (
                        <div 
                          key={transaction.id}
                          className="p-2.5 sm:p-3 bg-gradient-to-br from-white to-blue-50 border-2 border-blue-200 rounded-lg shadow-md"
                        >
                          {/* Transaction Header - Compact */}
                          <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-blue-200">
                            <Badge className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[10px] sm:text-xs font-bold px-2 py-0.5">
                              #{index + 1}
                            </Badge>
                            <span className="text-base sm:text-lg font-bold text-green-600">
                              {formatNumber(Number(transaction.amount))}
                            </span>
                          </div>

                          {/* Transaction Details - Compact */}
                          <div className="space-y-1.5 text-xs sm:text-sm">
                            <div className="flex items-center justify-between p-1.5 bg-white/60 rounded">
                              <span className="text-gray-600">📅 Sana:</span>
                              <span className="font-bold text-gray-900">
                                {new Date(transaction.transactionDate).toLocaleDateString('uz-UZ', {
                                  day: '2-digit',
                                  month: 'short'
                                })}
                              </span>
                            </div>

                            <div className="flex items-center justify-between p-1.5 bg-white/60 rounded">
                              <span className="text-gray-600">💳 Usul:</span>
                              <Badge variant="outline" className="text-xs font-bold">
                                {transaction.paymentMethod === 'CASH' && 'Naqd'}
                                {transaction.paymentMethod === 'CLICK' && 'Click'}
                                {transaction.paymentMethod === 'PAYME' && 'Payme'}
                                {transaction.paymentMethod === 'UZUM' && 'Uzum'}
                              </Badge>
                            </div>

                            {transaction.receivedBy && (
                              <div className="flex items-center justify-between p-1.5 bg-white/60 rounded">
                                <span className="text-gray-600">👤</span>
                                <span className="font-semibold text-gray-900 text-right truncate max-w-[150px]">
                                  {transaction.receivedBy.fullName}
                                </span>
                              </div>
                            )}

                            {transaction.notes && (
                              <div className="p-2 bg-white/80 rounded border border-blue-200">
                                <p className="text-[10px] text-gray-600 mb-0.5">📝 Izoh:</p>
                                <p className="text-xs font-medium text-gray-800">
                                  {transaction.notes}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )

  return (
    <>
      <ResponsiveTableWrapper
        desktopContent={renderDesktopTable()}
        mobileContent={renderMobileCards()}
      />

      <BulkActionsToolbar
        selectedCount={selectedIds.length}
        onClearSelection={() => setSelectedIds([])}
        onExport={handleExport}
        onDelete={handleBulkDelete}
        onStatusChange={handleBulkStatusChange}
        statusOptions={statusOptions}
        entityName="to'lov"
      />

      {/* Partial Payment Modal */}
      {partialPaymentModal.payment && (
        <AddPartialPaymentModal
          open={partialPaymentModal.open}
          onOpenChange={(open) => setPartialPaymentModal({ open, payment: null })}
          payment={{
            id: partialPaymentModal.payment.id,
            invoiceNumber: partialPaymentModal.payment.invoiceNumber,
            amount: Number(partialPaymentModal.payment.amount),
            paidAmount: Number(partialPaymentModal.payment.paidAmount || 0),
            remainingAmount: Number(partialPaymentModal.payment.remainingAmount || partialPaymentModal.payment.amount),
            student: partialPaymentModal.payment.student
          }}
        />
      )}
    </>
  )
}
