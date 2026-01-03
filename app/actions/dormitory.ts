'use server'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import {
  buildingSchema,
  updateBuildingSchema,
  roomSchema,
  updateRoomSchema,
  bedSchema,
  assignmentSchema,
  updateAssignmentSchema,
  type BuildingFormData,
  type RoomFormData,
  type BedFormData,
  type AssignmentFormData,
  type UpdateAssignmentFormData,
} from '@/lib/validations/dormitory'

// ============================================
// BUILDING ACTIONS
// ============================================

export async function createBuilding(data: BuildingFormData) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return { success: false, error: 'Unauthorized' }
    }

    const tenantId = session.user.tenantId!
    const validatedData = buildingSchema.parse(data)

    // Check if code already exists
    const existing = await db.dormitoryBuilding.findFirst({
      where: {
        tenantId,
        code: validatedData.code,
      },
    })

    if (existing) {
      return { success: false, error: 'Bu kod allaqachon mavjud' }
    }

    const building = await db.dormitoryBuilding.create({
      data: {
        tenantId,
        name: validatedData.name,
        code: validatedData.code,
        address: validatedData.address || null,
        description: validatedData.description || null,
        totalFloors: validatedData.totalFloors,
        gender: validatedData.gender === 'MIXED' ? null : (validatedData.gender as 'MALE' | 'FEMALE' | undefined),
        facilities: validatedData.facilities || [],
        rules: validatedData.rules || [],
        contactPerson: validatedData.contactPerson || null,
        contactPhone: validatedData.contactPhone || null,
      },
    })

    revalidatePath('/admin/dormitory')
    revalidatePath('/admin') // Dashboard: student dormitory info
    revalidatePath('/admin/dormitory/buildings')

    return { success: true, building }
  } catch (error: any) {
    console.error('Create building error:', error)
    return { success: false, error: error.message || 'Xatolik yuz berdi' }
  }
}

export async function updateBuilding(buildingId: string, data: Partial<BuildingFormData>) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return { success: false, error: 'Unauthorized' }
    }

    const tenantId = session.user.tenantId!
    const validatedData = updateBuildingSchema.parse(data)

    const building = await db.dormitoryBuilding.update({
      where: {
        id: buildingId,
        tenantId,
      },
      data: {
        ...(validatedData.name && { name: validatedData.name }),
        ...(validatedData.code && { code: validatedData.code }),
        ...(validatedData.address !== undefined && { address: validatedData.address || null }),
        ...(validatedData.description !== undefined && { description: validatedData.description || null }),
        ...(validatedData.totalFloors !== undefined && { totalFloors: validatedData.totalFloors }),
        ...(validatedData.gender !== undefined && { 
          gender: validatedData.gender === 'MIXED' ? null : (validatedData.gender as 'MALE' | 'FEMALE' | undefined) 
        }),
        ...(validatedData.facilities && { facilities: validatedData.facilities }),
        ...(validatedData.rules && { rules: validatedData.rules }),
        ...(validatedData.contactPerson !== undefined && { contactPerson: validatedData.contactPerson || null }),
        ...(validatedData.contactPhone !== undefined && { contactPhone: validatedData.contactPhone || null }),
      },
    })

    revalidatePath('/admin/dormitory')
    revalidatePath('/admin') // Dashboard: student dormitory info
    revalidatePath('/admin/dormitory/buildings')

    return { success: true, building }
  } catch (error: any) {
    console.error('Update building error:', error)
    return { success: false, error: error.message || 'Xatolik yuz berdi' }
  }
}

export async function deleteBuilding(buildingId: string) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return { success: false, error: 'Unauthorized' }
    }

    const tenantId = session.user.tenantId!

    // Check if building has rooms
    const roomCount = await db.dormitoryRoom.count({
      where: { buildingId },
    })

    if (roomCount > 0) {
      return { 
        success: false, 
        error: 'Binoda xonalar mavjud. Avval xonalarni o\'chiring' 
      }
    }

    await db.dormitoryBuilding.delete({
      where: {
        id: buildingId,
        tenantId,
      },
    })

    revalidatePath('/admin/dormitory')
    revalidatePath('/admin') // Dashboard: student dormitory info
    revalidatePath('/admin/dormitory/buildings')

    return { success: true }
  } catch (error: any) {
    console.error('Delete building error:', error)
    return { success: false, error: error.message || 'Xatolik yuz berdi' }
  }
}

// ============================================
// ROOM ACTIONS
// ============================================

