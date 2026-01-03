'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/components/ui/use-toast'
import { kitchenExpenseCategorySchema, KitchenExpenseCategoryFormData } from '@/lib/validations/cook'
import { createKitchenExpenseCategory } from '@/app/actions/cook'
import { Loader2 } from 'lucide-react'

const colorOptions = [
  { value: '#EF4444', label: 'Qizil' },
  { value: '#F97316', label: 'To\'q sariq' },
  { value: '#F59E0B', label: 'Sariq' },
  { value: '#10B981', label: 'Yashil' },
  { value: '#3B82F6', label: 'Ko\'k' },
  { value: '#8B5CF6', label: 'Binafsha' },
  { value: '#EC4899', label: 'Pushti' },
  { value: '#6B7280', label: 'Kulrang' },
]

export function CategoryForm() {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<KitchenExpenseCategoryFormData>({
    resolver: zodResolver(kitchenExpenseCategorySchema),
    defaultValues: {
      period: 'MONTHLY',
      isActive: true,
      color: '#3B82F6',
    },
  })

  const selectedColor = watch('color')

  const onSubmit = async (data: KitchenExpenseCategoryFormData) => {
    setIsLoading(true)
    try {
      const result = await createKitchenExpenseCategory(data)

      if (result.success) {
        toast({
          title: 'Muvaffaqiyatli!',
          description: 'Kategoriya yaratildi',
        })
        router.push('/admin/kitchen/categories')
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

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">Nomi *</Label>
        <Input
          id="name"
          placeholder="Oziq-ovqat mahsulotlari"
          {...register('name')}
          disabled={isLoading}
        />
        {errors.name && (
          <p className="text-sm text-red-500">{errors.name.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Tavsif</Label>
        <Textarea
          id="description"
          placeholder="Kategoriya haqida qisqacha ma'lumot"
          rows={3}
          {...register('description')}
          disabled={isLoading}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="limitAmount">Limit (so'm) *</Label>
          <Input
            id="limitAmount"
            type="number"
            min="0"
            placeholder="5000000"
            {...register('limitAmount', { valueAsNumber: true })}
            disabled={isLoading}
          />
          {errors.limitAmount && (
            <p className="text-sm text-red-500">{errors.limitAmount.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Davr *</Label>
          <Select
            defaultValue="MONTHLY"
            onValueChange={(value) => setValue('period', value as any)}
            disabled={isLoading}
          >
            <SelectTrigger>
              <SelectValue placeholder="Davrni tanlang" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="DAILY">Kunlik</SelectItem>
              <SelectItem value="WEEKLY">Haftalik</SelectItem>
              <SelectItem value="MONTHLY">Oylik</SelectItem>
              <SelectItem value="YEARLY">Yillik</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Rang</Label>
        <div className="flex gap-2 flex-wrap">
          {colorOptions.map((color) => (
            <button
              key={color.value}
              type="button"
              onClick={() => setValue('color', color.value)}
              className={`w-8 h-8 rounded-full border-2 transition-all ${
                selectedColor === color.value 
                  ? 'border-gray-900 scale-110' 
                  : 'border-transparent hover:scale-105'
              }`}
              style={{ backgroundColor: color.value }}
              title={color.label}
            />
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between rounded-lg border p-4">
        <div>
          <Label htmlFor="isActive">Faol holat</Label>
          <p className="text-sm text-muted-foreground">
            Kategoriya xarajat kiritishda ko'rinadi
          </p>
        </div>
        <Switch
          id="isActive"
          defaultChecked={true}
          onCheckedChange={(checked) => setValue('isActive', checked)}
          disabled={isLoading}
        />
      </div>

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
        <Button type="submit" disabled={isLoading} className="flex-1 bg-blue-500 hover:bg-blue-600">
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Yaratilmoqda...
            </>
          ) : (
            'Kategoriya Yaratish'
          )}
        </Button>
      </div>
    </form>
  )
}

