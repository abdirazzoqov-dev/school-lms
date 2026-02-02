import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, UtensilsCrossed, Coffee, Soup, Moon, Calendar, Filter, ChefHat } from 'lucide-react'
import Link from 'next/link'
import { MealsTableClient } from './meals-table-client'

export const revalidate = 0
export const dynamic = 'force-dynamic'

const dayNames = ['Yakshanba', 'Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba']
const mealTypeNames = {
  BREAKFAST: 'Nonushta',
  LUNCH: 'Tushlik',
  DINNER: 'Kechki ovqat'
}

const mealTypeConfig = {
  BREAKFAST: {
    icon: Coffee,
    emoji: '☕',
    label: 'Nonushta',
    gradient: 'from-amber-500 to-orange-500',
  },
  LUNCH: {
    icon: Soup,
    emoji: '🍽️',
    label: 'Tushlik',
    gradient: 'from-blue-500 to-cyan-500',
  },
  DINNER: {
    icon: Moon,
    emoji: '🌙',
    label: 'Kechki ovqat',
    gradient: 'from-purple-500 to-pink-500',
  }
}

export default async function AdminMealsPage({
  searchParams
}: {
  searchParams: { day?: string; type?: string }
}) {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'ADMIN') {
    redirect('/unauthorized')
  }

  const tenantId = session.user.tenantId!

  // Build filters
  const where: any = { tenantId }

  if (searchParams.day) {
    where.dayOfWeek = parseInt(searchParams.day)
  }

  if (searchParams.type) {
    where.mealType = searchParams.type
  }

  const meals = await db.meal.findMany({
    where,
    orderBy: [
      { dayOfWeek: 'asc' },
      { mealType: 'asc' },
    ],
  })

  const mealsWithNames = meals.map(meal => ({
    ...meal,
    dayName: dayNames[meal.dayOfWeek] || 'N/A',
    mealTypeName: mealTypeNames[meal.mealType as keyof typeof mealTypeNames] || meal.mealType,
  }))

  // Group meals by day
  const mealsByDay: { [key: number]: typeof mealsWithNames } = {}
  mealsWithNames.forEach(meal => {
    if (!mealsByDay[meal.dayOfWeek]) {
      mealsByDay[meal.dayOfWeek] = []
    }
    mealsByDay[meal.dayOfWeek].push(meal)
  })

  // Calculate statistics
  const totalMeals = mealsWithNames.length
  const activeMeals = mealsWithNames.filter(m => m.isActive).length
  const breakfastCount = mealsWithNames.filter(m => m.mealType === 'BREAKFAST').length
  const lunchCount = mealsWithNames.filter(m => m.mealType === 'LUNCH').length
  const dinnerCount = mealsWithNames.filter(m => m.mealType === 'DINNER').length

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50 to-amber-50 p-3 sm:p-4 md:p-6 lg:p-8">
      <div className="max-w-[1800px] mx-auto space-y-4 md:space-y-6">
        
        {/* Hero Header */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-green-600 via-emerald-600 to-teal-600 p-6 sm:p-8 md:p-10 text-white shadow-2xl">
          {/* Decorative background */}
          <div className="absolute inset-0">
            <div className="absolute top-0 left-0 w-full h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0YzAtMi4yMS0xLjc5LTQtNC00cy00IDEuNzktNCA0IDEuNzkgNCA0IDQgNC0xLjc5IDQtNHptMC0zMGMwLTIuMjEtMS43OS00LTQtNHMtNCAxLjc5LTQgNCAxLjc5IDQgNCA0IDQtMS43OSA0LTR6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30"></div>
          </div>

          <div className="relative z-10">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 sm:gap-4 mb-3">
                  <div className="p-3 sm:p-4 bg-white/20 backdrop-blur-sm rounded-2xl shadow-lg">
                    <ChefHat className="h-8 w-8 sm:h-10 sm:w-10" />
                  </div>
                  <div>
                    <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-1">Ovqatlar Menyusi</h1>
                    <p className="text-green-50 text-sm sm:text-base lg:text-lg">
                      Oshxona uchun haftalik ovqatlar menyusini boshqaring
                    </p>
                  </div>
                </div>

                {/* Statistics */}
                <div className="flex flex-wrap gap-2 sm:gap-3 mt-4">
                  <div className="px-3 sm:px-4 py-2 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
                    <p className="text-xs text-white/70">Jami</p>
                    <p className="text-xl sm:text-2xl font-bold">{totalMeals}</p>
                  </div>
                  <div className="px-3 sm:px-4 py-2 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
                    <p className="text-xs text-white/70">Faol</p>
                    <p className="text-xl sm:text-2xl font-bold">{activeMeals}</p>
                  </div>
                  <div className="px-3 sm:px-4 py-2 bg-amber-500/20 backdrop-blur-sm rounded-xl border border-amber-300/30">
                    <p className="text-xs text-white/70">☕ Nonushta</p>
                    <p className="text-xl sm:text-2xl font-bold">{breakfastCount}</p>
                  </div>
                  <div className="px-3 sm:px-4 py-2 bg-blue-500/20 backdrop-blur-sm rounded-xl border border-blue-300/30">
                    <p className="text-xs text-white/70">🍽️ Tushlik</p>
                    <p className="text-xl sm:text-2xl font-bold">{lunchCount}</p>
                  </div>
                  <div className="px-3 sm:px-4 py-2 bg-purple-500/20 backdrop-blur-sm rounded-xl border border-purple-300/30">
                    <p className="text-xs text-white/70">🌙 Kechki</p>
                    <p className="text-xl sm:text-2xl font-bold">{dinnerCount}</p>
                  </div>
                </div>
              </div>

              <Link href="/admin/meals/create">
                <Button size="lg" className="bg-white text-green-600 hover:bg-green-50 shadow-xl hover:shadow-2xl transition-all hover:scale-105 text-base sm:text-lg px-6 sm:px-8">
                  <Plus className="mr-2 h-5 w-5 sm:h-6 sm:w-6" />
                  Yangi Menyu
                </Button>
              </Link>
            </div>
          </div>

          {/* Decorative blurs */}
          <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10 blur-3xl"></div>
          <div className="absolute -left-8 -bottom-8 h-40 w-40 rounded-full bg-white/10 blur-3xl"></div>
        </div>

        {/* Quick Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200 hover:shadow-lg transition-all">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl shadow-lg">
                  <Coffee className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Nonushta</p>
                  <p className="text-2xl font-bold text-amber-900">{breakfastCount} ta</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200 hover:shadow-lg transition-all">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl shadow-lg">
                  <Soup className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Tushlik</p>
                  <p className="text-2xl font-bold text-blue-900">{lunchCount} ta</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 hover:shadow-lg transition-all">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl shadow-lg">
                  <Moon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Kechki ovqat</p>
                  <p className="text-2xl font-bold text-purple-900">{dinnerCount} ta</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Meals List */}
        <Card className="shadow-xl border-0">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Barcha Ovqatlar</h2>
                <p className="text-sm text-gray-600 mt-1">{totalMeals} ta menyu mavjud</p>
              </div>
              <Badge variant="outline" className="text-sm">
                <Calendar className="h-4 w-4 mr-1" />
                Haftalik
              </Badge>
            </div>
            <MealsTableClient meals={mealsWithNames} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