export async function createRoom(data: RoomFormData) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return { success: false, error: 'Unauthorized' }
    }

    const tenantId = session.user.tenantId!
    const validatedData = roomSchema.parse(data)

    // Check if room already exists in building
    const existing = await db.dormitoryRoom.findFirst({
      where: {
        buildingId: validatedData.buildingId,
        roomNumber: validatedData.roomNumber,
      },
    })

    if (existing) {
      return { success: false, error: 'Bu xona raqami allaqachon mavjud' }
    }

    // Create room
    const room = await db.dormitoryRoom.create({
      data: {
        tenantId,
        buildingId: validatedData.buildingId,
        roomNumber: validatedData.roomNumber,
        floor: validatedData.floor,
        capacity: validatedData.capacity,
        roomType: validatedData.roomType,
        pricePerMonth: validatedData.pricePerMonth,
        gender: validatedData.gender === 'MIXED' ? null : (validatedData.gender as 'MALE' | 'FEMALE' | undefined),
        description: validatedData.description || null,
        amenities: validatedData.amenities || [],
      },
    })

    // Auto-create beds for the room
    const beds = []
    for (let i = 1; i <= validatedData.capacity; i++) {
      beds.push({
        tenantId,
        roomId: room.id,
        bedNumber: i.toString(),
        bedType: 'SINGLE',
      })
    }

    await db.dormitoryBed.createMany({
      data: beds,
    })

    // Update building cache
    await updateBuildingCache(validatedData.buildingId)

    revalidatePath('/admin/dormitory')
    revalidatePath('/admin') // Dashboard: student dormitory info
    revalidatePath('/admin/dormitory/rooms')

    return { success: true, room }
  } catch (error: any) {
    console.error('Create room error:', error)
    return { success: false, error: error.message || 'Xatolik yuz berdi' }
  }
}

export async function updateRoom(roomId: string, data: Partial<RoomFormData>) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return { success: false, error: 'Unauthorized' }
    }

    const tenantId = session.user.tenantId!
    const validatedData = updateRoomSchema.parse(data)

    const room = await db.dormitoryRoom.findFirst({
      where: { id: roomId, tenantId },
    })

    if (!room) {
      return { success: false, error: 'Xona topilmadi' }
    }

    const updatedRoom = await db.dormitoryRoom.update({
      where: { id: roomId },
      data: {
        ...(validatedData.roomNumber && { roomNumber: validatedData.roomNumber }),
        ...(validatedData.floor !== undefined && { floor: validatedData.floor }),
        ...(validatedData.roomType && { roomType: validatedData.roomType }),
        ...(validatedData.pricePerMonth !== undefined && { pricePerMonth: validatedData.pricePerMonth }),
        ...(validatedData.gender !== undefined && { 
          gender: validatedData.gender === 'MIXED' ? null : (validatedData.gender as 'MALE' | 'FEMALE' | undefined) 
        }),
        ...(validatedData.description !== undefined && { description: validatedData.description || null }),
        ...(validatedData.amenities && { amenities: validatedData.amenities }),
      },
    })

    revalidatePath('/admin/dormitory')
    revalidatePath('/admin') // Dashboard: student dormitory info
    revalidatePath('/admin/dormitory/rooms')

    return { success: true, room: updatedRoom }
  } catch (error: any) {
    console.error('Update room error:', error)
    return { success: false, error: error.message || 'Xatolik yuz berdi' }
  }
}

export async function deleteRoom(roomId: string) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return { success: false, error: 'Unauthorized' }
    }

    const tenantId = session.user.tenantId!

    const room = await db.dormitoryRoom.findFirst({
      where: { id: roomId, tenantId },
      include: { building: true },
    })

    if (!room) {
      return { success: false, error: 'Xona topilmadi' }
    }

    // Check if room has active assignments
    const activeAssignments = await db.dormitoryAssignment.count({
      where: { 
        roomId,
        status: 'ACTIVE',
      },
    })

    if (activeAssignments > 0) {
      return { 
        success: false, 
        error: 'Xonada faol o\'quvchilar bor. Avval ularni ko\'chirting' 
      }
    }

    // Delete beds first
    await db.dormitoryBed.deleteMany({
      where: { roomId },
    })

    // Delete room
    await db.dormitoryRoom.delete({
      where: { id: roomId },
    })

    // Update building cache
    await updateBuildingCache(room.buildingId)

    revalidatePath('/admin/dormitory')
    revalidatePath('/admin') // Dashboard: student dormitory info
    revalidatePath('/admin/dormitory/rooms')

    return { success: true }
  } catch (error: any) {
    console.error('Delete room error:', error)
    return { success: false, error: error.message || 'Xatolik yuz berdi' }
  }
}

// ============================================
// ASSIGNMENT ACTIONS
// ============================================

