'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Save, UtensilsCrossed } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { updateMeal } from '@/app/actions/meal'
import { toast } from 'sonner'
import { Checkbox } from '@/components/ui/checkbox'
const dayNames = [
  { value: 1, label: 'Dushanba' },
  { value: 2, label: 'Seshanba' },
  { value: 3, label: 'Chorshanba' },
  { value: 4, label: 'Payshanba' },
  { value: 5, label: 'Juma' },
  { value: 6, label: 'Shanba' },
  { value: 0, label: 'Yakshanba' },
]

// Suggested meal labels (5 meals per day)
const suggestedMealLabels = [
  '1-ovqat (Nonushta)',
  '2-ovqat',
  '3-ovqat (Tushlik)',
  '4-ovqat',
  '5-ovqat (Kechki ovqat)',
]

type Meal = {
  id: string
  dayOfWeek: number
  mealLabel: string
  mealTime: string
  mainDish: string
  sideDish: string | null
  salad: string | null
  dessert: string | null
  drink: string | null
  description: string | null
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export function EditMealForm({ meal }: { meal: Meal }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    dayOfWeek: meal.dayOfWeek,
    mealLabel: meal.mealLabel,
    mealTime: meal.mealTime,
    mainDish: meal.mainDish,
    sideDish: meal.sideDish || '',
    salad: meal.salad || '',
    dessert: meal.dessert || '',
    drink: meal.drink || '',
    description: meal.description || '',
    isActive: meal.isActive,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const result = await updateMeal(meal.id, formData)
    setLoading(false)

    if (result.success) {
      toast.success('Menyu o\'zgartirildi')
      router.push('/admin/meals')
      router.refresh()
    } else {
      toast.error(result.error || 'Xatolik yuz berdi')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50 to-amber-50 p-3 sm:p-4 md:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto space-y-4 md:space-y-6">
        
        {/* Header */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-green-600 via-emerald-600 to-teal-600 p-6 sm:p-8 text-white shadow-2xl">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-2">
              <Link href="/admin/meals">
                <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                <UtensilsCrossed className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold">Menyuni Tahrirlash</h1>
                <p className="text-green-50 text-sm sm:text-base">
                  Ovqatlar menyusini o'zgartiring
                </p>
              </div>
            </div>
          </div>
          <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10 blur-3xl"></div>
          <div className="absolute -left-8 -bottom-8 h-40 w-40 rounded-full bg-white/10 blur-3xl"></div>
        </div>

        {/* Form Card */}
        <Card className="shadow-xl border-0">
          <CardHeader>
            <CardTitle className="text-2xl">Menyu Ma'lumotlari</CardTitle>
            <CardDescription>Kerakli ma'lumotlarni o'zgartiring</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-2">
                  <Label htmlFor="dayOfWeek">Hafta kuni *</Label>
                  <Select
                    value={formData.dayOfWeek.toString()}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, dayOfWeek: parseInt(value) }))}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {dayNames.map((day) => (
                        <SelectItem key={day.value} value={day.value.toString()}>
                          {day.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mealLabel">Ovqat sarlavhasi *</Label>
                  <Input
                    id="mealLabel"
                    value={formData.mealLabel}
                    onChange={(e) => setFormData(prev => ({ ...prev, mealLabel: e.target.value }))}
                    placeholder="1-ovqat (Nonushta), 2-ovqat, 3-ovqat (Tushlik)..."
                    list="meal-labels-edit"
                    required
                  />
                  <datalist id="meal-labels-edit">
                    {suggestedMealLabels.map((label, index) => (
                      <option key={index} value={label} />
                    ))}
                  </datalist>
                  <p className="text-xs text-muted-foreground">
                    Masalan: 1-ovqat, Nonushta, Tushlik, 5-ovqat
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mealTime">Ovqat vaqti *</Label>
                  <Input
                    id="mealTime"
                    value={formData.mealTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, mealTime: e.target.value }))}
                    placeholder="08:00 - 09:00"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Masalan: 08:00 - 09:00, 12:30 - 13:30
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mainDish">Asosiy taom *</Label>
                  <Input
                    id="mainDish"
                    value={formData.mainDish}
                    onChange={(e) => setFormData(prev => ({ ...prev, mainDish: e.target.value }))}
                    placeholder="Osh, lag'mon..."
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sideDish">Garnitir</Label>
                  <Input
                    id="sideDish"
                    value={formData.sideDish}
                    onChange={(e) => setFormData(prev => ({ ...prev, sideDish: e.target.value }))}
                    placeholder="Guruch, kartoshka..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="salad">Salat</Label>
                  <Input
                    id="salad"
                    value={formData.salad}
                    onChange={(e) => setFormData(prev => ({ ...prev, salad: e.target.value }))}
                    placeholder="Achichuk, vinegret..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dessert">Shirinlik</Label>
                  <Input
                    id="dessert"
                    value={formData.dessert}
                    onChange={(e) => setFormData(prev => ({ ...prev, dessert: e.target.value }))}
                    placeholder="Meva, tort..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="drink">Ichimlik</Label>
                  <Input
                    id="drink"
                    value={formData.drink}
                    onChange={(e) => setFormData(prev => ({ ...prev, drink: e.target.value }))}
                    placeholder="Choy, kompot..."
                  />
                </div>
              </div>

              {/* Created and Updated info */}
              <div className="p-4 bg-muted/50 rounded-lg border">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="font-medium text-muted-foreground">Yaratilgan:</span>{' '}
                    <span className="text-foreground">
                      {new Date(meal.createdAt).toLocaleString('uz-UZ', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">Tahrirlangan:</span>{' '}
                    <span className="text-foreground">
                      {new Date(meal.updatedAt).toLocaleString('uz-UZ', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Qo'shimcha ma'lumot</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Maxsus ta'minot, allergiya haqida ma'lumot..."
                  rows={3}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: !!checked }))}
                />
                <Label htmlFor="isActive" className="cursor-pointer">
                  Faol holat
                </Label>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4 border-t">
                <Button type="submit" disabled={loading} size="lg" className="flex-1 sm:flex-none">
                  <Save className="mr-2 h-5 w-5" />
                  {loading ? 'Saqlanmoqda...' : 'Saqlash'}
                </Button>
                <Link href="/admin/meals" className="flex-1 sm:flex-none">
                  <Button type="button" variant="outline" size="lg" className="w-full">
                    Bekor qilish
                  </Button>
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
