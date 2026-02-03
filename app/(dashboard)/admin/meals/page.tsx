import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { MealsWeekView } from './meals-week-view'

export const metadata = {
  title: 'Ovqatlar Menyusi',
  description: 'Haftalik ovqatlar menyusini boshqarish',
}

export default async function MealsPage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'ADMIN') {
    redirect('/unauthorized')
  }

  const tenantId = session.user.tenantId!

  const meals = await db.meal.findMany({
    where: { tenantId },
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
