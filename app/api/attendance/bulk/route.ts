import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const bulkAttendanceSchema = z.object({
  classId: z.string(),
  subjectId: z.string(),
  teacherId: z.string(),
  date: z.string(),
  records: z.array(
    z.object({
      studentId: z.string(),
      status: z.enum(['PRESENT', 'ABSENT', 'LATE', 'EXCUSED']),
      notes: z.string().optional().nullable(),
    })
  ),
})

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    // Allow ADMIN and SUPER_ADMIN
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // SUPER_ADMIN needs tenantId from query params or can't access this endpoint
    if (session.user.role === 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'This endpoint requires tenant context' },
        { status: 403 }
      )
    }

    const tenantId = session.user.tenantId!
    const body = await req.json()

    // Validate input
    const validatedData = bulkAttendanceSchema.parse(body)

    // Verify class belongs to tenant
    const classExists = await db.class.findFirst({
      where: {
        id: validatedData.classId,
        tenantId,
      },
    })

    if (!classExists) {
      return NextResponse.json(
        { error: 'Class not found' },
        { status: 404 }
      )
    }

    // Verify subject belongs to tenant
    const subjectExists = await db.subject.findFirst({
      where: {
        id: validatedData.subjectId,
        tenantId,
      },
    })

    if (!subjectExists) {
      return NextResponse.json(
        { error: 'Subject not found' },
        { status: 404 }
      )
    }

    // Verify teacher belongs to tenant
    const teacherExists = await db.teacher.findFirst({
      where: {
        id: validatedData.teacherId,
        tenantId,
      },
    })

    if (!teacherExists) {
      return NextResponse.json(
        { error: 'Teacher not found' },
        { status: 404 }
      )
    }

    const date = new Date(validatedData.date)

    // Check if attendance already exists for this date/class/subject
    const existingRecords = await db.attendance.findMany({
      where: {
        tenantId,
        classId: validatedData.classId,
        subjectId: validatedData.subjectId,
        date,
      },
    })

    // If records exist, delete them first (update scenario)
    if (existingRecords.length > 0) {
      await db.attendance.deleteMany({
        where: {
          tenantId,
          classId: validatedData.classId,
          subjectId: validatedData.subjectId,
          date,
        },
      })
    }

    // Create new attendance records
    const attendanceRecords = validatedData.records.map((record) => ({
      tenantId,
      studentId: record.studentId,
      classId: validatedData.classId,
      subjectId: validatedData.subjectId,
      teacherId: validatedData.teacherId,
      date,
      status: record.status,
      notes: record.notes || null,
    }))

    await db.attendance.createMany({
      data: attendanceRecords,
    })

    return NextResponse.json({
      success: true,
      message: 'Attendance marked successfully',
      count: attendanceRecords.length,
    })
  } catch (error: any) {
    console.error('Bulk attendance error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

