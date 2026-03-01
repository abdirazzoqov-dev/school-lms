import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  const isAdminLike = session?.user.role === 'ADMIN' || session?.user.role === 'SUPER_ADMIN' || session?.user.role === 'MODERATOR'
  if (!session || !isAdminLike) {
    return NextResponse.json({ error: 'Ruxsat berilmagan' }, { status: 401 })
  }

  const tenantId = session.user.tenantId!

  await db.questionBank.delete({ where: { id: params.id, tenantId } })
  return NextResponse.json({ success: true })
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Ruxsat berilmagan' }, { status: 401 })

  const tenantId = session.user.tenantId!
  const bank = await db.questionBank.findUnique({
    where: { id: params.id, tenantId },
    include: { questions: { orderBy: { order: 'asc' } } }
  })
  if (!bank) return NextResponse.json({ error: 'Topilmadi' }, { status: 404 })

  return NextResponse.json(bank)
}
