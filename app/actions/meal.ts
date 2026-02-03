'use server'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'

export async function createMeal(data: {
  dayOfWeek: number
  mealNumber: number
  mealTime: string
  mainDish: string
  sideDish?: string
  salad?: string
  dessert?: string
  drink?: string
  description?: string
}) {
  const session = await getServerSession(authOptions)
  
  if (!session || session.user.role !== 'ADMIN') {
    throw new Error('Unauthorized')
  }

  const tenantId = session.user.tenantId!

  const meal = await db.meal.create({
    data: {
      tenantId,
      ...data,
    },
  })

  revalidatePath('/admin/meals')
  revalidatePath('/parent/meals')
  
  return meal
}

export async function updateMeal(
  id: string,
  data: {
    dayOfWeek?: number
    mealNumber?: number
    mealTime?: string
    mainDish?: string
    sideDish?: string
    salad?: string
    dessert?: string
    drink?: string
    description?: string
  }
) {
  const session = await getServerSession(authOptions)
  
  if (!session || session.user.role !== 'ADMIN') {
    throw new Error('Unauthorized')
  }

  const tenantId = session.user.tenantId!

  const meal = await db.meal.update({
    where: {
      id,
      tenantId,
    },
    data,
  })

  revalidatePath('/admin/meals')
  revalidatePath('/parent/meals')
  
  return meal
}

export async function deleteMeal(id: string) {
  const session = await getServerSession(authOptions)
  
  if (!session || session.user.role !== 'ADMIN') {
    throw new Error('Unauthorized')
  }

  const tenantId = session.user.tenantId!

  await db.meal.delete({
    where: {
      id,
      tenantId,
    },
  })

  revalidatePath('/admin/meals')
  revalidatePath('/parent/meals')
}

export async function toggleMealStatus(id: string) {
  const session = await getServerSession(authOptions)
  
  if (!session || session.user.role !== 'ADMIN') {
    throw new Error('Unauthorized')
  }

  const tenantId = session.user.tenantId!

  const meal = await db.meal.findUnique({
    where: { id, tenantId },
  })

  if (!meal) {
    throw new Error('Meal not found')
  }

  const updated = await db.meal.update({
    where: { id },
    data: { isActive: !meal.isActive },
  })

  revalidatePath('/admin/meals')
  revalidatePath('/parent/meals')
  
  return updated
}
