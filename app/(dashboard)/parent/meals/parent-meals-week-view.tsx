'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Clock } from 'lucide-react'
import Image from 'next/image'
import { cn } from '@/lib/utils'

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

export function ParentMealsWeekView({ meals }: { meals: Meal[] }) {
  const getMealForDayAndNumber = (day: number, mealNumber: number) => {
    return meals.find(m => m.dayOfWeek === day && m.mealNumber === mealNumber)
  }

  return (
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
                      <div className="relative h-32 w-full overflow-hidden">
                        <Image
                          src={mealData.image}
                          alt={mealData.mainDish}
                          fill
                          className="object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                        
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
                        <div className="text-center py-8 text-muted-foreground text-sm">
                          Ma'lumot yo'q
                        </div>
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
  )
}

