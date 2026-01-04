'use server'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { hashPassword } from '@/lib/auth'

/**
 * Eski o'quvchilar uchun User yaratish (Migration)
 * Bu faqat bir marta ishlatiladi - eski o'quvchilarga user account yaratish uchun
 */
export async function migrateStudentsWithoutUsers() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return { success: false, error: 'Faqat admin foydalanishi mumkin' }
    }

    const tenantId = session.user.tenantId!

    // Find all students without user accounts
    const studentsWithoutUser = await db.student.findMany({
      where: {
        tenantId,
        userId: null,
      },
      include: {
        parents: {
          include: {
            parent: {
              include: {
                user: true
              }
            }
          }
        }
      }
    })

    if (studentsWithoutUser.length === 0) {
      return { 
        success: true, 
        message: 'Barcha o\'quvchilar allaqachon user account\'ga ega',
        migrated: 0
      }
    }

    let migratedCount = 0
    const errors: string[] = []

    for (const student of studentsWithoutUser) {
      try {
        // Get student's name from parent
        const primaryParent = student.parents.find(p => p.hasAccess)
        const parentName = primaryParent?.parent.user.fullName || 'O\'quvchi'
        
        // Extract first name or use student code
        const studentName = parentName.split(' ')[0] || student.studentCode
        const fullName = `${studentName} (${student.studentCode})`
        
        // Generate email from student code
        const email = `${student.studentCode.toLowerCase()}@student.local`
        
        // Check if email already exists
        const existingUser = await db.user.findUnique({
          where: { email }
        })

        if (existingUser) {
          errors.push(`${student.studentCode}: Email allaqachon mavjud`)
          continue
        }

        // Create user account
        const defaultPassword = await hashPassword('Student123!')
        
        const user = await db.user.create({
          data: {
            email,
            fullName,
            phone: primaryParent?.parent.user.phone,
            passwordHash: defaultPassword,
            role: 'STUDENT',
            tenantId,
            isActive: true,
          }
        })

        // Link user to student
        await db.student.update({
          where: { id: student.id },
          data: { userId: user.id }
        })

        migratedCount++
      } catch (error: any) {
        errors.push(`${student.studentCode}: ${error.message}`)
      }
    }

    return {
      success: true,
      migrated: migratedCount,
      total: studentsWithoutUser.length,
      errors: errors.length > 0 ? errors : null,
      message: `${migratedCount} ta o'quvchiga user account yaratildi`
    }
  } catch (error: any) {
    console.error('Migration error:', error)
    return { 
      success: false, 
      error: error.message || 'Migration muvaffaqiyatsiz' 
    }
  }
}

/**
 * Bitta o'quvchi uchun User yaratish
 */
export async function createUserForStudent(studentId: string, fullName: string, email?: string) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return { success: false, error: 'Faqat admin foydalanishi mumkin' }
    }

    const tenantId = session.user.tenantId!

    // Get student
    const student = await db.student.findFirst({
      where: {
        id: studentId,
        tenantId
      },
      include: {
        user: true,
        parents: {
          include: {
            parent: {
              include: {
                user: true
              }
            }
          }
        }
      }
    })

    if (!student) {
      return { success: false, error: 'O\'quvchi topilmadi' }
    }

    if (student.user) {
      return { success: false, error: 'Bu o\'quvchi allaqachon user account\'ga ega' }
    }

    // Generate email if not provided
    const userEmail = email || `${student.studentCode.toLowerCase()}@student.local`
    
    // Check if email exists
    const existingUser = await db.user.findUnique({
      where: { email: userEmail }
    })

    if (existingUser) {
      return { success: false, error: 'Bu email allaqachon ishlatilgan' }
    }

    // Create user
    const defaultPassword = await hashPassword('Student123!')
    const primaryParent = student.parents.find(p => p.hasAccess)
    
    const user = await db.user.create({
      data: {
        email: userEmail,
        fullName: fullName,
        phone: primaryParent?.parent.user.phone,
        passwordHash: defaultPassword,
        role: 'STUDENT',
        tenantId,
        isActive: true,
      }
    })

    // Link to student
    await db.student.update({
      where: { id: studentId },
      data: { userId: user.id }
    })

    return {
      success: true,
      user: {
        email: userEmail,
        password: 'Student123!',
        fullName
      }
    }
  } catch (error: any) {
    console.error('Create user error:', error)
    return { 
      success: false, 
      error: error.message || 'Xatolik yuz berdi' 
    }
  }
}
