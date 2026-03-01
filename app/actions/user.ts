'use server'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function changeOwnPassword(currentPassword: string, newPassword: string) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return { success: false, error: 'Tizimga kiring' }
    }

    if (newPassword.length < 6) {
      return { success: false, error: 'Yangi parol kamida 6 belgidan iborat bo\'lishi kerak' }
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, passwordHash: true }
    })

    if (!user) {
      return { success: false, error: 'Foydalanuvchi topilmadi' }
    }

    const isCurrentValid = await bcrypt.compare(currentPassword, user.passwordHash)
    if (!isCurrentValid) {
      return { success: false, error: 'Joriy parol noto\'g\'ri' }
    }

    const hashedNew = await bcrypt.hash(newPassword, 12)

    await db.user.update({
      where: { id: user.id },
      data: { passwordHash: hashedNew }
    })

    return { success: true }
  } catch {
    return { success: false, error: 'Xatolik yuz berdi' }
  }
}
