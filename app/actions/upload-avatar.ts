'use server'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { writeFile, mkdir, unlink } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import { revalidatePath } from 'next/cache'

export async function uploadAvatar(userId: string, base64Data: string, fileName: string) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return { success: false, error: 'Ruxsat berilmagan' }
    }

    // Only admin can upload for others, or user can upload for themselves
    if (session.user.role !== 'ADMIN' && session.user.id !== userId) {
      return { success: false, error: 'Ruxsat berilmagan' }
    }

    // Validate base64 data
    if (!base64Data || !base64Data.startsWith('data:image/')) {
      return { success: false, error: 'Noto\'g\'ri rasm formati' }
    }

    // Ensure upload directory exists
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'avatars')
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true })
    }

    // Get current avatar to delete later
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { avatar: true }
    })

    // Generate unique filename
    const ext = fileName.split('.').pop()?.toLowerCase() || 'jpg'
    const safeExt = ['jpg', 'jpeg', 'png', 'webp'].includes(ext) ? ext : 'jpg'
    const uniqueFileName = `${userId}-${Date.now()}.${safeExt}`
    const filePath = path.join(uploadDir, uniqueFileName)

    // Convert base64 to buffer
    const base64WithoutPrefix = base64Data.replace(/^data:image\/\w+;base64,/, '')
    const buffer = Buffer.from(base64WithoutPrefix, 'base64')

    // Check file size (max 2MB)
    if (buffer.length > 2 * 1024 * 1024) {
      return { success: false, error: 'Rasm hajmi 2MB dan oshmasligi kerak' }
    }

    // Save file
    await writeFile(filePath, buffer)

    const avatarUrl = `/uploads/avatars/${uniqueFileName}`

    // Update user avatar
    await db.user.update({
      where: { id: userId },
      data: { avatar: avatarUrl }
    })

    // Delete old avatar if exists
    if (user?.avatar && user.avatar.startsWith('/uploads/avatars/')) {
      const oldFilePath = path.join(process.cwd(), 'public', user.avatar)
      try {
        if (existsSync(oldFilePath)) {
          await unlink(oldFilePath)
        }
      } catch (e) {
        // Ignore delete errors - file might not exist
      }
    }

    revalidatePath('/admin/teachers')
    revalidatePath('/admin/staff')
    revalidatePath('/admin')

    return { success: true, avatarUrl }
  } catch (error: any) {
    console.error('Upload avatar error:', error)
    return { success: false, error: error.message || 'Xatolik yuz berdi' }
  }
}

