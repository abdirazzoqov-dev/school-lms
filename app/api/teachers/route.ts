import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    // CRITICAL DEBUG - Log everything
    console.log('==========================================')
    console.log('[/api/teachers] Request received')
    console.log('Session exists:', !!session)
    console.log('Session.user:', JSON.stringify(session?.user, null, 2))
    console.log('TenantId from session:', session?.user?.tenantId)
    console.log('==========================================')
    
    if (!session || !session.user.tenantId) {
      console.error('[/api/teachers] UNAUTHORIZED - No session or tenantId')
      return NextResponse.json({ 
        error: 'Unauthorized',
        teachers: [],
        debug: {
          hasSession: !!session,
          user: session?.user,
          tenantId: session?.user?.tenantId,
        }
      }, { status: 401 })
    }

    const tenantId = session.user.tenantId
    console.log('[/api/teachers] Fetching teachers for tenantId:', tenantId)

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
    
    console.log('[/api/teachers] Found teachers:', teachers.length)
    console.log('[/api/teachers] Teachers:', teachers.map(t => ({ 
      id: t.id, 
      name: t.user?.fullName, 
      code: t.teacherCode 
    })))

    return NextResponse.json({ 
      teachers,
      debug: {
        tenantId,
        count: teachers.length,
      }
    })
  } catch (error) {
    console.error('[/api/teachers] ERROR:', error)
    return NextResponse.json({ 
      teachers: [],
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

