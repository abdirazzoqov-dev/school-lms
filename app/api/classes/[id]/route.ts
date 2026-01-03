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

    const classItem = await db.class.findFirst({
      where: { 
        id: params.id,
        tenantId
      },
      include: {
        classTeacher: {
          include: {
            user: {
              select: {
                fullName: true
              }
            }
          }
        },
        classSubjects: {
          include: {
            subject: true,
            teacher: {
              include: {
                user: {
                  select: {
                    fullName: true
                  }
                }
              }
            }
          }
        },
        _count: {
          select: {
            students: true,
            classSubjects: true
          }
        }
      }
    })

    if (!classItem) {
      return NextResponse.json({ error: 'Class not found' }, { status: 404 })
    }

    return NextResponse.json({ class: classItem })
  } catch (error) {
    console.error('Get class error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

