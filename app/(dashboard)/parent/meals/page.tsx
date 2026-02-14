import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Clock, UtensilsCrossed } from 'lucide-react'
import Image from 'next/image'
import { cn } from '@/lib/utils'

// Disable caching for real-time updates
export const revalidate = 0
export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Ovqatlar Menyusi',
  description: 'Haftalik ovqatlar menyusini ko\'rish',
}

const DAYS = [
  { value: 0, label: 'Yakshanba', color: 'bg-blue-500' },
  { value: 1, label: 'Dushanba', color: 'bg-green-500' },
  { value: 2, label: 'Seshanba', color: 'bg-yellow-500' },
  { value: 3, label: 'Chorshanba', color: 'bg-purple-500' },
  { value: 4, label: 'Payshanba', color: 'bg-pink-500' },
  { value: 5, label: 'Juma', color: 'bg-indigo-500' },
  { value: 6, label: 'Shanba', color: 'bg-orange-500' },
]

const MEALS = [
  { number: 1, label: '1-ovqat', icon: '🌅' },
  { number: 2, label: '2-ovqat', icon: '☀️' },
  { number: 3, label: '3-ovqat', icon: '🌤️' },
  { number: 4, label: '4-ovqat', icon: '🌆' },
  { number: 5, label: '5-ovqat', icon: '🌙' },
]

export default async function ParentMealsPage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'PARENT') {
    redirect('/unauthorized')
  }

  const tenantId = session.user.tenantId!

  const meals = await db.meal.findMany({
    where: { 
      tenantId,
      isActive: true,
    },
    orderBy: [
      { dayOfWeek: 'asc' },
      { mealNumber: 'asc' },
    ],
  })

  const getMealForDayAndNumber = (day: number, mealNumber: number) => {
    return meals.find(m => m.dayOfWeek === day && m.mealNumber === mealNumber)
  }

  return (
    <div className="space-y-6 pb-8">
      <div className="space-y-2">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Ovqatlar Menyusi</h1>
        <p className="text-sm md:text-base text-muted-foreground">
          Haftalik ovqatlar menyusi
        </p>
      </div>

      <div className="grid gap-6">
        {DAYS.map((day) => {
          const dayMeals = meals.filter(m => m.dayOfWeek === day.value)
          
          if (dayMeals.length === 0) {
            return null
          }

          return (
            <Card key={day.value} className="overflow-hidden shadow-lg">
              <CardHeader className={`${day.color} text-white p-4 md:p-6`}>
                <CardTitle className="text-xl md:text-2xl font-bold flex items-center gap-2">
                  <UtensilsCrossed className="h-5 w-5 md:h-6 md:w-6" />
                  {day.label}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-border">
                  {MEALS.map((meal) => {
                    const mealData = getMealForDayAndNumber(day.value, meal.number)
                    
                    if (!mealData) {
                      return null
                    }

                    return (
                      <div 
                        key={meal.number} 
                        className="group hover:bg-muted/30 transition-all duration-300"
                      >
                        <div className="flex flex-col md:flex-row gap-4 p-4 md:p-6">
                          {/* Left side - Meal info */}
                          <div className="flex-1 space-y-3">
                            {/* Meal title and time */}
                            <div className="space-y-2">
                              <div className="flex items-center gap-3">
                                <span className="text-3xl">{meal.icon}</span>
                                <div>
                                  <h3 className="text-xl md:text-2xl font-bold text-foreground group-hover:text-primary transition-colors">
                                    {mealData.mainDish}
                                  </h3>
                                  <div className="flex items-center gap-2 mt-1">
                                    <Badge variant="secondary" className="text-xs">
                                      {meal.label}
                                    </Badge>
                                    <div className="flex items-center gap-1 text-muted-foreground">
                                      <Clock className="h-3.5 w-3.5" />
                                      <span className="text-sm font-medium">{mealData.mealTime}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Meal details in horizontal layout */}
                            <div className="flex flex-wrap gap-3 pt-2">
                              {mealData.sideDish && (
                                <div className="flex items-center gap-2 bg-orange-50 dark:bg-orange-950/20 rounded-lg px-3 py-1.5">
                                  <span className="text-sm font-medium text-muted-foreground">Garnitir:</span>
                                  <span className="text-sm font-semibold text-foreground">{mealData.sideDish}</span>
                                </div>
                              )}
                              
                              {mealData.salad && (
                                <div className="flex items-center gap-2 bg-green-50 dark:bg-green-950/20 rounded-lg px-3 py-1.5">
                                  <span className="text-sm font-medium text-muted-foreground">🥗 Salat:</span>
                                  <span className="text-sm font-semibold text-foreground">{mealData.salad}</span>
                                </div>
                              )}
                              
                              {mealData.dessert && (
                                <div className="flex items-center gap-2 bg-pink-50 dark:bg-pink-950/20 rounded-lg px-3 py-1.5">
                                  <span className="text-sm font-medium text-muted-foreground">🍰 Shirinlik:</span>
                                  <span className="text-sm font-semibold text-foreground">{mealData.dessert}</span>
                                </div>
                              )}
                              
                              {mealData.drink && (
                                <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-950/20 rounded-lg px-3 py-1.5">
                                  <span className="text-sm font-medium text-muted-foreground">🥤 Ichimlik:</span>
                                  <span className="text-sm font-semibold text-foreground">{mealData.drink}</span>
                                </div>
                              )}
                            </div>

                            {/* Description */}
                            {mealData.description && (
                              <div className="pt-2">
                                <p className="text-sm text-muted-foreground italic leading-relaxed">
                                  💬 {mealData.description}
                                </p>
                              </div>
                            )}
                          </div>

                          {/* Right side - Image */}
                          {mealData.image && (
                            <div className="md:w-64 lg:w-80 shrink-0">
                              <div className="relative h-48 md:h-full min-h-[200px] rounded-xl overflow-hidden shadow-xl group-hover:shadow-2xl transition-shadow duration-300">
                                <Image
                                  src={mealData.image}
                                  alt={mealData.mainDish}
                                  fill
                                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {meals.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 md:py-16">
            <UtensilsCrossed className="h-12 w-12 md:h-16 md:w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg md:text-xl font-semibold mb-2">Ovqatlar menyusi mavjud emas</h3>
            <p className="text-sm md:text-base text-muted-foreground text-center max-w-md">
              Hozircha haftalik ovqatlar menyusi kiritilmagan. Tez orada ma'lumotlar qo'shiladi.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
