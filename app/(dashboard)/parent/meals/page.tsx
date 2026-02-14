import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Clock, UtensilsCrossed } from 'lucide-react'
import Image from 'next/image'
import { cn } from '@/lib/utils'

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
                      <Card key={meal.number} className="overflow-hidden hover:shadow-xl hover:scale-[1.02] transition-all duration-300 group border-2 border-transparent hover:border-primary/20">
                        {/* Restaurant Style Image */}
                        {mealData.image && (
                          <div className="relative h-52 w-full overflow-hidden">
                            <Image
                              src={mealData.image}
                              alt={mealData.mainDish}
                              fill
                              className="object-cover group-hover:scale-110 transition-transform duration-500"
                            />
                            {/* Gradient overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                            
                            {/* Floating badge */}
                            <div className="absolute top-3 left-3">
                              <div className="backdrop-blur-lg bg-white/25 rounded-full px-4 py-2 border border-white/40 shadow-xl">
                                <div className="flex items-center gap-2">
                                  <span className="text-2xl">{meal.icon}</span>
                                  <span className="text-white font-bold text-sm">{meal.label}</span>
                                </div>
                              </div>
                            </div>
                            
                            {/* Time badge */}
                            <div className="absolute bottom-3 right-3">
                              <div className="backdrop-blur-lg bg-green-500/90 rounded-full px-3 py-1.5 border border-white/30 shadow-lg">
                                <div className="flex items-center gap-1.5">
                                  <Clock className="h-3.5 w-3.5 text-white" />
                                  <span className="text-white font-semibold text-xs">{mealData.mealTime}</span>
                                </div>
                              </div>
                            </div>
                            
                            {/* Main dish title on image */}
                            <div className="absolute bottom-3 left-3 right-3">
                              <div className="backdrop-blur-md bg-black/40 rounded-lg px-4 py-2 border border-white/20">
                                <h3 className="text-white font-bold text-lg line-clamp-2">{mealData.mainDish}</h3>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {/* Header for meals without image */}
                        {!mealData.image && (
                          <CardHeader className="p-4 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent">
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
                        )}
                        
                        <CardContent className={cn(
                          "space-y-3",
                          mealData.image ? "p-4 pt-5" : "p-4"
                        )}>
                          <div className="space-y-2.5">
                            {/* Main dish - only show if no image */}
                            {!mealData.image && (
                              <div className="flex items-start gap-2">
                                <Badge variant="default" className="shrink-0 text-xs shadow-sm">
                                  Asosiy
                                </Badge>
                                <p className="text-sm md:text-base font-semibold">
                                  {mealData.mainDish}
                                </p>
                              </div>
                            )}

                            {mealData.sideDish && (
                              <div className="flex items-start gap-2">
                                <Badge variant="secondary" className="shrink-0 text-xs shadow-sm">
                                  Garnitir
                                </Badge>
                                <p className="text-sm md:text-base font-medium">
                                  {mealData.sideDish}
                                </p>
                              </div>
                            )}

                            {mealData.salad && (
                              <div className="flex items-start gap-2">
                                <Badge className="shrink-0 text-xs bg-green-100 text-green-800 hover:bg-green-100 shadow-sm">
                                  🥗 Salat
                                </Badge>
                                <p className="text-sm md:text-base">
                                  {mealData.salad}
                                </p>
                              </div>
                            )}

                            {mealData.dessert && (
                              <div className="flex items-start gap-2">
                                <Badge className="shrink-0 text-xs bg-pink-100 text-pink-800 hover:bg-pink-100 shadow-sm">
                                  🍰 Shirinlik
                                </Badge>
                                <p className="text-sm md:text-base">
                                  {mealData.dessert}
                                </p>
                              </div>
                            )}

                            {mealData.drink && (
                              <div className="flex items-start gap-2">
                                <Badge className="shrink-0 text-xs bg-blue-100 text-blue-800 hover:bg-blue-100 shadow-sm">
                                  🥤 Ichimlik
                                </Badge>
                                <p className="text-sm md:text-base">
                                  {mealData.drink}
                                </p>
                              </div>
                            )}
                          </div>

                          {mealData.description && (
                            <div className="pt-3 mt-3 border-t border-dashed">
                              <p className="text-xs md:text-sm text-muted-foreground italic leading-relaxed">
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
