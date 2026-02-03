'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Edit, Trash2, Clock, UtensilsCrossed } from 'lucide-react'
import { MealDialog } from './meal-dialog'
import { deleteMeal } from '@/app/actions/meal'
import { toast } from 'sonner'

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
  isActive: boolean
}

export function MealsWeekView({ meals }: { meals: Meal[] }) {
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

    setIsDeleting(true)
    try {
      await deleteMeal(mealId)
      toast.success('Ovqat muvaffaqiyatli o\'chirildi')
      window.location.reload()
    } catch (error) {
      toast.error('Xatolik yuz berdi')
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
                    <Card key={meal.number} className="overflow-hidden">
                      <CardHeader className="p-3 pb-2 bg-muted/50">
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
                      <CardContent className="p-3">
                        {mealData ? (
                          <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              <span>{mealData.mealTime}</span>
                            </div>
                            <div>
                              <p className="font-medium text-xs text-muted-foreground mb-1">Asosiy:</p>
                              <p className="text-sm">{mealData.mainDish}</p>
                            </div>
                            {mealData.sideDish && (
                              <div>
                                <p className="font-medium text-xs text-muted-foreground mb-1">Garnitir:</p>
                                <p className="text-sm">{mealData.sideDish}</p>
                              </div>
                            )}
                            {mealData.salad && (
                              <div>
                                <p className="font-medium text-xs text-muted-foreground mb-1">Salat:</p>
                                <p className="text-sm">{mealData.salad}</p>
                              </div>
                            )}
                            {mealData.drink && (
                              <div>
                                <p className="font-medium text-xs text-muted-foreground mb-1">Ichimlik:</p>
                                <p className="text-sm">{mealData.drink}</p>
                              </div>
                            )}
                          </div>
                        ) : (
                          <Button
                            variant="outline"
                            className="w-full h-24"
                            onClick={() => handleAddMeal(day.value, meal.number)}
                          >
                            <div className="flex flex-col items-center gap-2">
                              <Plus className="h-5 w-5" />
                              <span className="text-xs">Ovqat qo'shish</span>
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
        dayOfWeek={selectedDay!}
        mealNumber={selectedMeal!}
        meal={editingMeal}
      />
    </>
  )
}
