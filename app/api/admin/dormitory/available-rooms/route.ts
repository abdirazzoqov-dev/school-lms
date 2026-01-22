import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// Force dynamic rendering to prevent static generation issues
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    // Allow ADMIN and SUPER_ADMIN
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // SUPER_ADMIN needs tenantId from query params or can't access this endpoint
    if (session.user.role === 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'This endpoint requires tenant context' },
        { status: 403 }
      )
    }

    const tenantId = session.user.tenantId!
    const { searchParams } = new URL(req.url)
    const gender = searchParams.get('gender')
    const buildingId = searchParams.get('buildingId')

    console.log('🛏️  Fetching available rooms for tenant:', tenantId, 'gender:', gender, 'buildingId:', buildingId)

    // Get rooms with available beds
    const rooms = await db.dormitoryRoom.findMany({
      where: {
        tenantId,
        isActive: true,
        // Room should have available space
        occupiedBeds: {
          lt: db.dormitoryRoom.fields.capacity,
        },
        // Building filter
        ...(buildingId && { buildingId }),
        // Gender filter
        ...(gender && {
          OR: [
            { gender: gender as 'MALE' | 'FEMALE' },
            { gender: null }, // Mixed rooms
          ],
        }),
      },
      include: {
        building: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        beds: {
          where: {
            isOccupied: false,
            isActive: true,
          },
          select: {
            id: true,
            bedNumber: true,
            bedType: true,
            description: true,
          },
          orderBy: { bedNumber: 'asc' },
        },
      },
      orderBy: [
        { building: { name: 'asc' } },
        { floor: 'asc' },
        { roomNumber: 'asc' },
      ],
    })

    // Filter out rooms without any available beds
    const roomsWithBeds = rooms.filter((room) => room.beds.length > 0)

    console.log('✅ Available rooms found:', roomsWithBeds.length)

    return NextResponse.json({ 
      rooms: roomsWithBeds,
      count: roomsWithBeds.length,
    })
  } catch (error: any) {
    console.error('❌ Get available rooms error:', error)
    return NextResponse.json({ 
      rooms: [],
      count: 0,
      error: error.message,
    })
  }
}

