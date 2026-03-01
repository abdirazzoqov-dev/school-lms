import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

// POST  — add a leave month
// DELETE — remove a leave month (query params: year, month)

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'MODERATOR')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const tenantId = session.user.tenantId!
    const studentId = params.id

    const body = await req.json()
    const year = Number(body.year)
    const month = Number(body.month)
    const reason: string | undefined = body.reason

    if (!year || !month || month < 1 || month > 12) {
      return NextResponse.json({ error: 'Noto\'g\'ri yil yoki oy' }, { status: 400 })
    }

    // Verify student & get assignment
    const student = await db.student.findFirst({
      where: { id: studentId, tenantId },
      select: { dormitoryAssignment: { select: { id: true } } }
    })
    if (!student?.dormitoryAssignment) {
      return NextResponse.json({ error: 'O\'quvchi yoki yotoqxona tayinlamasi topilmadi' }, { status: 404 })
    }

    const leave = await db.dormitoryLeave.upsert({
      where: { studentId_year_month: { studentId, year, month } },
      create: {
        tenantId,
        studentId,
        assignmentId: student.dormitoryAssignment.id,
        year,
        month,
        reason: reason || null,
      },
      update: { reason: reason || null },
    })

    return NextResponse.json({ success: true, leave })
  } catch (err: any) {
    console.error('POST dormitory-leave error:', err)
    return NextResponse.json({ error: 'Server xatosi' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'MODERATOR')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const tenantId = session.user.tenantId!
    const studentId = params.id

    const { searchParams } = req.nextUrl
    const year = Number(searchParams.get('year'))
    const month = Number(searchParams.get('month'))

    if (!year || !month) {
      return NextResponse.json({ error: 'Yil va oy talab qilinadi' }, { status: 400 })
    }

    // Verify ownership
    const existing = await db.dormitoryLeave.findUnique({
      where: { studentId_year_month: { studentId, year, month } },
      select: { tenantId: true }
    })
    if (!existing || existing.tenantId !== tenantId) {
      return NextResponse.json({ error: 'Topilmadi' }, { status: 404 })
    }

    await db.dormitoryLeave.delete({
      where: { studentId_year_month: { studentId, year, month } }
    })

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('DELETE dormitory-leave error:', err)
    return NextResponse.json({ error: 'Server xatosi' }, { status: 500 })
  }
}
