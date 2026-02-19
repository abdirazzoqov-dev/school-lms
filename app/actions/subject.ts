'use server'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

// Validation schema
const subjectSchema = z.object({
  name: z.string().min(2, 'Fan nomi kamida 2 ta belgidan iborat bo\'lishi kerak'),
  code: z.string().min(2, 'Kod kamida 2 ta belgidan iborat bo\'lishi kerak').regex(/^[A-Z_]+$/, 'Kod faqat katta harflar va _ dan iborat bo\'lishi kerak'),
  description: z.string().optional(),
  color: z.string().optional(),
})

// Create subject
export async function createSubject(data: z.infer<typeof subjectSchema>) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'MODERATOR')) {
      return { success: false, error: 'Ruxsat yo\'q' }
    }

    const tenantId = session.user.tenantId!

    // Validate
    const validated = subjectSchema.parse(data)

    // Check if code already exists
    const existingSubject = await db.subject.findUnique({
      where: {
        tenantId_code: {
          tenantId,
          code: validated.code
        }
      }
    })

    if (existingSubject) {
      return { success: false, error: 'Bu kod allaqachon mavjud' }
    }

    // Create subject
    await db.subject.create({
      data: {
        ...validated,
        tenantId
      }
    })

    revalidatePath('/admin/subjects')
    revalidatePath('/admin') // Dashboard: totalSubjects
    return { success: true }
  } catch (error) {
    console.error('Create subject error:', error)
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message }
    }
    return { success: false, error: 'Xatolik yuz berdi' }
  }
}

// Update subject
export async function updateSubject(id: string, data: z.infer<typeof subjectSchema>) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'MODERATOR')) {
      return { success: false, error: 'Ruxsat yo\'q' }
    }

    const tenantId = session.user.tenantId!

    // Validate
    const validated = subjectSchema.parse(data)

    // Check if subject exists and belongs to tenant
    const subject = await db.subject.findFirst({
      where: { id, tenantId }
    })

    if (!subject) {
      return { success: false, error: 'Fan topilmadi' }
    }

    // Check if code already exists (excluding current subject)
    const existingSubject = await db.subject.findFirst({
      where: {
        tenantId,
        code: validated.code,
        id: { not: id }
      }
    })

    if (existingSubject) {
      return { success: false, error: 'Bu kod allaqachon mavjud' }
    }

    // Update subject
    await db.subject.update({
      where: { id },
      data: validated
    })

    revalidatePath('/admin/subjects')
    revalidatePath('/admin') // Dashboard: totalSubjects
    revalidatePath(`/admin/subjects/${id}/edit`)
    return { success: true }
  } catch (error) {
    console.error('Update subject error:', error)
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message }
    }
    return { success: false, error: 'Xatolik yuz berdi' }
  }
}

// Delete subject
export async function deleteSubject(id: string) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'MODERATOR')) {
      return { success: false, error: 'Ruxsat yo\'q' }
    }

    const tenantId = session.user.tenantId!

    // Check if subject exists and belongs to tenant
    const subject = await db.subject.findFirst({
      where: { id, tenantId }
    })

    if (!subject) {
      return { success: false, error: 'Fan topilmadi' }
    }

    // Check if subject is used in schedules
    const schedulesCount = await db.schedule.count({
      where: { subjectId: id }
    })

    if (schedulesCount > 0) {
      return { 
        success: false, 
        error: `Bu fan ${schedulesCount} ta dars jadvalida ishlatilmoqda. Avval dars jadvallarini o'chiring.` 
      }
    }

    // Check if subject is used in class subjects
    const classSubjectsCount = await db.classSubject.count({
      where: { subjectId: id }
    })

    if (classSubjectsCount > 0) {
      return { 
        success: false, 
        error: `Bu fan ${classSubjectsCount} ta sinfga biriktirilgan. Avval sinflardan o'chiring.` 
      }
    }

    // Delete subject
    await db.subject.delete({
      where: { id }
    })

    revalidatePath('/admin/subjects')
    revalidatePath('/admin') // Dashboard: totalSubjects
    return { success: true }
  } catch (error) {
    console.error('Delete subject error:', error)
    return { success: false, error: 'Xatolik yuz berdi' }
  }
}

// Bulk create subjects (for quick setup)
export async function bulkCreateSubjects(subjects: Array<{ name: string; code: string; description?: string; color?: string }>) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'MODERATOR')) {
      return { success: false, error: 'Ruxsat yo\'q' }
    }

    const tenantId = session.user.tenantId!

    // Create subjects
    const created = []
    const errors = []

    for (const subject of subjects) {
      try {
        // Check if code exists
        const existing = await db.subject.findUnique({
          where: {
            tenantId_code: {
              tenantId,
              code: subject.code
            }
          }
        })

        if (!existing) {
          await db.subject.create({
            data: {
              ...subject,
              tenantId
            }
          })
          created.push(subject.name)
        } else {
          errors.push(`${subject.name} - allaqachon mavjud`)
        }
      } catch (error) {
        errors.push(`${subject.name} - xatolik`)
      }
    }

    revalidatePath('/admin/subjects')
    revalidatePath('/admin') // Dashboard: totalSubjects

    return {
      success: true,
      data: {
        created: created.length,
        errors: errors.length,
        details: { created, errors }
      }
    }
  } catch (error) {
    console.error('Bulk create subjects error:', error)
    return { success: false, error: 'Xatolik yuz berdi' }
  }
}

