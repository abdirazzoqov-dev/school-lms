'use server'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'

export async function getGlobalSettings() {
  try {
    // Get the first (and should be only) global settings record
    let settings = await db.globalSettings.findFirst()

    // If no settings exist, create default
    if (!settings) {
      settings = await db.globalSettings.create({
        data: {
          platformName: 'School LMS',
          platformDescription: 'Maktablar uchun zamonaviy boshqaruv tizimi',
          supportPhone: '+998 71 123 45 67',
          defaultLanguage: 'uz',
          timezone: 'Asia/Tashkent',
        },
      })
    }

    return settings
  } catch (error) {
    console.error('Error getting global settings:', error)
    throw new Error('Sozlamalarni yuklashda xatolik')
  }
}

export async function updateGlobalSettings(data: {
  platformName: string
  platformDescription: string
  supportPhone: string
  supportEmail?: string
  defaultLanguage?: string
  timezone?: string
  maintenanceMode?: boolean
  maintenanceMessage?: string
}) {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'SUPER_ADMIN') {
    throw new Error('Ruxsat yo\'q')
  }

  try {
    // Get existing settings
    const existing = await db.globalSettings.findFirst()

    let settings
    if (existing) {
      // Update existing
      settings = await db.globalSettings.update({
        where: { id: existing.id },
        data: {
          platformName: data.platformName,
          platformDescription: data.platformDescription,
          supportPhone: data.supportPhone,
          supportEmail: data.supportEmail,
          defaultLanguage: data.defaultLanguage,
          timezone: data.timezone,
          maintenanceMode: data.maintenanceMode,
          maintenanceMessage: data.maintenanceMessage,
        },
      })
    } else {
      // Create new
      settings = await db.globalSettings.create({
        data: {
          platformName: data.platformName,
          platformDescription: data.platformDescription,
          supportPhone: data.supportPhone,
          supportEmail: data.supportEmail,
          defaultLanguage: data.defaultLanguage || 'uz',
          timezone: data.timezone || 'Asia/Tashkent',
          maintenanceMode: data.maintenanceMode || false,
          maintenanceMessage: data.maintenanceMessage,
        },
      })
    }

    // Revalidate all pages that might use these settings
    revalidatePath('/', 'layout')
    revalidatePath('/super-admin/settings')

    return { success: true, settings }
  } catch (error) {
    console.error('Error updating global settings:', error)
    throw new Error('Sozlamalarni saqlashda xatolik')
  }
}

