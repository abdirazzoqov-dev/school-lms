'use server'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { teacherSchema, TeacherFormData } from '@/lib/validations/teacher'
import { revalidatePath } from 'next/cache'
import { hashPassword } from '@/lib/auth'
import { canAddTeacher } from '@/lib/tenant'

export async function createTeacher(data: TeacherFormData) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return { success: false, error: 'Ruxsat berilmagan' }
    }

    const tenantId = session.user.tenantId!

    // Check if can add more teachers
    const canAdd = await canAddTeacher(tenantId)
    if (!canAdd) {
      return { success: false, error: 'O\'qituvchilar limitiga yetdingiz. Plan\'ni upgrade qiling.' }
    }

    // Validate data
    const validatedData = teacherSchema.parse(data)

    // Check if email already exists
    const existingUser = await db.user.findUnique({
      where: { email: validatedData.email }
    })

    if (existingUser) {
      return { success: false, error: 'Bu email allaqachon ishlatilgan' }
    }

    // Check if teacher code already exists
    const existingTeacher = await db.teacher.findUnique({
      where: {
        tenantId_teacherCode: {
          tenantId,
          teacherCode: validatedData.teacherCode
        }
      }
    })

    if (existingTeacher) {
      return { success: false, error: 'Bu o\'qituvchi kodi allaqachon ishlatilgan' }
    }

    // Hash password
    const passwordHash = await hashPassword(validatedData.password)

    // Create user
    const user = await db.user.create({
      data: {
        email: validatedData.email,
        fullName: validatedData.fullName,
        phone: validatedData.phone || null,
        passwordHash,
        role: 'TEACHER',
        tenantId,
        isActive: true,
      }
    })

    // Create teacher
    const teacher = await db.teacher.create({
      data: {
        tenantId,
        userId: user.id,
        teacherCode: validatedData.teacherCode,
        specialization: validatedData.specialization,
        education: validatedData.education || null,
        experienceYears: validatedData.experienceYears || null,
        salaryInfo: {
          monthlySalary: validatedData.monthlySalary,
          currency: 'UZS',
          lastUpdated: new Date().toISOString(),
        },
      }
    })

    revalidatePath('/admin/teachers')
    revalidatePath('/admin') // Dashboard: totalTeachers
    
    return { 
      success: true, 
      teacher,
      credentials: {
        email: validatedData.email,
        password: validatedData.password
      }
    }
  } catch (error: any) {
    console.error('Create teacher error:', error)
    return { success: false, error: error.message || 'Xatolik yuz berdi' }
  }
}

export async function updateTeacher(teacherId: string, data: Partial<Omit<TeacherFormData, 'password' | 'email'>>) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return { success: false, error: 'Ruxsat berilmagan' }
    }

    const tenantId = session.user.tenantId!

    // Check if teacher code is being changed and is unique
    if (data.teacherCode) {
      const existingTeacher = await db.teacher.findFirst({
        where: {
          tenantId,
          teacherCode: data.teacherCode,
          NOT: { id: teacherId }
        }
      })

      if (existingTeacher) {
        return { success: false, error: 'Bu o\'qituvchi kodi allaqachon ishlatilgan' }
      }
    }

    // Get teacher with user
    const teacher = await db.teacher.findUnique({
      where: { id: teacherId },
      include: { user: true }
    })

    if (!teacher) {
      return { success: false, error: 'O\'qituvchi topilmadi' }
    }

    // Update user
    await db.user.update({
      where: { id: teacher.userId },
      data: {
        fullName: data.fullName,
        phone: data.phone || null,
      }
    })

    // Update teacher
    const updatedTeacher = await db.teacher.update({
      where: { id: teacherId },
      data: {
        teacherCode: data.teacherCode,
        specialization: data.specialization,
        education: data.education || null,
        experienceYears: data.experienceYears || null,
      }
    })

    revalidatePath('/admin/teachers')
    revalidatePath('/admin') // Dashboard: totalTeachers
    
    return { success: true, teacher: updatedTeacher }
  } catch (error: any) {
    console.error('Update teacher error:', error)
    return { success: false, error: error.message || 'Xatolik yuz berdi' }
  }
}

