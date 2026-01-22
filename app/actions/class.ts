'use server'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { classSchema, ClassFormData } from '@/lib/validations/class'
import { revalidatePath } from 'next/cache'
import { getCurrentAcademicYear } from '@/lib/utils'

export async function createClass(data: ClassFormData) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return { success: false, error: 'Ruxsat berilmagan' }
    }

    const tenantId = session.user.tenantId!
    const academicYear = getCurrentAcademicYear()

    // Validate data
    const validatedData = classSchema.parse(data)

    // Check if class name already exists for this academic year
    const existingClass = await db.class.findFirst({
      where: {
        tenantId,
        name: validatedData.name,
        academicYear
      }
    })

    if (existingClass) {
      return { success: false, error: 'Bu sinf nomi allaqachon mavjud' }
    }

    // Create class
    const newClass = await db.class.create({
      data: {
        tenantId,
        name: validatedData.name,
        gradeLevel: validatedData.gradeLevel,
        classTeacherId: validatedData.classTeacherId || null,
        roomNumber: validatedData.roomNumber || null,
        maxStudents: validatedData.maxStudents,
        academicYear,
      }
    })

    revalidatePath('/admin/classes')
    revalidatePath('/admin') // Dashboard: totalClasses
    
    return { success: true, class: newClass }
  } catch (error: any) {
    console.error('Create class error:', error)
    return { success: false, error: error.message || 'Xatolik yuz berdi' }
  }
}

export async function updateClass(classId: string, data: Partial<ClassFormData>) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return { success: false, error: 'Ruxsat berilmagan' }
    }

    const tenantId = session.user.tenantId!
    const academicYear = getCurrentAcademicYear()

    // Check if class name is being changed and is unique
    if (data.name) {
      const existingClass = await db.class.findFirst({
        where: {
          tenantId,
          name: data.name,
          academicYear,
          NOT: { id: classId }
        }
      })

      if (existingClass) {
        return { success: false, error: 'Bu sinf nomi allaqachon mavjud' }
      }
    }

    // Update class
    const updatedClass = await db.class.update({
      where: { id: classId },
      data: {
        name: data.name,
        gradeLevel: data.gradeLevel,
        classTeacherId: data.classTeacherId || null,
        roomNumber: data.roomNumber || null,
        maxStudents: data.maxStudents,
      }
    })

    revalidatePath('/admin/classes')
    revalidatePath('/admin') // Dashboard: totalClasses
    
    return { success: true, class: updatedClass }
  } catch (error: any) {
    console.error('Update class error:', error)
    return { success: false, error: error.message || 'Xatolik yuz berdi' }
  }
}

export async function deleteClass(classId: string) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return { success: false, error: 'Ruxsat berilmagan' }
    }

    const tenantId = session.user.tenantId!

    // Check if class has students
    const classItem = await db.class.findFirst({
      where: { id: classId, tenantId },
      include: {
        _count: {
          select: {
            students: true,
            classSubjects: true,
          }
        }
      }
    })

    if (!classItem) {
      return { success: false, error: 'Sinf topilmadi' }
    }

    // Prevent deletion if has students
    if (classItem._count.students > 0) {
      return { 
        success: false, 
        error: 'Sinfda o\'quvchilar mavjud. Avval o\'quvchilarni boshqa sinfga o\'tkazing.' 
      }
    }

    // Delete class subjects first
    await db.classSubject.deleteMany({
      where: { classId }
    })

    // Delete schedules
    await db.schedule.deleteMany({
      where: { classId }
    })

    // Safe to delete class
    await db.class.delete({
      where: { id: classId }
    })

    revalidatePath('/admin/classes')
    revalidatePath('/admin') // Dashboard: totalClasses
    
    return { success: true }
  } catch (error: any) {
    console.error('Delete class error:', error)
    return { success: false, error: error.message || 'Xatolik yuz berdi' }
  }
}

// ============================================
// CLASS SUBJECT ACTIONS
// ============================================

export async function addClassSubject(data: {
  classId: string
  subjectId: string
  teacherId: string
  hoursPerWeek?: number
}) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return { success: false, error: 'Ruxsat berilmagan' }
    }

    const tenantId = session.user.tenantId!

    // Check if already exists
    const existing = await db.classSubject.findFirst({
      where: {
        classId: data.classId,
        subjectId: data.subjectId,
      }
    })

    if (existing) {
      return { success: false, error: 'Bu fan allaqachon sinfga biriktirilgan' }
    }

    // Create class subject
    await db.classSubject.create({
      data: {
        tenantId,
        classId: data.classId,
        subjectId: data.subjectId,
        teacherId: data.teacherId,
        hoursPerWeek: data.hoursPerWeek || 2,
      }
    })

    revalidatePath('/admin/classes')
    revalidatePath(`/admin/classes/${data.classId}`)
    revalidatePath('/teacher/classes') // Teacher panel
    
    return { success: true }
  } catch (error: any) {
    console.error('Add class subject error:', error)
    return { success: false, error: error.message || 'Xatolik yuz berdi' }
  }
}

export async function removeClassSubject(classSubjectId: string) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return { success: false, error: 'Ruxsat berilmagan' }
    }

    const classSubject = await db.classSubject.findUnique({
      where: { id: classSubjectId }
    })

    if (!classSubject) {
      return { success: false, error: 'ClassSubject topilmadi' }
    }

    await db.classSubject.delete({
      where: { id: classSubjectId }
    })

    revalidatePath('/admin/classes')
    revalidatePath(`/admin/classes/${classSubject.classId}`)
    revalidatePath('/teacher/classes') // Teacher panel
    
    return { success: true }
  } catch (error: any) {
    console.error('Remove class subject error:', error)
    return { success: false, error: error.message || 'Xatolik yuz berdi' }
  }
}

