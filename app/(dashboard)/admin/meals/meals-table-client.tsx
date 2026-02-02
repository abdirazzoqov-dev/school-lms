'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { MoreVertical, Edit, Trash2, Eye, ToggleLeft, ToggleRight, Coffee, Soup, Moon, Clock, Star, Calendar, UtensilsCrossed } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { deleteMeal, toggleMealStatus } from '@/app/actions/meal'
import { toast } from 'sonner'
import { MealType } from '@prisma/client'

const mealTypeConfig = {
  BREAKFAST: {
    icon: Coffee,
    emoji: '☕',
    label: 'Nonushta',
    timeStart: '08:00',
    timeEnd: '09:00',
    description: 'Ertalabki ovqat',
    gradient: 'from-amber-500 to-orange-500',
    gradientLight: 'from-amber-400 to-orange-400',
    bg: 'from-amber-50 via-orange-50 to-yellow-50',
    border: 'border-amber-300',
    text: 'text-amber-900',
    shadow: 'shadow-amber-200'
  },
  LUNCH: {
    icon: Soup,
    emoji: '🍽️',
    label: 'Tushlik',
    timeStart: '12:00',
    timeEnd: '13:30',
    description: 'Kunduzgi ovqat',
    gradient: 'from-blue-500 to-cyan-500',
    gradientLight: 'from-blue-400 to-cyan-400',
    bg: 'from-blue-50 via-cyan-50 to-sky-50',
    border: 'border-blue-300',
    text: 'text-blue-900',
    shadow: 'shadow-blue-200'
  },
  DINNER: {
    icon: Moon,
    emoji: '🌙',
    label: 'Kechki ovqat',
    timeStart: '18:00',
    timeEnd: '19:30',
    description: 'Kechqurun ovqat',
    gradient: 'from-purple-500 to-pink-500',
    gradientLight: 'from-purple-400 to-pink-400',
    bg: 'from-purple-50 via-pink-50 to-fuchsia-50',
    border: 'border-purple-300',
    text: 'text-purple-900',
    shadow: 'shadow-purple-200'
  }
}

type Meal = {
  id: string
  dayOfWeek: number
  dayName: string
  mealType: MealType
  mealTypeName: string
  mainDish: string
  sideDish: string | null
  salad: string | null
  dessert: string | null
  drink: string | null
  description: string | null
  effectiveFrom: Date
  effectiveTo: Date | null
  isActive: boolean
}

