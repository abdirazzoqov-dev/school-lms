import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions, hashPassword } from '@/lib/auth'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { passwordSchema } from '@/lib/validations/password'
import { logger } from '@/lib/logger'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { error: 'Autentifikatsiya talab qilinadi' },
        { status: 401 }
      )
    }

    const { currentPassword, newPassword } = await req.json()

    // Validation
    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'Barcha maydonlarni to\'ldiring' },
        { status: 400 }
      )
    }

    // ✅ SECURITY: Strong password validation
    try {
      passwordSchema.parse(newPassword)
    } catch (validationError: any) {
      const errors = validationError.errors?.map((e: any) => e.message).join(', ')
      return NextResponse.json(
        { error: errors || 'Parol talablarga javob bermaydi' },
        { status: 400 }
      )
    }

    // Get user
    const user = await db.user.findUnique({
      where: { id: session.user.id },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Foydalanuvchi topilmadi' },
        { status: 404 }
      )
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.passwordHash
    )

    if (!isPasswordValid) {
      // ✅ SECURITY: Log failed password change attempts
      logger.warn('Failed password change attempt', {
        userId: session.user.id,
        action: 'CHANGE_PASSWORD_FAILED',
      })
      
      return NextResponse.json(
        { error: 'Joriy parol noto\'g\'ri' },
        { status: 400 }
      )
    }

    // ✅ SECURITY: Check if new password is same as current
    const isSamePassword = await bcrypt.compare(newPassword, user.passwordHash)
    if (isSamePassword) {
      return NextResponse.json(
        { error: 'Yangi parol eski paroldan farq qilishi kerak' },
        { status: 400 }
      )
    }

    // Hash new password
    const newPasswordHash = await hashPassword(newPassword)

    // Update password
    await db.user.update({
      where: { id: user.id },
      data: { passwordHash: newPasswordHash },
    })

    // ✅ SECURITY: Log successful password change
    logger.info('Password changed successfully', {
      userId: session.user.id,
      action: 'CHANGE_PASSWORD_SUCCESS',
    })

    return NextResponse.json(
      { message: 'Parol muvaffaqiyatli o\'zgartirildi' },
      { status: 200 }
    )
  } catch (error) {
    logger.error('Change password error', error, {
      action: 'CHANGE_PASSWORD_ERROR',
    })
    
    return NextResponse.json(
      { error: 'Serverda xatolik yuz berdi' },
      { status: 500 }
    )
  }
}

