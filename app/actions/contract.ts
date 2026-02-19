'use server'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { handleError } from '@/lib/error-handler'
import { writeFile, unlink, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

export interface ContractFormData {
  title: string
  description?: string
  forTeachers: boolean
  forStaff: boolean
  forParents: boolean
  teacherId?: string
  staffId?: string
  parentId?: string
  fileData?: string // Base64 encoded file
  fileName?: string
  fileType?: string
}

/**
 * Create a new contract
 */
export async function createContract(data: ContractFormData) {
  try {
    console.log('Creating contract with data:', JSON.stringify({
      title: data.title,
      forTeachers: data.forTeachers,
      forStaff: data.forStaff,
      forParents: data.forParents,
      teacherId: data.teacherId,
      staffId: data.staffId,
      parentId: data.parentId,
      hasFile: !!data.fileData
    }, null, 2))
    
    const session = await getServerSession(authOptions)
    
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'MODERATOR')) {
      return { success: false, error: 'Ruxsat berilmagan' }
    }

    const tenantId = session.user.tenantId!

    // Validate at least one recipient type is selected
    if (!data.forTeachers && !data.forStaff && !data.forParents) {
      return { success: false, error: 'Kamida bitta qabul qiluvchi turini tanlang' }
    }

    // File handling
    if (!data.fileData || !data.fileName) {
      return { success: false, error: 'Faylni yuklang' }
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'contracts', tenantId)
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true })
    }

    // Generate unique filename
    const timestamp = Date.now()
    const safeName = data.fileName.replace(/[^a-zA-Z0-9.-]/g, '_')
    const uniqueFileName = `${timestamp}_${safeName}`
    const filePath = join(uploadsDir, uniqueFileName)
    const fileUrl = `/uploads/contracts/${tenantId}/${uniqueFileName}`

    // Decode Base64 and save file
    const base64Data = data.fileData.split(',')[1] || data.fileData
    const buffer = Buffer.from(base64Data, 'base64')
    await writeFile(filePath, buffer)

    const fileSize = buffer.length

    // Create contract in database
    const contract = await db.contract.create({
      data: {
        tenantId,
        title: data.title,
        description: data.description || null,
        fileName: data.fileName,
        fileUrl,
        fileType: data.fileType || 'application/pdf',
        fileSize,
        forTeachers: data.forTeachers,
        forStaff: data.forStaff,
        forParents: data.forParents,
        teacherId: data.teacherId && data.teacherId !== '' ? data.teacherId : null,
        staffId: data.staffId && data.staffId !== '' ? data.staffId : null,
        parentId: data.parentId && data.parentId !== '' ? data.parentId : null,
        uploadedById: session.user.id,
        isActive: true,
      },
    })

    revalidatePath('/admin/contracts')
    revalidatePath('/teacher/contracts')
    revalidatePath('/staff/contracts')
    revalidatePath('/parent/contracts')

    return { success: true, contract }
  } catch (error: any) {
    console.error('Contract creation error:', error)
    return handleError(error)
  }
}

/**
 * Update contract
 */
export async function updateContract(contractId: string, data: Partial<ContractFormData>) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'MODERATOR')) {
      return { success: false, error: 'Ruxsat berilmagan' }
    }

    const tenantId = session.user.tenantId!

    // Check if contract exists and belongs to tenant
    const existingContract = await db.contract.findFirst({
      where: { id: contractId, tenantId },
    })

    if (!existingContract) {
      return { success: false, error: 'Shartnoma topilmadi' }
    }

    const updateData: any = {}

    if (data.title) updateData.title = data.title
    if (data.description !== undefined) updateData.description = data.description || null
    if (data.forTeachers !== undefined) updateData.forTeachers = data.forTeachers
    if (data.forStaff !== undefined) updateData.forStaff = data.forStaff
    if (data.forParents !== undefined) updateData.forParents = data.forParents
    if (data.teacherId !== undefined) updateData.teacherId = data.teacherId && data.teacherId !== '' ? data.teacherId : null
    if (data.staffId !== undefined) updateData.staffId = data.staffId && data.staffId !== '' ? data.staffId : null
    if (data.parentId !== undefined) updateData.parentId = data.parentId && data.parentId !== '' ? data.parentId : null

    // If new file is uploaded
    if (data.fileData && data.fileName) {
      const uploadsDir = join(process.cwd(), 'public', 'uploads', 'contracts', tenantId)
      if (!existsSync(uploadsDir)) {
        await mkdir(uploadsDir, { recursive: true })
      }

      const timestamp = Date.now()
      const safeName = data.fileName.replace(/[^a-zA-Z0-9.-]/g, '_')
      const uniqueFileName = `${timestamp}_${safeName}`
      const filePath = join(uploadsDir, uniqueFileName)
      const fileUrl = `/uploads/contracts/${tenantId}/${uniqueFileName}`

      const base64Data = data.fileData.split(',')[1] || data.fileData
      const buffer = Buffer.from(base64Data, 'base64')
      await writeFile(filePath, buffer)

      updateData.fileName = data.fileName
      updateData.fileUrl = fileUrl
      updateData.fileType = data.fileType || 'application/pdf'
      updateData.fileSize = buffer.length

      // Delete old file
      try {
        const oldFilePath = join(process.cwd(), 'public', existingContract.fileUrl)
        if (existsSync(oldFilePath)) {
          await unlink(oldFilePath)
        }
      } catch (err) {
        console.error('Failed to delete old file:', err)
      }
    }

    const contract = await db.contract.update({
      where: { id: contractId },
      data: updateData,
    })

    revalidatePath('/admin/contracts')
    revalidatePath('/teacher/contracts')
    revalidatePath('/staff/contracts')
    revalidatePath('/parent/contracts')

    return { success: true, contract }
  } catch (error: any) {
    return handleError(error)
  }
}

/**
 * Delete contract
 */
export async function deleteContract(contractId: string) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'MODERATOR')) {
      return { success: false, error: 'Ruxsat berilmagan' }
    }

    const tenantId = session.user.tenantId!

    const contract = await db.contract.findFirst({
      where: { id: contractId, tenantId },
    })

    if (!contract) {
      return { success: false, error: 'Shartnoma topilmadi' }
    }

    // Delete file from filesystem
    try {
      const filePath = join(process.cwd(), 'public', contract.fileUrl)
      if (existsSync(filePath)) {
        await unlink(filePath)
      }
    } catch (err) {
      console.error('Failed to delete file:', err)
    }

    // Delete from database
    await db.contract.delete({
      where: { id: contractId },
    })

    revalidatePath('/admin/contracts')
    revalidatePath('/teacher/contracts')
    revalidatePath('/staff/contracts')
    revalidatePath('/parent/contracts')

    return { success: true }
  } catch (error: any) {
    return handleError(error)
  }
}

/**
 * Toggle contract active status
 */
export async function toggleContractStatus(contractId: string) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'MODERATOR')) {
      return { success: false, error: 'Ruxsat berilmagan' }
    }

    const tenantId = session.user.tenantId!

    const contract = await db.contract.findFirst({
      where: { id: contractId, tenantId },
    })

    if (!contract) {
      return { success: false, error: 'Shartnoma topilmadi' }
    }

    const updated = await db.contract.update({
      where: { id: contractId },
      data: { isActive: !contract.isActive },
    })

    revalidatePath('/admin/contracts')
    revalidatePath('/teacher/contracts')
    revalidatePath('/staff/contracts')
    revalidatePath('/parent/contracts')

    return { success: true, contract: updated }
  } catch (error: any) {
    return handleError(error)
  }
}

