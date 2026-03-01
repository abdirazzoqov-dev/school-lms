'use client'

import { useState, Fragment } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Plus, Receipt, ChevronDown, ChevronUp, CheckCircle2,
  CreditCard, Calendar, User, Hash, ArrowDownRight, Clock,
  AlertTriangle, Banknote, Wallet, Smartphone, ShieldCheck
} from 'lucide-react'

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
    user: { fullName: string; avatar: string | null } | null
    monthlyTuitionFee: any | null
  }
  transactions?: Array<{
    id: string
    amount: any
    paymentMethod: string
    transactionDate: Date
    receiptNumber: string | null
    notes: string | null
    receivedBy: { fullName: string; email: string | null } | null
  }>
}

export function PaymentsTable({ payments }: { payments: Payment[] }) {
  const router = useRouter()
  const { toast } = useToast()
  const { can } = useAdminPermissions()
  const canRead    = can('payments', 'READ')
  const canCreate  = can('payments', 'CREATE')
  const canUpdate  = can('payments', 'UPDATE')
  const canDelete  = can('payments', 'DELETE')
  const canBulkAction = canRead || canUpdate || canDelete

  const [selectedIds, setSelectedIds]         = useState<string[]>([])
  const [expandedPayments, setExpandedPayments] = useState<Set<string>>(new Set())
  const [partialPaymentModal, setPartialPaymentModal] = useState<{ open: boolean; payment: Payment | null }>({ open: false, payment: null })

  const toggleExpanded = (id: string) =>
    setExpandedPayments(prev => {
      const s = new Set(prev)
      s.has(id) ? s.delete(id) : s.add(id)
      return s
    })

  const getPaymentTypeLabel = (type: string) =>
    ({ TUITION: "O'qish", DORMITORY: 'Yotoqxona', BOOKS: 'Kitob', UNIFORM: 'Forma', OTHER: 'Boshqa' }[type] ?? type)

  const getMethodLabel = (method: string) =>
    ({ CASH: 'Naqd', CLICK: 'Click', PAYME: 'Payme', UZUM: 'Uzum' }[method] ?? method)

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'CASH':  return <Banknote className="h-3.5 w-3.5" />
      case 'CLICK': return <Smartphone className="h-3.5 w-3.5" />
      case 'PAYME': return <Wallet className="h-3.5 w-3.5" />
      case 'UZUM':  return <CreditCard className="h-3.5 w-3.5" />
      default:      return <CreditCard className="h-3.5 w-3.5" />
    }
  }

  const handleAddPartialPayment = (payment: Payment) =>
    setPartialPaymentModal({ open: true, payment })

  const handleSelectAll = (checked: boolean) =>
    setSelectedIds(checked ? payments.map(p => p.id) : [])

  const handleSelectOne = (id: string, checked: boolean) =>
    setSelectedIds(prev => checked ? [...prev, id] : prev.filter(x => x !== id))

  const handleExport = () => {
    try {
      const sel = payments.filter(p => selectedIds.includes(p.id))
      exportToCSV(formatPaymentsForExport(sel), 'payments')
      toast({ title: 'Muvaffaqiyatli!', description: `${sel.length} ta to'lov eksport qilindi` })
    } catch {
      toast({ title: 'Xato!', description: 'Eksport qilishda xatolik', variant: 'destructive' })
    }
  }

  const handleBulkDelete = async () => {
    try {
      const result = await bulkDeletePayments(selectedIds)
      if (result.success) {
        toast({ title: 'Muvaffaqiyatli!', description: `${result.deleted} ta to'lov o'chirildi` })
        setSelectedIds([])
        router.refresh()
      } else {
        toast({ title: 'Xato!', description: result.error || "O'chirishda xatolik", variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Xato!', description: 'Kutilmagan xatolik', variant: 'destructive' })
    }
  }

  const handleBulkStatusChange = async (status: string) => {
    try {
      const result = await bulkChangePaymentStatus(selectedIds, status as any)
      if (result.success) {
        toast({ title: 'Muvaffaqiyatli!', description: `${result.updated} ta to'lov statusi yangilandi` })
        setSelectedIds([])
        router.refresh()
      } else {
        toast({ title: 'Xato!', description: result.error || 'Status o\'zgartirishda xatolik', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Xato!', description: 'Kutilmagan xatolik', variant: 'destructive' })
    }
  }

  const statusOptions = [
    { label: 'Kutilmoqda',       value: 'PENDING' },
    { label: "Qisman to'langan", value: 'PARTIALLY_PAID' },
    { label: "To'langan",        value: 'COMPLETED' },
    { label: 'Muvaffaqiyatsiz',  value: 'FAILED' },
    { label: 'Qaytarilgan',      value: 'REFUNDED' },
  ]

  const calcProgress = (p: Payment) => {
    const total = Number(p.amount) || 0
    const paid  = Number(p.paidAmount) || 0
    const pct   = total === 0 ? 0 : Math.min(Math.round((paid / total) * 100), 100)
    return { percentage: pct, paid, total, remaining: total - paid }
  }

  const progressBarColor = (pct: number) =>
    pct === 0 ? 'bg-red-500' : pct < 100 ? 'bg-amber-500' : 'bg-emerald-500'

  const formatDate = (date: Date | string) => {
    const d = new Date(date)
    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`
  }

  const sortedPayments = [...payments].sort(
    (a, b) => calcProgress(a).percentage - calcProgress(b).percentage
  )

  /* ─── Status pill ─── */
  const StatusPill = ({ payment, isOverdue }: { payment: Payment; isOverdue: boolean }) => {
    const base = 'inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap border'
    if (payment.status === 'COMPLETED')
      return <span className={`${base} bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700`}><ShieldCheck className="h-3 w-3" />To'landi</span>
    if (payment.status === 'PARTIALLY_PAID')
      return <span className={`${base} bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700`}><Clock className="h-3 w-3" />Qisman</span>
    if (payment.status === 'PENDING' && isOverdue)
      return <span className={`${base} bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300 border-red-300 dark:border-red-700`}><AlertTriangle className="h-3 w-3" />Kechikkan</span>
    if (payment.status === 'PENDING')
      return <span className={`${base} bg-orange-50 dark:bg-orange-950/50 text-orange-700 dark:text-orange-300 border-orange-300 dark:border-orange-700`}><Clock className="h-3 w-3" />Kutilmoqda</span>
    if (payment.status === 'REFUNDED')
      return <span className={`${base} bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-600`}><ArrowDownRight className="h-3 w-3" />Qaytarildi</span>
    return <span className={`${base} bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-600`}>Xato</span>
  }

  /* ─── Transaction expanded panel (full-width row) ─── */
  const TransactionPanel = ({ payment, colSpan }: { payment: Payment; colSpan: number }) => {
    if (!payment.transactions?.length) return null
    return (
      <tr className="bg-gradient-to-r from-indigo-50/80 via-blue-50/60 to-slate-50/80 dark:from-indigo-950/30 dark:via-blue-950/20 dark:to-slate-900/30">
        <td colSpan={colSpan} className="px-6 py-4">
          {/* Header */}
          <div className="flex items-center gap-2 mb-3">
            <div className="flex items-center justify-center w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-900/50">
              <Receipt className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <span className="text-sm font-bold text-indigo-700 dark:text-indigo-300">
              To'lov Tarixi
            </span>
            <Badge className="bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800 text-[10px] font-bold">
              {payment.transactions.length} ta tranzaksiya
            </Badge>
          </div>

          {/* Timeline grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {payment.transactions.map((tx, i) => (
              <div
                key={tx.id}
                className="relative bg-white dark:bg-card border border-blue-200/80 dark:border-blue-800/60 rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow"
              >
                {/* Color stripe */}
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-emerald-400 to-emerald-600 rounded-l-xl" />

                <div className="pl-4 pr-4 py-3">
                  {/* Row 1: index + amount */}
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-2 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-800">
                      <Hash className="h-3 w-3" />{i + 1}
                    </span>
                    <span className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums">
                      {formatNumber(Number(tx.amount))} <span className="text-xs font-semibold text-emerald-500/80">so'm</span>
                    </span>
                  </div>

                  {/* Row 2: date + method */}
                  <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                    <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/50 rounded-lg px-2.5 py-1.5 border border-slate-200 dark:border-slate-700">
                      <Calendar className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400 shrink-0" />
                      <span className="font-semibold text-foreground tabular-nums">{formatDate(tx.transactionDate)}</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-blue-50 dark:bg-blue-950/40 rounded-lg px-2.5 py-1.5 border border-blue-200 dark:border-blue-800">
                      {getMethodIcon(tx.paymentMethod)}
                      <span className="font-semibold text-blue-700 dark:text-blue-300">{getMethodLabel(tx.paymentMethod)}</span>
                    </div>
                  </div>

                  {/* Row 3: received by */}
                  {tx.receivedBy && (
                    <div className="flex items-center gap-1.5 text-xs bg-purple-50 dark:bg-purple-950/30 rounded-lg px-2.5 py-1.5 border border-purple-200 dark:border-purple-800 mb-2">
                      <User className="h-3.5 w-3.5 text-purple-500 dark:text-purple-400 shrink-0" />
                      <span className="text-purple-700 dark:text-purple-300 font-medium truncate">{tx.receivedBy.fullName}</span>
                    </div>
                  )}

                  {/* Row 4: receipt + notes */}
                  {(tx.receiptNumber || tx.notes) && (
                    <div className="border-t border-slate-100 dark:border-slate-800 pt-2 mt-1 space-y-1">
                      {tx.receiptNumber && (
                        <p className="text-[10px] text-muted-foreground">
                          Kvitansiya: <span className="font-mono font-semibold text-foreground">{tx.receiptNumber}</span>
                        </p>
                      )}
                      {tx.notes && (
                        <p className="text-[10px] text-muted-foreground italic">{tx.notes}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </td>
      </tr>
    )
  }

  /* ─── Desktop table ─── */
  const renderDesktopTable = () => {
    const colSpan = canBulkAction ? 7 : 6
    return (
      <div className="w-full rounded-2xl border border-border shadow-sm overflow-hidden">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gradient-to-r from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-900 border-b-2 border-border">
              {canBulkAction && (
                <th className="px-4 py-3.5 w-10">
                  <Checkbox
                    checked={selectedIds.length === payments.length && payments.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                </th>
              )}
              <th className="px-4 py-3.5 text-left">
                <span className="flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
                  <User className="h-3.5 w-3.5" /> O'quvchi
                </span>
              </th>
              <th className="px-4 py-3.5 text-left">
                <span className="flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
                  <CreditCard className="h-3.5 w-3.5" /> Turi · Usul
                </span>
              </th>
              <th className="px-4 py-3.5 text-left">
                <span className="flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
                  <Calendar className="h-3.5 w-3.5" /> Sana
                </span>
              </th>
              <th className="px-4 py-3.5 text-left">
                <span className="flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
                  <Wallet className="h-3.5 w-3.5" /> To'lov holati ↑%
                </span>
              </th>
              <th className="px-4 py-3.5 text-left">
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Status</span>
              </th>
              <th className="px-4 py-3.5 w-[160px]" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {sortedPayments.map((payment) => {
              const progress  = calcProgress(payment)
              const isOverdue = payment.status === 'PENDING' && new Date(payment.dueDate) < new Date()
              const isSelected = selectedIds.includes(payment.id)
              const isExpanded = expandedPayments.has(payment.id)
              const hasTx      = (payment.transactions?.length ?? 0) > 0

              const accent =
                progress.percentage === 100 ? 'border-l-emerald-500'
                : isOverdue               ? 'border-l-red-500'
                : progress.percentage > 0 ? 'border-l-amber-500'
                : 'border-l-slate-300 dark:border-l-slate-600'

              const rowBg =
                progress.percentage === 100
                  ? 'bg-emerald-50/30 dark:bg-emerald-950/10 hover:bg-emerald-50/60 dark:hover:bg-emerald-950/20'
                  : isOverdue
                  ? 'bg-red-50/30 dark:bg-red-950/10 hover:bg-red-50/60 dark:hover:bg-red-950/20'
                  : progress.percentage > 0
                  ? 'bg-amber-50/20 dark:bg-amber-950/10 hover:bg-amber-50/50 dark:hover:bg-amber-950/20'
                  : 'bg-card hover:bg-muted/30'

              return (
                <Fragment key={payment.id}>
                  <tr
                    className={`${rowBg} border-l-4 ${accent} transition-colors ${isSelected ? 'ring-1 ring-inset ring-blue-300 dark:ring-blue-700' : ''}`}
                  >
                    {/* Checkbox */}
                    {canBulkAction && (
                      <td className="px-4 py-3">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={c => handleSelectOne(payment.id, c as boolean)}
                        />
                      </td>
                    )}

                    {/* Student */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full shrink-0 shadow overflow-hidden ${
                          progress.percentage === 100 ? 'ring-2 ring-emerald-400'
                          : isOverdue               ? 'ring-2 ring-red-400'
                          : progress.percentage > 0 ? 'ring-2 ring-amber-400'
                          : 'ring-1 ring-slate-300 dark:ring-slate-600'
                        }`}>
                          {payment.student?.user?.avatar ? (
                            <Image src={payment.student.user.avatar} alt={payment.student.user.fullName ?? ''} width={36} height={36} className="w-full h-full object-cover" />
                          ) : (
                            <div className={`w-full h-full flex items-center justify-center text-white text-sm font-bold ${
                              progress.percentage === 100 ? 'bg-gradient-to-br from-emerald-500 to-green-600'
                              : isOverdue               ? 'bg-gradient-to-br from-red-500 to-rose-600'
                              : progress.percentage > 0 ? 'bg-gradient-to-br from-amber-500 to-orange-600'
                              : 'bg-gradient-to-br from-slate-400 to-slate-500'
                            }`}>
                              {payment.student?.user?.fullName?.charAt(0) ?? '?'}
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-foreground leading-tight truncate max-w-[160px]">
                            {payment.student?.user?.fullName || 'N/A'}
                          </p>
                          <p className="text-xs text-muted-foreground tabular-nums">
                            {formatNumber(Number(payment.amount))} so'm
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Type · Method */}
                    <td className="px-4 py-3">
                      <span className="block text-xs font-semibold text-foreground mb-0.5">
                        {getPaymentTypeLabel(payment.paymentType)}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded">
                        {getMethodIcon(payment.paymentMethod)}
                        {getMethodLabel(payment.paymentMethod)}
                      </span>
                    </td>

                    {/* Dates */}
                    <td className="px-4 py-3">
                      <div className="space-y-1">
                        <p className={`text-xs font-semibold tabular-nums flex items-center gap-1 ${isOverdue ? 'text-red-600 dark:text-red-400' : 'text-foreground'}`}>
                          <Calendar className="h-3 w-3 shrink-0 text-muted-foreground" />
                          {formatDate(payment.dueDate)}
                        </p>
                        {payment.paidDate && (
                          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 tabular-nums flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3 shrink-0" />
                            {formatDate(payment.paidDate)}
                          </p>
                        )}
                      </div>
                    </td>

                    {/* Progress + tx toggle */}
                    <td className="px-4 py-3">
                      <div className="space-y-2 min-w-[220px]">
                        {/* Bar + % */}
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-slate-200 dark:bg-slate-700 rounded-full h-2.5 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${progressBarColor(progress.percentage)}`}
                              style={{ width: `${progress.percentage}%` }}
                            />
                          </div>
                          <span className={`text-xs font-extrabold w-9 text-right tabular-nums shrink-0 ${
                            progress.percentage === 100 ? 'text-emerald-600 dark:text-emerald-400'
                            : progress.percentage > 0   ? 'text-amber-600 dark:text-amber-400'
                            : 'text-red-600 dark:text-red-400'
                          }`}>
                            {progress.percentage}%
                          </span>
                        </div>

                        {/* Amounts */}
                        <div className="grid grid-cols-2 gap-x-2 text-[11px]">
                          <div>
                            <span className="text-muted-foreground block">To'langan</span>
                            <span className={`font-bold tabular-nums ${
                              progress.percentage === 100 ? 'text-emerald-600 dark:text-emerald-400'
                              : progress.percentage > 0   ? 'text-amber-600 dark:text-amber-400'
                              : 'text-red-500 dark:text-red-400'
                            }`}>
                              {formatNumber(progress.paid)} so'm
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-muted-foreground block">Jami</span>
                            <span className="font-semibold text-foreground tabular-nums">
                              {formatNumber(progress.total)} so'm
                            </span>
                          </div>
                        </div>

                        {/* Remaining */}
                        {progress.percentage > 0 && progress.percentage < 100 && (
                          <div className="flex items-center justify-between text-[11px] bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-md px-2 py-1">
                            <span className="text-amber-700 dark:text-amber-400 font-medium">Qarz:</span>
                            <span className="text-amber-700 dark:text-amber-400 font-bold tabular-nums">
                              {formatNumber(progress.remaining)} so'm
                            </span>
                          </div>
                        )}

                        {/* Transaction toggle */}
                        {hasTx && (
                          <button
                            type="button"
                            onClick={() => toggleExpanded(payment.id)}
                            className={`flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border transition-all w-full justify-center ${
                              isExpanded
                                ? 'bg-indigo-100 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border-indigo-300 dark:border-indigo-700'
                                : 'bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-950/50'
                            }`}
                          >
                            <Receipt className="h-3.5 w-3.5" />
                            {isExpanded ? 'Yashirish' : `Tarix (${payment.transactions!.length})`}
                            {isExpanded ? <ChevronUp className="h-3.5 w-3.5 ml-auto" /> : <ChevronDown className="h-3.5 w-3.5 ml-auto" />}
                          </button>
                        )}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <StatusPill payment={payment} isOverdue={isOverdue} />
                    </td>

                    {/* Action */}
                    <td className="px-4 py-3">
                      {canCreate && progress.percentage < 100 ? (
                        <Button
                          size="sm"
                          onClick={() => handleAddPartialPayment(payment)}
                          className="w-full bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white text-xs h-8 gap-1.5 shadow-sm font-semibold"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          To'lov qo'sh
                        </Button>
                      ) : progress.percentage === 100 ? (
                        <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-xs font-bold justify-center">
                          <CheckCircle2 className="h-4 w-4" />
                          To'liq
                        </div>
                      ) : null}
                    </td>
                  </tr>

                  {/* Expanded Transaction Panel — full-width row */}
                  {isExpanded && hasTx && (
                    <TransactionPanel payment={payment} colSpan={colSpan} />
                  )}
                </Fragment>
              )
            })}
          </tbody>
        </table>

        {sortedPayments.length === 0 && (
          <div className="py-20 text-center">
            <Receipt className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-sm font-medium text-muted-foreground">To'lovlar topilmadi</p>
          </div>
        )}
      </div>
    )
  }

  /* ─── Mobile cards (unchanged logic, polished) ─── */
  const renderMobileCards = () => (
    <div className="space-y-3 pb-20">
      {sortedPayments.map((payment) => {
        const progress  = calcProgress(payment)
        const isOverdue = payment.status === 'PENDING' && new Date(payment.dueDate) < new Date()
        const isExpanded = expandedPayments.has(payment.id)
        const hasTx = (payment.transactions?.length ?? 0) > 0

        return (
          <Card
            key={payment.id}
            className={`border-2 transition-all hover:shadow-lg overflow-visible ${
              progress.percentage === 100
                ? 'border-emerald-200 dark:border-emerald-800 bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950 dark:to-green-950/80'
                : progress.percentage > 0
                ? 'border-amber-200 dark:border-amber-800 bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950 dark:to-yellow-950/80'
                : isOverdue
                ? 'border-red-300 dark:border-red-800 bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950 dark:to-rose-950/80'
                : 'border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950/80'
            }`}
          >
            <CardContent className="p-4">
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  {canBulkAction && (
                    <Checkbox
                      checked={selectedIds.includes(payment.id)}
                      onCheckedChange={c => handleSelectOne(payment.id, c as boolean)}
                    />
                  )}
                </div>
                <StatusPill payment={payment} isOverdue={isOverdue} />
              </div>

              {/* Student */}
              <div className="flex items-center gap-3 mb-3 pb-3 border-b border-border/50">
                <div className={`w-10 h-10 rounded-full overflow-hidden shadow shrink-0 ${
                  progress.percentage === 100 ? 'ring-2 ring-emerald-400'
                  : progress.percentage > 0   ? 'ring-2 ring-amber-400'
                  : 'ring-2 ring-blue-400'
                }`}>
                  {payment.student?.user?.avatar ? (
                    <Image src={payment.student.user.avatar} alt={payment.student.user.fullName ?? ''} width={40} height={40} className="w-full h-full object-cover" />
                  ) : (
                    <div className={`w-full h-full flex items-center justify-center text-white font-bold text-lg ${
                      progress.percentage === 100 ? 'bg-gradient-to-br from-emerald-500 to-green-600'
                      : progress.percentage > 0   ? 'bg-gradient-to-br from-amber-500 to-orange-600'
                      : 'bg-gradient-to-br from-blue-500 to-indigo-600'
                    }`}>
                      {payment.student?.user?.fullName?.charAt(0) ?? '?'}
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-sm text-foreground">
                    {payment.student?.user?.fullName || 'N/A'}
                  </h3>
                  <p className="text-xs text-muted-foreground">{getPaymentTypeLabel(payment.paymentType)}</p>
                </div>
              </div>

              {/* Progress block */}
              <div className={`mb-3 p-3 rounded-xl border-2 ${
                progress.percentage === 100
                  ? 'bg-emerald-100/60 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800'
                  : progress.percentage > 0
                  ? 'bg-amber-100/60 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800'
                  : 'bg-red-100/60 dark:bg-red-950/30 border-red-300 dark:border-red-800'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground font-medium">Jami:</span>
                  <span className="text-xl font-extrabold text-foreground tabular-nums">
                    {formatNumber(progress.total)} <span className="text-xs">so'm</span>
                  </span>
                </div>
                <div className="bg-slate-200 dark:bg-slate-700 rounded-full h-3 mb-2 overflow-hidden">
                  <div className={`h-full rounded-full ${progressBarColor(progress.percentage)}`} style={{ width: `${progress.percentage}%` }} />
                </div>
                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className={`p-2 rounded-lg ${
                    progress.percentage === 100 ? 'bg-emerald-500' : progress.percentage > 0 ? 'bg-amber-500' : 'bg-slate-400 dark:bg-slate-600'
                  }`}>
                    <p className="text-[10px] text-white/80">To'langan</p>
                    <p className="text-base font-extrabold text-white tabular-nums">{formatNumber(progress.paid)}</p>
                  </div>
                  <div className={`p-2 rounded-lg ${progress.remaining > 0 ? 'bg-red-500' : 'bg-slate-300 dark:bg-slate-700'}`}>
                    <p className="text-[10px] text-white/80">Qoldi</p>
                    <p className="text-base font-extrabold text-white tabular-nums">{formatNumber(progress.remaining)}</p>
                  </div>
                </div>
              </div>

              {/* Action */}
              {canCreate && progress.percentage < 100 && (
                <Button
                  size="lg"
                  onClick={() => handleAddPartialPayment(payment)}
                  className="w-full bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-bold h-11 mb-3"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  To'lov qo'shish ({formatNumber(progress.remaining)})
                </Button>
              )}
              {progress.percentage === 100 && (
                <div className="flex items-center justify-center gap-2 p-3 bg-emerald-100 dark:bg-emerald-950/40 border-2 border-emerald-300 dark:border-emerald-800 rounded-xl mb-3">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-sm font-bold text-emerald-700 dark:text-emerald-300">To'liq to'langan ✓</span>
                </div>
              )}

              {/* Meta */}
              <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                <div className="flex items-center gap-1.5 bg-white/50 dark:bg-card rounded-lg px-2 py-1.5 border border-border/50">
                  {getMethodIcon(payment.paymentMethod)}
                  <span className="font-semibold text-foreground">{getMethodLabel(payment.paymentMethod)}</span>
                </div>
                <div className={`flex items-center gap-1.5 rounded-lg px-2 py-1.5 border ${isOverdue ? 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800' : 'bg-white/50 dark:bg-card border-border/50'}`}>
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span className={`font-semibold tabular-nums ${isOverdue ? 'text-red-600 dark:text-red-400' : 'text-foreground'}`}>
                    {formatDate(payment.dueDate)}
                  </span>
                </div>
              </div>

              {/* Transaction toggle */}
              {hasTx && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleExpanded(payment.id)}
                    className={`w-full h-9 text-xs font-semibold border-2 gap-1.5 ${
                      isExpanded
                        ? 'bg-indigo-50 dark:bg-indigo-950/30 border-indigo-300 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300'
                        : 'hover:bg-blue-50 dark:hover:bg-blue-950/30'
                    }`}
                  >
                    <Receipt className="h-3.5 w-3.5" />
                    {isExpanded ? 'Yashirish' : `Tarix (${payment.transactions!.length})`}
                    {isExpanded ? <ChevronUp className="h-3.5 w-3.5 ml-auto" /> : <ChevronDown className="h-3.5 w-3.5 ml-auto" />}
                  </Button>

                  {isExpanded && (
                    <div className="mt-3 space-y-2.5">
                      {payment.transactions!.map((tx, i) => (
                        <div key={tx.id} className="bg-white dark:bg-card border-2 border-indigo-200 dark:border-indigo-800 rounded-xl p-3 shadow-sm">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-2 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-800">
                              #{i + 1}
                            </span>
                            <span className="text-base font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums">
                              {formatNumber(Number(tx.amount))} so'm
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/50 rounded-lg px-2 py-1.5 border border-slate-200 dark:border-slate-700">
                              <Calendar className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                              <span className="font-semibold tabular-nums">{formatDate(tx.transactionDate)}</span>
                            </div>
                            <div className="flex items-center gap-1.5 bg-blue-50 dark:bg-blue-950/40 rounded-lg px-2 py-1.5 border border-blue-200 dark:border-blue-800">
                              {getMethodIcon(tx.paymentMethod)}
                              <span className="font-semibold text-blue-700 dark:text-blue-300">{getMethodLabel(tx.paymentMethod)}</span>
                            </div>
                          </div>
                          {tx.receivedBy && (
                            <div className="flex items-center gap-1.5 mt-2 text-xs bg-purple-50 dark:bg-purple-950/30 rounded-lg px-2 py-1.5 border border-purple-200 dark:border-purple-800">
                              <User className="h-3.5 w-3.5 text-purple-500 shrink-0" />
                              <span className="font-medium text-purple-700 dark:text-purple-300 truncate">{tx.receivedBy.fullName}</span>
                            </div>
                          )}
                          {tx.notes && (
                            <p className="text-[10px] text-muted-foreground italic mt-2 px-1">{tx.notes}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </>
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

      {partialPaymentModal.payment && (
        <AddPartialPaymentModal
          open={partialPaymentModal.open}
          onOpenChange={open => setPartialPaymentModal({ open, payment: null })}
          payment={{
            id: partialPaymentModal.payment.id,
            invoiceNumber: partialPaymentModal.payment.invoiceNumber,
            amount: Number(partialPaymentModal.payment.amount),
            paidAmount: Number(partialPaymentModal.payment.paidAmount || 0),
            remainingAmount: Number(partialPaymentModal.payment.remainingAmount || partialPaymentModal.payment.amount),
            student: partialPaymentModal.payment.student,
          }}
        />
      )}
    </>
  )
}
