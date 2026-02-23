'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Receipt, ChevronDown, ChevronUp, CheckCircle2 } from 'lucide-react'
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
import { useAdminPermissions } from '@/components/admin/permissions-provider'
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
      avatar: string | null
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
  const { can } = useAdminPermissions()
  const canRead = can('payments', 'READ')
  const canCreate = can('payments', 'CREATE')
  const canUpdate = can('payments', 'UPDATE')
  const canDelete = can('payments', 'DELETE')
  const canBulkAction = canRead || canUpdate || canDelete
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

  const getProgressTextColor = (percentage: number) => {
    if (percentage === 0) return 'text-red-600'
    if (percentage < 100) return 'text-amber-600'
    return 'text-emerald-600'
  }

  const formatDate = (date: Date | string) => {
    const d = new Date(date)
    const day = d.getDate().toString().padStart(2, '0')
    const month = (d.getMonth() + 1).toString().padStart(2, '0')
    const year = d.getFullYear()
    return `${day}/${month}/${year}`
  }

  const getMethodLabel = (method: string) => {
    const map: Record<string, string> = { CASH: 'Naqd', CLICK: 'Click', PAYME: 'Payme', UZUM: 'Uzum' }
    return map[method] || method
  }

  // Sort: least paid (0%) → most paid (100%)
  const sortedPayments = [...payments].sort((a, b) =>
    calculateProgress(a).percentage - calculateProgress(b).percentage
  )

  const renderDesktopTable = () => (
    <div className="w-full rounded-xl border border-border overflow-hidden shadow-sm">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-muted/60 border-b border-border">
            {canBulkAction && (
              <th className="px-4 py-3 w-10">
                <Checkbox
                  checked={selectedIds.length === payments.length && payments.length > 0}
                  onCheckedChange={handleSelectAll}
                />
              </th>
            )}
            <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider w-[130px]">Invoice</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">O'quvchi</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider w-[110px]">Turi · Usul</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider w-[110px]">Muddat</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">To'lov Holati ↑%</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider w-[110px]">Status</th>
            <th className="px-4 py-3 w-[150px]" />
          </tr>
        </thead>
        <tbody>
          {sortedPayments.map((payment, idx) => {
            const progress = calculateProgress(payment)
            const isOverdue = payment.status === 'PENDING' && new Date(payment.dueDate) < new Date()
            const isSelected = selectedIds.includes(payment.id)

            const rowBg =
              progress.percentage === 100
                ? 'bg-emerald-50/40 hover:bg-emerald-50/70'
                : isOverdue
                ? 'bg-red-50/40 hover:bg-red-50/70'
                : progress.percentage > 0
                ? 'bg-amber-50/30 hover:bg-amber-50/60'
                : 'bg-white hover:bg-slate-50/80'

            const leftBorder =
              progress.percentage === 100
                ? 'border-l-4 border-l-emerald-400'
                : isOverdue
                ? 'border-l-4 border-l-red-400'
                : progress.percentage > 0
                ? 'border-l-4 border-l-amber-400'
                : 'border-l-4 border-l-slate-300'

            return (
              <tr
                key={payment.id}
                className={`${rowBg} ${leftBorder} border-b border-border/60 transition-colors ${isSelected ? 'ring-1 ring-inset ring-blue-400' : ''}`}
              >
                {canBulkAction && (
                  <td className="px-4 py-3">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={(checked) => handleSelectOne(payment.id, checked as boolean)}
                    />
                  </td>
                )}

                {/* Invoice */}
                <td className="px-4 py-3">
                  <code className="text-xs font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-700 block truncate max-w-[120px]" title={payment.invoiceNumber}>
                    {payment.invoiceNumber}
                  </code>
                </td>

                {/* Student */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-8 h-8 rounded-full shrink-0 shadow-sm overflow-hidden ${
                      progress.percentage === 100 ? 'ring-2 ring-emerald-400' :
                      isOverdue ? 'ring-2 ring-red-400' :
                      progress.percentage > 0 ? 'ring-2 ring-amber-400' : 'ring-1 ring-slate-300'
                    }`}>
                      {payment.student?.user?.avatar ? (
                        <Image
                          src={payment.student.user.avatar}
                          alt={payment.student.user.fullName ?? ''}
                          width={32}
                          height={32}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className={`w-full h-full flex items-center justify-center text-white text-xs font-bold ${
                          progress.percentage === 100 ? 'bg-emerald-500' :
                          isOverdue ? 'bg-red-500' :
                          progress.percentage > 0 ? 'bg-amber-500' : 'bg-slate-400'
                        }`}>
                          {payment.student?.user?.fullName?.charAt(0) ?? '?'}
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground leading-tight">
                        {payment.student?.user?.fullName || 'N/A'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatNumber(Number(payment.amount))} so'm
                      </p>
                    </div>
                  </div>
                </td>

                {/* Type · Method */}
                <td className="px-4 py-3">
                  <p className="text-xs font-medium text-foreground">{getPaymentTypeLabel(payment.paymentType)}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{getMethodLabel(payment.paymentMethod)}</p>
                </td>

                {/* Due date */}
                <td className="px-4 py-3">
                  <p className={`text-xs font-medium tabular-nums ${isOverdue ? 'text-red-600' : 'text-foreground'}`}>
                    {formatDate(payment.dueDate)}
                  </p>
                  {payment.paidDate && (
                    <p className="text-[11px] text-emerald-600 mt-0.5 tabular-nums">
                      ✓ {formatDate(payment.paidDate)}
                    </p>
                  )}
                </td>

                {/* Progress */}
                <td className="px-4 py-3">
                  <div className="space-y-1.5 min-w-[200px]">
                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <Progress
                          value={progress.percentage}
                          className="h-2 bg-slate-200"
                          indicatorClassName={getProgressColor(progress.percentage)}
                        />
                      </div>
                      <span className={`text-xs font-bold w-9 text-right tabular-nums ${getProgressTextColor(progress.percentage)}`}>
                        {progress.percentage}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className={`font-semibold ${getProgressTextColor(progress.percentage)}`}>
                        {formatNumber(progress.paid)} so'm
                      </span>
                      <span className="text-muted-foreground">/ {formatNumber(progress.total)} so'm</span>
                    </div>
                    {progress.percentage > 0 && progress.percentage < 100 && (
                      <p className="text-[11px] text-amber-600 font-medium">
                        Qarz: {formatNumber(progress.remaining)} so'm
                      </p>
                    )}
                    {/* Transaction history toggle */}
                    {payment.transactions && payment.transactions.length > 0 && (
                      <button
                        type="button"
                        onClick={() => toggleExpanded(payment.id)}
                        className="flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-800 transition-colors mt-0.5"
                      >
                        <Receipt className="h-3 w-3" />
                        {expandedPayments.has(payment.id) ? 'Yashirish' : `Tarix (${payment.transactions.length})`}
                        {expandedPayments.has(payment.id) ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                      </button>
                    )}
                    {/* Transactions expanded */}
                    {expandedPayments.has(payment.id) && payment.transactions && payment.transactions.length > 0 && (
                      <div className="mt-2 space-y-1.5 bg-blue-50 border border-blue-200 rounded-lg p-2">
                        {payment.transactions.map((tx, i) => (
                          <div key={tx.id} className="flex items-center justify-between text-[11px] bg-white border border-blue-100 rounded px-2 py-1.5">
                            <div className="flex items-center gap-1.5">
                              <span className="text-blue-500 font-bold">#{i + 1}</span>
                              <span>{formatDate(tx.transactionDate)}</span>
                              <span className="text-muted-foreground">·</span>
                              <span>{getMethodLabel(tx.paymentMethod)}</span>
                            </div>
                            <span className="font-semibold text-emerald-600">{formatNumber(Number(tx.amount))}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </td>

                {/* Status badge */}
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${
                    payment.status === 'COMPLETED'
                      ? 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-300'
                      : payment.status === 'PARTIALLY_PAID'
                      ? 'bg-amber-100 text-amber-700 ring-1 ring-amber-300'
                      : payment.status === 'PENDING'
                      ? isOverdue
                        ? 'bg-red-100 text-red-700 ring-1 ring-red-300'
                        : 'bg-orange-100 text-orange-700 ring-1 ring-orange-300'
                      : 'bg-slate-100 text-slate-600 ring-1 ring-slate-300'
                  }`}>
                    {payment.status === 'COMPLETED' && '✓ To\'langan'}
                    {payment.status === 'PARTIALLY_PAID' && '⏳ Qisman'}
                    {payment.status === 'PENDING' && (isOverdue ? '⚠ Kechikkan' : '○ Kutilmoqda')}
                    {payment.status === 'REFUNDED' && '↩ Qaytarilgan'}
                    {payment.status === 'FAILED' && '✕ Xato'}
                  </span>
                </td>

                {/* Action */}
                <td className="px-4 py-3">
                  {canCreate && progress.percentage < 100 ? (
                    <Button
                      size="sm"
                      onClick={() => handleAddPartialPayment(payment)}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8 gap-1.5 shadow-sm"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      To'lov qo'sh
                    </Button>
                  ) : progress.percentage === 100 ? (
                    <div className="flex items-center gap-1.5 text-emerald-600 text-xs font-semibold justify-center">
                      <CheckCircle2 className="h-4 w-4" />
                      To'liq
                    </div>
                  ) : null}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
      {sortedPayments.length === 0 && (
        <div className="py-16 text-center text-muted-foreground">
          <p className="text-sm">To'lovlar topilmadi</p>
        </div>
      )}
    </div>
  )

  const renderMobileCards = () => (
    <div className="space-y-3 sm:space-y-4 pb-20">
      {sortedPayments.map((payment) => {
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
                  {canBulkAction && (
                    <Checkbox
                      checked={selectedIds.includes(payment.id)}
                      onCheckedChange={(checked) => handleSelectOne(payment.id, checked as boolean)}
                      className="mt-0.5"
                    />
                  )}
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
                  <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full overflow-hidden shadow-lg shrink-0 ${
                    progress.percentage === 100 ? 'ring-2 ring-emerald-400' :
                    progress.percentage > 0 ? 'ring-2 ring-amber-400' : 'ring-2 ring-blue-400'
                  }`}>
                    {payment.student?.user?.avatar ? (
                      <Image
                        src={payment.student.user.avatar}
                        alt={payment.student.user.fullName ?? ''}
                        width={40}
                        height={40}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className={`w-full h-full flex items-center justify-center text-white font-bold text-base sm:text-lg ${
                        progress.percentage === 100 ? 'bg-gradient-to-br from-green-500 to-emerald-600' :
                        progress.percentage > 0 ? 'bg-gradient-to-br from-yellow-500 to-amber-600' :
                        'bg-gradient-to-br from-blue-500 to-cyan-600'
                      }`}>
                        {payment.student?.user?.fullName?.charAt(0) || '?'}
                      </div>
                    )}
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
              {canCreate && progress.percentage < 100 && (
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
                  <p className={`font-semibold text-xs sm:text-sm tabular-nums ${isOverdue ? 'text-red-600' : 'text-gray-900'}`}>
                    {formatDate(payment.dueDate)}
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
                              <span className="font-bold text-gray-900 tabular-nums">
                                {formatDate(transaction.transactionDate)}
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
        onExport={canRead ? handleExport : undefined}
        onDelete={canDelete ? handleBulkDelete : undefined}
        onStatusChange={canUpdate ? handleBulkStatusChange : undefined}
        statusOptions={canUpdate ? statusOptions : undefined}
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
