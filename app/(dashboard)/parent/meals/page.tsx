import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { UtensilsCrossed } from 'lucide-react'
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

  // Group meals by day and type
  const mealsByDay: Record<number, Record<string, typeof meals[0]>> = {}
  meals.forEach(meal => {
    if (!mealsByDay[meal.dayOfWeek]) {
      mealsByDay[meal.dayOfWeek] = {}
    }
    mealsByDay[meal.dayOfWeek][meal.mealType] = meal
  })

  // Get week days (Monday to Sunday)
  const weekDays = [1, 2, 3, 4, 5, 6, 0]
  const currentDay = new Date().getDay()

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
            Haftalik ovqatlar kalendari
          </p>
        </div>
        <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10 blur-2xl"></div>
        <div className="absolute -left-8 -bottom-8 h-40 w-40 rounded-full bg-white/10 blur-2xl"></div>
      </div>

      {/* Calendar View */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-7 gap-4">
        {weekDays.map((dayIndex) => {
          const dayMeals = mealsByDay[dayIndex] || {}
          const isToday = currentDay === dayIndex

          return (
            <Card 
              key={dayIndex} 
              className={`${isToday ? 'ring-2 ring-green-500 shadow-xl scale-105' : 'hover:shadow-lg'} transition-all duration-200`}
            >
              <CardHeader className={`pb-3 ${isToday ? 'bg-gradient-to-br from-green-50 to-emerald-50' : 'bg-gradient-to-br from-gray-50 to-slate-50'}`}>
                <CardTitle className="text-base font-bold flex items-center justify-between">
                  <span className={isToday ? 'text-green-700' : ''}>{dayNames[dayIndex]}</span>
                  {isToday && (
                    <Badge className="bg-green-600 text-xs">Bugun</Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-4">
                {/* Breakfast */}
                {dayMeals.BREAKFAST ? (
                  <div className="p-3 rounded-lg bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200">
                    <div className="flex items-center gap-1 mb-2">
                      <span className="text-lg">🌅</span>
                      <p className="text-xs font-semibold text-orange-700">Nonushta</p>
                    </div>
                    <p className="text-sm font-bold text-gray-800 mb-1">{dayMeals.BREAKFAST.mainDish}</p>
                    {dayMeals.BREAKFAST.drink && (
                      <p className="text-xs text-gray-600">+ {dayMeals.BREAKFAST.drink}</p>
                    )}
                  </div>
                ) : (
                  <div className="p-3 rounded-lg bg-gray-50 border border-gray-200">
                    <p className="text-xs text-gray-400 text-center">🌅 -</p>
                  </div>
                )}

                {/* Lunch */}
                {dayMeals.LUNCH ? (
                  <div className="p-3 rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200">
                    <div className="flex items-center gap-1 mb-2">
                      <span className="text-lg">🍽️</span>
                      <p className="text-xs font-semibold text-blue-700">Tushlik</p>
                    </div>
                    <p className="text-sm font-bold text-gray-800 mb-1">{dayMeals.LUNCH.mainDish}</p>
                    {dayMeals.LUNCH.sideDish && (
                      <p className="text-xs text-gray-600">+ {dayMeals.LUNCH.sideDish}</p>
                    )}
                    {dayMeals.LUNCH.salad && (
                      <p className="text-xs text-gray-600">+ {dayMeals.LUNCH.salad}</p>
                    )}
                  </div>
                ) : (
                  <div className="p-3 rounded-lg bg-gray-50 border border-gray-200">
                    <p className="text-xs text-gray-400 text-center">🍽️ -</p>
                  </div>
                )}

                {/* Dinner */}
                {dayMeals.DINNER ? (
                  <div className="p-3 rounded-lg bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200">
                    <div className="flex items-center gap-1 mb-2">
                      <span className="text-lg">🌙</span>
                      <p className="text-xs font-semibold text-purple-700">Kechki ovqat</p>
                    </div>
                    <p className="text-sm font-bold text-gray-800 mb-1">{dayMeals.DINNER.mainDish}</p>
                    {dayMeals.DINNER.drink && (
                      <p className="text-xs text-gray-600">+ {dayMeals.DINNER.drink}</p>
                    )}
                  </div>
                ) : (
                  <div className="p-3 rounded-lg bg-gray-50 border border-gray-200">
                    <p className="text-xs text-gray-400 text-center">🌙 -</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Legend */}
      <Card className="border-2 border-green-200">
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4 justify-center items-center">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200"></div>
              <span className="text-sm">🌅 Nonushta</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200"></div>
              <span className="text-sm">🍽️ Tushlik</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200"></div>
              <span className="text-sm">🌙 Kechki ovqat</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
