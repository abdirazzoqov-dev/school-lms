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
      <table className="w-full">
          <thead className="border-b bg-muted/50">
            <tr>
              <th className="p-4 text-left w-12">
                <Checkbox
                  checked={selectedIds.length === payments.length && payments.length > 0}
                  onCheckedChange={handleSelectAll}
                />
              </th>
              <th className="p-4 text-left text-sm font-medium">Invoice</th>
              <th className="p-4 text-left text-sm font-medium">O'quvchi</th>
              <th className="p-4 text-left text-sm font-medium">Summasi</th>
              <th className="p-4 text-left text-sm font-medium min-w-[200px]">To'lov Holati</th>
              <th className="p-4 text-left text-sm font-medium">Usuli</th>
              <th className="p-4 text-left text-sm font-medium">Muddat</th>
              <th className="p-4 text-left text-sm font-medium">Status</th>
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
                    <div className="space-y-2 min-w-[200px]">
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
                    
                    {/* Transactions Expanded */}
                    {expandedPayments.has(payment.id) && payment.transactions && payment.transactions.length > 0 && (
                      <div className="mt-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg space-y-2">
                        <div className="flex items-center gap-2 mb-2">
                          <Receipt className="h-4 w-4 text-blue-600" />
                          <p className="text-xs font-semibold text-blue-900">
                            To'lovlar Tarixi ({payment.transactions.length})
                          </p>
                        </div>
                        {payment.transactions.map((transaction, index) => (
                          <div 
                            key={transaction.id}
                            className="p-2 bg-white border border-blue-200 rounded-md space-y-1"
                          >
                            <div className="flex items-center justify-between">
                              <Badge className="bg-blue-600 text-white text-xs">
                                #{index + 1}
                              </Badge>
                              <span className="text-sm font-bold text-green-600">
                                {formatNumber(Number(transaction.amount))} so'm
                              </span>
                            </div>
                            <div className="grid grid-cols-2 gap-x-2 text-xs">
                              <div>
                                <span className="text-muted-foreground">Sana:</span>
                                <p className="font-medium">
                                  {new Date(transaction.transactionDate).toLocaleDateString('uz-UZ', {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric'
                                  })}
                                </p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Usul:</span>
                                <p className="font-medium">
                                  {transaction.paymentMethod === 'CASH' && '💵 Naqd'}
                                  {transaction.paymentMethod === 'CLICK' && '💳 Click'}
                                  {transaction.paymentMethod === 'PAYME' && '💳 Payme'}
                                  {transaction.paymentMethod === 'UZUM' && '💳 Uzum'}
                                </p>
                              </div>
                              {transaction.receivedBy && (
                                <div className="col-span-2">
                                  <span className="text-muted-foreground">Qabul qildi:</span>
                                  <p className="font-medium">{transaction.receivedBy.fullName}</p>
                                </div>
                              )}
                              {transaction.notes && (
                                <div className="col-span-2 pt-1 border-t">
                                  <span className="text-muted-foreground">Izoh:</span>
                                  <p className="text-xs font-medium">{transaction.notes}</p>
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
  )

  const renderMobileCards = () => (
    <div className="space-y-3">
      {payments.map((payment) => {
        const progress = calculateProgress(payment)
        
        return (
          <Card key={payment.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start gap-3 flex-1">
                  <Checkbox
                    checked={selectedIds.includes(payment.id)}
                    onCheckedChange={(checked) => handleSelectOne(payment.id, checked as boolean)}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <code className="text-xs bg-muted px-2 py-0.5 rounded">
                        {payment.invoiceNumber}
                      </code>
                      <Badge variant={
                        payment.status === 'COMPLETED' ? 'default' : 
                        payment.status === 'PARTIALLY_PAID' ? 'outline' :
                        payment.status === 'PENDING' ? 'secondary' : 
                        'destructive'
                      } className="text-xs">
                        {payment.status === 'COMPLETED' ? 'To\'langan' :
                         payment.status === 'PARTIALLY_PAID' ? 'Qisman' :
                         payment.status === 'PENDING' ? 'Kutilmoqda' : 
                         payment.status === 'REFUNDED' ? 'Qaytarilgan' :
                         'Xato'}
                      </Badge>
                    </div>
                    
                    <div className="font-medium text-base mb-2">
                      {payment.student?.user?.fullName || 'N/A'}
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="space-y-2 mb-3">
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
                      
                      <div className="flex items-center justify-between text-xs">
                        <span className={`font-medium ${getProgressTextColor(progress.percentage)}`}>
                          {formatNumber(progress.paid)} so'm
                        </span>
                        <span className="text-muted-foreground">/ {formatNumber(progress.total)} so'm</span>
                      </div>
                      
                      {progress.percentage > 0 && progress.percentage < 100 && (
                        <div className="flex items-center gap-1 text-xs text-orange-600">
                          <span>Qoldi:</span>
                          <span className="font-semibold">{formatNumber(progress.remaining)} so'm</span>
                        </div>
                      )}
                      
                      {/* Add Payment Button for Mobile */}
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
                      
                      {/* Transactions History for Mobile */}
                      {payment.transactions && payment.transactions.length > 0 && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleExpanded(payment.id)}
                            className="w-full mt-2 text-xs"
                          >
                            <Receipt className="h-3 w-3 mr-1" />
                            {expandedPayments.has(payment.id) ? 'Yashirish' : `To'lovlar Tarixi (${payment.transactions.length})`}
                            {expandedPayments.has(payment.id) ? (
                              <ChevronUp className="h-3 w-3 ml-1" />
                            ) : (
                              <ChevronDown className="h-3 w-3 ml-1" />
                            )}
                          </Button>
                          
                          {expandedPayments.has(payment.id) && (
                            <div className="mt-3 p-3 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border-2 border-blue-300 rounded-xl space-y-2 shadow-sm">
                              <div className="flex items-center gap-2 mb-3 pb-2 border-b border-blue-200">
                                <div className="p-1.5 bg-blue-500 rounded-lg">
                                  <Receipt className="h-4 w-4 text-white" />
                                </div>
                                <p className="text-sm font-bold text-blue-900">
                                  To'lovlar Tarixi ({payment.transactions.length} ta)
                                </p>
                              </div>
                              {payment.transactions.map((transaction, index) => (
                                <div 
                                  key={transaction.id}
                                  className="p-3 bg-white border-2 border-blue-200 rounded-lg shadow-sm hover:shadow-md transition-shadow"
                                >
                                  <div className="flex items-center justify-between mb-2">
                                    <Badge className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-semibold">
                                      #{index + 1}
                                    </Badge>
                                    <span className="text-base font-bold text-green-600">
                                      {formatNumber(Number(transaction.amount))} so'm
                                    </span>
                                  </div>
                                  <div className="space-y-1.5 text-xs">
                                    <div className="flex items-center justify-between py-1">
                                      <span className="text-muted-foreground font-medium">📅 Sana:</span>
                                      <span className="font-semibold text-gray-700">
                                        {new Date(transaction.transactionDate).toLocaleDateString('uz-UZ', {
                                          day: 'numeric',
                                          month: 'long',
                                          year: 'numeric'
                                        })}
                                      </span>
                                    </div>
                                    <div className="flex items-center justify-between py-1">
                                      <span className="text-muted-foreground font-medium">💳 Usul:</span>
                                      <Badge variant="outline" className="text-xs font-medium">
                                        {transaction.paymentMethod === 'CASH' && '💵 Naqd pul'}
                                        {transaction.paymentMethod === 'CLICK' && '💳 Click'}
                                        {transaction.paymentMethod === 'PAYME' && '💳 Payme'}
                                        {transaction.paymentMethod === 'UZUM' && '💳 Uzum'}
                                      </Badge>
                                    </div>
                                    {transaction.receivedBy && (
                                      <div className="flex items-center justify-between py-1">
                                        <span className="text-muted-foreground font-medium">👤 Qabul qildi:</span>
                                        <span className="font-semibold text-gray-700 text-right max-w-[150px] truncate">
                                          {transaction.receivedBy.fullName}
                                        </span>
                                      </div>
                                    )}
                                    {transaction.notes && (
                                      <div className="mt-2 pt-2 border-t border-gray-200">
                                        <p className="text-muted-foreground font-medium mb-1">📝 Izoh:</p>
                                        <p className="text-xs font-medium text-gray-700 bg-gray-50 p-2 rounded">
                                          {transaction.notes}
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </>
                      )}
                    </div>

                    <div className="space-y-1 text-sm text-muted-foreground">
                      <div className="flex items-start gap-2">
                        <span className="font-medium min-w-[70px]">Turi:</span>
                        <span>{getPaymentTypeLabel(payment.paymentType)} ({payment.paymentMethod})</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="font-medium min-w-[70px]">Muddat:</span>
                        <span>{new Date(payment.dueDate).toLocaleDateString('uz-UZ')}</span>
                      </div>
                      {payment.paidDate && (
                        <div className="flex items-start gap-2">
                          <span className="font-medium min-w-[70px]">To'langan:</span>
                          <span>{new Date(payment.paidDate).toLocaleDateString('uz-UZ')}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
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
