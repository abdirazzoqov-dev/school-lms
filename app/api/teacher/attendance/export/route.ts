import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = session.user.tenantId!

    // Get teacher
    const teacher = await db.teacher.findFirst({
      where: { userId: session.user.id },
    })

    if (!teacher) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 })
    }

    const formData = await req.formData()
    const dateStr = formData.get('date') as string
    const date = new Date(dateStr)
    date.setHours(0, 0, 0, 0)

    // Get attendance for the date
    const attendanceRecords = await db.attendance.findMany({
      where: {
        teacherId: teacher.id,
        date,
      },
      include: {
        student: {
          include: {
            user: {
              select: { fullName: true }
            },
            class: {
              select: { name: true }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    })

    // Generate CSV content (Excel can open CSV files)
    const csvRows = [
      ['O\'quvchi', 'Sinf', 'Status', 'Vaqt'].join(','),
      ...attendanceRecords.map(att => [
        att.student.user.fullName,
        att.student.class?.name || '',
        att.status === 'PRESENT' ? 'Kelgan' : att.status === 'ABSENT' ? 'Kelmagan' : 'Kech kelgan',
        new Date(att.createdAt).toLocaleTimeString('uz-UZ')
      ].join(','))
    ]

    const csvContent = csvRows.join('\n')
    
    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="davomat-${date.toLocaleDateString('uz-UZ')}.csv"`,
      },
    })
  } catch (error) {
    console.error('Error exporting attendance:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}

