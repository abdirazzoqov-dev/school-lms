'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { MoreVertical, Edit, Trash2, Eye, ToggleLeft, ToggleRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { deleteMeal, toggleMealStatus } from '@/app/actions/meal'
import { toast } from 'sonner'

type Meal = {
  id: string
  dayOfWeek: number
  dayName: string
  mealType: string
  mealTypeName: string
  mainDish: string
  sideDish: string | null
  salad: string | null
  dessert: string | null
  drink: string | null
  description: string | null
  effectiveFrom: Date
  effectiveTo: Date | null
  isActive: boolean
}

export function MealsTableClient({ meals }: { meals: Meal[] }) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)

  const handleDelete = async (id: string) => {
    if (!confirm('Bu menyuni o\'chirishni xohlaysizmi?')) return

    setLoading(id)
    const result = await deleteMeal(id)
    setLoading(null)

    if (result.success) {
      toast.success('Menyu o\'chirildi')
      router.refresh()
    } else {
      toast.error(result.error || 'Xatolik yuz berdi')
    }
  }

  const handleToggleStatus = async (id: string) => {
    setLoading(id)
    const result = await toggleMealStatus(id)
    setLoading(null)

    if (result.success) {
      toast.success('Status o\'zgartirildi')
      router.refresh()
    } else {
      toast.error(result.error || 'Xatolik yuz berdi')
    }
  }

  if (meals.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Hozircha ovqatlar menyusi yo'q</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {meals.map((meal) => (
        <div
          key={meal.id}
          className="p-4 border rounded-lg hover:shadow-md transition-shadow bg-gradient-to-br from-muted/50 to-muted/30"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge className="bg-blue-600">{meal.dayName}</Badge>
                <Badge className="bg-purple-600">{meal.mealTypeName}</Badge>
                {meal.isActive ? (
                  <Badge className="bg-green-600">✓ Faol</Badge>
                ) : (
                  <Badge className="bg-gray-600">○ Nofaol</Badge>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div>
                  <p className="text-sm text-muted-foreground">Asosiy taom</p>
                  <p className="font-semibold">{meal.mainDish}</p>
                </div>
                {meal.sideDish && (
                  <div>
                    <p className="text-sm text-muted-foreground">Garnitir</p>
                    <p className="font-semibold">{meal.sideDish}</p>
                  </div>
                )}
                {meal.salad && (
                  <div>
                    <p className="text-sm text-muted-foreground">Salat</p>
                    <p className="font-semibold">{meal.salad}</p>
                  </div>
                )}
                {meal.dessert && (
                  <div>
                    <p className="text-sm text-muted-foreground">Shirinlik</p>
                    <p className="font-semibold">{meal.dessert}</p>
                  </div>
                )}
                {meal.drink && (
                  <div>
                    <p className="text-sm text-muted-foreground">Ichimlik</p>
                    <p className="font-semibold">{meal.drink}</p>
                  </div>
                )}
              </div>

              {meal.description && (
                <p className="text-sm text-muted-foreground">📝 {meal.description}</p>
              )}

              <div className="text-xs text-muted-foreground">
                📅 {new Date(meal.effectiveFrom).toLocaleDateString('uz-UZ')}
                {meal.effectiveTo && ` - ${new Date(meal.effectiveTo).toLocaleDateString('uz-UZ')}`}
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  disabled={loading === meal.id}
                  className="h-8 w-8"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => router.push(`/admin/meals/${meal.id}`)}>
                  <Eye className="mr-2 h-4 w-4" />
                  Ko'rish
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push(`/admin/meals/${meal.id}/edit`)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Tahrirlash
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleToggleStatus(meal.id)}>
                  {meal.isActive ? (
                    <><ToggleLeft className="mr-2 h-4 w-4" />O'chirish</>
                  ) : (
                    <><ToggleRight className="mr-2 h-4 w-4" />Yoqish</>
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleDelete(meal.id)}
                  className="text-red-600"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  O'chirish
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      ))}
    </div>
  )
}

