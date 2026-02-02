import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, UtensilsCrossed, Coffee, Sun, Soup, Moon, Star, Clock, ChefHat } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export const revalidate = 0
export const dynamic = 'force-dynamic'

const dayNamesShort = ['Yak', 'Dush', 'Sesh', 'Chor', 'Pay', 'Juma', 'Shan']
const dayNamesFull = ['Yakshanba', 'Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba']
const monthNames = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr']

const mealTypeConfig = {
  BREAKFAST: {
    icon: Coffee,
    emoji: '☕',
    label: 'Nonushta',
    time: '08:00 - 09:00',
    gradient: 'from-amber-500 to-orange-500',
    bg: 'from-amber-50 to-orange-50',
    border: 'border-amber-200',
    text: 'text-amber-900'
  },
  LUNCH: {
    icon: Soup,
    emoji: '🍽️',
    label: 'Tushlik',
    time: '12:00 - 13:00',
    gradient: 'from-blue-500 to-cyan-500',
    bg: 'from-blue-50 to-cyan-50',
    border: 'border-blue-200',
    text: 'text-blue-900'
  },
  DINNER: {
    icon: Moon,
    emoji: '🌙',
    label: 'Kechki ovqat',
    time: '18:00 - 19:00',
    gradient: 'from-purple-500 to-pink-500',
    bg: 'from-purple-50 to-pink-50',
    border: 'border-purple-200',
    text: 'text-purple-900'
  }
}

