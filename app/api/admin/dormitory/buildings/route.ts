import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

// Force dynamic rendering to prevent static generation issues
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    // Allow ADMIN and SUPER_ADMIN
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // SUPER_ADMIN needs tenant context
    if (session.user.role === 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'This endpoint requires tenant context' },
        { status: 403 }
      )
    }

    const tenantId = session.user.tenantId!

    console.log('🏢 Fetching dormitory buildings for tenant:', tenantId)

    // Get all active buildings
    const buildings = await db.dormitoryBuilding.findMany({
      where: {
        tenantId,
        isActive: true,
      },
      include: {
        rooms: {
          where: { isActive: true },
          select: {
            id: true,
            roomNumber: true,
            floor: true,
            capacity: true,
            occupiedBeds: true,
            gender: true,
          },
          orderBy: [
            { floor: 'asc' },
            { roomNumber: 'asc' },
          ],
        },
      },
      orderBy: { name: 'asc' },
    })

    console.log('✅ Buildings found:', buildings.length)

    return NextResponse.json({
      buildings,
      count: buildings.length,
    })
  } catch (error) {
    console.error('❌ Error fetching dormitory buildings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dormitory buildings' },
      { status: 500 }
    )
  }
}

