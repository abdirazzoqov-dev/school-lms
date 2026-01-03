'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Eye, Pencil, Plus } from 'lucide-react'
import { DeleteButton } from '@/components/delete-button'
import { deletePayment, bulkDeletePayments, bulkChangePaymentStatus } from '@/app/actions/payment'
import { Checkbox } from '@/components/ui/checkbox'
import { BulkActionsToolbar } from '@/components/bulk-actions-toolbar'
import { exportToCSV, formatPaymentsForExport } from '@/lib/export'
import { formatNumber } from '@/lib/utils'
import { Progress } from '@/components/ui/progress'
import { AddPartialPaymentModal } from '@/components/add-partial-payment-modal'

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
}

export function PaymentsTable({ payments }: { payments: Payment[] }) {
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [partialPaymentModal, setPartialPaymentModal] = useState<{
    open: boolean
    payment: Payment | null
  }>({
    open: false,
    payment: null
  })

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

  const handleAddPartialPayment = (payment: Payment) => {
    setPartialPaymentModal({
      open: true,
      payment
    })
  }

  const handleExport = () => {
    const selectedPayments = payments.filter(p => selectedIds.includes(p.id))
    const formatted = formatPaymentsForExport(selectedPayments)
    exportToCSV(formatted, 'payments')
  }

  const handleBulkDelete = async () => {
    await bulkDeletePayments(selectedIds)
    setSelectedIds([])
  }

  const handleBulkStatusChange = async (status: string) => {
    await bulkChangePaymentStatus(selectedIds, status as any)
    setSelectedIds([])
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
    
    if (totalAmount === 0) return { percentage: 0, paid: 0, total: 0 }
    
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

  return (
    <>
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
              <th className="p-4 text-left text-sm font-medium">Harakatlar</th>
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
                        {formatNumber(payment.amount)} so'm
                      </div>
                      {payment.paidAmount && Number(payment.paidAmount) > 0 && (
                        <div className="text-sm text-muted-foreground">
                          To'langan: {formatNumber(payment.paidAmount)}
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
                    </div>
                  </td>
                  <td className="p-4">
                    <div>
                      <div className="text-sm">{payment.paymentType}</div>
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
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    {/* Add Partial Payment Button (if not fully paid) */}
                    {progress.percentage < 100 && (
                      <Button 
                        variant="default" 
                        size="sm"
                        onClick={() => handleAddPartialPayment(payment)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        To'lov
                      </Button>
                    )}
                    
                    <Link href={`/admin/payments/${payment.id}`}>
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Link href={`/admin/payments/${payment.id}/edit`}>
                      <Button variant="ghost" size="sm">
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </Link>
                    {payment.status !== 'COMPLETED' && (
                      <DeleteButton
                        itemId={payment.id}
                        itemName={payment.invoiceNumber}
                        itemType="payment"
                        onDelete={deletePayment}
                      />
                    )}
                  </div>
                </td>
              </tr>
            )
            })}
          </tbody>
        </table>
      </div>

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

