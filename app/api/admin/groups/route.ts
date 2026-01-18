import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { getCurrentAcademicYear } from '@/lib/utils'

export const dynamic = 'force-dynamic' // Prevent static rendering issues with cookies

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'No session', groups: [] }, { status: 401 })
    }
    
    if (!session.user.tenantId) {
      return NextResponse.json({ 
        error: 'No tenant found', 
        groups: [],
        debug: { email: session.user.email, userId: session.user.id }
      }, { status: 401 })
    }

    const tenantId = session.user.tenantId
    const academicYear = getCurrentAcademicYear()

    const groups = await db.group.findMany({
      where: {
        tenantId,
        academicYear,
      },
      include: {
        groupTeacher: {
          include: {
            user: {
              select: {
                fullName: true
              }
            }
          }
        },
        _count: {
          select: { students: true }
        }
      },
      orderBy: {
        name: 'asc'
      }
    })

    return NextResponse.json({ groups })
  } catch (error) {
    console.error('Get groups error:', error)
    return NextResponse.json({ 
      groups: [],
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

