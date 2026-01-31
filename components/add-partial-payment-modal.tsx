'use client'

import { useState, useTransition } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/components/ui/use-toast'
import { addPartialPayment } from '@/app/actions/payment'
import { Loader2, DollarSign, Wallet, CreditCard, Banknote } from 'lucide-react'
import { formatNumber } from '@/lib/utils'
import { Progress } from '@/components/ui/progress'

interface AddPartialPaymentModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  payment: {
    id: string
    invoiceNumber: string
    amount: number
    paidAmount: number
    remainingAmount: number
    student: {
      user: {
        fullName: string
      } | null
    }
  }
}

export function AddPartialPaymentModal({ open, onOpenChange, payment }: AddPartialPaymentModalProps) {
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition()
  
  const totalAmount = payment.amount
  const currentPaidAmount = payment.paidAmount
  
  // BUGFIX: If remainingAmount is 0 but paidAmount is also 0, recalculate
  // This handles old payments created before remainingAmount was properly set
  const remainingAmount = payment.remainingAmount > 0 
    ? payment.remainingAmount 
    : (currentPaidAmount === 0 ? totalAmount : 0)
  
  const [amount, setAmount] = useState<number>(remainingAmount)
  const [paymentMethod, setPaymentMethod] = useState<string>('CASH')
  const [notes, setNotes] = useState<string>('')
  
  const currentPercentage = Math.round((currentPaidAmount / totalAmount) * 100)
  
  // Calculate new values after adding payment
  const newPaidAmount = Math.min(currentPaidAmount + amount, totalAmount)
  const newRemainingAmount = Math.max(totalAmount - newPaidAmount, 0)
  const newPercentage = Math.round((newPaidAmount / totalAmount) * 100)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (amount <= 0) {
      toast({
        title: 'Xato!',
        description: 'Summa 0 dan katta bo\'lishi kerak',
        variant: 'destructive',
      })
      return
    }

    if (amount > remainingAmount) {
      toast({
        title: 'Xato!',
        description: `Maksimal summa: ${formatNumber(remainingAmount)} so'm`,
        variant: 'destructive',
      })
      return
    }

    startTransition(async () => {
      const result = await addPartialPayment(payment.id, amount, paymentMethod, notes)

      if (result.success) {
        toast({
          title: result.isCompleted ? '🎉 To\'lov yakunlandi!' : '✅ To\'lov qo\'shildi',
          description: result.message,
        })
        onOpenChange(false)
        // Reset form
        setAmount(0)
        setNotes('')
      } else {
        toast({
          title: 'Xato!',
          description: result.error,
          variant: 'destructive',
        })
      }
    })
  }

  const paymentMethods = [
    { value: 'CASH', label: 'Naqd', icon: Banknote },
    { value: 'CLICK', label: 'Plastik', icon: CreditCard },
  ]

  const selectedMethod = paymentMethods.find(m => m.value === paymentMethod)
  const MethodIcon = selectedMethod?.icon || Wallet

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <DollarSign className="h-6 w-6 text-green-600" />
            Bo'lib-bo'lib To'lov Qo'shish
          </DialogTitle>
          <DialogDescription className="text-base">
            {payment.student.user?.fullName || 'N/A'} uchun to'lov qo'shish
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Current Status Card */}
          <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm text-muted-foreground">Invoice</p>
                <code className="text-sm font-semibold">{payment.invoiceNumber}</code>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Jami Summa</p>
                <p className="text-xl font-bold text-blue-600">{formatNumber(totalAmount)} so'm</p>
              </div>
            </div>

            {/* Current Progress */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Hozirgi holat:</span>
                <span className="font-semibold text-blue-600">{currentPercentage}%</span>
              </div>
              <Progress value={currentPercentage} className="h-2" />
              <div className="flex items-center justify-between text-xs">
                <span className="text-green-600 font-medium">
                  To'langan: {formatNumber(currentPaidAmount)} so'm
                </span>
                <span className="text-orange-600 font-medium">
                  Qoldi: {formatNumber(remainingAmount)} so'm
                </span>
              </div>
            </div>
          </div>

          {/* Amount Input */}
          <div className="space-y-3">
            <Label htmlFor="amount" className="text-base font-semibold">
              To'lov Summasi *
            </Label>
            <div className="relative">
              <Input
                id="amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value) || 0)}
                placeholder="Summani kiriting"
                className="h-14 text-lg pr-24"
                min="0"
                max={remainingAmount}
                step="1000"
                required
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                so'm
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setAmount(remainingAmount)}
              >
                To'liq to'lash ({formatNumber(remainingAmount)} so'm)
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setAmount(Math.round(remainingAmount / 2))}
              >
                Yarmini ({formatNumber(Math.round(remainingAmount / 2))} so'm)
              </Button>
            </div>
          </div>

          {/* Payment Method */}
          <div className="space-y-3">
            <Label htmlFor="paymentMethod" className="text-base font-semibold">
              To'lov Usuli *
            </Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger id="paymentMethod" className="h-12">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {paymentMethods.map((method) => {
                  const Icon = method.icon
                  return (
                    <SelectItem key={method.value} value={method.value}>
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        {method.label}
                      </div>
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div className="space-y-3">
            <Label htmlFor="notes" className="text-base font-semibold">
              Izoh (ixtiyoriy)
            </Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Qo'shimcha ma'lumotlar..."
              rows={3}
            />
          </div>

          {/* Preview After Payment */}
          {amount > 0 && (
            <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl">
              <p className="text-sm font-semibold text-green-800 mb-3">
                ✨ To'lovdan keyin:
              </p>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Yangi holat:</span>
                  <span className="font-semibold text-green-600">{newPercentage}%</span>
                </div>
                <Progress value={newPercentage} className="h-2" />
                <div className="grid grid-cols-2 gap-3 text-xs mt-3">
                  <div className="p-2 bg-white rounded-lg">
                    <p className="text-muted-foreground mb-1">To'langan</p>
                    <p className="font-semibold text-green-600">
                      {formatNumber(newPaidAmount)} so'm
                    </p>
                  </div>
                  <div className="p-2 bg-white rounded-lg">
                    <p className="text-muted-foreground mb-1">Qoladi</p>
                    <p className="font-semibold text-orange-600">
                      {formatNumber(newRemainingAmount)} so'm
                    </p>
                  </div>
                </div>
                {newPercentage === 100 && (
                  <div className="p-3 bg-green-100 border border-green-300 rounded-lg text-center mt-3">
                    <p className="text-sm font-bold text-green-700">
                      🎉 To'lov to'liq yakunlanadi!
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Bekor qilish
            </Button>
            <Button type="submit" disabled={isPending || amount <= 0 || amount > remainingAmount}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Qo'shilmoqda...
                </>
              ) : (
                <>
                  <MethodIcon className="mr-2 h-4 w-4" />
                  {formatNumber(amount)} so'm to'lash
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

