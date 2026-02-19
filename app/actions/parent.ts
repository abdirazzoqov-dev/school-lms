'use server'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { handleError } from '@/lib/error-handler'

export async function deleteParent(parentId: string) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'MODERATOR')) {
      return { success: false, error: 'Ruxsat berilmagan' }
    }

    const tenantId = session.user.tenantId!

    // Get parent with related data
    const parent = await db.parent.findFirst({
      where: { 
        id: parentId,
        tenantId 
      },
      include: {
        user: true,
        students: {
          include: {
            student: {
              include: {
                user: true
              }
            }
          }
        }
      }
    })

    if (!parent) {
      return { success: false, error: 'Ota-ona topilmadi' }
    }

    // Prevent deletion if parent has active students
    if (parent.students.length > 0) {
      const studentNames = parent.students
        .map(sp => sp.student.user?.fullName || 'N/A')
        .join(', ')
      
      return { 
        success: false, 
        error: `Bu ota-ona farzandlarga biriktirilgan: ${studentNames}. Avval bog'lanishlarni olib tashlang.` 
      }
    }

    // Delete parent first
    await db.parent.delete({
      where: { id: parentId }
    })

    // Delete user account
    if (parent.userId) {
      await db.user.delete({
        where: { id: parent.userId }
      })
    }

    revalidatePath('/admin/parents')
    revalidatePath('/admin')
    
    return { success: true, message: 'Ota-ona muvaffaqiyatli o\'chirildi' }
  } catch (error: any) {
    return handleError(error)
  }
}

export async function deactivateParent(parentId: string) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'MODERATOR')) {
      return { success: false, error: 'Ruxsat berilmagan' }
    }

    const tenantId = session.user.tenantId!

    const parent = await db.parent.findFirst({
      where: { 
        id: parentId,
        tenantId 
      },
      include: {
        user: true
      }
    })

    if (!parent) {
      return { success: false, error: 'Ota-ona topilmadi' }
    }

    // Deactivate user account
    if (parent.userId) {
      await db.user.update({
        where: { id: parent.userId },
        data: { isActive: false }
      })
    }

    revalidatePath('/admin/parents')
    revalidatePath('/admin')
    
    return { success: true, message: 'Ota-ona nofaol holatga o\'tkazildi' }
  } catch (error: any) {
    return handleError(error)
  }
}

export async function activateParent(parentId: string) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'MODERATOR')) {
      return { success: false, error: 'Ruxsat berilmagan' }
    }

    const tenantId = session.user.tenantId!

    const parent = await db.parent.findFirst({
      where: { 
        id: parentId,
        tenantId 
      },
      include: {
        user: true
      }
    })

    if (!parent) {
      return { success: false, error: 'Ota-ona topilmadi' }
    }

    // Activate user account
    if (parent.userId) {
      await db.user.update({
        where: { id: parent.userId },
        data: { isActive: true }
      })
    }

    revalidatePath('/admin/parents')
    revalidatePath('/admin')
    
    return { success: true, message: 'Ota-ona faollashtirildi' }
  } catch (error: any) {
    return handleError(error)
  }
}

