'use server'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { materialSchema, MaterialFormData } from '@/lib/validations/material'
import { revalidatePath } from 'next/cache'

export async function createMaterial(data: MaterialFormData) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || (session.user.role !== 'TEACHER' && session.user.role !== 'ADMIN')) {
      return { success: false, error: 'Ruxsat berilmagan' }
    }

    const tenantId = session.user.tenantId!

    // Validate data
    const validatedData = materialSchema.parse(data)

    // Get teacher ID
    const teacher = await db.teacher.findFirst({
      where: { userId: session.user.id }
    })
    
    if (!teacher) {
      return { success: false, error: 'O\'qituvchi topilmadi' }
    }

    // Create material
    const material = await db.material.create({
      data: {
        tenantId,
        teacherId: teacher.id,
        title: validatedData.title,
        description: validatedData.description || null,
        type: validatedData.materialType,
        subjectId: validatedData.subjectId,
        classId: validatedData.classId || null,
        fileUrl: validatedData.fileUrl,
        fileSize: validatedData.fileSize,
      }
    })

    revalidatePath('/teacher/materials')
    revalidatePath('/admin/materials')
    
    return { success: true, material }
  } catch (error: any) {
    console.error('Create material error:', error)
    return { success: false, error: error.message || 'Xatolik yuz berdi' }
  }
}

export async function updateMaterial(materialId: string, data: Partial<MaterialFormData>) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || (session.user.role !== 'TEACHER' && session.user.role !== 'ADMIN')) {
      return { success: false, error: 'Ruxsat berilmagan' }
    }

    const tenantId = session.user.tenantId!

    // Check if material exists
    const existing = await db.material.findFirst({
      where: { id: materialId, tenantId }
    })

    if (!existing) {
      return { success: false, error: 'Material topilmadi' }
    }

    // Update material
    const material = await db.material.update({
      where: { id: materialId },
      data: {
        title: data.title,
        description: data.description || null,
        type: data.materialType,
        subjectId: data.subjectId,
        classId: data.classId || null,
      }
    })

    revalidatePath('/teacher/materials')
    revalidatePath('/admin/materials')
    
    return { success: true, material }
  } catch (error: any) {
    console.error('Update material error:', error)
    return { success: false, error: error.message || 'Xatolik yuz berdi' }
  }
}

export async function deleteMaterial(materialId: string) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || (session.user.role !== 'TEACHER' && session.user.role !== 'ADMIN')) {
      return { success: false, error: 'Ruxsat berilmagan' }
    }

    const tenantId = session.user.tenantId!

    // Check if material exists
    const material = await db.material.findFirst({
      where: { id: materialId, tenantId }
    })

    if (!material) {
      return { success: false, error: 'Material topilmadi' }
    }

    // Delete from database
    await db.material.delete({
      where: { id: materialId }
    })

    // TODO: Delete physical file from disk
    // This requires fs operations which should be done carefully

    revalidatePath('/teacher/materials')
    revalidatePath('/admin/materials')
    
    return { success: true }
  } catch (error: any) {
    console.error('Delete material error:', error)
    return { success: false, error: error.message || 'Xatolik yuz berdi' }
  }
}

export async function bulkDeleteMaterials(materialIds: string[]) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || (session.user.role !== 'TEACHER' && session.user.role !== 'ADMIN')) {
      return { success: false, error: 'Ruxsat berilmagan' }
    }

    const tenantId = session.user.tenantId!

    const result = await db.material.deleteMany({
      where: { 
        id: { in: materialIds },
        tenantId 
      }
    })

    revalidatePath('/teacher/materials')
    revalidatePath('/admin/materials')
    
    return { success: true, deleted: result.count }
  } catch (error: any) {
    console.error('Bulk delete materials error:', error)
    return { success: false, error: error.message || 'Xatolik yuz berdi' }
  }
}

