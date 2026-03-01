import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import type { VariantData } from '@/app/actions/exam-variant'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Ruxsat berilmagan' }, { status: 401 })

  const tenantId = session.user.tenantId!
  const variant = await db.examVariant.findUnique({ where: { id: params.id, tenantId } })
  if (!variant) return NextResponse.json({ error: 'Topilmadi' }, { status: 404 })

  const data = variant.questionData as unknown as VariantData

  // Build answer keys map: { "subjectOrder": { "1": "A", ... } }
  const answerKeys: Record<string, Record<string, string>> = {}
  for (const sub of data.subjects) {
    answerKeys[String(sub.subjectOrder)] = sub.answerKey
  }

  return NextResponse.json({
    variantId: variant.id,
    variantName: variant.variantName,
    variantNum: variant.variantNum,
    answerKeys,
  })
}
