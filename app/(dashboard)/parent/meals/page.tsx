import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Clock, UtensilsCrossed } from 'lucide-react'

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

      <div className="grid gap-4 md:gap-6">
        {DAYS.map((day) => {
          const dayMeals = meals.filter(m => m.dayOfWeek === day.value)
          
          if (dayMeals.length === 0) {
            return null
          }

          return (
            <Card key={day.value} className="overflow-hidden">
              <CardHeader className={`${day.color} text-white p-4 md:p-6`}>
                <CardTitle className="text-xl md:text-2xl font-bold flex items-center gap-2">
                  <UtensilsCrossed className="h-5 w-5 md:h-6 md:w-6" />
                  {day.label}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 md:p-6">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                  {MEALS.map((meal) => {
                    const mealData = getMealForDayAndNumber(day.value, meal.number)
                    
                    if (!mealData) {
                      return null
                    }

                    return (
                      <Card key={meal.number} className="overflow-hidden hover:shadow-lg transition-shadow">
                        <CardHeader className="p-4 bg-gradient-to-br from-muted/50 to-muted/30">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-2xl">{meal.icon}</span>
                              <CardTitle className="text-base md:text-lg">
                                {meal.label}
                              </CardTitle>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs md:text-sm text-muted-foreground mt-2">
                            <Clock className="h-3.5 w-3.5 md:h-4 md:w-4" />
                            <span className="font-medium">{mealData.mealTime}</span>
                          </div>
                        </CardHeader>
                        <CardContent className="p-4 space-y-3">
                          <div className="space-y-2">
                            <div className="flex items-start gap-2">
                              <Badge variant="default" className="shrink-0 text-xs">
                                Asosiy
                              </Badge>
                              <p className="text-sm md:text-base font-medium">
                                {mealData.mainDish}
                              </p>
                            </div>

                            {mealData.sideDish && (
                              <div className="flex items-start gap-2">
                                <Badge variant="secondary" className="shrink-0 text-xs">
                                  Garnitir
                                </Badge>
                                <p className="text-sm md:text-base">
                                  {mealData.sideDish}
                                </p>
                              </div>
                            )}

                            {mealData.salad && (
                              <div className="flex items-start gap-2">
                                <Badge variant="outline" className="shrink-0 text-xs">
                                  Salat
                                </Badge>
                                <p className="text-sm md:text-base">
                                  {mealData.salad}
                                </p>
                              </div>
                            )}

                            {mealData.dessert && (
                              <div className="flex items-start gap-2">
                                <Badge variant="outline" className="shrink-0 text-xs">
                                  Shirinlik
                                </Badge>
                                <p className="text-sm md:text-base">
                                  {mealData.dessert}
                                </p>
                              </div>
                            )}

                            {mealData.drink && (
                              <div className="flex items-start gap-2">
                                <Badge variant="outline" className="shrink-0 text-xs">
                                  Ichimlik
                                </Badge>
                                <p className="text-sm md:text-base">
                                  {mealData.drink}
                                </p>
                              </div>
                            )}
                          </div>

                          {mealData.description && (
                            <div className="pt-2 border-t">
                              <p className="text-xs md:text-sm text-muted-foreground italic">
                                {mealData.description}
                              </p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
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
