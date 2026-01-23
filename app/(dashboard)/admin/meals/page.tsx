import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, UtensilsCrossed } from 'lucide-react'
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

  return (
    <div className="space-y-6 p-6">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-600 via-emerald-600 to-teal-600 p-8 text-white shadow-2xl">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                  <UtensilsCrossed className="h-8 w-8" />
                </div>
                <h1 className="text-4xl font-bold">Ovqatlar Menyusi</h1>
              </div>
              <p className="text-green-50 text-lg">
                Oshxona uchun haftalik ovqatlar menyusini boshqaring
              </p>
            </div>
            <Link href="/admin/meals/create">
              <Button size="lg" className="bg-white text-green-600 hover:bg-green-50 shadow-lg">
                <Plus className="mr-2 h-5 w-5" />
                Yangi Menyu Qo'shish
              </Button>
            </Link>
          </div>
        </div>
        <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10 blur-2xl"></div>
        <div className="absolute -left-8 -bottom-8 h-40 w-40 rounded-full bg-white/10 blur-2xl"></div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ovqatlar Ro'yxati</CardTitle>
          <CardDescription>
            {mealsWithNames.length} ta menyu mavjud
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MealsTableClient meals={mealsWithNames} />
        </CardContent>
      </Card>
    </div>
  )
}

