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
import { Loader2, AlertCircle, CheckCircle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

interface Category {
  id: string
  name: string
  color: string | null
}

interface CookExpenseFormProps {
  categories: Category[]
}

export function CookExpenseForm({ categories }: CookExpenseFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [displayAmount, setDisplayAmount] = useState('') // ✅ TOPSHIRIQ 2: Formatted display

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    watch,
    formState: { errors },
  } = useForm<KitchenExpenseFormData>({
    resolver: zodResolver(kitchenExpenseSchema),
    defaultValues: {
      paymentMethod: 'CASH',
      date: new Date().toISOString().split('T')[0],
    },
  })

  const amount = watch('amount')

  // ✅ TOPSHIRIQ 2: Format number with spaces
  const formatNumberWithSpaces = (value: string): string => {
    const digits = value.replace(/\D/g, '')
    if (!digits) return ''
    return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
  }

  // ✅ TOPSHIRIQ 2: Handle amount input
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value
    const digitsOnly = inputValue.replace(/\D/g, '')
    
    setValue('amount', parseFloat(digitsOnly) || 0)
    setDisplayAmount(formatNumberWithSpaces(digitsOnly))
  }

  const onSubmit = async (data: KitchenExpenseFormData) => {
    setIsLoading(true)
    try {
      const result = await createKitchenExpense(data)

      if (result.success) {
        setSuccess(true)
        toast({
          title: 'Muvaffaqiyatli!',
          description: 'Xarajat kiritildi',
        })
        // Reset form for new entry
        setTimeout(() => {
          reset()
          setSuccess(false)
        }, 2000)
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
        <p className="text-muted-foreground">
          Administrator tomonidan kategoriyalar yaratilishi kerak
        </p>
      </div>
    )
  }

  if (success) {
    return (
      <div className="text-center py-8">
        <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
        <h3 className="mt-4 text-lg font-semibold">Xarajat Kiritildi!</h3>
        <p className="text-muted-foreground">Yangi xarajat kiritish uchun kutib turing...</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
          <Label htmlFor="date">
            Sana <span className="text-red-500">*</span>
            <span className="ml-2 text-xs text-green-600 font-normal">
              ✓ Bugungi sana
            </span>
          </Label>
          <Input
            id="date"
            type="date"
            {...register('date')}
            readOnly
            disabled
            className="bg-muted cursor-not-allowed"
          />
          <p className="text-xs text-muted-foreground">
            Xarajat bugungi sana bilan avtomatik yoziladi
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="amount">Summa (so'm) *</Label>
          <Input
            id="amount"
            type="text"
            inputMode="numeric"
            placeholder="500 000"
            value={displayAmount}
            onChange={handleAmountChange}
            disabled={isLoading}
            className="text-lg font-mono"
          />
          {amount > 0 && (
            <p className="text-xs text-muted-foreground">
              {amount.toLocaleString('uz-UZ')} so'm
            </p>
          )}
          {errors.amount && (
            <p className="text-sm text-red-500">{errors.amount.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label>To'lov turi</Label>
          <Select
            defaultValue="CASH"
            onValueChange={(value) => setValue('paymentMethod', value as any)}
            disabled={isLoading}
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
      </div>

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
          <Label>Birlik</Label>
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
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="supplier">Yetkazib beruvchi</Label>
          <Input
            id="supplier"
            placeholder="Bozor, Do'kon"
            {...register('supplier')}
            disabled={isLoading}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Izoh</Label>
        <Textarea
          id="description"
          placeholder="Qo'shimcha ma'lumot"
          rows={2}
          {...register('description')}
          disabled={isLoading}
        />
      </div>

      <div className="flex gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/cook')}
          disabled={isLoading}
          className="flex-1"
        >
          Bekor qilish
        </Button>
        <Button type="submit" disabled={isLoading} className="flex-1 bg-orange-500 hover:bg-orange-600">
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

