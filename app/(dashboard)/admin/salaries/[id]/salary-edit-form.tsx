'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { Loader2, DollarSign, TrendingDown, Gift, Calculator } from 'lucide-react'
import { formatNumberWithSpaces } from '@/lib/utils'

interface SalaryEditFormProps {
  salaryPayment: any
}

export function SalaryEditForm({ salaryPayment }: SalaryEditFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const [formData, setFormData] = useState({
    type: salaryPayment.type || 'FULL_SALARY',
    baseSalary: formatNumberWithSpaces(Number(salaryPayment.baseSalary || salaryPayment.amount)),
    bonusAmount: formatNumberWithSpaces(Number(salaryPayment.bonusAmount || 0)),
    deductionAmount: formatNumberWithSpaces(Number(salaryPayment.deductionAmount || 0)),
    paidAmount: formatNumberWithSpaces(Number(salaryPayment.paidAmount || 0)),
    paymentDate: salaryPayment.paymentDate 
      ? new Date(salaryPayment.paymentDate).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0],
    paymentMethod: salaryPayment.paymentMethod || 'CASH',
    description: salaryPayment.description || '',
    notes: salaryPayment.notes || ''
  })

  // Calculate total amount
  const calculateTotal = () => {
    const base = Number(formData.baseSalary.replace(/\s/g, '') || 0)
    const bonus = Number(formData.bonusAmount.replace(/\s/g, '') || 0)
    const deduction = Number(formData.deductionAmount.replace(/\s/g, '') || 0)
    return base + bonus - deduction
  }

  const totalAmount = calculateTotal()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const baseSalary = Number(formData.baseSalary.replace(/\s/g, ''))
      const bonusAmount = Number(formData.bonusAmount.replace(/\s/g, ''))
      const deductionAmount = Number(formData.deductionAmount.replace(/\s/g, ''))
      const paidAmount = Number(formData.paidAmount.replace(/\s/g, ''))

      if (paidAmount > totalAmount) {
        toast.error('To\'langan summa umumiy summadan katta bo\'lishi mumkin emas')
        setIsLoading(false)
        return
      }

      const response = await fetch(`/api/salaries/${salaryPayment.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: formData.type,
          baseSalary,
          bonusAmount,
          deductionAmount,
          amount: totalAmount,
          paidAmount,
          paymentDate: formData.paymentDate,
          paymentMethod: formData.paymentMethod,
          description: formData.description,
          notes: formData.notes
        })
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Maosh to\'lovi yangilandi!')
        router.push('/admin/salaries')
        router.refresh()
      } else {
        toast.error(data.error || 'Xatolik yuz berdi')
      }
    } catch (error) {
      console.error(error)
      toast.error('Kutilmagan xatolik yuz berdi')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAmountChange = (field: 'baseSalary' | 'bonusAmount' | 'deductionAmount' | 'paidAmount', value: string) => {
    const numbersOnly = value.replace(/\D/g, '')
    const formatted = formatNumberWithSpaces(Number(numbersOnly))
    setFormData(prev => ({ ...prev, [field]: formatted }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Employee Info */}
      <div className="rounded-lg border-2 border-primary/20 bg-primary/5 p-4">
        <p className="text-sm font-medium text-muted-foreground mb-2">
          {salaryPayment.teacher ? 'O\'qituvchi' : 'Xodim'}
        </p>
        <p className="text-lg font-semibold">
          {salaryPayment.teacher 
            ? salaryPayment.teacher.user.fullName
            : salaryPayment.staff?.user.fullName
          }
        </p>
        <p className="text-sm text-muted-foreground">
          {salaryPayment.month}-oy, {salaryPayment.year}-yil
        </p>
      </div>

      {/* Payment Type */}
      <div className="space-y-2">
        <Label htmlFor="type">To'lov Turi *</Label>
        <Select
          value={formData.type}
          onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="FULL_SALARY">To'liq Oylik</SelectItem>
            <SelectItem value="ADVANCE">Avans</SelectItem>
            <SelectItem value="BONUS">Mukofot/Bonus</SelectItem>
            <SelectItem value="DEDUCTION">Ushlab Qolish</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Base Salary */}
        <div className="space-y-2">
          <Label htmlFor="baseSalary" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Asosiy Maosh (so'm) *
          </Label>
          <Input
            id="baseSalary"
            type="text"
            inputMode="numeric"
            placeholder="0"
            value={formData.baseSalary}
            onChange={(e) => handleAmountChange('baseSalary', e.target.value)}
            required
          />
        </div>

        {/* Bonus Amount */}
        <div className="space-y-2">
          <Label htmlFor="bonusAmount" className="flex items-center gap-2">
            <Gift className="h-4 w-4 text-purple-600" />
            Mukofot/Bonus (so'm)
          </Label>
          <Input
            id="bonusAmount"
            type="text"
            inputMode="numeric"
            placeholder="0"
            value={formData.bonusAmount}
            onChange={(e) => handleAmountChange('bonusAmount', e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Qo'shimcha to'lov
          </p>
        </div>

        {/* Deduction Amount */}
        <div className="space-y-2">
          <Label htmlFor="deductionAmount" className="flex items-center gap-2">
            <TrendingDown className="h-4 w-4 text-red-600" />
            Ushlab Qolish (so'm)
          </Label>
          <Input
            id="deductionAmount"
            type="text"
            inputMode="numeric"
            placeholder="0"
            value={formData.deductionAmount}
            onChange={(e) => handleAmountChange('deductionAmount', e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Jarima yoki chegirma
          </p>
        </div>

        {/* Total Amount - Calculated */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Calculator className="h-4 w-4 text-green-600" />
            Jami Summa (so'm)
          </Label>
          <Input
            type="text"
            value={formatNumberWithSpaces(totalAmount)}
            readOnly
            className="bg-green-50 border-green-200 font-bold text-green-700 cursor-not-allowed"
          />
          <p className="text-xs text-muted-foreground">
            Asosiy + Bonus - Ushlab qolish
          </p>
        </div>
      </div>

      {/* Paid Amount */}
      <div className="space-y-2">
        <Label htmlFor="paidAmount" className="text-base font-semibold">
          Hozir To'lanadigan Summa (so'm) *
        </Label>
        <Input
          id="paidAmount"
          type="text"
          inputMode="numeric"
          placeholder="0"
          value={formData.paidAmount}
          onChange={(e) => handleAmountChange('paidAmount', e.target.value)}
          required
          className="text-lg font-semibold"
        />
        <p className="text-sm text-muted-foreground">
          Qoldi: <span className="font-semibold text-orange-600">
            {formatNumberWithSpaces(Math.max(0, totalAmount - Number(formData.paidAmount.replace(/\s/g, ''))))} so'm
          </span>
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Payment Date */}
        <div className="space-y-2">
          <Label htmlFor="paymentDate">To'lov Sanasi *</Label>
          <Input
            id="paymentDate"
            type="date"
            value={formData.paymentDate}
            onChange={(e) => setFormData(prev => ({ ...prev, paymentDate: e.target.value }))}
            required
          />
        </div>

        {/* Payment Method */}
        <div className="space-y-2">
          <Label htmlFor="paymentMethod">To'lov Usuli *</Label>
          <Select
            value={formData.paymentMethod}
            onValueChange={(value) => setFormData(prev => ({ ...prev, paymentMethod: value }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="CASH">Naqd</SelectItem>
              <SelectItem value="BANK_TRANSFER">Bank o'tkazmasi</SelectItem>
              <SelectItem value="CARD">Karta</SelectItem>
              <SelectItem value="CLICK">Click</SelectItem>
              <SelectItem value="PAYME">Payme</SelectItem>
              <SelectItem value="UZUM">Uzum Bank</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Tavsif</Label>
        <Input
          id="description"
          placeholder="Masalan: Fevral oyi uchun maosh"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
        />
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <Label htmlFor="notes">Izoh</Label>
        <Textarea
          id="notes"
          placeholder="Qo'shimcha ma'lumotlar..."
          value={formData.notes}
          onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
          rows={3}
        />
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-4 pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isLoading}
        >
          Bekor qilish
        </Button>
        <Button type="submit" disabled={isLoading} size="lg">
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          💰 Saqlash
        </Button>
      </div>
    </form>
  )
}

