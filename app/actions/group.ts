'use server'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { groupSchema, GroupFormData } from '@/lib/validations/group'
import { revalidatePath } from 'next/cache'
import { getCurrentAcademicYear } from '@/lib/utils'

export async function createGroup(data: GroupFormData) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return { success: false, error: 'Ruxsat berilmagan' }
    }

    const tenantId = session.user.tenantId!
    const academicYear = getCurrentAcademicYear()

    // Validate data
    const validatedData = groupSchema.parse(data)

    // Check if group name already exists for this academic year
    const existingGroup = await db.group.findFirst({
      where: {
        tenantId,
        name: validatedData.name,
        academicYear
      }
    })

    if (existingGroup) {
      return { success: false, error: 'Bu guruh nomi allaqachon mavjud' }
    }

    // Check if code already exists (if provided)
    if (validatedData.code) {
      const existingCode = await db.group.findFirst({
        where: {
          tenantId,
          code: validatedData.code,
          academicYear
        }
      })

      if (existingCode) {
        return { success: false, error: 'Bu guruh kodi allaqachon mavjud' }
      }
    }

    // Create group
    const newGroup = await db.group.create({
      data: {
        tenantId,
        name: validatedData.name,
        description: validatedData.description || null,
        code: validatedData.code || null,
        groupTeacherId: validatedData.groupTeacherId || null,
        roomNumber: validatedData.roomNumber || null,
        maxStudents: validatedData.maxStudents,
        academicYear,
      }
    })

    revalidatePath('/admin/groups')
    revalidatePath('/admin') // Dashboard
    
    return { success: true, group: newGroup }
  } catch (error: any) {
    console.error('Create group error:', error)
    return { success: false, error: error.message || 'Xatolik yuz berdi' }
  }
}

export async function updateGroup(groupId: string, data: Partial<GroupFormData>) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return { success: false, error: 'Ruxsat berilmagan' }
    }

    const tenantId = session.user.tenantId!
    const academicYear = getCurrentAcademicYear()

    // Check if group name is being changed and is unique
    if (data.name) {
      const existingGroup = await db.group.findFirst({
        where: {
          tenantId,
          name: data.name,
          academicYear,
          NOT: { id: groupId }
        }
      })

      if (existingGroup) {
        return { success: false, error: 'Bu guruh nomi allaqachon mavjud' }
      }
    }

    // Check if code is being changed and is unique
    if (data.code) {
      const existingCode = await db.group.findFirst({
        where: {
          tenantId,
          code: data.code,
          academicYear,
          NOT: { id: groupId }
        }
      })

      if (existingCode) {
        return { success: false, error: 'Bu guruh kodi allaqachon mavjud' }
      }
    }

    // Update group
    const updatedGroup = await db.group.update({
      where: { id: groupId },
      data: {
        name: data.name,
        description: data.description || null,
        code: data.code || null,
        groupTeacherId: data.groupTeacherId || null,
        roomNumber: data.roomNumber || null,
        maxStudents: data.maxStudents,
      }
    })

    revalidatePath('/admin/groups')
    revalidatePath('/admin') // Dashboard
    
    return { success: true, group: updatedGroup }
  } catch (error: any) {
    console.error('Update group error:', error)
    return { success: false, error: error.message || 'Xatolik yuz berdi' }
  }
}

export async function deleteGroup(groupId: string) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return { success: false, error: 'Ruxsat berilmagan' }
    }

    const tenantId = session.user.tenantId!

    // Check if group has students
    const group = await db.group.findFirst({
      where: { id: groupId, tenantId },
      include: {
        _count: {
          select: {
            students: true,
            groupSubjects: true,
          }
        }
      }
    })

    if (!group) {
      return { success: false, error: 'Guruh topilmadi' }
    }

    // Prevent deletion if has students
    if (group._count.students > 0) {
      return { 
        success: false, 
        error: 'Guruhda o\'quvchilar mavjud. Avval o\'quvchilarni boshqa guruhga o\'tkazing.' 
      }
    }

    // Delete group subjects first
    await db.groupSubject.deleteMany({
      where: { groupId }
    })

    // Delete schedules
    await db.groupSchedule.deleteMany({
      where: { groupId }
    })

    // Safe to delete group
    await db.group.delete({
      where: { id: groupId }
    })

    revalidatePath('/admin/groups')
    revalidatePath('/admin') // Dashboard
    
    return { success: true }
  } catch (error: any) {
    console.error('Delete group error:', error)
    return { success: false, error: error.message || 'Xatolik yuz berdi' }
  }
}

