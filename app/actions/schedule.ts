'use server'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { getCurrentAcademicYear } from '@/lib/utils'
import { scheduleSchema, checkTimeConflict } from '@/lib/validations/schedule'

interface TimeSlot {
  id: string
  startTime: string
  endTime: string
  label: string
}

type ScheduleType = 'LESSON' | 'BREAK' | 'LUNCH'

interface ScheduleItemInput {
  id: string
  dayOfWeek: number
  timeSlotId: string
  type: ScheduleType
  title?: string // For break/lunch
  subjectId?: string
  teacherId?: string
  roomNumber?: string
  startTime?: string
  endTime?: string
}

const DEFAULT_TIME_SLOTS: TimeSlot[] = [
  { id: '1', startTime: '08:00', endTime: '08:45', label: '1-dars' },
  { id: '2', startTime: '08:55', endTime: '09:40', label: '2-dars' },
  { id: '3', startTime: '09:50', endTime: '10:35', label: '3-dars' },
  { id: '4', startTime: '10:55', endTime: '11:40', label: '4-dars' },
  { id: '5', startTime: '11:50', endTime: '12:35', label: '5-dars' },
  { id: '6', startTime: '12:45', endTime: '13:30', label: '6-dars' },
  { id: '7', startTime: '13:40', endTime: '14:25', label: '7-dars' },
]

export async function saveSchedules(
  classId: string,
  schedules: ScheduleItemInput[],
  customTimeSlots?: TimeSlot[]
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
      return { success: false, error: 'Ruxsat berilmagan' }
    }

    const tenantId = session.user.tenantId!
    const academicYear = getCurrentAcademicYear()

    // Validate class belongs to tenant (skip for SUPER_ADMIN)
    const classItem = await db.class.findFirst({
      where: { 
        id: classId, 
        ...(session.user.role !== 'SUPER_ADMIN' && { tenantId })
      }
    })

    if (!classItem) {
      return { success: false, error: 'Sinf topilmadi' }
    }

    const timeSlots = customTimeSlots || DEFAULT_TIME_SLOTS

    // Validate schedules based on type
    const validSchedules = schedules.filter(s => {
      if (s.type === 'LESSON') {
        // Lessons need subject and teacher
        return s.subjectId && s.teacherId
      }
      // Breaks and lunch are always valid
      return true
    })

    if (validSchedules.length === 0) {
      return { success: false, error: 'Hech bo\'lmaganda bitta element qo\'shing' }
    }

    // Delete existing schedules for this class
    await db.schedule.deleteMany({
      where: {
        tenantId: classItem.tenantId,
        classId,
        academicYear
      }
    })

    // Create new schedules
    const schedulesToCreate = validSchedules.map(s => {
      let startTime = s.startTime
      let endTime = s.endTime

      // If times not provided, look up from timeSlot
      if (!startTime || !endTime) {
        const timeSlot = timeSlots.find(t => t.id === s.timeSlotId)
        if (timeSlot) {
          startTime = timeSlot.startTime
          endTime = timeSlot.endTime
        }
      }
      
      return {
        tenantId: classItem.tenantId,
        classId,
        type: s.type,
        title: s.title || null,
        subjectId: s.subjectId || null,
        teacherId: s.teacherId || null,
        dayOfWeek: s.dayOfWeek,
        startTime: startTime || '08:00',
        endTime: endTime || '08:45',
        roomNumber: s.roomNumber || null,
        academicYear
      }
    })

    if (schedulesToCreate.length > 0) {
      await db.schedule.createMany({
        data: schedulesToCreate
      })
    }

    revalidatePath('/admin/schedules')
    revalidatePath('/admin/schedules/builder')
    revalidatePath('/admin')

    return { 
      success: true,
      message: `${schedulesToCreate.length} ta dars saqlandi`
    }
  } catch (error) {
    console.error('Save schedules error:', error)
    return { success: false, error: 'Xatolik yuz berdi' }
  }
}

export async function createSchedule(data: {
  classId: string
  subjectId: string
  teacherId: string
  dayOfWeek: number
  startTime: string
  endTime: string
  roomNumber?: string
  academicYear: string
}) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
      return { success: false, error: 'Ruxsat berilmagan' }
    }

    const tenantId = session.user.tenantId!
    const validatedData = scheduleSchema.parse(data)

    const classItem = await db.class.findFirst({
      where: {
        id: validatedData.classId,
        ...(session.user.role !== 'SUPER_ADMIN' && { tenantId }),
      },
      select: {
        id: true,
        tenantId: true,
      },
    })

    if (!classItem) {
      return { success: false, error: 'Sinf topilmadi' }
    }

    const [subject, teacher] = await Promise.all([
      db.subject.findFirst({
        where: {
          id: validatedData.subjectId,
          ...(session.user.role !== 'SUPER_ADMIN' && { tenantId: classItem.tenantId }),
        },
        select: { id: true },
      }),
      db.teacher.findFirst({
        where: {
          id: validatedData.teacherId,
          ...(session.user.role !== 'SUPER_ADMIN' && { tenantId: classItem.tenantId }),
        },
        select: { id: true },
      }),
    ])

    if (!subject) {
      return { success: false, error: 'Fan topilmadi' }
    }

    if (!teacher) {
      return { success: false, error: 'O\'qituvchi topilmadi' }
    }

    const existingSchedules = await db.schedule.findMany({
      where: {
        tenantId: classItem.tenantId,
        classId: validatedData.classId,
        dayOfWeek: validatedData.dayOfWeek,
        academicYear: validatedData.academicYear,
      },
      select: {
        startTime: true,
        endTime: true,
      },
    })

    const hasConflict = existingSchedules.some((schedule) =>
      checkTimeConflict(
        { startTime: schedule.startTime, endTime: schedule.endTime },
        { startTime: validatedData.startTime, endTime: validatedData.endTime }
      )
    )

    if (hasConflict) {
      return { success: false, error: 'Bu vaqt oralig\'ida dars mavjud' }
    }

    await db.schedule.create({
      data: {
        tenantId: classItem.tenantId,
        classId: validatedData.classId,
        subjectId: validatedData.subjectId,
        teacherId: validatedData.teacherId,
        dayOfWeek: validatedData.dayOfWeek,
        startTime: validatedData.startTime,
        endTime: validatedData.endTime,
        roomNumber: validatedData.roomNumber || null,
        academicYear: validatedData.academicYear || getCurrentAcademicYear(),
      },
    })

    revalidatePath('/admin/schedules')
    revalidatePath('/admin/schedules/builder')
    revalidatePath('/admin')

    return { success: true }
  } catch (error) {
    console.error('Create schedule error:', error)
    return { success: false, error: 'Xatolik yuz berdi' }
  }
}

export async function deleteSchedule(scheduleId: string) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
      return { success: false, error: 'Ruxsat berilmagan' }
    }

    const tenantId = session.user.tenantId

    await db.schedule.delete({
      where: {
        id: scheduleId,
        ...(session.user.role !== 'SUPER_ADMIN' && tenantId && { tenantId })
      }
    })

    revalidatePath('/admin/schedules')
    revalidatePath('/admin/schedules/builder')

    return { success: true, message: 'Dars o\'chirildi' }
  } catch (error) {
    console.error('Delete schedule error:', error)
    return { success: false, error: 'Xatolik yuz berdi' }
  }
}
