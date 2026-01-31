import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

// GET /api/admin/staff/[id] - Get single staff details
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = session.user.tenantId

    const staff = await db.staff.findFirst({
      where: {
        id: params.id,
        tenantId, // Ensure staff belongs to user's tenant
      },
      include: {
        user: {
          select: {
            fullName: true,
            email: true,
            phone: true,
            avatar: true,
            isActive: true,
          }
        }
      }
    })

    if (!staff) {
      return NextResponse.json({ error: 'Staff not found' }, { status: 404 })
    }

    return NextResponse.json({ staff })
  } catch (error) {
    console.error('Get staff error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
