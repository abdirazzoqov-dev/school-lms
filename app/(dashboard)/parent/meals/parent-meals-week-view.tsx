'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
}

export function ParentMealsWeekView({ meals }: { meals: Meal[] }) {
  const today = new Date().getDay()
  const [selectedDay, setSelectedDay] = useState<string>(today.toString())

  const getMealForDayAndNumber = (day: number, mealNumber: number) => {
    return meals.find(m => m.dayOfWeek === day && m.mealNumber === mealNumber)
  }

  const daysWithMeals = DAYS.filter(day => 
    meals.some(m => m.dayOfWeek === day.value)
  )

  return (
    <Tabs value={selectedDay} onValueChange={setSelectedDay} className="w-full">
      {/* Tabs List - Responsive with horizontal scroll on mobile */}
      <div className="mb-6">
        <TabsList className="w-full h-auto p-1 bg-muted/30 border rounded-lg inline-flex md:grid md:grid-cols-7 gap-1 overflow-x-auto">
          {daysWithMeals.map((day) => (
            <TabsTrigger
              key={day.value}
              value={day.value.toString()}
              className={cn(
                "flex-shrink-0 px-4 md:px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-200 whitespace-nowrap",
                "data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm",
                "data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:text-foreground data-[state=inactive]:hover:bg-muted/50"
              )}
            >
              {day.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>

      {/* Tab Content for each day */}
      {daysWithMeals.map((day) => (
        <TabsContent key={day.value} value={day.value.toString()} className="mt-6">
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {MEALS.map((meal) => {
              const mealData = getMealForDayAndNumber(day.value, meal.number)
              
              if (!mealData) {
                return null
              }

              return (
                <Card 
                  key={meal.number} 
                  className="overflow-hidden group hover:shadow-lg transition-all duration-300 border-2 hover:border-primary/20"
                >
                  {/* Image Section */}
                  {mealData.image && (
                    <div className="relative h-36 w-full overflow-hidden bg-muted">
                      <Image
                        src={mealData.image}
                        alt={mealData.mainDish}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                        quality={75}
                        sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 20vw"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      
                      {/* Meal label and time on image */}
                      <div className="absolute bottom-2 left-2 right-2">
                        <div className="backdrop-blur-md bg-white/90 dark:bg-black/70 rounded-lg px-3 py-2 border border-white/50">
                          <div className="flex items-center justify-between">
                            <p className="text-foreground font-semibold text-sm">{meal.label}</p>
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              <span className="text-xs font-medium">{mealData.mealTime}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Header for meals without image */}
                  {!mealData.image && (
                    <div className="p-3 pb-2 bg-muted/30 border-b">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-semibold">{meal.label}</p>
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span className="text-xs">{mealData.mealTime}</span>
                      </div>
                    </div>
                  )}
                  
                  {/* Content */}
                  <CardContent className="p-3 space-y-2">
                    {/* Main dish */}
                    <div>
                      <h3 className="font-bold text-base leading-tight line-clamp-2">
                        {mealData.mainDish}
                      </h3>
                    </div>
                    
                    {/* Details */}
                    <div className="space-y-1.5 text-sm">
                      {mealData.sideDish && (
                        <div className="flex items-start gap-2 text-muted-foreground">
                          <span className="text-xs min-w-[55px] font-medium">Garnitir:</span>
                          <span className="text-xs text-foreground font-medium">{mealData.sideDish}</span>
                        </div>
                      )}
                      
                      {mealData.salad && (
                        <div className="flex items-start gap-2 text-muted-foreground">
                          <span className="text-xs min-w-[55px] font-medium">Salat:</span>
                          <span className="text-xs text-foreground font-medium">{mealData.salad}</span>
                        </div>
                      )}
                      
                      {mealData.dessert && (
                        <div className="flex items-start gap-2 text-muted-foreground">
                          <span className="text-xs min-w-[55px] font-medium">Shirinlik:</span>
                          <span className="text-xs text-foreground font-medium">{mealData.dessert}</span>
                        </div>
                      )}
                      
                      {mealData.drink && (
                        <div className="flex items-start gap-2 text-muted-foreground">
                          <span className="text-xs min-w-[55px] font-medium">Ichimlik:</span>
                          <span className="text-xs text-foreground font-medium">{mealData.drink}</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Description */}
                    {mealData.description && (
                      <div className="pt-2 mt-2 border-t">
                        <p className="text-xs text-muted-foreground italic line-clamp-2 leading-relaxed">
                          {mealData.description}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>
      ))}
    </Tabs>
  )
}
