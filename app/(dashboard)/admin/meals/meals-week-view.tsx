'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Edit, Trash2, Clock, UtensilsCrossed } from 'lucide-react'
import { MealDialog } from './meal-dialog'
import { deleteMeal } from '@/app/actions/meal'
import { toast } from 'sonner'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'

const DAYS = [
  { value: 0, label: 'Yakshanba' },
  { value: 1, label: 'Dushanba' },
  { value: 2, label: 'Seshanba' },
  { value: 3, label: 'Chorshanba' },
  { value: 4, label: 'Payshanba' },
  { value: 5, label: 'Juma' },
  { value: 6, label: 'Shanba' },
]

const MEALS = [
  { number: 1, label: '1-ovqat' },
  { number: 2, label: '2-ovqat' },
  { number: 3, label: '3-ovqat' },
  { number: 4, label: '4-ovqat' },
  { number: 5, label: '5-ovqat' },
]

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
  isActive: boolean
}

export function MealsWeekView({ meals }: { meals: Meal[] }) {
  const router = useRouter()
  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  const [selectedMeal, setSelectedMeal] = useState<number | null>(null)
  const [editingMeal, setEditingMeal] = useState<Meal | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const getMealForDayAndNumber = (day: number, mealNumber: number) => {
    return meals.find(m => m.dayOfWeek === day && m.mealNumber === mealNumber)
  }

  const handleAddMeal = (day: number, mealNumber: number) => {
    setSelectedDay(day)
    setSelectedMeal(mealNumber)
    setEditingMeal(null)
    setIsDialogOpen(true)
  }

  const handleEditMeal = (meal: Meal) => {
    setEditingMeal(meal)
    setSelectedDay(meal.dayOfWeek)
    setSelectedMeal(meal.mealNumber)
    setIsDialogOpen(true)
  }

  const handleDeleteMeal = async (mealId: string) => {
    if (!confirm('Rostdan ham bu ovqatni o\'chirmoqchimisiz?')) {
      return
    }

    // Show loading toast immediately
    const loadingToast = toast.loading('O\'chirilmoqda...')
    setIsDeleting(true)
    
    try {
      await deleteMeal(mealId)
      toast.success('Ovqat muvaffaqiyatli o\'chirildi', { id: loadingToast })
      // Refresh in background
      router.refresh()
    } catch (error) {
      toast.error('Xatolik yuz berdi', { id: loadingToast })
      console.error('Error deleting meal:', error)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <>
      <div className="grid gap-4">
        {DAYS.map((day) => (
          <Card key={day.value}>
            <CardHeader className="pb-3">
              <CardTitle className="text-xl">{day.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-5">
                {MEALS.map((meal) => {
                  const mealData = getMealForDayAndNumber(day.value, meal.number)
                  
                  return (
                    <Card key={meal.number} className="overflow-hidden group hover:shadow-lg transition-all duration-300">
                      {/* Rasm - Restaurant Style */}
                      {mealData?.image && (
                        <div className="relative h-40 w-full overflow-hidden">
                          <Image
                            src={mealData.image}
                            alt={mealData.mainDish}
                            fill
                            className="object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                          
                          {/* Action buttons on image */}
                          <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <Button
                              variant="secondary"
                              size="sm"
                              className="h-8 w-8 p-0 rounded-full backdrop-blur-sm bg-white/90 hover:bg-white"
                              onClick={() => handleEditMeal(mealData)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="secondary"
                              size="sm"
                              className="h-8 w-8 p-0 rounded-full backdrop-blur-sm bg-white/90 hover:bg-destructive hover:text-destructive-foreground"
                              onClick={() => handleDeleteMeal(mealData.id)}
                              disabled={isDeleting}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          
                          {/* Meal label on image */}
                          <div className="absolute bottom-2 left-2">
                            <div className="backdrop-blur-md bg-white/20 rounded-lg px-3 py-1.5 border border-white/30">
                              <p className="text-white font-semibold text-sm">{meal.label}</p>
                              <div className="flex items-center gap-1.5 text-white/90 text-xs">
                                <Clock className="h-3 w-3" />
                                <span>{mealData.mealTime}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Header for meals without image */}
                      {!mealData?.image && (
                        <CardHeader className={cn(
                          "p-3 pb-2",
                          mealData ? "bg-gradient-to-br from-primary/10 to-primary/5" : "bg-muted/50"
                        )}>
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-sm font-medium">
                              {meal.label}
                            </CardTitle>
                            {mealData && (
                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0"
                                  onClick={() => handleEditMeal(mealData)}
                                >
                                  <Edit className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0 text-destructive"
                                  onClick={() => handleDeleteMeal(mealData.id)}
                                  disabled={isDeleting}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            )}
                          </div>
                        </CardHeader>
                      )}
                      
                      <CardContent className="p-3">
                        {mealData ? (
                          <div className="space-y-2 text-sm">
                            {/* Show time only if no image */}
                            {!mealData.image && (
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                <span>{mealData.mealTime}</span>
                              </div>
                            )}
                            
                            <div>
                              <p className="font-semibold text-base mb-1">{mealData.mainDish}</p>
                            </div>
                            
                            {mealData.sideDish && (
                              <div className="flex items-start gap-2">
                                <span className="text-xs text-muted-foreground min-w-[60px]">Garnitir:</span>
                                <span className="text-sm">{mealData.sideDish}</span>
                              </div>
                            )}
                            
                            {mealData.salad && (
                              <div className="flex items-start gap-2">
                                <span className="text-xs text-muted-foreground min-w-[60px]">Salat:</span>
                                <span className="text-sm">{mealData.salad}</span>
                              </div>
                            )}
                            
                            {mealData.dessert && (
                              <div className="flex items-start gap-2">
                                <span className="text-xs text-muted-foreground min-w-[60px]">Shirinlik:</span>
                                <span className="text-sm">{mealData.dessert}</span>
                              </div>
                            )}
                            
                            {mealData.drink && (
                              <div className="flex items-start gap-2">
                                <span className="text-xs text-muted-foreground min-w-[60px]">Ichimlik:</span>
                                <span className="text-sm">{mealData.drink}</span>
                              </div>
                            )}
                            
                            {mealData.description && (
                              <div className="pt-2 mt-2 border-t">
                                <p className="text-xs text-muted-foreground italic">{mealData.description}</p>
                              </div>
                            )}
                          </div>
                        ) : (
                          <Button
                            variant="outline"
                            className="w-full h-32 hover:bg-primary/5 hover:border-primary/50 transition-colors"
                            onClick={() => handleAddMeal(day.value, meal.number)}
                          >
                            <div className="flex flex-col items-center gap-2">
                              <Plus className="h-6 w-6 text-muted-foreground" />
                              <span className="text-sm font-medium">Ovqat qo'shish</span>
                            </div>
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <MealDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        dayOfWeek={selectedDay ?? 0}
        mealNumber={selectedMeal ?? 1}
        meal={editingMeal}
      />
    </>
  )
}
