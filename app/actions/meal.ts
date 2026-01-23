'use server'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const mealSchema = z.object({
  dayOfWeek: z.number().min(1).max(7),
  mealType: z.enum(['BREAKFAST', 'LUNCH', 'DINNER']),
  mainDish: z.string().min(1, 'Asosiy taom kiritilishi shart'),
  sideDish: z.string().optional(),
  salad: z.string().optional(),
  dessert: z.string().optional(),
  drink: z.string().optional(),
  description: z.string().optional(),
  effectiveFrom: z.string(), // ISO date string
  effectiveTo: z.string().optional(),
  isActive: z.boolean().default(true),
})

export async function createMeal(data: z.infer<typeof mealSchema>) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return { success: false, error: 'Unauthorized' }
    }

    const tenantId = session.user.tenantId!
    const validatedData = mealSchema.parse(data)

    const meal = await db.meal.create({
      data: {
        tenantId,
        dayOfWeek: validatedData.dayOfWeek,
        mealType: validatedData.mealType,
        mainDish: validatedData.mainDish,
        sideDish: validatedData.sideDish || null,
        salad: validatedData.salad || null,
        dessert: validatedData.dessert || null,
        drink: validatedData.drink || null,
        description: validatedData.description || null,
        effectiveFrom: new Date(validatedData.effectiveFrom),
        effectiveTo: validatedData.effectiveTo ? new Date(validatedData.effectiveTo) : null,
        isActive: validatedData.isActive,
      },
    })

    revalidatePath('/admin/meals')
    return { success: true, meal }
  } catch (error: any) {
    console.error('Error creating meal:', error)
    return { success: false, error: error.message || 'Failed to create meal' }
  }
}

export async function updateMeal(id: string, data: z.infer<typeof mealSchema>) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return { success: false, error: 'Unauthorized' }
    }

    const tenantId = session.user.tenantId!
    const validatedData = mealSchema.parse(data)

    const meal = await db.meal.update({
      where: { id, tenantId },
      data: {
        dayOfWeek: validatedData.dayOfWeek,
        mealType: validatedData.mealType,
        mainDish: validatedData.mainDish,
        sideDish: validatedData.sideDish || null,
        salad: validatedData.salad || null,
        dessert: validatedData.dessert || null,
        drink: validatedData.drink || null,
        description: validatedData.description || null,
        effectiveFrom: new Date(validatedData.effectiveFrom),
        effectiveTo: validatedData.effectiveTo ? new Date(validatedData.effectiveTo) : null,
        isActive: validatedData.isActive,
      },
    })

    revalidatePath('/admin/meals')
    return { success: true, meal }
  } catch (error: any) {
    console.error('Error updating meal:', error)
    return { success: false, error: error.message || 'Failed to update meal' }
  }
}

export async function deleteMeal(id: string) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return { success: false, error: 'Unauthorized' }
    }

    const tenantId = session.user.tenantId!

    await db.meal.delete({
      where: { id, tenantId },
    })

    revalidatePath('/admin/meals')
    return { success: true }
  } catch (error: any) {
    console.error('Error deleting meal:', error)
    return { success: false, error: error.message || 'Failed to delete meal' }
  }
}

export async function toggleMealStatus(id: string) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return { success: false, error: 'Unauthorized' }
    }

    const tenantId = session.user.tenantId!

    const meal = await db.meal.findUnique({
      where: { id, tenantId },
    })

    if (!meal) {
      return { success: false, error: 'Meal not found' }
    }

    const updated = await db.meal.update({
      where: { id, tenantId },
      data: { isActive: !meal.isActive },
    })

    revalidatePath('/admin/meals')
    return { success: true, meal: updated }
  } catch (error: any) {
    console.error('Error toggling meal status:', error)
    return { success: false, error: error.message || 'Failed to toggle meal status' }
  }
}

