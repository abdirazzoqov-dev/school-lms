import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

// POST  — add a salary leave month
// DELETE — remove a salary leave month (query params: employeeId, employeeType, year, month)

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'MODERATOR')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const tenantId = session.user.tenantId!

    const body = await req.json()
    const employeeId: string = body.employeeId
    const employeeType: 'teacher' | 'staff' = body.employeeType
    const year = Number(body.year)
    const month = Number(body.month)
    const reason: string | undefined = body.reason

    if (!employeeId || !employeeType || !year || !month || month < 1 || month > 12) {
      return NextResponse.json({ error: "Noto'g'ri parametrlar" }, { status: 400 })
    }

    // Verify employee belongs to tenant
    if (employeeType === 'teacher') {
      const teacher = await db.teacher.findFirst({ where: { id: employeeId, tenantId }, select: { id: true } })
      if (!teacher) return NextResponse.json({ error: 'O\'qituvchi topilmadi' }, { status: 404 })
    } else {
      const staff = await db.staff.findFirst({ where: { id: employeeId, tenantId }, select: { id: true } })
      if (!staff) return NextResponse.json({ error: 'Xodim topilmadi' }, { status: 404 })
    }

    const leave = await db.employeeSalaryLeave.create({
      data: {
        tenantId,
        ...(employeeType === 'teacher' ? { teacherId: employeeId } : { staffId: employeeId }),
        year,
        month,
        reason: reason || null,
      },
    })

    return NextResponse.json({ success: true, leave })
  } catch (err: any) {
    // Handle unique constraint violation (already exists) — upsert via update
    if (err.code === 'P2002') {
      return NextResponse.json({ error: 'Bu oy allaqachon ta\'til deb belgilangan' }, { status: 409 })
    }
    console.error('POST employee salary-leave error:', err)
    return NextResponse.json({ error: 'Server xatosi' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'MODERATOR')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const tenantId = session.user.tenantId!

    const { searchParams } = req.nextUrl
    const employeeId = searchParams.get('employeeId')
    const employeeType = searchParams.get('employeeType') as 'teacher' | 'staff'
    const year = Number(searchParams.get('year'))
    const month = Number(searchParams.get('month'))

    if (!employeeId || !employeeType || !year || !month) {
      return NextResponse.json({ error: 'Parametrlar yetishmaydi' }, { status: 400 })
    }

    const existing = await db.employeeSalaryLeave.findFirst({
      where: {
        tenantId,
        year,
        month,
        ...(employeeType === 'teacher' ? { teacherId: employeeId } : { staffId: employeeId }),
      },
      select: { id: true }
    })

    if (!existing) {
      return NextResponse.json({ error: 'Topilmadi' }, { status: 404 })
    }

    await db.employeeSalaryLeave.delete({ where: { id: existing.id } })

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('DELETE employee salary-leave error:', err)
    return NextResponse.json({ error: 'Server xatosi' }, { status: 500 })
  }
}
