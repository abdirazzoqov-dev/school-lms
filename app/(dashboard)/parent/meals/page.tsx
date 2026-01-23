import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { UtensilsCrossed, Calendar } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export const revalidate = 0
export const dynamic = 'force-dynamic'

const dayNames = ['Yakshanba', 'Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba']
const mealTypeNames = {
  BREAKFAST: '🌅 Nonushta',
  LUNCH: '🍽️ Tushlik',
  DINNER: '🌙 Kechki ovqat'
}

export default async function ParentMealsPage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'PARENT') {
    redirect('/unauthorized')
  }

  const tenantId = session.user.tenantId!

  // Get current week's meals
  const today = new Date()
  const meals = await db.meal.findMany({
    where: {
      tenantId,
      isActive: true,
      effectiveFrom: { lte: today },
      OR: [
        { effectiveTo: null },
        { effectiveTo: { gte: today } }
      ]
    },
    orderBy: [
      { dayOfWeek: 'asc' },
      { mealType: 'asc' },
    ],
  })

  // Group meals by day
  const mealsByDay: Record<number, typeof meals> = {}
  meals.forEach(meal => {
    if (!mealsByDay[meal.dayOfWeek]) {
      mealsByDay[meal.dayOfWeek] = []
    }
    mealsByDay[meal.dayOfWeek].push(meal)
  })

  // Get week days (Monday to Sunday)
  const weekDays = [1, 2, 3, 4, 5, 6, 0]

  return (
    <div className="space-y-6 p-6">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-600 via-emerald-600 to-teal-600 p-8 text-white shadow-2xl">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
              <UtensilsCrossed className="h-8 w-8" />
            </div>
            <h1 className="text-4xl font-bold">Ovqatlar Menyusi</h1>
          </div>
          <p className="text-green-50 text-lg">
            Haftalik ovqatlar jadvali
          </p>
        </div>
        <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10 blur-2xl"></div>
        <div className="absolute -left-8 -bottom-8 h-40 w-40 rounded-full bg-white/10 blur-2xl"></div>
      </div>

      <div className="grid gap-6">
        {weekDays.map((dayIndex) => {
          const dayMeals = mealsByDay[dayIndex] || []
          const isToday = new Date().getDay() === dayIndex

          return (
            <Card key={dayIndex} className={`border-2 ${isToday ? 'border-green-500 shadow-lg' : ''}`}>
              <CardHeader className={`${isToday ? 'bg-gradient-to-r from-green-50 to-emerald-50' : 'bg-gradient-to-r from-blue-50 to-indigo-50'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Calendar className={`h-6 w-6 ${isToday ? 'text-green-600' : 'text-blue-600'}`} />
                    <CardTitle className="text-xl">{dayNames[dayIndex]}</CardTitle>
                    {isToday && (
                      <Badge className="bg-green-600">Bugun</Badge>
                    )}
                  </div>
                  {dayMeals.length > 0 && (
                    <Badge variant="outline">{dayMeals.length} ta ovqat</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                {dayMeals.length > 0 ? (
                  <div className="space-y-4">
                    {dayMeals.map((meal) => (
                      <div
                        key={meal.id}
                        className="p-4 rounded-lg border bg-gradient-to-br from-muted/50 to-muted/30"
                      >
                        <div className="flex items-center gap-2 mb-3">
                          <Badge className="bg-purple-600 text-sm">
                            {mealTypeNames[meal.mealType as keyof typeof mealTypeNames] || meal.mealType}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="bg-white p-3 rounded-md border">
                            <p className="text-xs text-muted-foreground mb-1">🍛 Asosiy taom</p>
                            <p className="font-semibold text-lg">{meal.mainDish}</p>
                          </div>

                          {meal.sideDish && (
                            <div className="bg-white p-3 rounded-md border">
                              <p className="text-xs text-muted-foreground mb-1">🍚 Garnitir</p>
                              <p className="font-semibold text-lg">{meal.sideDish}</p>
                            </div>
                          )}

                          {meal.salad && (
                            <div className="bg-white p-3 rounded-md border">
                              <p className="text-xs text-muted-foreground mb-1">🥗 Salat</p>
                              <p className="font-semibold text-lg">{meal.salad}</p>
                            </div>
                          )}

                          {meal.dessert && (
                            <div className="bg-white p-3 rounded-md border">
                              <p className="text-xs text-muted-foreground mb-1">🍰 Shirinlik</p>
                              <p className="font-semibold text-lg">{meal.dessert}</p>
                            </div>
                          )}

                          {meal.drink && (
                            <div className="bg-white p-3 rounded-md border">
                              <p className="text-xs text-muted-foreground mb-1">🥤 Ichimlik</p>
                              <p className="font-semibold text-lg">{meal.drink}</p>
                            </div>
                          )}
                        </div>

                        {meal.description && (
                          <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded text-sm">
                            <p className="text-blue-700">ℹ️ {meal.description}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <UtensilsCrossed className="mx-auto h-12 w-12 text-muted-foreground opacity-50 mb-4" />
                    <p className="text-lg font-semibold text-muted-foreground mb-2">
                      Ovqat menyusi mavjud emas
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Bu kun uchun ovqat menyusi hali belgilanmagan
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

