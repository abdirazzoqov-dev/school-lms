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

    // Get classId and subjectId from the first record
    const classId = attendanceRecords[0]?.classId
    const subjectId = attendanceRecords[0]?.subjectId
    const startTime = attendanceRecords[0]?.startTime
    const endTime = attendanceRecords[0]?.endTime
    
    if (!classId) {
      return NextResponse.json({ error: 'Class ID required' }, { status: 400 })
    }

    if (!subjectId) {
      return NextResponse.json({ error: 'Subject ID required' }, { status: 400 })
    }

    // Verify teacher teaches this class and subject via Schedule (constructor)
    const schedule = await db.schedule.findFirst({
      where: {
        classId,
        subjectId,
        teacherId: teacher.id,
        type: 'LESSON'
      },
    })

    if (!schedule) {
      return NextResponse.json(
        { error: 'You do not teach this subject in this class' },
        { status: 403 }
      )
    }

    // Delete existing attendance for today (if any)
    const studentIds = attendanceRecords.map((r) => r.studentId)
    const deleteWhere: any = {
      teacherId: teacher.id,
      classId,
      subjectId,
      date: today,
    }
    if (startTime) {
      deleteWhere.startTime = startTime
    }
    await db.attendance.deleteMany({ where: deleteWhere })

    // Create new attendance records
    const created = await db.attendance.createMany({
      data: attendanceRecords.map((record) => ({
        tenantId,
        studentId: record.studentId,
        teacherId: teacher.id,
        classId: record.classId,
        subjectId: subjectId,
        date: today,
        startTime: startTime || null,
        endTime: endTime || null,
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

