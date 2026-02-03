'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { createMeal, updateMeal } from '@/app/actions/meal'
import { toast } from 'sonner'

const DAYS = ['Yakshanba', 'Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba']

type Meal = {
  id: string
  dayOfWeek: number
  mealNumber: number
  mealTime: string
  mainDish: string
  sideDish: string | null
  salad: string | null
  dessert: string | null
  drink: string | null
  description: string | null
}

type MealDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  dayOfWeek: number
  mealNumber: number
  meal?: Meal | null
}

export function MealDialog({ open, onOpenChange, dayOfWeek, mealNumber, meal }: MealDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    mealTime: '',
    mainDish: '',
    sideDish: '',
    salad: '',
    dessert: '',
    drink: '',
    description: '',
  })

  useEffect(() => {
    if (meal) {
      setFormData({
        mealTime: meal.mealTime,
        mainDish: meal.mainDish,
        sideDish: meal.sideDish || '',
        salad: meal.salad || '',
        dessert: meal.dessert || '',
        drink: meal.drink || '',
        description: meal.description || '',
      })
    } else {
      setFormData({
        mealTime: '',
        mainDish: '',
        sideDish: '',
        salad: '',
        dessert: '',
        drink: '',
        description: '',
      })
    }
  }, [meal, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.mainDish || !formData.mealTime) {
      toast.error('Asosiy taom va vaqtni kiriting')
      return
    }

    setIsSubmitting(true)
    try {
      const data = {
        dayOfWeek,
        mealNumber,
        mealTime: formData.mealTime,
        mainDish: formData.mainDish,
        sideDish: formData.sideDish || undefined,
        salad: formData.salad || undefined,
        dessert: formData.dessert || undefined,
        drink: formData.drink || undefined,
        description: formData.description || undefined,
      }

      if (meal) {
        await updateMeal(meal.id, data)
        toast.success('Ovqat muvaffaqiyatli yangilandi')
      } else {
        await createMeal(data)
        toast.success('Ovqat muvaffaqiyatli qo\'shildi')
      }
      
      onOpenChange(false)
      window.location.reload()
    } catch (error) {
      toast.error('Xatolik yuz berdi')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {meal ? 'Ovqatni tahrirlash' : 'Yangi ovqat qo\'shish'}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            {DAYS[dayOfWeek]} - {mealNumber}-ovqat
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="mealTime">
                Ovqat vaqti <span className="text-destructive">*</span>
              </Label>
              <Input
                id="mealTime"
                placeholder="08:00 - 09:00"
                value={formData.mealTime}
                onChange={(e) => setFormData(prev => ({ ...prev, mealTime: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="mainDish">
                Asosiy taom <span className="text-destructive">*</span>
              </Label>
              <Input
                id="mainDish"
                placeholder="Osh, Mastava, ..."
                value={formData.mainDish}
                onChange={(e) => setFormData(prev => ({ ...prev, mainDish: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="sideDish">Garnitir</Label>
              <Input
                id="sideDish"
                placeholder="Guruch, Makaron, ..."
                value={formData.sideDish}
                onChange={(e) => setFormData(prev => ({ ...prev, sideDish: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="salad">Salat</Label>
              <Input
                id="salad"
                placeholder="Achichiq salat, ..."
                value={formData.salad}
                onChange={(e) => setFormData(prev => ({ ...prev, salad: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="dessert">Shirinlik</Label>
              <Input
                id="dessert"
                placeholder="Meva, Tort, ..."
                value={formData.dessert}
                onChange={(e) => setFormData(prev => ({ ...prev, dessert: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="drink">Ichimlik</Label>
              <Input
                id="drink"
                placeholder="Choy, Kompot, ..."
                value={formData.drink}
                onChange={(e) => setFormData(prev => ({ ...prev, drink: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Qo'shimcha ma'lumot</Label>
            <Textarea
              id="description"
              placeholder="Qo'shimcha izohlar..."
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Bekor qilish
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saqlanmoqda...' : meal ? 'Yangilash' : 'Qo\'shish'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