export default async function ParentMealsPage({
  searchParams
}: {
  searchParams: { month?: string; year?: string }
}) {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'PARENT') {
    redirect('/unauthorized')
  }

  const tenantId = session.user.tenantId!

  // Get current date or from params
  const today = new Date()
  const currentMonth = searchParams.month ? parseInt(searchParams.month) : today.getMonth()
  const currentYear = searchParams.year ? parseInt(searchParams.year) : today.getFullYear()

  // Get meals for current week/month
  const meals = await db.meal.findMany({
    where: {
      tenantId,
      isActive: true,
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

  // Calendar calculations
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1)
  const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0)
  const startingDayOfWeek = firstDayOfMonth.getDay()
  const daysInMonth = lastDayOfMonth.getDate()

  // Previous month days to fill
  const prevMonthLastDay = new Date(currentYear, currentMonth, 0).getDate()
  const prevMonthDays = Array.from({ length: startingDayOfWeek }, (_, i) => prevMonthLastDay - startingDayOfWeek + i + 1)

  // Current month days
  const currentMonthDays = Array.from({ length: daysInMonth }, (_, i) => i + 1)

  // Next month days to fill (to make 6 rows)
  const totalCells = 42 // 6 rows × 7 days
  const remainingCells = totalCells - prevMonthDays.length - currentMonthDays.length
  const nextMonthDays = Array.from({ length: remainingCells }, (_, i) => i + 1)

  const todayDate = today.getDate()
  const todayMonth = today.getMonth()
  const todayYear = today.getFullYear()

  const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1
  const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear
  const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1
  const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 p-3 md:p-6">
      <div className="max-w-7xl mx-auto space-y-4 md:space-y-6">
        {/* Hero Header */}
        <div className="relative overflow-hidden bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 rounded-3xl shadow-2xl">
          <div className="absolute inset-0 bg-black/5"></div>
          <div className="relative p-6 md:p-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-white/20 backdrop-blur-sm rounded-2xl shadow-lg">
                  <ChefHat className="h-8 w-8 md:h-10 md:w-10 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold text-white mb-1">
                    Haftalik Menyu 🍽️
                  </h1>
                  <p className="text-sm md:text-base text-white/90 flex items-center gap-2">
                    <Star className="h-4 w-4" />
                    Maktab ovqatlanish jadvali
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-white/20 backdrop-blur-sm text-white border-white/30 text-sm px-3 py-1">
                  <Clock className="h-3 w-3 mr-1" />
                  {monthNames[currentMonth]} {currentYear}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Weekly Menu Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
          {dayNamesFull.map((dayName, dayIndex) => {
            const dayMeals = mealsByDay[dayIndex] || []
            const isWeekend = dayIndex === 0 || dayIndex === 6
            const isToday = new Date().getDay() === dayIndex

            return (
              <Card 
                key={dayIndex} 
                className={`group overflow-hidden transition-all duration-300 hover:shadow-2xl ${
                  isToday 
                    ? 'ring-4 ring-green-400 shadow-xl scale-105' 
                    : 'hover:scale-105'
                } ${isWeekend ? 'bg-gradient-to-br from-red-50 to-pink-50' : 'bg-white'}`}
              >
                <CardHeader className={`pb-3 ${
                  isToday 
                    ? 'bg-gradient-to-r from-green-500 to-emerald-500' 
                    : isWeekend 
                      ? 'bg-gradient-to-r from-red-400 to-pink-400' 
                      : 'bg-gradient-to-r from-blue-500 to-cyan-500'
                }`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-white text-lg md:text-xl font-bold">
                        {dayName}
                      </CardTitle>
                      {isToday && (
                        <Badge className="mt-1 bg-white/20 text-white border-white/30 text-xs">
                          <Sun className="h-3 w-3 mr-1" />
                          Bugun
                        </Badge>
                      )}
                    </div>
                    <div className="p-2 bg-white/20 rounded-full">
                      <UtensilsCrossed className="h-5 w-5 text-white" />
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-4 space-y-3">
                  {dayMeals.length > 0 ? (
                    dayMeals.map((meal) => {
                      const config = mealTypeConfig[meal.mealType as keyof typeof mealTypeConfig]
                      const MealIcon = config.icon

                      return (
                        <div
                          key={meal.id}
                          className={`relative overflow-hidden rounded-xl border-2 ${config.border} bg-gradient-to-br ${config.bg} p-4 transition-all hover:shadow-lg hover:-translate-y-1 cursor-pointer group/meal`}
                        >
                          {/* Meal Type Badge */}
                          <div className="flex items-center justify-between mb-3">
                            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r ${config.gradient} shadow-md`}>
                              <MealIcon className="h-4 w-4 text-white" />
                              <span className="text-xs font-bold text-white">{config.label}</span>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              <Clock className="h-3 w-3 mr-1" />
                              {config.time}
                            </Badge>
                          </div>

                          {/* Main Dish */}
                          <div className="space-y-2">
                            <div>
                              <p className="text-xs text-gray-500 font-medium mb-1">Asosiy taom</p>
                              <h4 className={`text-base font-bold ${config.text} flex items-center gap-2`}>
                                <span className="text-xl">{config.emoji}</span>
                                {meal.mainDish}
                              </h4>
                            </div>

                            {/* Side Dish & Salad */}
                            {(meal.sideDish || meal.salad) && (
                              <div>
                                <p className="text-xs text-gray-500 font-medium mb-1">Qo'shimcha</p>
                                <div className="space-y-1">
                                  {meal.sideDish && (
                                    <p className="text-sm text-gray-700">🥘 {meal.sideDish}</p>
                                  )}
                                  {meal.salad && (
                                    <p className="text-sm text-gray-700">🥗 {meal.salad}</p>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Drink */}
                            {meal.drink && (
                              <div className="flex items-center gap-2 pt-2 border-t border-gray-200">
                                <div className="p-1 bg-blue-100 rounded">
                                  <Coffee className="h-3 w-3 text-blue-600" />
                                </div>
                                <span className="text-xs text-gray-600">{meal.drink}</span>
                              </div>
                            )}

                            {/* Dessert */}
                            {meal.dessert && (
                              <div className="flex items-center gap-2 pt-1">
                                <div className="p-1 bg-pink-100 rounded">
                                  <Star className="h-3 w-3 text-pink-600" />
                                </div>
                                <span className="text-xs text-gray-600">{meal.dessert}</span>
                              </div>
                            )}
                          </div>

                          {/* Hover Effect Overlay */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent opacity-0 group-hover/meal:opacity-100 transition-opacity pointer-events-none" />
                        </div>
                      )
                    })
                  ) : (
                    <div className="text-center py-8 text-gray-400">
                      <UtensilsCrossed className="h-12 w-12 mx-auto mb-2 opacity-20" />
                      <p className="text-sm">Menyu mavjud emas</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Info Footer */}
        <Card className="bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200">
          <CardContent className="py-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-500 rounded-lg">
                  <ChefHat className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-blue-900 mb-1">Professional Menyu Xizmati</h3>
                  <p className="text-sm text-blue-700">
                    Barcha ovqatlar sog'lom va muvozanatli tarzda tayyorlanadi
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge className="bg-amber-500 text-white">
                  ☕ Nonushta
                </Badge>
                <Badge className="bg-blue-500 text-white">
                  🍽️ Tushlik
                </Badge>
                <Badge className="bg-purple-500 text-white">
                  🌙 Kechki ovqat
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
