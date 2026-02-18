'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { createMeal, updateMeal } from '@/app/actions/meal'
import { toast } from 'sonner'
import { Upload, X, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

// Compress image using canvas - max 800x600px, JPEG quality 0.82
// Result is typically 30-120KB, perfect for meal photos
async function compressMealImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const MAX_W = 800
        const MAX_H = 600
        let { width, height } = img

        // Maintain aspect ratio
        if (width > MAX_W || height > MAX_H) {
          const ratio = Math.min(MAX_W / width, MAX_H / height)
          width = Math.round(width * ratio)
          height = Math.round(height * ratio)
        }

        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')!
        ctx.drawImage(img, 0, 0, width, height)
        resolve(canvas.toDataURL('image/jpeg', 0.82))
      }
      img.onerror = reject
      img.src = e.target?.result as string
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

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
  image: string | null
}

type MealDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  dayOfWeek: number
  mealNumber: number
  meal?: Meal | null
}

export function MealDialog({ open, onOpenChange, dayOfWeek, mealNumber, meal }: MealDialogProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isCompressing, setIsCompressing] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    mealTime: '',
    mainDish: '',
    sideDish: '',
    salad: '',
    dessert: '',
    drink: '',
    description: '',
    image: '',
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
        image: meal.image || '',
      })
      setImagePreview(meal.image || null)
    } else {
      setFormData({
        mealTime: '',
        mainDish: '',
        sideDish: '',
        salad: '',
        dessert: '',
        drink: '',
        description: '',
        image: '',
      })
      setImagePreview(null)
    }
  }, [meal, open])

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Check file type
    if (!file.type.startsWith('image/')) {
      toast.error('Faqat rasm fayllari yuklanadi')
      return
    }

    // Check original file size (max 10MB before compression)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Rasm hajmi 10MB dan oshmasligi kerak')
      return
    }

    try {
      setIsCompressing(true)
      // Compress image: max 800x600px, JPEG 82% quality → typically 30-120KB
      const compressed = await compressMealImage(file)
      setFormData(prev => ({ ...prev, image: compressed }))
      setImagePreview(compressed)
    } catch (err) {
      toast.error('Rasmni qayta ishlashda xatolik')
    } finally {
      setIsCompressing(false)
      // Reset input so same file can be re-selected
      e.target.value = ''
    }
  }

  const handleRemoveImage = () => {
    setFormData(prev => ({ ...prev, image: '' }))
    setImagePreview(null)
  }

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
        image: formData.image || undefined,
      }

      // Close dialog immediately for better UX
      onOpenChange(false)
      
      // Show loading toast
      const loadingToast = toast.loading(meal ? 'Yangilanmoqda...' : 'Saqlanmoqda...')

      if (meal) {
        await updateMeal(meal.id, data)
        toast.success('Ovqat muvaffaqiyatli yangilandi', { id: loadingToast })
      } else {
        await createMeal(data)
        toast.success('Ovqat muvaffaqiyatli qo\'shildi', { id: loadingToast })
      }
      
      // Refresh in background
      router.refresh()
    } catch (error) {
      toast.error('Xatolik yuz berdi')
      console.error('Error saving meal:', error)
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
          {/* Image Upload Section */}
          <div className="space-y-2">
            <Label>
              Ovqat rasmi
              <span className="text-xs text-muted-foreground ml-2">(Siqilgan holda saqlanadi)</span>
            </Label>
            
            {/* Hidden file input always rendered */}
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
              id="meal-image"
              disabled={isCompressing}
            />

            {imagePreview ? (
              <div className="relative w-full h-64 rounded-lg overflow-hidden border-2 border-primary/20 group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imagePreview}
                  alt="Ovqat rasmi"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <label
                    htmlFor="meal-image"
                    className="cursor-pointer inline-flex items-center justify-center rounded-md text-sm font-medium h-9 px-3 bg-white text-gray-900 hover:bg-gray-100 transition-colors"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Almashtirish
                  </label>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={handleRemoveImage}
                  >
                    <X className="h-4 w-4 mr-2" />
                    O'chirish
                  </Button>
                </div>
              </div>
            ) : (
              <label
                htmlFor="meal-image"
                className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-muted-foreground/25 rounded-lg cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-all"
              >
                <div className="text-center">
                  {isCompressing ? (
                    <>
                      <Loader2 className="h-10 w-10 text-primary mx-auto mb-3 animate-spin" />
                      <p className="text-sm font-medium text-foreground">Rasm qayta ishlanmoqda...</p>
                    </>
                  ) : (
                    <>
                      <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                      <p className="text-sm font-medium text-foreground mb-1">
                        Rasmni yuklash uchun bosing
                      </p>
                      <p className="text-xs text-muted-foreground">
                        PNG, JPG, WEBP • Avtomatik siqiladi
                      </p>
                    </>
                  )}
                </div>
              </label>
            )}
          </div>

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
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Bekor qilish
            </Button>
            <Button type="submit" disabled={isSubmitting || isCompressing}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {meal ? 'Yangilanmoqda...' : 'Saqlanmoqda...'}
                </>
              ) : (
                meal ? 'Yangilash' : 'Qo\'shish'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
