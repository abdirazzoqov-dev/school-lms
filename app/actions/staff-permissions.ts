'use server'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'

export type PermissionInput = {
  resource: string
  actions: string[] // ['CREATE', 'READ', 'UPDATE', 'DELETE'] or ['ALL']
}

// Save permissions for a staff user (replaces all existing)
export async function saveStaffPermissions(
  staffUserId: string,
  permissions: PermissionInput[]
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return { success: false, error: 'Ruxsat berilmagan' }
    }

    const tenantId = session.user.tenantId!

    // Verify the target user belongs to this tenant
    const targetUser = await db.user.findFirst({
      where: { id: staffUserId, tenantId },
    })

    if (!targetUser) {
      return { success: false, error: 'Xodim topilmadi' }
    }

    // Delete existing permissions
    await db.permission.deleteMany({
      where: { userId: staffUserId, tenantId },
    })

    // Insert new permissions
    const rows: { userId: string; tenantId: string; resource: string; action: string }[] = []
    for (const perm of permissions) {
      for (const action of perm.actions) {
        if (action) {
          rows.push({ userId: staffUserId, tenantId, resource: perm.resource, action })
        }
      }
    }

    if (rows.length > 0) {
      await db.permission.createMany({ data: rows })
    }

    revalidatePath('/admin/staff')
    return { success: true, message: "Ruxsatlar saqlandi" }
  } catch (error: any) {
    console.error('saveStaffPermissions error:', error)
    return { success: false, error: error.message || 'Xatolik yuz berdi' }
  }
}

// Get permissions for a staff user
export async function getStaffPermissions(staffUserId: string) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return { success: false, error: 'Ruxsat berilmagan', permissions: [] }
    }
    const tenantId = session.user.tenantId!

    const perms = await db.permission.findMany({
      where: { userId: staffUserId, tenantId },
      select: { resource: true, action: true },
    })

    return { success: true, permissions: perms }
  } catch (error: any) {
    return { success: false, error: error.message, permissions: [] }
  }
}

