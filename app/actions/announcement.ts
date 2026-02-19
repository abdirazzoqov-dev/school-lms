'use server'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { announcementSchema, AnnouncementFormData } from '@/lib/validations/announcement'
import { revalidatePath } from 'next/cache'

export async function createAnnouncement(data: AnnouncementFormData) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'MODERATOR')) {
      return { success: false, error: 'Ruxsat berilmagan' }
    }

    const tenantId = session.user.tenantId!

    // Validate data
    const validatedData = announcementSchema.parse(data)

    // Parse expiration date if provided
    let expiresAt = null
    if (validatedData.expiresAt) {
      expiresAt = new Date(validatedData.expiresAt)
    }

    // Create announcement
    const announcement = await db.announcement.create({
      data: {
        tenantId,
        title: validatedData.title,
        content: validatedData.content,
        priority: validatedData.priority,
        targetAudience: validatedData.targetAudience,
        expiresAt,
        isPinned: validatedData.isPinned,
        authorId: session.user.id,
      }
    })

    revalidatePath('/admin/announcements')
    revalidatePath('/teacher')
    revalidatePath('/parent')
    
    return { success: true, announcement }
  } catch (error: any) {
    console.error('Create announcement error:', error)
    return { success: false, error: error.message || 'Xatolik yuz berdi' }
  }
}

export async function updateAnnouncement(announcementId: string, data: Partial<AnnouncementFormData>) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'MODERATOR')) {
      return { success: false, error: 'Ruxsat berilmagan' }
    }

    const tenantId = session.user.tenantId!

    // Check if announcement exists
    const existing = await db.announcement.findFirst({
      where: { id: announcementId, tenantId }
    })

    if (!existing) {
      return { success: false, error: 'E\'lon topilmadi' }
    }

    // Parse expiration date if provided
    let expiresAt = existing.expiresAt
    if (data.expiresAt !== undefined) {
      expiresAt = data.expiresAt ? new Date(data.expiresAt) : null
    }

    // Update announcement
    const announcement = await db.announcement.update({
      where: { id: announcementId },
      data: {
        title: data.title,
        content: data.content,
        priority: data.priority,
        targetAudience: data.targetAudience,
        expiresAt,
        isPinned: data.isPinned,
      }
    })

    revalidatePath('/admin/announcements')
    revalidatePath('/teacher')
    revalidatePath('/parent')
    
    return { success: true, announcement }
  } catch (error: any) {
    console.error('Update announcement error:', error)
    return { success: false, error: error.message || 'Xatolik yuz berdi' }
  }
}

export async function deleteAnnouncement(announcementId: string) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'MODERATOR')) {
      return { success: false, error: 'Ruxsat berilmagan' }
    }

    const tenantId = session.user.tenantId!

    // Check if announcement exists
    const announcement = await db.announcement.findFirst({
      where: { id: announcementId, tenantId }
    })

    if (!announcement) {
      return { success: false, error: 'E\'lon topilmadi' }
    }

    await db.announcement.delete({
      where: { id: announcementId }
    })

    revalidatePath('/admin/announcements')
    revalidatePath('/teacher')
    revalidatePath('/parent')
    
    return { success: true }
  } catch (error: any) {
    console.error('Delete announcement error:', error)
    return { success: false, error: error.message || 'Xatolik yuz berdi' }
  }
}

export async function toggleAnnouncementPin(announcementId: string) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'MODERATOR')) {
      return { success: false, error: 'Ruxsat berilmagan' }
    }

    const tenantId = session.user.tenantId!

    // Get current state
    const announcement = await db.announcement.findFirst({
      where: { id: announcementId, tenantId }
    })

    if (!announcement) {
      return { success: false, error: 'E\'lon topilmadi' }
    }

    // Toggle pin
    await db.announcement.update({
      where: { id: announcementId },
      data: { isPinned: !announcement.isPinned }
    })

    revalidatePath('/admin/announcements')
    revalidatePath('/teacher')
    revalidatePath('/parent')
    
    return { success: true }
  } catch (error: any) {
    console.error('Toggle pin error:', error)
    return { success: false, error: error.message || 'Xatolik yuz berdi' }
  }
}

export async function bulkDeleteAnnouncements(announcementIds: string[]) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'MODERATOR')) {
      return { success: false, error: 'Ruxsat berilmagan' }
    }

    const tenantId = session.user.tenantId!

    const result = await db.announcement.deleteMany({
      where: { 
        id: { in: announcementIds },
        tenantId 
      }
    })

    revalidatePath('/admin/announcements')
    revalidatePath('/teacher')
    revalidatePath('/parent')
    
    return { success: true, deleted: result.count }
  } catch (error: any) {
    console.error('Bulk delete announcements error:', error)
    return { success: false, error: error.message || 'Xatolik yuz berdi' }
  }
}

