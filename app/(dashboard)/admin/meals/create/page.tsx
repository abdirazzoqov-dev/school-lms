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
import { createMeal } from '@/app/actions/meal'
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

const mealTypes = [
  { value: 'BREAKFAST', label: 'Nonushta' },
  { value: 'LUNCH', label: 'Tushlik' },
  { value: 'DINNER', label: 'Kechki ovqat' },
]

export default function CreateMealPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    dayOfWeek: 1,
    mealType: 'LUNCH',
    mainDish: '',
    sideDish: '',
    salad: '',
    dessert: '',
    drink: '',
    description: '',
    effectiveFrom: new Date().toISOString().split('T')[0],
    effectiveTo: '',
    isActive: true,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const result = await createMeal(formData)
    setLoading(false)

    if (result.success) {
      toast.success('Menyu qo\'shildi')
      router.push('/admin/meals')
    } else {
      toast.error(result.error || 'Xatolik yuz berdi')
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-600 via-emerald-600 to-teal-600 p-8 text-white shadow-2xl">
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
            <h1 className="text-4xl font-bold">Yangi Menyu Qo'shish</h1>
          </div>
          <p className="text-green-50 text-lg ml-16">
            Ovqatlar menyusini yarating
          </p>
        </div>
        <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10 blur-2xl"></div>
        <div className="absolute -left-8 -bottom-8 h-40 w-40 rounded-full bg-white/10 blur-2xl"></div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Menyu Ma'lumotlari</CardTitle>
          <CardDescription>Barcha kerakli ma'lumotlarni kiriting</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                <Label htmlFor="mealType">Ovqat turi *</Label>
                <Select
                  value={formData.mealType}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, mealType: value }))}
                  required
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {mealTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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

              <div className="space-y-2">
                <Label htmlFor="effectiveFrom">Boshlanish sanasi *</Label>
                <Input
                  id="effectiveFrom"
                  type="date"
                  value={formData.effectiveFrom}
                  onChange={(e) => setFormData(prev => ({ ...prev, effectiveFrom: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="effectiveTo">Tugash sanasi</Label>
                <Input
                  id="effectiveTo"
                  type="date"
                  value={formData.effectiveTo}
                  onChange={(e) => setFormData(prev => ({ ...prev, effectiveTo: e.target.value }))}
                />
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
                Darhol faollashtirish
              </Label>
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={loading} size="lg">
                <Save className="mr-2 h-5 w-5" />
                {loading ? 'Saqlanmoqda...' : 'Saqlash'}
              </Button>
              <Link href="/admin/meals">
                <Button type="button" variant="outline" size="lg">
                  Bekor qilish
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

