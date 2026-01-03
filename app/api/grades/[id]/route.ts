import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const updateGradeSchema = z.object({
  score: z.number().min(0).optional(),
  maxScore: z.number().min(1).optional(),
  percentage: z.number().min(0).max(100).optional(),
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
    const validatedData = updateGradeSchema.parse(body)

    // Check if grade exists and belongs to tenant
    const grade = await db.grade.findFirst({
      where: {
        id: params.id,
        tenantId,
      },
    })

    if (!grade) {
      return NextResponse.json(
        { error: 'Grade not found' },
        { status: 404 }
      )
    }

    // Update grade
    const updatedGrade = await db.grade.update({
      where: { id: params.id },
      data: {
        ...(validatedData.score !== undefined && { score: validatedData.score }),
        ...(validatedData.maxScore !== undefined && { maxScore: validatedData.maxScore }),
        ...(validatedData.percentage !== undefined && { percentage: validatedData.percentage }),
        ...(validatedData.notes !== undefined && { notes: validatedData.notes }),
      },
    })

    return NextResponse.json(updatedGrade)
  } catch (error: any) {
    console.error('Update grade error:', error)

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

    // Check if grade exists and belongs to tenant
    const grade = await db.grade.findFirst({
      where: {
        id: params.id,
        tenantId,
      },
    })

    if (!grade) {
      return NextResponse.json(
        { error: 'Grade not found' },
        { status: 404 }
      )
    }

    // Delete grade
    await db.grade.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Delete grade error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

