import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const bulkGradesSchema = z.object({
  classId: z.string(),
  subjectId: z.string(),
  teacherId: z.string(),
  date: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  gradeType: z.enum(['ORAL', 'WRITTEN', 'TEST', 'EXAM', 'QUARTER', 'FINAL']),
  maxScore: z.number().min(1),
  quarter: z.number().min(1).max(4).optional().nullable(),
  academicYear: z.string(),
  records: z.array(
    z.object({
      studentId: z.string(),
      score: z.number().min(0),
      percentage: z.number().min(0).max(100),
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
    const validatedData = bulkGradesSchema.parse(body)

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

    // Create grades
    const gradeRecords = validatedData.records.map((record) => ({
      tenantId,
      studentId: record.studentId,
      subjectId: validatedData.subjectId,
      teacherId: validatedData.teacherId,
      gradeType: validatedData.gradeType,
      score: record.score,
      maxScore: validatedData.maxScore,
      percentage: record.percentage,
      quarter: validatedData.quarter,
      academicYear: validatedData.academicYear,
      date,
      startTime: validatedData.startTime,
      endTime: validatedData.endTime,
      notes: record.notes || null,
    }))

    await db.grade.createMany({
      data: gradeRecords,
    })

    return NextResponse.json({
      success: true,
      message: 'Grades added successfully',
      count: gradeRecords.length,
    })
  } catch (error: any) {
    console.error('Bulk grades error:', error)

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