export async function deactivateTeacher(teacherId: string) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return { success: false, error: 'Ruxsat berilmagan' }
    }

    const tenantId = session.user.tenantId!

    const teacher = await db.teacher.findFirst({
      where: { id: teacherId, tenantId },
      include: { user: true }
    })

    if (!teacher) {
      return { success: false, error: 'O\'qituvchi topilmadi' }
    }

    // Deactivate user account
    await db.user.update({
      where: { id: teacher.userId },
      data: { isActive: false }
    })

    revalidatePath('/admin/teachers')
    revalidatePath('/admin') // Dashboard: totalTeachers
    
    return { success: true }
  } catch (error: any) {
    console.error('Deactivate teacher error:', error)
    return { success: false, error: error.message || 'Xatolik yuz berdi' }
  }
}

export async function deleteTeacher(teacherId: string) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return { success: false, error: 'Ruxsat berilmagan' }
    }

    const tenantId = session.user.tenantId!

    // Check if teacher has related data
    const teacher = await db.teacher.findFirst({
      where: { id: teacherId, tenantId },
      include: {
        user: true,
        _count: {
          select: {
            classSubjects: true,
            classTeacher: true,
            grades: true,
          }
        }
      }
    })

    if (!teacher) {
      return { success: false, error: 'O\'qituvchi topilmadi' }
    }

    // Prevent deletion if has important data
    if (teacher._count.classSubjects > 0 || teacher._count.classTeacher > 0 || teacher._count.grades > 0) {
      return { 
        success: false, 
        error: 'O\'qituvchi sinf yoki fanlarga biriktirilgan. Avval barcha bog\'lanishlarni olib tashlang yoki deactivate qiling.' 
      }
    }

    // Delete teacher first
    await db.teacher.delete({
      where: { id: teacherId }
    })

    // Delete user account
    await db.user.delete({
      where: { id: teacher.userId }
    })

    revalidatePath('/admin/teachers')
    revalidatePath('/admin') // Dashboard: totalTeachers
    
    return { success: true }
  } catch (error: any) {
    console.error('Delete teacher error:', error)
    return { success: false, error: error.message || 'Xatolik yuz berdi' }
  }
}

// Bulk Operations
export async function bulkDeleteTeachers(teacherIds: string[]) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return { success: false, error: 'Ruxsat berilmagan' }
    }

    const tenantId = session.user.tenantId!

    // Check which teachers are safe to delete
    const teachers = await db.teacher.findMany({
      where: { 
        id: { in: teacherIds },
        tenantId 
      },
      include: {
        user: true,
        _count: {
          select: {
            classSubjects: true,
            classTeacher: true,
            grades: true,
          }
        }
      }
    })

    const safeToDelete = teachers.filter(t => 
      t._count.classSubjects === 0 && t._count.classTeacher === 0 && t._count.grades === 0
    )

    if (safeToDelete.length === 0) {
      return { 
        success: false, 
        error: 'Hech bir o\'qituvchini o\'chirib bo\'lmaydi. Sinf yoki fanlarga biriktirilgan.' 
      }
    }

    const safeIds = safeToDelete.map(t => t.id)
    const userIds = safeToDelete.map(t => t.userId)

    // Delete teachers
    await db.teacher.deleteMany({
      where: { id: { in: safeIds } }
    })

    // Delete user accounts
    await db.user.deleteMany({
      where: { id: { in: userIds } }
    })

    revalidatePath('/admin/teachers')
    revalidatePath('/admin') // Dashboard: totalTeachers
    
    return { 
      success: true, 
      deleted: safeToDelete.length,
      skipped: teacherIds.length - safeToDelete.length
    }
  } catch (error: any) {
    console.error('Bulk delete teachers error:', error)
    return { success: false, error: error.message || 'Xatolik yuz berdi' }
  }
}

export async function bulkDeactivateTeachers(teacherIds: string[]) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return { success: false, error: 'Ruxsat berilmagan' }
    }

    const tenantId = session.user.tenantId!

    // Get teachers
    const teachers = await db.teacher.findMany({
      where: { 
        id: { in: teacherIds },
        tenantId 
      }
    })

    const userIds = teachers.map(t => t.userId)

    // Deactivate user accounts
    const result = await db.user.updateMany({
      where: { id: { in: userIds } },
      data: { isActive: false }
    })

    revalidatePath('/admin/teachers')
    revalidatePath('/admin') // Dashboard: totalTeachers
    
    return { success: true, updated: result.count }
  } catch (error: any) {
    console.error('Bulk deactivate teachers error:', error)
    return { success: false, error: error.message || 'Xatolik yuz berdi' }
  }
}

