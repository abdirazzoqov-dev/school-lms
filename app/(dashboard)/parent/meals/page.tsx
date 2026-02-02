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

// Color schemes for different meals (5 meals)
const colorSchemes = [
  {
    emoji: '☕',
    gradient: 'from-amber-500 to-orange-500',
    gradientLight: 'from-amber-400 to-orange-400',
    bg: 'from-amber-50 via-orange-50 to-yellow-50',
    border: 'border-amber-300',
    text: 'text-amber-900',
  },
  {
    emoji: '🍽️',
    gradient: 'from-blue-500 to-cyan-500',
    gradientLight: 'from-blue-400 to-cyan-400',
    bg: 'from-blue-50 via-cyan-50 to-sky-50',
    border: 'border-blue-300',
    text: 'text-blue-900',
  },
  {
    emoji: '🌙',
    gradient: 'from-purple-500 to-pink-500',
    gradientLight: 'from-purple-400 to-pink-400',
    bg: 'from-purple-50 via-pink-50 to-fuchsia-50',
    border: 'border-purple-300',
    text: 'text-purple-900',
  },
  {
    emoji: '🍴',
    gradient: 'from-green-500 to-emerald-500',
    gradientLight: 'from-green-400 to-emerald-400',
    bg: 'from-green-50 via-emerald-50 to-teal-50',
    border: 'border-green-300',
    text: 'text-green-900',
  },
  {
    emoji: '🥘',
    gradient: 'from-red-500 to-rose-500',
    gradientLight: 'from-red-400 to-rose-400',
    bg: 'from-red-50 via-rose-50 to-pink-50',
    border: 'border-red-300',
    text: 'text-red-900',
  },
]

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
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 p-3 sm:p-4 md:p-6 lg:p-8">
      <div className="max-w-[1800px] mx-auto space-y-4 md:space-y-6">
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

        {/* Weekly Menu Cards - Enhanced */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-5 lg:gap-6">
          {dayNamesFull.map((dayName, dayIndex) => {
            const dayMeals = mealsByDay[dayIndex] || []
            const isWeekend = dayIndex === 0 || dayIndex === 6
            const isToday = new Date().getDay() === dayIndex

            return (
              <Card 
                key={dayIndex} 
                className={`group relative overflow-hidden transition-all duration-500 ${
                  isToday 
                    ? 'ring-4 ring-green-500 shadow-2xl scale-[1.02] sm:scale-105 z-10' 
                    : 'hover:scale-[1.02] hover:shadow-2xl hover:z-10'
                } ${isWeekend ? 'bg-gradient-to-br from-red-50 via-pink-50 to-rose-50' : 'bg-white'}`}
              >
                {/* Animated Background Pattern */}
                <div className="absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity">
                  <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMwMDAiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yLjIxLTEuNzktNC00LTRzLTQgMS43OS00IDQgMS43OSA0IDQgNCA0LTEuNzkgNC00em0wLTMwYzAtMi4yMS0xLjc5LTQtNC00cy00IDEuNzktNCA0IDEuNzkgNCA0IDQgNC0xLjc5IDQtNHoiLz48L2c+PC9nPjwvc3ZnPg==')]"></div>
                </div>

                <CardHeader className={`relative pb-4 ${
                  isToday 
                    ? 'bg-gradient-to-br from-green-500 via-emerald-500 to-teal-500' 
                    : isWeekend 
                      ? 'bg-gradient-to-br from-red-500 via-pink-500 to-rose-500' 
                      : 'bg-gradient-to-br from-blue-500 via-cyan-500 to-sky-500'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-white text-base sm:text-lg md:text-xl font-bold mb-1">
                        {dayName}
                      </CardTitle>
                      {isToday && (
                        <Badge className="bg-white/20 backdrop-blur-sm text-white border-white/30 text-xs">
                          <Sun className="h-3 w-3 mr-1" />
                          Bugun
                        </Badge>
                      )}
                      {!isToday && (
                        <p className="text-white/80 text-xs">
                          {dayMeals.length} ta ovqat
                        </p>
                      )}
                    </div>
                    <div className="p-2.5 bg-white/20 backdrop-blur-sm rounded-xl shrink-0">
                      <UtensilsCrossed className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-3 sm:p-4 space-y-2.5 sm:space-y-3">
                  {dayMeals.length > 0 ? (
                    dayMeals.map((meal, mealIndex) => {
                      // Get color scheme based on index
                      const colorScheme = colorSchemes[mealIndex % colorSchemes.length]

                      return (
                        <div
                          key={meal.id}
                          className={`relative overflow-hidden rounded-2xl border-2 ${colorScheme.border} bg-gradient-to-br ${colorScheme.bg} p-3 sm:p-4 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer group/meal animate-in fade-in slide-in-from-bottom-4`}
                        >
                          {/* Decorative Corner */}
                          <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-br ${colorScheme.gradientLight} opacity-10 rounded-bl-full`}></div>

                          {/* Meal Label Header */}
                          <div className="relative flex items-center justify-between mb-3 sm:mb-4">
                            <div className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl bg-gradient-to-r ${colorScheme.gradient} shadow-lg transform transition-transform group-hover/meal:scale-105`}>
                              <UtensilsCrossed className="h-4 w-4 sm:h-5 sm:w-5 text-white shrink-0" />
                              <div className="flex flex-col">
                                <span className="text-xs sm:text-sm font-bold text-white leading-tight">{meal.mealLabel}</span>
                              </div>
                            </div>
                          </div>

                          {/* Time Display - Prominent */}
                          <div className="mb-3 sm:mb-4 p-2 sm:p-3 bg-white/60 backdrop-blur-sm rounded-xl border border-white/40">
                            <div className="flex items-center justify-center gap-2">
                              <Clock className={`h-4 w-4 sm:h-5 sm:w-5 ${colorScheme.text}`} />
                              <span className={`text-base sm:text-lg md:text-xl font-bold ${colorScheme.text}`}>
                                {meal.mealTime}
                              </span>
                            </div>
                          </div>

                          {/* Main Dish - Restaurant Style */}
                          <div className="space-y-3">
                            {/* Main Dish */}
                            <div className="relative">
                              <div className="flex items-start gap-2 mb-1.5">
                                <div className={`p-1.5 bg-gradient-to-br ${colorScheme.gradient} rounded-lg shrink-0`}>
                                  <span className="text-lg sm:text-xl">{colorScheme.emoji}</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-[10px] sm:text-xs text-gray-500 font-semibold uppercase tracking-wide mb-0.5">Asosiy Taom</p>
                                  <h4 className={`text-sm sm:text-base md:text-lg font-bold ${colorScheme.text} leading-tight`}>
                                    {meal.mainDish}
                                  </h4>
                                </div>
                              </div>
                            </div>

                            {/* Side Dishes & Salad - Enhanced Grid */}
                            {(meal.sideDish || meal.salad) && (
                              <div className="grid grid-cols-1 gap-2">
                                {meal.sideDish && (
                                  <div className="flex items-center gap-2 p-2 sm:p-2.5 bg-white/60 rounded-lg border border-gray-200/50">
                                    <span className="text-base sm:text-lg shrink-0">🥘</span>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-[10px] text-gray-500 font-medium">Garnitir</p>
                                      <p className="text-xs sm:text-sm text-gray-800 font-medium truncate">{meal.sideDish}</p>
                                    </div>
                                  </div>
                                )}
                                {meal.salad && (
                                  <div className="flex items-center gap-2 p-2 sm:p-2.5 bg-white/60 rounded-lg border border-gray-200/50">
                                    <span className="text-base sm:text-lg shrink-0">🥗</span>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-[10px] text-gray-500 font-medium">Salat</p>
                                      <p className="text-xs sm:text-sm text-gray-800 font-medium truncate">{meal.salad}</p>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Drink & Dessert - Bottom Row */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 sm:pt-3 border-t border-gray-200/50">
                              {/* Drink */}
                              {meal.drink && (
                                <div className="flex items-center gap-2 p-2 bg-blue-50/50 rounded-lg">
                                  <div className="p-1.5 bg-blue-500 rounded-md">
                                    <Coffee className="h-3 w-3 text-white" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-[10px] text-gray-500 font-medium">Ichimlik</p>
                                    <p className="text-xs font-semibold text-blue-900 truncate">{meal.drink}</p>
                                  </div>
                                </div>
                              )}

                              {/* Dessert */}
                              {meal.dessert && (
                                <div className="flex items-center gap-2 p-2 bg-pink-50/50 rounded-lg">
                                  <div className="p-1.5 bg-pink-500 rounded-md">
                                    <Star className="h-3 w-3 text-white" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-[10px] text-gray-500 font-medium">Shirinlik</p>
                                    <p className="text-xs font-semibold text-pink-900 truncate">{meal.dessert}</p>
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Description if exists */}
                            {meal.description && (
                              <div className="pt-2 sm:pt-3 border-t border-gray-200/50">
                                <p className="text-[10px] sm:text-xs text-gray-600 italic line-clamp-2">
                                  💬 {meal.description}
                                </p>
                              </div>
                            )}
                          </div>

                          {/* Hover Shine Effect */}
                          <div className="absolute inset-0 bg-gradient-to-br from-white/0 via-white/5 to-white/0 opacity-0 group-hover/meal:opacity-100 transition-opacity pointer-events-none" />
                        </div>
                      )
                    })
                  ) : (
                    <div className="text-center py-8 sm:py-12">
                      <div className="p-4 bg-gray-100 rounded-full w-fit mx-auto mb-3">
                        <UtensilsCrossed className="h-8 w-8 sm:h-12 sm:w-12 text-gray-300" />
                      </div>
                      <p className="text-sm text-gray-500 font-medium">Menyu mavjud emas</p>
                      <p className="text-xs text-gray-400 mt-1">Keyinroq qayta tekshiring</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Info Footer - Enhanced */}
        <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200 shadow-lg">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl shadow-lg">
                  <UtensilsCrossed className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-blue-900">Maktabda kuniga 5 mahal ovqatlanish</h3>
                  <p className="text-xs sm:text-sm text-blue-700">
                    Har bir ovqat o'z vaqtida beriladi
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-blue-100 px-4 py-2 rounded-xl">
                <Star className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-bold text-blue-900">5 Ovqat</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Professional Footer Info */}
        <Card className="bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 border-0 shadow-xl">
          <CardContent className="py-4 sm:py-5 md:py-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="p-3 sm:p-4 bg-white/20 backdrop-blur-sm rounded-2xl shadow-lg">
                  <ChefHat className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                </div>
                <div className="text-center md:text-left">
                  <h3 className="text-base sm:text-lg font-bold text-white mb-1">Professional Oshxona Xizmati</h3>
                  <p className="text-xs sm:text-sm text-white/90">
                    Barcha ovqatlar sog'lom, muvozanatli va mazali tayyorlanadi 🌟
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-xl">
                <Star className="h-4 w-4 text-yellow-300" />
                <span className="text-sm font-bold text-white">Premium Quality</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
