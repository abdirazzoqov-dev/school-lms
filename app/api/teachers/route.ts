import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    // Debug logging
    console.log('=== /api/teachers DEBUG ===')
    console.log('Session exists:', !!session)
    console.log('User:', session?.user)
    console.log('TenantId:', session?.user?.tenantId)
    console.log('========================')
    
    if (!session || !session.user.tenantId) {
      console.error('No session or tenantId')
      return NextResponse.json({ 
        error: 'Unauthorized',
        debug: {
          hasSession: !!session,
          hasTenantId: !!session?.user?.tenantId,
          user: session?.user
        }
      }, { status: 401 })
    }

    const tenantId = session.user.tenantId
    
    console.log('Fetching teachers for tenant:', tenantId)

    const teachers = await db.teacher.findMany({
      where: {
        tenantId,
      },
      select: {
        id: true,
        teacherCode: true,
        specialization: true,
        experienceYears: true,
        user: {
          select: {
            fullName: true,
            email: true,
            phone: true,
          }
        }
      },
      orderBy: {
        teacherCode: 'asc'
      }
    })
    
    console.log('Found teachers:', teachers.length)

    return NextResponse.json({ teachers })
  } catch (error) {
    console.error('Get teachers error:', error)
    return NextResponse.json({ 
      teachers: [],
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

