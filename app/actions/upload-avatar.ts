'use server'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'

export async function uploadAvatar(userId: string, base64Data: string, fileName?: string) {
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

    // Check approximate size (base64 is ~33% larger than binary)
    // Max ~2MB binary → max ~2.7MB base64 string
    const base64WithoutPrefix = base64Data.replace(/^data:image\/\w+;base64,/, '')
    const approximateSizeBytes = (base64WithoutPrefix.length * 3) / 4
    if (approximateSizeBytes > 2 * 1024 * 1024) {
      return { success: false, error: 'Rasm hajmi 2MB dan oshmasligi kerak' }
    }

    // Store base64 data URL directly in database (works in any deployment)
    await db.user.update({
      where: { id: userId },
      data: { avatar: base64Data }
    })

    revalidatePath('/admin/teachers')
    revalidatePath('/admin/staff')
    revalidatePath('/admin')
    revalidatePath('/admin/settings/profile')

    return { success: true, avatarUrl: base64Data }
  } catch (error: any) {
    console.error('Upload avatar error:', error)
    return { success: false, error: error.message || 'Xatolik yuz berdi' }
  }
}
