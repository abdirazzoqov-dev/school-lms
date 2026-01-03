import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const updateParentSchema = z.object({
  fullName: z.string().min(3).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  relationship: z.string().optional(),
  occupation: z.string().optional(),
  workAddress: z.string().optional(),
  emergencyContact: z.string().optional(),
  isActive: z.boolean().optional(),
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
    const validatedData = updateParentSchema.parse(body)

    // Check if parent exists and belongs to tenant
    const parent = await db.parent.findFirst({
      where: {
        id: params.id,
        tenantId,
      },
      include: {
        user: true,
      },
    })

    if (!parent) {
      return NextResponse.json(
        { error: 'Parent not found' },
        { status: 404 }
      )
    }

    // Update user data if provided
    if (validatedData.fullName || validatedData.email || validatedData.phone !== undefined || validatedData.isActive !== undefined) {
      await db.user.update({
        where: { id: parent.userId },
        data: {
          ...(validatedData.fullName && { fullName: validatedData.fullName }),
          ...(validatedData.email && { email: validatedData.email }),
          ...(validatedData.phone !== undefined && { phone: validatedData.phone || null }),
          ...(validatedData.isActive !== undefined && { isActive: validatedData.isActive }),
        },
      })
    }

    // Update parent data
    const updatedParent = await db.parent.update({
      where: { id: params.id },
      data: {
        ...(validatedData.relationship && { relationship: validatedData.relationship }),
        ...(validatedData.occupation !== undefined && { occupation: validatedData.occupation || null }),
        ...(validatedData.workAddress !== undefined && { workAddress: validatedData.workAddress || null }),
        ...(validatedData.emergencyContact !== undefined && { emergencyContact: validatedData.emergencyContact || null }),
      },
      include: {
        user: {
          select: {
            fullName: true,
            email: true,
            phone: true,
            isActive: true,
          },
        },
      },
    })

    return NextResponse.json(updatedParent)
  } catch (error: any) {
    console.error('Update parent error:', error)

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

    // Check if parent exists and belongs to tenant
    const parent = await db.parent.findFirst({
      where: {
        id: params.id,
        tenantId,
      },
    })

    if (!parent) {
      return NextResponse.json(
        { error: 'Parent not found' },
        { status: 404 }
      )
    }

    // Delete parent (cascade will delete user)
    await db.parent.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Delete parent error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

