import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, UtensilsCrossed } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export const revalidate = 0
export const dynamic = 'force-dynamic'

const dayNamesShort = ['Yak', 'Dush', 'Sesh', 'Chor', 'Pay', 'Juma', 'Shan']
const dayNamesFull = ['Yakshanba', 'Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba']
const monthNames = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr']

const mealTypeIcons = {
  BREAKFAST: '🌅',
  LUNCH: '🍽️',
  DINNER: '🌙'
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
    <div className="h-full bg-gradient-to-br from-gray-50 via-white to-gray-50 p-4 md:p-6">
      <div className="max-w-[1600px] mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between bg-white rounded-2xl p-4 md:p-6 shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg">
              <UtensilsCrossed className="h-6 w-6 md:h-7 md:w-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                Ovqatlar Menyusi
              </h1>
              <p className="text-sm text-gray-500">Haftalik ovqatlanish jadvali</p>
            </div>
          </div>
        </div>

        {/* Calendar Card */}
        <Card className="shadow-lg border-0 overflow-hidden">
          {/* Calendar Header */}
          <div className="bg-gradient-to-r from-green-50 via-emerald-50 to-teal-50 border-b p-4 md:p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl md:text-2xl font-bold text-gray-800">
                {monthNames[currentMonth]} {currentYear}
              </h2>
              <div className="flex items-center gap-2">
                <form method="get" className="contents">
                  <input type="hidden" name="month" value={prevMonth} />
                  <input type="hidden" name="year" value={prevYear} />
                  <Button type="submit" variant="ghost" size="sm" className="hover:bg-white/50">
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                </form>
                <form method="get" className="contents">
                  <Button type="submit" variant="ghost" size="sm" className="hover:bg-white/50">
                    Bugun
                  </Button>
                </form>
                <form method="get" className="contents">
                  <input type="hidden" name="month" value={nextMonth} />
                  <input type="hidden" name="year" value={nextYear} />
                  <Button type="submit" variant="ghost" size="sm" className="hover:bg-white/50">
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                </form>
              </div>
            </div>
          </div>

          <CardContent className="p-0">
            {/* Week Days Header */}
            <div className="grid grid-cols-7 bg-gray-50 border-b">
              {dayNamesShort.map((day, i) => (
                <div key={day} className={`py-3 text-center text-sm font-semibold ${i === 0 || i === 6 ? 'text-red-600' : 'text-gray-600'}`}>
                  <span className="hidden md:inline">{dayNamesFull[i]}</span>
                  <span className="md:hidden">{day}</span>
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7">
              {/* Previous month days */}
              {prevMonthDays.map((day, index) => (
                <div key={`prev-${day}`} className="min-h-[80px] md:min-h-[120px] border-b border-r bg-gray-50/50 p-1 md:p-2">
                  <span className="text-xs md:text-sm text-gray-400">{day}</span>
                </div>
              ))}

              {/* Current month days */}
              {currentMonthDays.map((day, index) => {
                const date = new Date(currentYear, currentMonth, day)
                const dayOfWeek = date.getDay()
                const dayMeals = mealsByDay[dayOfWeek] || []
                const isToday = day === todayDate && currentMonth === todayMonth && currentYear === todayYear
                const isWeekend = dayOfWeek === 0 || dayOfWeek === 6

                return (
                  <div
                    key={`current-${day}`}
                    className={`min-h-[80px] md:min-h-[120px] border-b border-r p-1 md:p-2 transition-colors hover:bg-gray-50 ${
                      isToday ? 'bg-blue-50 ring-2 ring-blue-500 ring-inset' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-xs md:text-sm font-semibold ${
                        isToday ? 'bg-blue-500 text-white px-2 py-0.5 rounded-full' : isWeekend ? 'text-red-600' : 'text-gray-700'
                      }`}>
                        {day}
                      </span>
                    </div>

                    <div className="space-y-1 overflow-y-auto max-h-[60px] md:max-h-[90px]">
                      {dayMeals.map((meal) => (
                        <div
                          key={meal.id}
                          className={`text-[10px] md:text-xs p-1 md:p-1.5 rounded ${
                            meal.mealType === 'BREAKFAST' ? 'bg-orange-100 text-orange-700 border border-orange-200' :
                            meal.mealType === 'LUNCH' ? 'bg-blue-100 text-blue-700 border border-blue-200' :
                            'bg-purple-100 text-purple-700 border border-purple-200'
                          } truncate hover:shadow-sm transition-shadow cursor-pointer`}
                          title={`${mealTypeIcons[meal.mealType as keyof typeof mealTypeIcons]} ${meal.mainDish}`}
                        >
                          <span className="hidden md:inline">{mealTypeIcons[meal.mealType as keyof typeof mealTypeIcons]} </span>
                          {meal.mainDish}
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}

              {/* Next month days */}
              {nextMonthDays.map((day) => (
                <div key={`next-${day}`} className="min-h-[80px] md:min-h-[120px] border-b border-r bg-gray-50/50 p-1 md:p-2">
                  <span className="text-xs md:text-sm text-gray-400">{day}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Legend */}
        <Card className="shadow-sm border">
          <CardContent className="py-4">
            <div className="flex flex-wrap gap-3 md:gap-4 justify-center items-center">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 md:w-4 md:h-4 rounded bg-orange-100 border border-orange-200"></div>
                <span className="text-xs md:text-sm">🌅 Nonushta</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 md:w-4 md:h-4 rounded bg-blue-100 border border-blue-200"></div>
                <span className="text-xs md:text-sm">🍽️ Tushlik</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 md:w-4 md:h-4 rounded bg-purple-100 border border-purple-200"></div>
                <span className="text-xs md:text-sm">🌙 Kechki ovqat</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
