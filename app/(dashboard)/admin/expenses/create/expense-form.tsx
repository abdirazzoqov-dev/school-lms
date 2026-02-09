'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createExpense } from '@/app/actions/expense'
import { toast } from 'sonner'
import { Loader2, AlertTriangle } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface ExpenseCategory {
  id: string
  name: string
  limitAmount: any
  period: string
  color: string | null
}

interface ExpenseFormProps {
  categories: ExpenseCategory[]
  generatedReceiptNumber: string
}

export function ExpenseForm({ categories, generatedReceiptNumber }: ExpenseFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    categoryId: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    paymentMethod: 'CASH' as 'CASH' | 'CLICK' | 'PAYME' | 'UZUM',
    receiptNumber: generatedReceiptNumber,
    description: '',
  })

  // Get selected category for limit warning
  const selectedCategory = categories.find(c => c.id === formData.categoryId)
  const amount = parseFloat(formData.amount) || 0
  const limit = selectedCategory ? Number(selectedCategory.limitAmount) : 0
  const showWarning = selectedCategory && amount > limit

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const result = await createExpense({
        ...formData,
        amount: parseFloat(formData.amount),
      })

      if (result.success) {
        toast.success('Xarajat muvaffaqiyatli qo\'shildi!')
        router.push('/admin/expenses')
        router.refresh()
      } else {
        toast.error(result.error || 'Xatolik yuz berdi')
      }
    } catch (error) {
      toast.error('Xatolik yuz berdi')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Category */}
      <div className="space-y-2">
        <Label htmlFor="category">
          Xarajat Turi <span className="text-red-500">*</span>
        </Label>
        <Select
          value={formData.categoryId}
          onValueChange={(value) => setFormData({ ...formData, categoryId: value })}
          required
        >
          <SelectTrigger>
            <SelectValue placeholder="Xarajat turini tanlang" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: category.color || '#3B82F6' }}
                  />
                  {category.name}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectedCategory && (
          <p className="text-xs text-muted-foreground">
            Limit: {formatCurrency(Number(selectedCategory.limitAmount))} ({selectedCategory.period})
          </p>
        )}
      </div>

      {/* Amount */}
      <div className="space-y-2">
        <Label htmlFor="amount">
          Miqdor (so'm) <span className="text-red-500">*</span>
        </Label>
        <Input
          id="amount"
          type="number"
          inputMode="numeric"
          step="1"
          min="0"
          value={formData.amount}
          onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
          placeholder="500000"
          required
        />
        {showWarning && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Diqqat! Bu miqdor limit ({formatCurrency(limit)}) dan oshib ketmoqda!
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Date */}
      <div className="space-y-2">
        <Label htmlFor="date">
          Sana <span className="text-red-500">*</span>
        </Label>
        <Input
          id="date"
          type="date"
          value={formData.date}
          onChange={(e) => setFormData({ ...formData, date: e.target.value })}
          required
        />
      </div>

      {/* Payment Method */}
      <div className="space-y-2">
        <Label htmlFor="paymentMethod">
          To'lov Usuli <span className="text-red-500">*</span>
        </Label>
        <Select
          value={formData.paymentMethod}
          onValueChange={(value: any) => setFormData({ ...formData, paymentMethod: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="CASH">Naqd</SelectItem>
            <SelectItem value="CLICK">Plastik</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Receipt Number */}
      <div className="space-y-2">
        <Label htmlFor="receiptNumber">
          Chek/Hujjat Raqami
          <span className="ml-2 text-xs text-green-600 font-normal">
            ✓ Avtomatik generatsiya
          </span>
        </Label>
        <Input
          id="receiptNumber"
          value={formData.receiptNumber}
          onChange={(e) => setFormData({ ...formData, receiptNumber: e.target.value })}
          placeholder="EXP-2025-001"
          className="font-mono"
        />
        <p className="text-xs text-muted-foreground">
          Avtomatik yaratilgan. Kerak bo'lsa o'zgartirishingiz mumkin.
        </p>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Izoh</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Nima uchun bu xarajat..."
          rows={3}
        />
      </div>

      {/* Submit Button */}
      <div className="flex gap-4">
        <Button type="submit" disabled={isLoading} className="flex-1">
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Saqlash
        </Button>
        <Link href="/admin/expenses" className="flex-1">
          <Button type="button" variant="outline" className="w-full">
            Bekor qilish
          </Button>
        </Link>
      </div>
    </form>
  )
}

