'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/components/ui/use-toast'
import { kitchenExpenseSchema, KitchenExpenseFormData } from '@/lib/validations/cook'
import { createKitchenExpense } from '@/app/actions/cook'
import { Loader2, AlertCircle } from 'lucide-react'

interface Category {
  id: string
  name: string
  color: string | null
}

interface ExpenseFormProps {
  categories: Category[]
}

export function ExpenseForm({ categories }: ExpenseFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<KitchenExpenseFormData>({
    resolver: zodResolver(kitchenExpenseSchema),
    defaultValues: {
      paymentMethod: 'CASH',
      date: new Date().toISOString().split('T')[0],
    },
  })

  const selectedCategory = watch('categoryId')

  const onSubmit = async (data: KitchenExpenseFormData) => {
    setIsLoading(true)
    try {
      const result = await createKitchenExpense(data)

      if (result.success) {
        toast({
          title: 'Muvaffaqiyatli!',
          description: 'Xarajat kiritildi',
        })
        router.push('/admin/kitchen/expenses')
      } else {
        toast({
          variant: 'destructive',
          title: 'Xato!',
          description: result.error,
        })
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Xato!',
        description: 'Nimadir xato ketdi',
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (categories.length === 0) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="mx-auto h-12 w-12 text-orange-500" />
        <h3 className="mt-4 text-lg font-semibold">Kategoriyalar yo'q</h3>
        <p className="text-muted-foreground mb-4">
          Avval xarajat turini yarating
        </p>
        <Button onClick={() => router.push('/admin/kitchen/categories/create')}>
          Kategoriya Yaratish
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Basic Info */}
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Kategoriya *</Label>
            <Select
              onValueChange={(value) => setValue('categoryId', value)}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Kategoriyani tanlang" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: cat.color || '#6B7280' }}
                      />
                      {cat.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.categoryId && (
              <p className="text-sm text-red-500">{errors.categoryId.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Sana *</Label>
            <Input
              id="date"
              type="date"
              {...register('date')}
              disabled={isLoading}
            />
            {errors.date && (
              <p className="text-sm text-red-500">{errors.date.message}</p>
            )}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="amount">Summa (so'm) *</Label>
            <Input
              id="amount"
              type="number"
              inputMode="numeric"
              min="0"
              step="1"
              placeholder="500000"
              {...register('amount', { valueAsNumber: true })}
              disabled={isLoading}
            />
            {errors.amount && (
              <p className="text-sm text-red-500">{errors.amount.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>To'lov turi *</Label>
            <Select
              defaultValue="CASH"
              onValueChange={(value) => setValue('paymentMethod', value as any)}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="To'lov turini tanlang" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CASH">Naqd</SelectItem>
                <SelectItem value="CLICK">Plastik</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Product Info */}
      <div className="space-y-4">
        <h3 className="font-semibold text-lg border-b pb-2">Mahsulot Ma'lumotlari</h3>

        <div className="space-y-2">
          <Label htmlFor="itemName">Mahsulot nomi</Label>
          <Input
            id="itemName"
            placeholder="Go'sht, sabzavot, un, yog'"
            {...register('itemName')}
            disabled={isLoading}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="quantity">Miqdori</Label>
            <Input
              id="quantity"
              type="number"
              min="0"
              step="0.01"
              placeholder="10"
              {...register('quantity', { valueAsNumber: true })}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="unit">Birlik</Label>
            <Select
              onValueChange={(value) => setValue('unit', value)}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Tanlang" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="kg">kg</SelectItem>
                <SelectItem value="dona">dona</SelectItem>
                <SelectItem value="litr">litr</SelectItem>
                <SelectItem value="qadoq">qadoq</SelectItem>
                <SelectItem value="qop">qop</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="supplier">Yetkazib beruvchi</Label>
            <Input
              id="supplier"
              placeholder="Bozor, Do'kon nomi"
              {...register('supplier')}
              disabled={isLoading}
            />
          </div>
        </div>
      </div>

      {/* Additional Info */}
      <div className="space-y-4">
        <h3 className="font-semibold text-lg border-b pb-2">Qo'shimcha Ma'lumotlar</h3>

        <div className="space-y-2">
          <Label htmlFor="receiptNumber">Chek raqami</Label>
          <Input
            id="receiptNumber"
            placeholder="CHK-12345"
            {...register('receiptNumber')}
            disabled={isLoading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Izoh</Label>
          <Textarea
            id="description"
            placeholder="Xarajat haqida qo'shimcha ma'lumot"
            rows={3}
            {...register('description')}
            disabled={isLoading}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isLoading}
          className="flex-1"
        >
          Bekor qilish
        </Button>
        <Button type="submit" disabled={isLoading} className="flex-1 bg-green-500 hover:bg-green-600">
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Kiritilmoqda...
            </>
          ) : (
            'Xarajat Kiritish'
          )}
        </Button>
      </div>
    </form>
  )
}

