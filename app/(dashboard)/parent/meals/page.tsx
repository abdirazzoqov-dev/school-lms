import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { ParentMealsWeekView } from './parent-meals-week-view'
import { Suspense } from 'react'
import { MealsLoadingSkeleton } from './meals-loading-skeleton'

// Enable ISR - revalidate every 5 minutes
export const revalidate = 300

export const metadata = {
  title: 'Ovqatlar Menyusi',
  description: 'Haftalik ovqatlar menyusini ko\'rish',
}

async function MealsData() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'PARENT') {
    redirect('/unauthorized')
  }

  const tenantId = session.user.tenantId!

  // Optimize query - select only needed fields
  const meals = await db.meal.findMany({
    where: { 
      tenantId,
      isActive: true,
    },
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
    },
    orderBy: [
      { dayOfWeek: 'asc' },
      { mealNumber: 'asc' },
    ],
  })

  return <ParentMealsWeekView meals={meals} />
}

export default function ParentMealsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Ovqatlar Menyusi</h1>
        <p className="text-muted-foreground">
          Haftalik ovqatlar menyusi
        </p>
      </div>

      <Suspense fallback={<MealsLoadingSkeleton />}>
        <MealsData />
      </Suspense>
    </div>
  )
}
