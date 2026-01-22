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

    const body = await req.json()
    const { attendanceRecords } = body

    if (!attendanceRecords || !Array.isArray(attendanceRecords)) {
      return NextResponse.json({ error: 'Invalid data' }, { status: 400 })
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Delete existing attendance for today (if any)
    const studentIds = attendanceRecords.map((r) => r.studentId)
    await db.attendance.deleteMany({
      where: {
        teacherId: teacher.id,
        studentId: { in: studentIds },
        date: today,
      },
    })

    // Create new attendance records
    const created = await db.attendance.createMany({
      data: attendanceRecords.map((record) => ({
        tenantId,
        studentId: record.studentId,
        teacherId: teacher.id,
        classId: record.classId,
        date: today,
        status: record.status,
      })),
    })

    return NextResponse.json({ 
      success: true, 
      count: created.count,
    })
  } catch (error) {
    console.error('Error saving attendance:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}