export async function createAssignment(data: AssignmentFormData) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return { success: false, error: 'Unauthorized' }
    }

    const tenantId = session.user.tenantId!
    const validatedData = assignmentSchema.parse(data)

    // Check if student already has active assignment
    const existingAssignment = await db.dormitoryAssignment.findFirst({
      where: {
        studentId: validatedData.studentId,
        status: 'ACTIVE',
      },
    })

    if (existingAssignment) {
      return { 
        success: false, 
        error: 'O\'quvchi allaqachon yotoqxonada joylashtirilgan' 
      }
    }

    // Check if bed is available
    const bed = await db.dormitoryBed.findFirst({
      where: {
        id: validatedData.bedId,
        tenantId,
        isOccupied: false,
        isActive: true,
      },
      include: {
        room: true,
      },
    })

    if (!bed) {
      return { success: false, error: 'Joy band yoki mavjud emas' }
    }

    // Check if student gender matches room gender
    const student = await db.student.findFirst({
      where: { id: validatedData.studentId, tenantId },
    })

    if (!student) {
      return { success: false, error: 'O\'quvchi topilmadi' }
    }

    if (bed.room.gender && student.gender !== bed.room.gender) {
      return { 
        success: false, 
        error: `Bu xona faqat ${bed.room.gender === 'MALE' ? 'o\'g\'il bolalar' : 'qizlar'} uchun` 
      }
    }

    // Create assignment
    const assignment = await db.dormitoryAssignment.create({
      data: {
        tenantId,
        studentId: validatedData.studentId,
        roomId: validatedData.roomId,
        bedId: validatedData.bedId,
        checkInDate: validatedData.checkInDate || new Date(),
        monthlyFee: validatedData.monthlyFee,
        notes: validatedData.notes || null,
        assignedById: session.user.id,
        status: 'ACTIVE',
      },
    })

    // Mark bed as occupied
    await db.dormitoryBed.update({
      where: { id: validatedData.bedId },
      data: { isOccupied: true },
    })

    // Update room occupied count
    await db.dormitoryRoom.update({
      where: { id: validatedData.roomId },
      data: { occupiedBeds: { increment: 1 } },
    })

    // Update building cache
    await updateBuildingCache(bed.room.buildingId)

    revalidatePath('/admin/dormitory')
    revalidatePath('/admin') // Dashboard: student dormitory info
    revalidatePath('/admin/students')

    return { success: true, assignment }
  } catch (error: any) {
    console.error('Create assignment error:', error)
    return { success: false, error: error.message || 'Xatolik yuz berdi' }
  }
}

export async function updateAssignment(
  assignmentId: string,
  data: UpdateAssignmentFormData
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return { success: false, error: 'Unauthorized' }
    }

    const tenantId = session.user.tenantId!
    const validatedData = updateAssignmentSchema.parse(data)

    const assignment = await db.dormitoryAssignment.findFirst({
      where: { id: assignmentId, tenantId },
      include: {
        bed: true,
        room: true,
      },
    })

    if (!assignment) {
      return { success: false, error: 'Joylashtirish topilmadi' }
    }

    const updated = await db.dormitoryAssignment.update({
      where: { id: assignmentId },
      data: {
        ...(validatedData.checkOutDate !== undefined && { checkOutDate: validatedData.checkOutDate }),
        ...(validatedData.status && { status: validatedData.status }),
        ...(validatedData.notes !== undefined && { notes: validatedData.notes || null }),
      },
    })

    // If checking out, free the bed
    if (validatedData.status === 'CHECKED_OUT') {
      await db.dormitoryBed.update({
        where: { id: assignment.bedId },
        data: { isOccupied: false },
      })

      await db.dormitoryRoom.update({
        where: { id: assignment.roomId },
        data: { occupiedBeds: { decrement: 1 } },
      })

      await updateBuildingCache(assignment.room.buildingId)
    }

    revalidatePath('/admin/dormitory')
    revalidatePath('/admin') // Dashboard: student dormitory info

    return { success: true, assignment: updated }
  } catch (error: any) {
    console.error('Update assignment error:', error)
    return { success: false, error: error.message || 'Xatolik yuz berdi' }
  }
}

export async function checkOutStudent(assignmentId: string) {
  return updateAssignment(assignmentId, {
    status: 'CHECKED_OUT',
    checkOutDate: new Date(),
  })
}

// ============================================
// HELPER FUNCTIONS
// ============================================

async function updateBuildingCache(buildingId: string) {
  const rooms = await db.dormitoryRoom.findMany({
    where: { buildingId },
    select: {
      capacity: true,
      occupiedBeds: true,
    },
  })

  const totalRooms = rooms.length
  const totalCapacity = rooms.reduce((sum, r) => sum + r.capacity, 0)
  const occupiedBeds = rooms.reduce((sum, r) => sum + r.occupiedBeds, 0)

  await db.dormitoryBuilding.update({
    where: { id: buildingId },
    data: {
      totalRooms,
      totalCapacity,
      occupiedBeds,
    },
  })
}

// Get available rooms with free beds
export async function getAvailableRooms(gender?: 'MALE' | 'FEMALE') {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return { success: false, error: 'Unauthorized' }
    }

    const tenantId = session.user.tenantId!

    const rooms = await db.dormitoryRoom.findMany({
      where: {
        tenantId,
        isActive: true,
        occupiedBeds: { lt: db.dormitoryRoom.fields.capacity },
        ...(gender && {
          OR: [
            { gender: gender },
            { gender: null }, // Mixed rooms
          ],
        }),
      },
      include: {
        building: {
          select: {
            name: true,
            code: true,
          },
        },
        beds: {
          where: {
            isOccupied: false,
            isActive: true,
          },
        },
      },
      orderBy: [
        { building: { name: 'asc' } },
        { floor: 'asc' },
        { roomNumber: 'asc' },
      ],
    })

    return { success: true, rooms }
  } catch (error: any) {
    console.error('Get available rooms error:', error)
    return { success: false, error: error.message || 'Xatolik yuz berdi' }
  }
}

