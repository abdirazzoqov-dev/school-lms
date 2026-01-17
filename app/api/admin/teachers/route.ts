import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    // Critical debugging - log everything
    console.log('========== /api/admin/teachers ==========')
    console.log('Session:', JSON.stringify({
      exists: !!session,
      user: session?.user,
      tenantId: session?.user?.tenantId,
    }, null, 2))
    
    if (!session) {
      console.error('ERROR: No session found')
      return NextResponse.json({ error: 'No session', teachers: [] }, { status: 401 })
    }
    
    if (!session.user.tenantId) {
      console.error('ERROR: No tenantId in session')
      console.error('Full session:', JSON.stringify(session, null, 2))
      
      // FALLBACK: Get user's tenant from database
      const user = await db.user.findUnique({
        where: { email: session.user.email! },
        select: { tenantId: true }
      })
      
      if (user?.tenantId) {
        console.log('✅ Found tenantId from database:', user.tenantId)
        session.user.tenantId = user.tenantId
      } else {
        console.error('ERROR: No tenantId in database either')
        return NextResponse.json({ 
          error: 'No tenant found', 
          teachers: [],
          debug: { email: session.user.email, userId: session.user.id }
        }, { status: 401 })
      }
    }

    const tenantId = session.user.tenantId
    console.log('Fetching teachers for tenantId:', tenantId)

    // First, check ALL teachers in database
    const allTeachers = await db.teacher.findMany({
      select: {
        id: true,
        teacherCode: true,
        tenantId: true,
        user: {
          select: {
            fullName: true,
            email: true,
          }
        }
      },
      take: 10,
    })
    
    console.log('All teachers in database:', allTeachers.length)
    console.log('Teachers:', allTeachers.map(t => ({
      name: t.user.fullName,
      code: t.teacherCode,
      tenantId: t.tenantId,
      matches: t.tenantId === tenantId
    })))

    // Now get teachers for this tenant
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
    
    console.log('Teachers for this tenant:', teachers.length)
    console.log('========================================')

    return NextResponse.json({ 
      teachers,
      debug: {
        tenantId,
        totalInDb: allTeachers.length,
        forThisTenant: teachers.length,
      }
    })
  } catch (error) {
    console.error('Get teachers error:', error)
    return NextResponse.json({ 
      teachers: [],
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

