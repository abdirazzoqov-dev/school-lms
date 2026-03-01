import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  const isAdminLike = session?.user.role === 'ADMIN' || session?.user.role === 'SUPER_ADMIN' || session?.user.role === 'MODERATOR'
  if (!session || !isAdminLike) {
    return NextResponse.json({ error: 'Ruxsat berilmagan' }, { status: 401 })
  }

  const tenantId = session.user.tenantId!
  const bankId = params.id

  // Verify bank belongs to tenant
  const bank = await db.questionBank.findUnique({ where: { id: bankId, tenantId } })
  if (!bank) return NextResponse.json({ error: 'Topilmadi' }, { status: 404 })

  const { answers } = await request.json() as {
    answers: { id: string; correctAnswer: string | null }[]
  }

  // Bulk update
  await Promise.all(
    answers.map(a =>
      db.question.update({
        where: { id: a.id, bankId },
        data: { correctAnswer: a.correctAnswer }
      })
    )
  )

  return NextResponse.json({ success: true })
}
