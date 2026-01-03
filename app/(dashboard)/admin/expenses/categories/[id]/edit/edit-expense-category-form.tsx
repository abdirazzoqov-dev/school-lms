'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { updateExpenseCategory } from '@/app/actions/expense'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { EXPENSE_PERIOD_OPTIONS, EXPENSE_COLORS } from '@/lib/validations/expense'
import Link from 'next/link'

interface ExpenseCategory {
  id: string
  name: string
  description: string | null
  limitAmount: any
  period: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY'
  color: string | null
  isActive: boolean
}

export function EditExpenseCategoryForm({ category }: { category: ExpenseCategory }) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: category.name,
    description: category.description || '',
    limitAmount: Number(category.limitAmount).toString(),
    period: category.period,
    color: category.color || '#3B82F6',
    isActive: category.isActive,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const result = await updateExpenseCategory(category.id, {
        ...formData,
        limitAmount: parseFloat(formData.limitAmount),
      })

      if (result.success) {
        toast.success('Xarajat turi muvaffaqiyatli yangilandi!')
        router.push('/admin/expenses/categories')
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
      {/* Name */}
      <div className="space-y-2">
        <Label htmlFor="name">
          Xarajat Nomi <span className="text-red-500">*</span>
        </Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Masalan: Soliq xarajati, Maosh, Kommunal"
          required
        />
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Izoh</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Qisqacha tavsif..."
          rows={3}
        />
      </div>

      {/* Limit Amount */}
      <div className="space-y-2">
        <Label htmlFor="limitAmount">
          Limit Miqdori (so'm) <span className="text-red-500">*</span>
        </Label>
        <Input
          id="limitAmount"
          type="number"
          step="1000"
          value={formData.limitAmount}
          onChange={(e) => setFormData({ ...formData, limitAmount: e.target.value })}
          placeholder="5000000"
          required
        />
      </div>

      {/* Period */}
      <div className="space-y-2">
        <Label htmlFor="period">
          Muddat <span className="text-red-500">*</span>
        </Label>
        <Select
          value={formData.period}
          onValueChange={(value: any) => setFormData({ ...formData, period: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {EXPENSE_PERIOD_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Color */}
      <div className="space-y-2">
        <Label htmlFor="color">Rang</Label>
        <div className="flex gap-2">
          {EXPENSE_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              className={`w-8 h-8 rounded-full border-2 transition-all ${
                formData.color === color ? 'border-gray-900 scale-110' : 'border-gray-300'
              }`}
              style={{ backgroundColor: color }}
              onClick={() => setFormData({ ...formData, color })}
            />
          ))}
        </div>
      </div>

      {/* Active Status */}
      <div className="flex items-center justify-between rounded-lg border p-4">
        <div className="space-y-0.5">
          <Label htmlFor="isActive">Faol holat</Label>
          <p className="text-xs text-muted-foreground">
            Xarajat turini faollashtirish yoki o'chirish
          </p>
        </div>
        <Switch
          id="isActive"
          checked={formData.isActive}
          onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
        />
      </div>

      {/* Submit Button */}
      <div className="flex gap-4">
        <Button type="submit" disabled={isLoading} className="flex-1">
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Yangilash
        </Button>
        <Link href="/admin/expenses/categories" className="flex-1">
          <Button type="button" variant="outline" className="w-full">
            Bekor qilish
          </Button>
        </Link>
      </div>
    </form>
  )
}

