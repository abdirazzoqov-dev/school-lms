import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { EditMealForm } from './edit-meal-form'

export const revalidate = 0
export const dynamic = 'force-dynamic'

export default async function EditMealPage({
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

  return <EditMealForm meal={meal} />
}
