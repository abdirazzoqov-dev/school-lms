import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Edit, Coffee, Soup, Moon, Clock, Calendar, Star } from 'lucide-react'
import Link from 'next/link'

export const revalidate = 0
export const dynamic = 'force-dynamic'

const dayNames = ['Yakshanba', 'Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba']

const mealTypeConfig = {
  BREAKFAST: {
    icon: Coffee,
    emoji: '☕',
    label: 'Nonushta',
    timeStart: '08:00',
    timeEnd: '09:00',
    description: 'Ertalabki ovqat',
    gradient: 'from-amber-500 to-orange-500',
    bg: 'from-amber-50 via-orange-50 to-yellow-50',
    border: 'border-amber-300',
    text: 'text-amber-900',
  },
  LUNCH: {
    icon: Soup,
    emoji: '🍽️',
    label: 'Tushlik',
    timeStart: '12:00',
    timeEnd: '13:30',
    description: 'Kunduzgi ovqat',
    gradient: 'from-blue-500 to-cyan-500',
    bg: 'from-blue-50 via-cyan-50 to-sky-50',
    border: 'border-blue-300',
    text: 'text-blue-900',
  },
  DINNER: {
    icon: Moon,
    emoji: '🌙',
    label: 'Kechki ovqat',
    timeStart: '18:00',
    timeEnd: '19:30',
    description: 'Kechqurun ovqat',
    gradient: 'from-purple-500 to-pink-500',
    bg: 'from-purple-50 via-pink-50 to-fuchsia-50',
    border: 'border-purple-300',
    text: 'text-purple-900',
  }
}

export default async function MealDetailPage({
  params
}: {
  params: { id: string }
}) {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'ADMIN') {
    redirect('/unauthorized')
  }

  const tenantId = session.user.tenantId!

  const meal = await db.meal.findUnique({
    where: {
      id: params.id,
      tenantId,
    },
  })

  if (!meal) {
    notFound()
  }

  const config = mealTypeConfig[meal.mealType as keyof typeof mealTypeConfig]
  const MealIcon = config.icon

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50 to-amber-50 p-3 sm:p-4 md:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto space-y-4 md:space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <Link href="/admin/meals">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Orqaga
            </Button>
          </Link>
          <Link href={`/admin/meals/${meal.id}/edit`}>
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
              <Edit className="h-4 w-4 mr-2" />
              Tahrirlash
            </Button>
          </Link>
        </div>

        {/* Main Card */}
        <Card className={`border-2 ${config.border} bg-gradient-to-br ${config.bg} shadow-xl`}>
          <CardHeader className={`bg-gradient-to-r ${config.gradient} text-white rounded-t-xl`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                  <MealIcon className="h-8 w-8" />
                </div>
                <div>
                  <CardTitle className="text-2xl sm:text-3xl">{config.label}</CardTitle>
                  <p className="text-white/90 text-sm">{config.description}</p>
                </div>
              </div>
              {meal.isActive ? (
                <Badge className="bg-green-500 text-white border-green-600 shadow-lg">
                  <div className="w-2 h-2 bg-white rounded-full mr-1 animate-pulse"></div>
                  Faol
                </Badge>
              ) : (
                <Badge variant="secondary" className="bg-gray-500 text-white border-gray-600">
                  Nofaol
                </Badge>
              )}
            </div>
          </CardHeader>

          <CardContent className="p-6 sm:p-8 space-y-6">
            {/* Day and Time */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-white/50">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className={`h-5 w-5 ${config.text}`} />
                  <p className="text-sm text-gray-600 font-medium">Kun</p>
                </div>
                <p className={`text-xl font-bold ${config.text}`}>
                  {dayNames[meal.dayOfWeek]}
                </p>
              </div>

              <div className="p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-white/50">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className={`h-5 w-5 ${config.text}`} />
                  <p className="text-sm text-gray-600 font-medium">Vaqt</p>
                </div>
                <p className={`text-xl font-bold ${config.text}`}>
                  {config.timeStart} - {config.timeEnd}
                </p>
              </div>
            </div>

            {/* Main Dish */}
            <div className="p-5 bg-white/70 rounded-xl border-2 border-gray-200">
              <div className="flex items-start gap-3 mb-2">
                <div className={`p-2 bg-gradient-to-br ${config.gradient} rounded-lg`}>
                  <span className="text-2xl">{config.emoji}</span>
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-1">
                    Asosiy Taom
                  </p>
                  <h3 className={`text-2xl font-bold ${config.text}`}>
                    {meal.mainDish}
                  </h3>
                </div>
              </div>
            </div>

            {/* Additional Items */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {meal.sideDish && (
                <div className="p-4 bg-white/60 rounded-xl border border-gray-200">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">🥘</span>
                    <p className="text-xs text-gray-500 font-medium">Garnitir</p>
                  </div>
                  <p className="text-base font-semibold text-gray-800">{meal.sideDish}</p>
                </div>
              )}

              {meal.salad && (
                <div className="p-4 bg-white/60 rounded-xl border border-gray-200">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">🥗</span>
                    <p className="text-xs text-gray-500 font-medium">Salat</p>
                  </div>
                  <p className="text-base font-semibold text-gray-800">{meal.salad}</p>
                </div>
              )}

              {meal.drink && (
                <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-1.5 bg-blue-500 rounded-md">
                      <Coffee className="h-4 w-4 text-white" />
                    </div>
                    <p className="text-xs text-gray-500 font-medium">Ichimlik</p>
                  </div>
                  <p className="text-base font-semibold text-blue-900">{meal.drink}</p>
                </div>
              )}

              {meal.dessert && (
                <div className="p-4 bg-pink-50 rounded-xl border border-pink-200">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-1.5 bg-pink-500 rounded-md">
                      <Star className="h-4 w-4 text-white" />
                    </div>
                    <p className="text-xs text-gray-500 font-medium">Shirinlik</p>
                  </div>
                  <p className="text-base font-semibold text-pink-900">{meal.dessert}</p>
                </div>
              )}
            </div>

            {/* Description */}
            {meal.description && (
              <div className="p-4 bg-white/70 rounded-xl border border-gray-200">
                <p className="text-sm text-gray-600 font-medium mb-2">💬 Izoh</p>
                <p className="text-base text-gray-800">{meal.description}</p>
              </div>
            )}

            {/* Date Range */}
            <div className="p-4 bg-white/70 rounded-xl border border-gray-200">
              <p className="text-sm text-gray-600 font-medium mb-2">📅 Amal qilish muddati</p>
              <p className="text-base text-gray-800">
                {new Date(meal.effectiveFrom).toLocaleDateString('uz-UZ', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
                {meal.effectiveTo && (
                  <> - {new Date(meal.effectiveTo).toLocaleDateString('uz-UZ', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}</>
                )}
              </p>
            </div>

            {/* Metadata */}
            <div className="pt-4 border-t border-gray-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-gray-500">
                <div>
                  <span className="font-medium">Yaratilgan:</span>{' '}
                  {new Date(meal.createdAt).toLocaleString('uz-UZ')}
                </div>
                <div>
                  <span className="font-medium">O'zgartirilgan:</span>{' '}
                  {new Date(meal.updatedAt).toLocaleString('uz-UZ')}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
