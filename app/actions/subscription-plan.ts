'use server'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { SubscriptionPlan } from '@prisma/client'

export async function getSubscriptionPlans() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'SUPER_ADMIN') {
    throw new Error('Ruxsat yo\'q')
  }

  const plans = await db.globalSubscriptionPlan.findMany({
    orderBy: { displayOrder: 'asc' }
  })

  return plans
}

export async function updateSubscriptionPlan(
  planType: SubscriptionPlan,
  data: {
    displayName: string
    price: number
    description?: string
    maxStudents: number
    maxTeachers: number
    features: string[]
    isActive: boolean
    isPopular: boolean
  }
) {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'SUPER_ADMIN') {
    throw new Error('Ruxsat yo\'q')
  }

  try {
    // Update or create the plan
    const plan = await db.globalSubscriptionPlan.upsert({
      where: { planType },
      update: {
        displayName: data.displayName,
        price: data.price,
        description: data.description,
        maxStudents: data.maxStudents,
        maxTeachers: data.maxTeachers,
        features: data.features,
        isActive: data.isActive,
        isPopular: data.isPopular,
      },
      create: {
        planType,
        name: planType,
        displayName: data.displayName,
        price: data.price,
        description: data.description,
        maxStudents: data.maxStudents,
        maxTeachers: data.maxTeachers,
        features: data.features,
        isActive: data.isActive,
        isPopular: data.isPopular,
        displayOrder: planType === 'BASIC' ? 1 : planType === 'STANDARD' ? 2 : 3,
      },
    })

    // Update all tenants using this plan with new limits
    await db.tenant.updateMany({
      where: { subscriptionPlan: planType },
      data: {
        maxStudents: data.maxStudents,
        maxTeachers: data.maxTeachers,
      },
    })

    revalidatePath('/super-admin/settings')
    revalidatePath('/super-admin/tenants')

    return { success: true, plan }
  } catch (error) {
    console.error('Error updating subscription plan:', error)
    throw new Error('Tarif rejani yangilashda xatolik')
  }
}

export async function initializeDefaultPlans() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'SUPER_ADMIN') {
    throw new Error('Ruxsat yo\'q')
  }

  try {
    const existingPlans = await db.globalSubscriptionPlan.count()
    
    if (existingPlans > 0) {
      return { success: true, message: 'Tarif rejalar allaqachon mavjud' }
    }

    // Create default plans
    await db.globalSubscriptionPlan.createMany({
      data: [
        {
          planType: 'BASIC',
          name: 'BASIC',
          displayName: 'Asosiy',
          price: 500000,
          description: 'Kichik maktablar uchun',
          maxStudents: 50,
          maxTeachers: 10,
          features: [
            '50 ta o\'quvchi',
            '10 ta o\'qituvchi',
            'Asosiy funksiyalar',
            'Email qo\'llab-quvvatlash'
          ],
          isActive: true,
          isPopular: false,
          displayOrder: 1,
        },
        {
          planType: 'STANDARD',
          name: 'STANDARD',
          displayName: 'Standart',
          price: 1500000,
          description: 'O\'rta maktablar uchun',
          maxStudents: 200,
          maxTeachers: 30,
          features: [
            '200 ta o\'quvchi',
            '30 ta o\'qituvchi',
            'Barcha funksiyalar',
            'Telefon qo\'llab-quvvatlash',
            'Hisobotlar va statistika'
          ],
          isActive: true,
          isPopular: true,
          displayOrder: 2,
        },
        {
          planType: 'PREMIUM',
          name: 'PREMIUM',
          displayName: 'Premium',
          price: 3000000,
          description: 'Katta maktablar uchun',
          maxStudents: 9999,
          maxTeachers: 9999,
          features: [
            'Cheksiz o\'quvchi',
            'Cheksiz o\'qituvchi',
            'Barcha funksiyalar',
            '24/7 qo\'llab-quvvatlash',
            'Maxsus integratsiyalar',
            'Shaxsiy menejer'
          ],
          isActive: true,
          isPopular: false,
          displayOrder: 3,
        },
      ],
    })

    revalidatePath('/super-admin/settings')

    return { success: true, message: 'Tarif rejalar yaratildi' }
  } catch (error) {
    console.error('Error initializing plans:', error)
    throw new Error('Tarif rejalarni yaratishda xatolik')
  }
}

