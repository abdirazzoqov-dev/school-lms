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
    const { attendanceRecords, groupId, subjectId } = body

    if (!attendanceRecords || !Array.isArray(attendanceRecords)) {
      return NextResponse.json({ error: 'Invalid data' }, { status: 400 })
    }

    if (!groupId) {
      return NextResponse.json({ error: 'Group ID required' }, { status: 400 })
    }

    if (!subjectId) {
      return NextResponse.json({ error: 'Subject ID required' }, { status: 400 })
    }

    // Verify teacher teaches this group and subject via GroupSchedule
    const groupSchedule = await db.groupSchedule.findFirst({
      where: {
        groupId,
        subjectId,
        teacherId: teacher.id,
      },
    })

    if (!groupSchedule) {
      return NextResponse.json(
        { error: 'You do not teach this subject in this group' },
        { status: 403 }
      )
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const startTime = attendanceRecords[0]?.startTime
    const endTime = attendanceRecords[0]?.endTime

    // Filter only records where student has a classId (Attendance model requires classId)
    const validRecords = attendanceRecords.filter((r) => r.classId)

    if (validRecords.length === 0) {
      return NextResponse.json({
        success: true,
        count: 0,
        message: 'No students with class assigned - attendance skipped',
      })
    }

    // Delete existing attendance for today (for these students + subject)
    const studentIds = validRecords.map((r) => r.studentId)
    const deleteWhere: any = {
      teacherId: teacher.id,
      subjectId,
      date: today,
      studentId: { in: studentIds },
    }
    if (startTime) {
      deleteWhere.startTime = startTime
    }
    await db.attendance.deleteMany({ where: deleteWhere })

    // Create new attendance records (each student uses their own classId)
    const created = await db.attendance.createMany({
      data: validRecords.map((record) => ({
        tenantId,
        studentId: record.studentId,
        teacherId: teacher.id,
        classId: record.classId, // student's own class
        subjectId,
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
    console.error('Error saving group attendance:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}

