'use server'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { gradeSchema, GradeFormData, bulkGradeSchema, BulkGradeFormData } from '@/lib/validations/grade'
import { revalidatePath } from 'next/cache'

export async function createGrade(data: GradeFormData) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || (session.user.role !== 'TEACHER' && session.user.role !== 'ADMIN')) {
      return { success: false, error: 'Ruxsat berilmagan' }
    }

    const tenantId = session.user.tenantId!

    // Validate data
    const validatedData = gradeSchema.parse(data)

    // Get teacher ID if user is teacher
    let teacherId: string | null = null
    if (session.user.role === 'TEACHER') {
      const teacher = await db.teacher.findFirst({
        where: { userId: session.user.id }
      })
      if (!teacher) {
        return { success: false, error: 'O\'qituvchi topilmadi' }
      }
      teacherId = teacher.id
    }

    // Create grade
    const grade = await db.grade.create({
      data: {
        tenantId,
        studentId: validatedData.studentId,
        subjectId: validatedData.subjectId,
        teacherId: teacherId!,
        gradeType: validatedData.gradeType,
        score: validatedData.score,
        maxScore: validatedData.maxScore,
        percentage: (validatedData.score / validatedData.maxScore) * 100,
        quarter: validatedData.quarter || null,
        academicYear: validatedData.academicYear,
        date: new Date(validatedData.date),
        notes: validatedData.notes || null,
      }
    })

    revalidatePath('/teacher/grades')
    revalidatePath('/admin/students')
    revalidatePath('/admin') // Dashboard: grade distribution chart
    
    return { success: true, grade }
  } catch (error: any) {
    console.error('Create grade error:', error)
    return { success: false, error: error.message || 'Xatolik yuz berdi' }
  }
}

export async function createBulkGrades(data: BulkGradeFormData) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || (session.user.role !== 'TEACHER' && session.user.role !== 'ADMIN')) {
      return { success: false, error: 'Ruxsat berilmagan' }
    }

    const tenantId = session.user.tenantId!

    // Validate data
    const validatedData = bulkGradeSchema.parse(data)

    // Get teacher ID if user is teacher
    let teacherId: string | null = null
    if (session.user.role === 'TEACHER') {
      const teacher = await db.teacher.findFirst({
        where: { userId: session.user.id }
      })
      if (!teacher) {
        return { success: false, error: 'O\'qituvchi topilmadi' }
      }
      teacherId = teacher.id
    }

    // Create grades for all students
    const grades = await db.grade.createMany({
      data: validatedData.grades.map(g => ({
        tenantId,
        studentId: g.studentId,
        subjectId: validatedData.subjectId,
        teacherId: teacherId!,
        gradeType: validatedData.gradeType,
        score: g.score,
        maxScore: validatedData.maxScore,
        percentage: (g.score / validatedData.maxScore) * 100,
        quarter: validatedData.quarter || null,
        academicYear: validatedData.academicYear,
        date: new Date(validatedData.date),
        notes: validatedData.notes || null,
      }))
    })

    revalidatePath('/teacher/grades')
    revalidatePath('/admin/students')
    revalidatePath('/admin') // Dashboard: grade distribution chart
    
    return { success: true, count: grades.count }
  } catch (error: any) {
    console.error('Create bulk grades error:', error)
    return { success: false, error: error.message || 'Xatolik yuz berdi' }
  }
}

export async function updateGrade(gradeId: string, data: Partial<GradeFormData>) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || (session.user.role !== 'TEACHER' && session.user.role !== 'ADMIN')) {
      return { success: false, error: 'Ruxsat berilmagan' }
    }

    const tenantId = session.user.tenantId!

    // Check if grade belongs to this tenant
    const existingGrade = await db.grade.findFirst({
      where: { id: gradeId, tenantId }
    })

    if (!existingGrade) {
      return { success: false, error: 'Baho topilmadi' }
    }

    // Update grade
    const updateData: any = {
      gradeType: data.gradeType,
      date: data.date ? new Date(data.date) : undefined,
      notes: data.notes || null,
      quarter: data.quarter,
      academicYear: data.academicYear,
    }

    // Update score and calculate percentage
    if (data.score !== undefined && data.maxScore !== undefined) {
      updateData.score = data.score
      updateData.maxScore = data.maxScore
      updateData.percentage = (data.score / data.maxScore) * 100
    } else if (data.score !== undefined) {
      updateData.score = data.score
      updateData.percentage = (data.score / existingGrade.maxScore.toNumber()) * 100
    } else if (data.maxScore !== undefined) {
      updateData.maxScore = data.maxScore
      updateData.percentage = (existingGrade.score.toNumber() / data.maxScore) * 100
    }

    const grade = await db.grade.update({
      where: { id: gradeId },
      data: updateData
    })

    revalidatePath('/teacher/grades')
    revalidatePath('/admin/students')
    revalidatePath('/admin') // Dashboard: grade distribution chart
    
    return { success: true, grade }
  } catch (error: any) {
    console.error('Update grade error:', error)
    return { success: false, error: error.message || 'Xatolik yuz berdi' }
  }
}

export async function deleteGrade(gradeId: string) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || (session.user.role !== 'TEACHER' && session.user.role !== 'ADMIN')) {
      return { success: false, error: 'Ruxsat berilmagan' }
    }

    const tenantId = session.user.tenantId!

    // Check if grade belongs to this tenant
    const existingGrade = await db.grade.findFirst({
      where: { id: gradeId, tenantId }
    })

    if (!existingGrade) {
      return { success: false, error: 'Baho topilmadi' }
    }

    await db.grade.delete({
      where: { id: gradeId }
    })

    revalidatePath('/teacher/grades')
    revalidatePath('/admin/students')
    revalidatePath('/admin') // Dashboard: grade distribution chart
    
    return { success: true }
  } catch (error: any) {
    console.error('Delete grade error:', error)
    return { success: false, error: error.message || 'Xatolik yuz berdi' }
  }
}

