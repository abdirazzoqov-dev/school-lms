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
              <CardContent className="p-4 md:p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                  {MEALS.map((meal) => {
                    const mealData = getMealForDayAndNumber(day.value, meal.number)
                    
                    if (!mealData) {
                      return null
                    }

                    return (
                      <Card 
                        key={meal.number} 
                        className="group overflow-hidden hover:shadow-xl hover:scale-[1.02] transition-all duration-300 border-2 border-transparent hover:border-primary/20"
                      >
                        {/* Image on top */}
                        {mealData.image && (
                          <div className="relative h-40 w-full overflow-hidden">
                            <Image
                              src={mealData.image}
                              alt={mealData.mainDish}
                              fill
                              className="object-cover group-hover:scale-110 transition-transform duration-500"
                            />
                            {/* Gradient overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                            
                            {/* Meal badge on image */}
                            <div className="absolute top-2 left-2">
                              <div className="backdrop-blur-md bg-white/20 rounded-full px-3 py-1 border border-white/30">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-xl">{meal.icon}</span>
                                  <Badge variant="secondary" className="text-xs bg-white/90 text-foreground">
                                    {meal.label}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                            
                            {/* Time badge on image */}
                            <div className="absolute top-2 right-2">
                              <div className="backdrop-blur-md bg-green-500/90 rounded-full px-2 py-1 border border-white/30">
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3 w-3 text-white" />
                                  <span className="text-white font-semibold text-xs">{mealData.mealTime}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {/* Header for meals without image */}
                        {!mealData.image && (
                          <CardHeader className="p-3 pb-2 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent">
                            <div className="flex items-center gap-2">
                              <span className="text-2xl">{meal.icon}</span>
                              <div className="flex-1">
                                <Badge variant="secondary" className="text-xs">
                                  {meal.label}
                                </Badge>
                                <div className="flex items-center gap-1 text-muted-foreground mt-1">
                                  <Clock className="h-3 w-3" />
                                  <span className="text-xs font-medium">{mealData.mealTime}</span>
                                </div>
                              </div>
                            </div>
                          </CardHeader>
                        )}
                        
                        <CardContent className="p-3 space-y-2">
                          {/* Main dish title */}
                          <h3 className="text-base font-bold text-foreground group-hover:text-primary transition-colors line-clamp-2">
                            {mealData.mainDish}
                          </h3>

                          {/* Meal details */}
                          <div className="space-y-1.5">
                            {mealData.sideDish && (
                              <div className="flex items-center gap-1.5 bg-orange-50 dark:bg-orange-950/20 rounded-md px-2 py-1">
                                <span className="text-xs text-muted-foreground">Garnitir:</span>
                                <span className="text-xs font-semibold text-foreground truncate">{mealData.sideDish}</span>
                              </div>
                            )}
                            
                            {mealData.salad && (
                              <div className="flex items-center gap-1.5 bg-green-50 dark:bg-green-950/20 rounded-md px-2 py-1">
                                <span className="text-xs text-muted-foreground">🥗</span>
                                <span className="text-xs font-semibold text-foreground truncate">{mealData.salad}</span>
                              </div>
                            )}
                            
                            {mealData.dessert && (
                              <div className="flex items-center gap-1.5 bg-pink-50 dark:bg-pink-950/20 rounded-md px-2 py-1">
                                <span className="text-xs text-muted-foreground">🍰</span>
                                <span className="text-xs font-semibold text-foreground truncate">{mealData.dessert}</span>
                              </div>
                            )}
                            
                            {mealData.drink && (
                              <div className="flex items-center gap-1.5 bg-blue-50 dark:bg-blue-950/20 rounded-md px-2 py-1">
                                <span className="text-xs text-muted-foreground">🥤</span>
                                <span className="text-xs font-semibold text-foreground truncate">{mealData.drink}</span>
                              </div>
                            )}
                          </div>

                          {/* Description */}
                          {mealData.description && (
                            <div className="pt-2 border-t border-dashed">
                              <p className="text-xs text-muted-foreground italic leading-relaxed line-clamp-2">
                                💬 {mealData.description}
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
