'use server'

import { db } from '@/lib/db'
import { hashPassword } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

// Create moderator schema
const createModeratorSchema = z.object({
  fullName: z.string().min(2, 'Ism kamida 2 ta belgi bo\'lishi kerak'),
  email: z.string().email('To\'g\'ri email kiriting'),
  password: z.string().min(6, 'Parol kamida 6 ta belgi bo\'lishi kerak'),
  tenantId: z.string(),
})

// Update permissions schema
const updatePermissionsSchema = z.object({
  userId: z.string(),
  tenantId: z.string(),
  permissions: z.array(
    z.object({
      resource: z.string(),
      action: z.string(),
    })
  ),
})

/**
 * Create a new moderator
 */
export async function createModerator(formData: FormData) {
  try {
    const data = createModeratorSchema.parse({
      fullName: formData.get('fullName'),
      email: formData.get('email'),
      password: formData.get('password'),
      tenantId: formData.get('tenantId'),
    })

    // Check if email already exists
    const existingUser = await db.user.findUnique({
      where: { email: data.email },
    })

    if (existingUser) {
      return {
        success: false,
        error: 'Bu email allaqachon ishlatilgan',
      }
    }

    // Create user with MODERATOR role
    const user = await db.user.create({
      data: {
        email: data.email,
        fullName: data.fullName,
        passwordHash: await hashPassword(data.password),
        role: 'MODERATOR',
        tenantId: data.tenantId,
        isActive: true,
      },
    })

    revalidatePath('/admin/moderators')
    return {
      success: true,
      data: user,
    }
  } catch (error: any) {
    console.error('Error creating moderator:', error)
    return {
      success: false,
      error: error.message || 'Moderator yaratishda xatolik',
    }
  }
}

/**
 * Update moderator permissions
 */
export async function updateModeratorPermissions(formData: FormData) {
  try {
    const data = updatePermissionsSchema.parse({
      userId: formData.get('userId'),
      tenantId: formData.get('tenantId'),
      permissions: JSON.parse(formData.get('permissions') as string),
    })

    // Delete all existing permissions for this moderator
    await db.permission.deleteMany({
      where: {
        userId: data.userId,
        tenantId: data.tenantId,
      },
    })

    // Create new permissions
    if (data.permissions.length > 0) {
      await db.permission.createMany({
        data: data.permissions.map((perm) => ({
          userId: data.userId,
          tenantId: data.tenantId,
          resource: perm.resource,
          action: perm.action,
        })),
      })
    }

    revalidatePath('/admin/moderators')
    return {
      success: true,
    }
  } catch (error: any) {
    console.error('Error updating permissions:', error)
    return {
      success: false,
      error: error.message || 'Ruxsatlarni yangilashda xatolik',
    }
  }
}

/**
 * Delete moderator
 */
export async function deleteModerator(userId: string) {
  try {
    // Delete all permissions first
    await db.permission.deleteMany({
      where: { userId },
    })

    // Delete user
    await db.user.delete({
      where: { id: userId },
    })

    revalidatePath('/admin/moderators')
    return {
      success: true,
    }
  } catch (error: any) {
    console.error('Error deleting moderator:', error)
    return {
      success: false,
      error: error.message || 'Moderatorni o\'chirishda xatolik',
    }
  }
}

/**
 * Toggle moderator active status
 */
export async function toggleModeratorStatus(userId: string, isActive: boolean) {
  try {
    await db.user.update({
      where: { id: userId },
      data: { isActive },
    })

    revalidatePath('/admin/moderators')
    return {
      success: true,
    }
  } catch (error: any) {
    console.error('Error toggling moderator status:', error)
    return {
      success: false,
      error: error.message || 'Statusni o\'zgartirishda xatolik',
    }
  }
}

