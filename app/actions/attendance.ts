'use server'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { attendanceSchema, AttendanceFormData, bulkAttendanceSchema, BulkAttendanceFormData } from '@/lib/validations/attendance'
import { revalidatePath } from 'next/cache'

export async function createAttendance(data: AttendanceFormData) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || (session.user.role !== 'TEACHER' && session.user.role !== 'ADMIN')) {
      return { success: false, error: 'Ruxsat berilmagan' }
    }

    const tenantId = session.user.tenantId!

    // Validate data
    const validatedData = attendanceSchema.parse(data)

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

    // Check if attendance already exists for this student, class, and date
    const existingAttendance = await db.attendance.findFirst({
      where: {
        studentId: validatedData.studentId,
        classId: validatedData.classId,
        date: new Date(validatedData.date),
      }
    })

    if (existingAttendance) {
      // Update existing attendance
      const attendance = await db.attendance.update({
        where: { id: existingAttendance.id },
        data: {
          status: validatedData.status,
          notes: validatedData.notes || null,
          teacherId: teacherId || validatedData.teacherId,
        }
      })

      revalidatePath('/teacher/attendance')
      revalidatePath('/admin/students')
    revalidatePath('/admin') // Dashboard: todayAttendance
      revalidatePath('/admin') // Dashboard: todayAttendance
      
      return { success: true, attendance }
    } else {
      // Create new attendance
      const attendance = await db.attendance.create({
        data: {
          tenantId,
          studentId: validatedData.studentId,
          classId: validatedData.classId,
          subjectId: validatedData.subjectId,
          teacherId: teacherId || validatedData.teacherId,
          date: new Date(validatedData.date),
          status: validatedData.status,
          notes: validatedData.notes || null,
        }
      })

      revalidatePath('/teacher/attendance')
      revalidatePath('/admin/students')
    revalidatePath('/admin') // Dashboard: todayAttendance
      revalidatePath('/admin') // Dashboard: todayAttendance
      
      return { success: true, attendance }
    }
  } catch (error: any) {
    console.error('Create attendance error:', error)
    return { success: false, error: error.message || 'Xatolik yuz berdi' }
  }
}

export async function createBulkAttendance(data: BulkAttendanceFormData) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || (session.user.role !== 'TEACHER' && session.user.role !== 'ADMIN')) {
      return { success: false, error: 'Ruxsat berilmagan' }
    }

    const tenantId = session.user.tenantId!

    // Validate data
    const validatedData = bulkAttendanceSchema.parse(data)

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

    const date = new Date(validatedData.date)

    // Delete existing attendance for this class and date
    await db.attendance.deleteMany({
      where: {
        classId: validatedData.classId,
        date: date,
      }
    })

    // Create new attendance records
    const attendances = await db.attendance.createMany({
      data: validatedData.attendances.map(a => ({
        tenantId,
        studentId: a.studentId,
        classId: validatedData.classId,
        subjectId: validatedData.subjectId,
        teacherId: teacherId || validatedData.teacherId,
        date: date,
        status: a.status,
        notes: validatedData.notes || null,
      }))
    })

    revalidatePath('/teacher/attendance')
    revalidatePath('/admin/students')
    revalidatePath('/admin') // Dashboard: todayAttendance
    
    return { success: true, count: attendances.count }
  } catch (error: any) {
    console.error('Create bulk attendance error:', error)
    return { success: false, error: error.message || 'Xatolik yuz berdi' }
  }
}

export async function updateAttendance(attendanceId: string, data: Partial<AttendanceFormData>) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || (session.user.role !== 'TEACHER' && session.user.role !== 'ADMIN')) {
      return { success: false, error: 'Ruxsat berilmagan' }
    }

    const tenantId = session.user.tenantId!

    // Check if attendance belongs to this tenant
    const existingAttendance = await db.attendance.findFirst({
      where: { id: attendanceId, tenantId }
    })

    if (!existingAttendance) {
      return { success: false, error: 'Davomat topilmadi' }
    }

    // Update attendance
    const attendance = await db.attendance.update({
      where: { id: attendanceId },
      data: {
        status: data.status,
        date: data.date ? new Date(data.date) : undefined,
        notes: data.notes || null,
      }
    })

    revalidatePath('/teacher/attendance')
    revalidatePath('/admin/students')
    revalidatePath('/admin') // Dashboard: todayAttendance
    
    return { success: true, attendance }
  } catch (error: any) {
    console.error('Update attendance error:', error)
    return { success: false, error: error.message || 'Xatolik yuz berdi' }
  }
}

export async function deleteAttendance(attendanceId: string) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || (session.user.role !== 'TEACHER' && session.user.role !== 'ADMIN')) {
      return { success: false, error: 'Ruxsat berilmagan' }
    }

    const tenantId = session.user.tenantId!

    // Check if attendance belongs to this tenant
    const existingAttendance = await db.attendance.findFirst({
      where: { id: attendanceId, tenantId }
    })

    if (!existingAttendance) {
      return { success: false, error: 'Davomat topilmadi' }
    }

    await db.attendance.delete({
      where: { id: attendanceId }
    })

    revalidatePath('/teacher/attendance')
    revalidatePath('/admin/students')
    revalidatePath('/admin') // Dashboard: todayAttendance
    
    return { success: true }
  } catch (error: any) {
    console.error('Delete attendance error:', error)
    return { success: false, error: error.message || 'Xatolik yuz berdi' }
  }
}

