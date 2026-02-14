import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import * as xlsx from 'xlsx'
import { getCurrentAcademicYear } from '@/lib/utils'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = session.user.tenantId!

    // Get teacher
    const teacher = await db.teacher.findFirst({
      where: { userId: session.user.id }
    })

    if (!teacher) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 })
    }

    // Parse query parameters
    const searchParams = req.nextUrl.searchParams
    const dateParam = searchParams.get('date')
    const period = searchParams.get('period') || 'day'
    const classId = searchParams.get('classId')
    const subjectId = searchParams.get('subjectId')
    const timeSlot = searchParams.get('timeSlot')

    // Parse date
    const selectedDate = dateParam ? new Date(dateParam) : new Date()
    selectedDate.setHours(0, 0, 0, 0)

    // Calculate date range
    let startDate = new Date(selectedDate)
    let endDate = new Date(selectedDate)

    if (period === 'week') {
      const dayOfWeek = startDate.getDay()
      const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1
      startDate.setDate(startDate.getDate() - diff)
      endDate = new Date(startDate)
      endDate.setDate(endDate.getDate() + 6)
    } else if (period === 'month') {
      startDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1)
      endDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0)
    }

    endDate.setHours(23, 59, 59, 999)

    // Build where clause
    const whereClause: any = {
      tenantId,
      teacherId: teacher.id,
      date: {
        gte: startDate,
        lte: endDate
      }
    }

    if (classId) whereClause.classId = classId
    if (subjectId) whereClause.subjectId = subjectId
    if (timeSlot) whereClause.startTime = timeSlot

    // Fetch attendance data
    const attendanceRecords = await db.attendance.findMany({
      where: whereClause,
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
        },
        subject: {
          select: { name: true }
        }
      },
      orderBy: [
        { date: 'desc' },
        { startTime: 'asc' }
      ]
    })

    // Define type for records with non-null relations
    type AttendanceWithRelations = typeof attendanceRecords[0] & {
      student: {
        user: { fullName: string }
        class: { name: string }
      } & typeof attendanceRecords[0]['student']
    }

    // Filter out records with null user or class (with type predicate)
    const attendances = attendanceRecords.filter(
      (record): record is AttendanceWithRelations => 
        record.student.user !== null && record.student.class !== null
    )

    // Format data for Excel
    const excelData = attendances.map((attendance, index) => {
      const statusMap: Record<string, string> = {
        PRESENT: 'Kelgan',
        ABSENT: 'Kelmagan',
        LATE: 'Kech kelgan',
        EXCUSED: 'Sababli'
      }

      return {
        '#': index + 1,
        'O\'quvchi': attendance.student.user.fullName,
        'Sinf': attendance.student.class.name,
        'Fan': attendance.subject?.name || '—',
        'Sana': new Date(attendance.date).toLocaleDateString('uz-UZ'),
        'Dars vaqti': attendance.startTime && attendance.endTime 
          ? `${attendance.startTime} - ${attendance.endTime}` 
          : '—',
        'Status': statusMap[attendance.status] || attendance.status
      }
    })

    // Create workbook and worksheet
    const wb = xlsx.utils.book_new()
    const ws = xlsx.utils.json_to_sheet(excelData)

    // Set column widths
    ws['!cols'] = [
      { wch: 5 },  // #
      { wch: 25 }, // O'quvchi
      { wch: 10 }, // Sinf
      { wch: 20 }, // Fan
      { wch: 12 }, // Sana
      { wch: 18 }, // Dars vaqti
      { wch: 12 }, // Status
    ]

    xlsx.utils.book_append_sheet(wb, ws, 'Davomat')

    // Generate buffer
    const excelBuffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' })

    // Generate filename
    const periodLabels: Record<string, string> = {
      day: 'Kun',
      week: 'Hafta',
      month: 'Oy'
    }
    const filename = `Davomat_${periodLabels[period]}_${startDate.toLocaleDateString('uz-UZ').replace(/\//g, '-')}.xlsx`

    // Return Excel file
    return new NextResponse(excelBuffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Error exporting attendance:', error)
    return NextResponse.json(
      { error: 'Failed to export attendance' },
      { status: 500 }
    )
  }
}
