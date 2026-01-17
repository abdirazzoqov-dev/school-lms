import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

// GET /api/admin/teachers/[id] - Get single teacher details
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

    const teacher = await db.teacher.findFirst({
      where: {
        id: params.id,
        tenantId, // Ensure teacher belongs to user's tenant
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
        },
        classSubjects: {
          include: {
            class: true,
            subject: true,
          }
        },
      }
    })

    if (!teacher) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 })
    }

    return NextResponse.json({ teacher })
  } catch (error) {
    console.error('Get teacher error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

