import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const updateAttendanceSchema = z.object({
  status: z.enum(['PRESENT', 'ABSENT', 'LATE', 'EXCUSED']).optional(),
  notes: z.string().optional().nullable(),
})

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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
    const validatedData = updateAttendanceSchema.parse(body)

    // Check if attendance exists and belongs to tenant
    const attendance = await db.attendance.findFirst({
      where: {
        id: params.id,
        tenantId,
      },
    })

    if (!attendance) {
      return NextResponse.json(
        { error: 'Attendance record not found' },
        { status: 404 }
      )
    }

    // Update attendance
    const updatedAttendance = await db.attendance.update({
      where: { id: params.id },
      data: {
        ...(validatedData.status && { status: validatedData.status }),
        ...(validatedData.notes !== undefined && { notes: validatedData.notes }),
      },
    })

    return NextResponse.json(updatedAttendance)
  } catch (error: any) {
    console.error('Update attendance error:', error)

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

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Check if attendance exists and belongs to tenant
    const attendance = await db.attendance.findFirst({
      where: {
        id: params.id,
        tenantId,
      },
    })

    if (!attendance) {
      return NextResponse.json(
        { error: 'Attendance record not found' },
        { status: 404 }
      )
    }

    // Delete attendance
    await db.attendance.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Delete attendance error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

