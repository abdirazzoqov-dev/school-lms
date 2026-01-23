import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = session.user.tenantId!
    const { searchParams } = new URL(request.url)
    const month = parseInt(searchParams.get('month') || String(new Date().getMonth() + 1))
    const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()))
    const classId = searchParams.get('classId')

    // Date range
    const startDate = new Date(year, month - 1, 1)
    const endDate = new Date(year, month, 0, 23, 59, 59)

    // Build where clause
    const where: any = {
      tenantId,
      date: {
        gte: startDate,
        lte: endDate
      }
    }
    if (classId) where.classId = classId

    // Get attendance records
    const attendances = await db.attendance.findMany({
      where,
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
        subject: {
          select: {
            name: true
          }
        },
        teacher: {
          include: {
            user: {
              select: {
                fullName: true
              }
            }
          }
        }
      },
      orderBy: {
        date: 'asc'
      }
    })

    // Generate CSV
    const csvRows = [
      ['#', 'Sana', 'O\'quvchi', 'Sinf', 'Fan', 'Status', 'O\'qituvchi'].join(',')
    ]

    attendances.forEach((att, index) => {
      const statusText = 
        att.status === 'PRESENT' ? 'Bor' :
        att.status === 'ABSENT' ? 'Yo\'q' :
        att.status === 'LATE' ? 'Kech' : 'Sababli'

      csvRows.push([
        index + 1,
        new Date(att.date).toLocaleDateString('uz-UZ'),
        att.student.user.fullName,
        att.student.class?.name || 'N/A',
        att.subject.name || 'N/A',
        statusText,
        att.teacher.user.fullName
      ].join(','))
    })

    const csv = '\uFEFF' + csvRows.join('\n')

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="davomat-hisoboti-${year}-${month}.csv"`
      }
    })
  } catch (error: any) {
    console.error('Export attendance report error:', error)
    return NextResponse.json({ error: 'Failed to export report' }, { status: 500 })
  }
}

