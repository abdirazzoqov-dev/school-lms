import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

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

    const student = await db.student.findFirst({
      where: { 
        id: params.id,
        tenantId
      },
      include: {
        user: {
          select: {
            fullName: true,
            email: true
          }
        },
        class: true,
        group: true,
        dormitoryAssignment: {
          include: {
            bed: true,
            room: {
              include: {
                building: true
              }
            }
          }
        },
        parents: {
          include: {
            parent: {
              include: {
                user: {
                  select: {
                    fullName: true,
                    email: true,
                    phone: true
                  }
                }
              }
            }
          }
        }
      }
    })

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    return NextResponse.json({ student })
  } catch (error) {
    console.error('Get student error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