export function MealsTableClient({ meals }: { meals: Meal[] }) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)

  const handleDelete = async (id: string) => {
    if (!confirm('Bu menyuni o\'chirishni xohlaysizmi?')) return

    setLoading(id)
    const result = await deleteMeal(id)
    setLoading(null)

    if (result.success) {
      toast.success('Menyu o\'chirildi')
      router.refresh()
    } else {
      toast.error(result.error || 'Xatolik yuz berdi')
    }
  }

  const handleToggleStatus = async (id: string) => {
    setLoading(id)
    const result = await toggleMealStatus(id)
    setLoading(null)

    if (result.success) {
      toast.success('Status o\'zgartirildi')
      router.refresh()
    } else {
      toast.error(result.error || 'Xatolik yuz berdi')
    }
  }

  if (meals.length === 0) {
    return (
      <div className="text-center py-12 sm:py-16">
        <div className="p-6 bg-gray-100 rounded-full w-fit mx-auto mb-4">
          <UtensilsCrossed className="h-12 w-12 sm:h-16 sm:w-16 text-gray-300" />
        </div>
        <h3 className="text-lg font-semibold text-gray-700 mb-2">Hozircha ovqatlar menyusi yo'q</h3>
        <p className="text-sm text-gray-500">Yangi menyu qo'shish uchun yuqoridagi tugmani bosing</p>
      </div>
    )
  }

  // Group meals by day
  const mealsByDay: { [key: number]: typeof meals } = {}
  meals.forEach(meal => {
    if (!mealsByDay[meal.dayOfWeek]) {
      mealsByDay[meal.dayOfWeek] = []
    }
    mealsByDay[meal.dayOfWeek].push(meal)
  })

  const dayNames = ['Yakshanba', 'Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba']

  return (
    <div className="space-y-6">
      {Object.entries(mealsByDay)
        .sort(([a], [b]) => parseInt(a) - parseInt(b))
        .map(([dayIndex, dayMeals]) => {
          const isWeekend = parseInt(dayIndex) === 0 || parseInt(dayIndex) === 6
          
          return (
            <div key={dayIndex} className="space-y-3">
              {/* Day Header */}
              <div className={`flex items-center gap-3 p-3 sm:p-4 rounded-xl ${
                isWeekend 
                  ? 'bg-gradient-to-r from-red-100 to-pink-100 border-2 border-red-200' 
                  : 'bg-gradient-to-r from-blue-100 to-cyan-100 border-2 border-blue-200'
              }`}>
                <div className={`p-2 rounded-lg ${
                  isWeekend ? 'bg-red-500' : 'bg-blue-500'
                }`}>
                  <Calendar className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className={`text-lg sm:text-xl font-bold ${
                    isWeekend ? 'text-red-900' : 'text-blue-900'
                  }`}>
                    {dayNames[parseInt(dayIndex)]}
                  </h3>
                  <p className="text-xs text-gray-600">{dayMeals.length} ta ovqat</p>
                </div>
              </div>

              {/* Meals for this day */}
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
                {dayMeals.map((meal) => {
                  const config = mealTypeConfig[meal.mealType as keyof typeof mealTypeConfig]
                  const MealIcon = config.icon

                  return (
                    <Card
                      key={meal.id}
                      className={`relative overflow-hidden border-2 ${config.border} bg-gradient-to-br ${config.bg} transition-all duration-300 hover:shadow-xl hover:-translate-y-1 group`}
                    >
                      {/* Decorative Corner */}
                      <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${config.gradientLight} opacity-10 rounded-bl-full`}></div>

                      {/* Status Badge */}
                      <div className="absolute top-3 right-3 z-20">
                        {meal.isActive ? (
                          <Badge className="bg-green-500 text-white border-green-600 shadow-lg">
                            <div className="w-2 h-2 bg-white rounded-full mr-1 animate-pulse"></div>
                            Faol
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-gray-500 text-white border-gray-600 shadow-lg">
                            Nofaol
                          </Badge>
                        )}
                      </div>

                      <div className="p-4 sm:p-5 space-y-4">
                        {/* Meal Type Header */}
                        <div className="flex items-center justify-between">
                          <div className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl bg-gradient-to-r ${config.gradient} shadow-lg`}>
                            <MealIcon className="h-4 w-4 sm:h-5 sm:w-5 text-white shrink-0" />
                            <div className="flex flex-col">
                              <span className="text-xs sm:text-sm font-bold text-white leading-tight">{config.label}</span>
                              <span className="text-[10px] text-white/90 leading-tight">{config.description}</span>
                            </div>
                          </div>
                        </div>

                        {/* Time Display */}
                        <div className="p-2 sm:p-3 bg-white/70 backdrop-blur-sm rounded-xl border border-white/50">
                          <div className="flex items-center justify-center gap-2">
                            <Clock className={`h-4 w-4 ${config.text}`} />
                            <div className="flex items-center gap-1">
                              <span className={`text-sm sm:text-base font-bold ${config.text}`}>{config.timeStart}</span>
                              <span className={`text-xs ${config.text} opacity-60`}>-</span>
                              <span className={`text-sm sm:text-base font-bold ${config.text}`}>{config.timeEnd}</span>
                            </div>
                          </div>
                        </div>

                        {/* Main Dish */}
                        <div className="relative">
                          <div className="flex items-start gap-2 mb-1">
                            <div className={`p-1.5 bg-gradient-to-br ${config.gradient} rounded-lg shrink-0`}>
                              <span className="text-base sm:text-lg">{config.emoji}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[10px] sm:text-xs text-gray-500 font-semibold uppercase tracking-wide mb-0.5">Asosiy Taom</p>
                              <h4 className={`text-sm sm:text-base font-bold ${config.text} leading-tight`}>
                                {meal.mainDish}
                              </h4>
                            </div>
                          </div>
                        </div>

                        {/* Side Dishes & Salad */}
                        {(meal.sideDish || meal.salad) && (
                          <div className="grid grid-cols-1 gap-2">
                            {meal.sideDish && (
                              <div className="flex items-center gap-2 p-2 bg-white/60 rounded-lg border border-gray-200/50">
                                <span className="text-base shrink-0">🥘</span>
                                <div className="flex-1 min-w-0">
                                  <p className="text-[10px] text-gray-500 font-medium">Garnitir</p>
                                  <p className="text-xs sm:text-sm text-gray-800 font-medium truncate">{meal.sideDish}</p>
                                </div>
                              </div>
                            )}
                            {meal.salad && (
                              <div className="flex items-center gap-2 p-2 bg-white/60 rounded-lg border border-gray-200/50">
                                <span className="text-base shrink-0">🥗</span>
                                <div className="flex-1 min-w-0">
                                  <p className="text-[10px] text-gray-500 font-medium">Salat</p>
                                  <p className="text-xs sm:text-sm text-gray-800 font-medium truncate">{meal.salad}</p>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Drink & Dessert */}
                        {(meal.drink || meal.dessert) && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-gray-200/50">
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
                        )}

                        {/* Description */}
                        {meal.description && (
                          <div className="pt-2 border-t border-gray-200/50">
                            <p className="text-[10px] sm:text-xs text-gray-600 italic line-clamp-2">
                              💬 {meal.description}
                            </p>
                          </div>
                        )}

                        {/* Date Range */}
                        <div className="pt-2 border-t border-gray-200/50">
                          <p className="text-[10px] text-gray-500">
                            📅 {new Date(meal.effectiveFrom).toLocaleDateString('uz-UZ')}
                            {meal.effectiveTo && ` - ${new Date(meal.effectiveTo).toLocaleDateString('uz-UZ')}`}
                          </p>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2 pt-3 border-t border-gray-200/50">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => router.push(`/admin/meals/${meal.id}/edit`)}
                            className="flex-1 hover:bg-blue-50 hover:border-blue-300"
                          >
                            <Edit className="h-3 w-3 mr-1" />
                            Tahrirlash
                          </Button>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={loading === meal.id}
                                className="hover:bg-gray-100"
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => router.push(`/admin/meals/${meal.id}`)}>
                                <Eye className="mr-2 h-4 w-4" />
                                Ko'rish
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleToggleStatus(meal.id)}>
                                {meal.isActive ? (
                                  <><ToggleLeft className="mr-2 h-4 w-4" />Nofaol qilish</>
                                ) : (
                                  <><ToggleRight className="mr-2 h-4 w-4" />Faol qilish</>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDelete(meal.id)}
                                className="text-red-600"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                O'chirish
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>

                      {/* Hover Shine Effect */}
                      <div className="absolute inset-0 bg-gradient-to-br from-white/0 via-white/5 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                    </Card>
                  )
                })}
              </div>
            </div>
          )
        })}
    </div>
  )
}

