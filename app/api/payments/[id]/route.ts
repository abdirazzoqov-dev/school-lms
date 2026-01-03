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

    const payment = await db.payment.findFirst({
      where: { 
        id: params.id,
        tenantId
      },
      include: {
        student: {
          include: {
            user: {
              select: {
                fullName: true
              }
            },
            class: {
              select: {
                name: true
              }
            }
          }
        },
        parent: {
          include: {
            user: {
              select: {
                fullName: true,
                phone: true
              }
            }
          }
        },
        receivedBy: {
          select: {
            fullName: true
          }
        }
      }
    })

    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
    }

    return NextResponse.json({ payment })
  } catch (error) {
    console.error('Get payment error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

