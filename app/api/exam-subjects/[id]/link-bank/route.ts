import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  const isAdminLike = session?.user.role === 'ADMIN' || session?.user.role === 'SUPER_ADMIN' || session?.user.role === 'MODERATOR'
  if (!session || !isAdminLike) return NextResponse.json({ error: 'Ruxsat berilmagan' }, { status: 401 })

  const { questionBankId } = await request.json()

  // Verify subject belongs to this tenant via exam
  const subject = await db.examSubject.findFirst({
    where: { id: params.id, exam: { tenantId: session.user.tenantId! } }
  })
  if (!subject) return NextResponse.json({ error: 'Topilmadi' }, { status: 404 })

  await db.examSubject.update({
    where: { id: params.id },
    data: { questionBankId: questionBankId || null }
  })

  return NextResponse.json({ success: true })
}
