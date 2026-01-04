'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Eye, Building2 } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { BulkActionsToolbar } from '@/components/bulk-actions-toolbar'
import { exportToCSV } from '@/lib/export'

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
  tenant: {
    id: string
    name: string
    slug: string
  }
  student: {
    user: {
      fullName: string
    } | null
  }
}

export function SuperAdminPaymentsTable({ payments }: { payments: Payment[] }) {
  const [selectedIds, setSelectedIds] = useState<string[]>([])

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
    const selectedPayments = payments.filter(p => selectedIds.includes(p.id))
    const formatted = selectedPayments.map(payment => ({
      'Invoice': payment.invoiceNumber,
      'Maktab': payment.tenant.name,
      'O\'quvchi': payment.student?.user?.fullName || 'N/A',
      'Summasi': Number(payment.amount).toLocaleString(),
      'To\'langan': payment.paidAmount ? Number(payment.paidAmount).toLocaleString() : '0',
      'Qoldiq': payment.remainingAmount ? Number(payment.remainingAmount).toLocaleString() : '0',
      'Turi': payment.paymentType,
      'Usuli': payment.paymentMethod,
      'Status': payment.status,
      'Muddat': new Date(payment.dueDate).toLocaleDateString('uz-UZ'),
      'To\'langan sana': payment.paidDate ? new Date(payment.paidDate).toLocaleDateString('uz-UZ') : '',
    }))
    exportToCSV(formatted, 'super-admin-payments')
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
              <th className="p-4 text-left text-sm font-medium">Maktab</th>
              <th className="p-4 text-left text-sm font-medium">O'quvchi</th>
              <th className="p-4 text-left text-sm font-medium">Summasi</th>
              <th className="p-4 text-left text-sm font-medium">Usuli</th>
              <th className="p-4 text-left text-sm font-medium">Muddat</th>
              <th className="p-4 text-left text-sm font-medium">Status</th>
              <th className="p-4 text-left text-sm font-medium">Harakatlar</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {payments.map((payment) => (
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
                  <Link 
                    href={`/super-admin/tenants/${payment.tenant.id}`}
                    className="flex items-center gap-2 hover:underline"
                  >
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium">{payment.tenant.name}</div>
                      <div className="text-xs text-muted-foreground">@{payment.tenant.slug}</div>
                    </div>
                  </Link>
                </td>
                <td className="p-4">
                  <div className="font-medium">
                    {payment.student?.user?.fullName || 'N/A'}
                  </div>
                </td>
                <td className="p-4">
                  <div>
                    <div className="font-medium">
                      {Number(payment.amount).toLocaleString()} so'm
                    </div>
                    {payment.paidAmount && (
                      <div className="text-sm text-muted-foreground">
                        To'langan: {Number(payment.paidAmount).toLocaleString()}
                      </div>
                    )}
                  </div>
                </td>
                <td className="p-4">
                  <div>
                    <div className="text-sm">
                      {payment.paymentType === 'TUITION' ? 'O\'qish haqi' :
                       payment.paymentType === 'BOOKS' ? 'Kitoblar' :
                       payment.paymentType === 'UNIFORM' ? 'Forma' :
                       payment.paymentType === 'TRANSPORT' ? 'Transport' :
                       payment.paymentType === 'MEALS' ? 'Ovqat' : 'Boshqa'}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {payment.paymentMethod === 'CASH' ? 'Naqd' :
                       payment.paymentMethod === 'CARD' ? 'Karta' :
                       payment.paymentMethod === 'BANK_TRANSFER' ? 'O\'tkazma' : 'Online'}
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
                    payment.status === 'PENDING' ? 'secondary' : 
                    'destructive'
                  }>
                    {payment.status === 'COMPLETED' ? 'To\'langan' :
                     payment.status === 'PENDING' ? 'Kutilmoqda' : 
                     payment.status === 'REFUNDED' ? 'Qaytarilgan' :
                     'Muvaffaqiyatsiz'}
                  </Badge>
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <Link href={`/super-admin/tenants/${payment.tenant.id}`}>
                      <Button variant="ghost" size="sm" title="Maktabni ko'rish">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <BulkActionsToolbar
        selectedCount={selectedIds.length}
        onClearSelection={() => setSelectedIds([])}
        onExport={handleExport}
        entityName="to'lov"
      />
    </>
  )
}
