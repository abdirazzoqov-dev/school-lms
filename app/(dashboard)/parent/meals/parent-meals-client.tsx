'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Clock, UtensilsCrossed } from 'lucide-react'
import Image from 'next/image'
import { cn } from '@/lib/utils'

const DAYS = [
  { value: 0, label: 'Yakshanba', shortLabel: 'Yak', color: 'from-blue-500 to-blue-600', icon: '☀️' },
  { value: 1, label: 'Dushanba', shortLabel: 'Dush', color: 'from-green-500 to-green-600', icon: '💚' },
  { value: 2, label: 'Seshanba', shortLabel: 'Sesh', color: 'from-yellow-500 to-yellow-600', icon: '⭐' },
  { value: 3, label: 'Chorshanba', shortLabel: 'Chor', color: 'from-purple-500 to-purple-600', icon: '💜' },
  { value: 4, label: 'Payshanba', shortLabel: 'Pay', color: 'from-pink-500 to-pink-600', icon: '🌸' },
  { value: 5, label: 'Juma', shortLabel: 'Juma', color: 'from-indigo-500 to-indigo-600', icon: '🕌' },
  { value: 6, label: 'Shanba', shortLabel: 'Shan', color: 'from-orange-500 to-orange-600', icon: '🎉' },
]

const MEALS = [
  { number: 1, label: '1-ovqat', icon: '🌅', time: 'Nonushta' },
  { number: 2, label: '2-ovqat', icon: '☀️', time: 'Tushlik' },
  { number: 3, label: '3-ovqat', icon: '🌤️', time: 'Tushdan keyin' },
  { number: 4, label: '4-ovqat', icon: '🌆', time: 'Kechki' },
  { number: 5, label: '5-ovqat', icon: '🌙', time: 'Kech' },
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

interface ParentMealsClientProps {
  meals: Meal[]
}

export function ParentMealsClient({ meals }: ParentMealsClientProps) {
  const [selectedDay, setSelectedDay] = useState<number>(new Date().getDay())

  const daysWithMeals = DAYS.filter(day => 
    meals.some(m => m.dayOfWeek === day.value)
  )

  const getMealsForDay = (day: number) => {
    return MEALS.map(mealType => ({
      ...mealType,
      data: meals.find(m => m.dayOfWeek === day && m.mealNumber === mealType.number)
    })).filter(item => item.data)
  }

  if (meals.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 md:py-16">
          <UtensilsCrossed className="h-12 w-12 md:h-16 md:w-16 text-muted-foreground mb-4" />
          <h3 className="text-lg md:text-xl font-semibold mb-2">Ovqatlar menyusi mavjud emas</h3>
          <p className="text-sm md:text-base text-muted-foreground text-center max-w-md">
            Hozircha haftalik ovqatlar menyusi kiritilmagan. Tez orada ma'lumotlar qo'shiladi.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">
          Ovqatlar Menyusi
        </h1>
        <p className="text-sm md:text-base text-muted-foreground">
          Haftalik ovqatlar menyusini ko'ring
        </p>
      </div>

      {/* Days Tabs */}
      <Tabs value={selectedDay.toString()} onValueChange={(v) => setSelectedDay(parseInt(v))} className="w-full">
        <TabsList className="w-full justify-start overflow-x-auto flex-nowrap h-auto p-1 bg-muted/50 rounded-xl">
          {daysWithMeals.map((day) => (
            <TabsTrigger
              key={day.value}
              value={day.value.toString()}
              className="flex-shrink-0 data-[state=active]:bg-gradient-to-br data-[state=active]:from-green-500 data-[state=active]:to-teal-600 data-[state=active]:text-white rounded-lg px-4 md:px-6 py-3 transition-all duration-300 data-[state=active]:shadow-lg"
            >
              <div className="flex flex-col items-center gap-1">
                <span className="text-lg">{day.icon}</span>
                <span className="font-semibold text-xs md:text-sm">{day.label}</span>
              </div>
            </TabsTrigger>
          ))}
        </TabsList>

        {daysWithMeals.map((day) => (
          <TabsContent key={day.value} value={day.value.toString()} className="mt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
              {getMealsForDay(day.value).map(({ data, icon, time, label }) => {
                if (!data) return null

                return (
                  <Card 
                    key={data.id}
                    className="group overflow-hidden hover:shadow-2xl transition-all duration-500 hover:scale-[1.02] border-2 border-transparent hover:border-green-400/50 bg-gradient-to-br from-background to-muted/20"
                  >
                    {/* Image Section */}
                    {data.image ? (
                      <div className="relative h-56 w-full overflow-hidden">
                        <Image
                          src={data.image}
                          alt={data.mainDish}
                          fill
                          className="object-cover group-hover:scale-110 transition-transform duration-700"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                        
                        {/* Floating meal badge */}
                        <div className="absolute top-3 left-3">
                          <div className="backdrop-blur-lg bg-white/90 rounded-2xl px-4 py-2 shadow-xl border border-white/50">
                            <div className="flex items-center gap-2">
                              <span className="text-2xl">{icon}</span>
                              <div className="text-left">
                                <p className="text-xs font-semibold text-muted-foreground">{time}</p>
                                <p className="text-sm font-bold text-foreground">{label}</p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Time badge */}
                        <div className="absolute top-3 right-3">
                          <div className="backdrop-blur-lg bg-green-500 rounded-full px-3 py-1.5 shadow-xl">
                            <div className="flex items-center gap-1.5">
                              <Clock className="h-3.5 w-3.5 text-white" />
                              <span className="text-white font-bold text-xs">{data.mealTime}</span>
                            </div>
                          </div>
                        </div>

                        {/* Main dish on image */}
                        <div className="absolute bottom-3 left-3 right-3">
                          <div className="backdrop-blur-xl bg-black/60 rounded-xl px-4 py-3 border border-white/20">
                            <h3 className="text-white font-bold text-lg md:text-xl line-clamp-2">
                              {data.mainDish}
                            </h3>
                          </div>
                        </div>
                      </div>
                    ) : (
                      // Header without image
                      <div className={cn(
                        "relative p-6 bg-gradient-to-br",
                        day.color
                      )}>
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-4xl">{icon}</span>
                          <div>
                            <p className="text-white/90 text-xs font-medium">{time}</p>
                            <p className="text-white font-bold text-lg">{label}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-white/90">
                          <Clock className="h-4 w-4" />
                          <span className="text-sm font-semibold">{data.mealTime}</span>
                        </div>
                        <h3 className="text-white font-bold text-xl mt-3">
                          {data.mainDish}
                        </h3>
                      </div>
                    )}

                    {/* Content Section */}
                    <CardContent className="p-4 space-y-3">
                      {/* Details */}
                      <div className="space-y-2">
                        {data.sideDish && (
                          <div className="flex items-center gap-2 bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-950/30 dark:to-orange-900/20 rounded-lg px-3 py-2 border border-orange-200 dark:border-orange-800">
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-orange-200 dark:bg-orange-900/50">
                              <span className="text-sm">🍚</span>
                            </div>
                            <div className="flex-1">
                              <p className="text-xs text-muted-foreground font-medium">Garnitir</p>
                              <p className="text-sm font-bold text-foreground">{data.sideDish}</p>
                            </div>
                          </div>
                        )}

                        {data.salad && (
                          <div className="flex items-center gap-2 bg-gradient-to-r from-green-50 to-green-100 dark:from-green-950/30 dark:to-green-900/20 rounded-lg px-3 py-2 border border-green-200 dark:border-green-800">
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-200 dark:bg-green-900/50">
                              <span className="text-sm">🥗</span>
                            </div>
                            <div className="flex-1">
                              <p className="text-xs text-muted-foreground font-medium">Salat</p>
                              <p className="text-sm font-bold text-foreground">{data.salad}</p>
                            </div>
                          </div>
                        )}

                        {data.dessert && (
                          <div className="flex items-center gap-2 bg-gradient-to-r from-pink-50 to-pink-100 dark:from-pink-950/30 dark:to-pink-900/20 rounded-lg px-3 py-2 border border-pink-200 dark:border-pink-800">
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-pink-200 dark:bg-pink-900/50">
                              <span className="text-sm">🍰</span>
                            </div>
                            <div className="flex-1">
                              <p className="text-xs text-muted-foreground font-medium">Shirinlik</p>
                              <p className="text-sm font-bold text-foreground">{data.dessert}</p>
                            </div>
                          </div>
                        )}

                        {data.drink && (
                          <div className="flex items-center gap-2 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/20 rounded-lg px-3 py-2 border border-blue-200 dark:border-blue-800">
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-200 dark:bg-blue-900/50">
                              <span className="text-sm">🥤</span>
                            </div>
                            <div className="flex-1">
                              <p className="text-xs text-muted-foreground font-medium">Ichimlik</p>
                              <p className="text-sm font-bold text-foreground">{data.drink}</p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Description */}
                      {data.description && (
                        <div className="pt-3 mt-3 border-t border-dashed">
                          <div className="flex gap-2">
                            <span className="text-lg flex-shrink-0">💬</span>
                            <p className="text-xs md:text-sm text-muted-foreground italic leading-relaxed">
                              {data.description}
                            </p>
                          </div>
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
    </div>
  )
}

