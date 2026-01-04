import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { getCurrentAcademicYear } from '@/lib/utils'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = session.user.tenantId
    const academicYear = getCurrentAcademicYear()

    const classes = await db.class.findMany({
      where: {
        tenantId,
        academicYear,
      },
      include: {
        _count: {
          select: { students: true }
        }
      },
      orderBy: {
        gradeLevel: 'asc'
      }
    })

    return NextResponse.json({ classes })
  } catch (error) {
    console.error('Get classes error:', error)
    return NextResponse.json({ classes: [] })
  }
}

