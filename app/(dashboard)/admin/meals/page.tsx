import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { MealsWeekView } from './meals-week-view'

// Enable ISR - revalidate every 2 minutes for admin
export const revalidate = 120

export const metadata = {
  title: 'Ovqatlar Menyusi',
  description: 'Haftalik ovqatlar menyusini boshqarish',
}

export default async function MealsPage() {
  const session = await getServerSession(authOptions)

  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'MODERATOR')) {
    redirect('/unauthorized')
  }

  const tenantId = session.user.tenantId!

  // Optimize query - select only needed fields
  const meals = await db.meal.findMany({
    where: { tenantId },
    select: {
      id: true,
      dayOfWeek: true,
      mealNumber: true,
      mealTime: true,
      mainDish: true,
      sideDish: true,
      salad: true,
      dessert: true,
      drink: true,
      description: true,
      image: true,
      isActive: true,
    },
    orderBy: [
      { dayOfWeek: 'asc' },
      { mealNumber: 'asc' },
    ],
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Ovqatlar Menyusi</h1>
        <p className="text-muted-foreground">
          Haftalik ovqatlar menyusini boshqaring
        </p>
      </div>

      <MealsWeekView meals={meals} />
    </div>
  )
}
