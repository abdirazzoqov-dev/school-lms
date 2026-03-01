import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { AnswerSheetPrintClient } from './answer-sheet-print-client'

export const dynamic = 'force-dynamic'

export default async function AnswerSheetPage({
  params,
  searchParams,
}: {
  params: { id: string }
  searchParams: { variantId?: string }
}) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'MODERATOR')) {
    redirect('/unauthorized')
  }

  const tenantId = session.user.tenantId!
  const variantId = searchParams.variantId

  const [exam, students, schoolSettings, variant, examResults] = await Promise.all([
    db.exam.findUnique({
      where: { id: params.id, tenantId },
      include: { subjects: { orderBy: { order: 'asc' } } }
    }),
    db.student.findMany({
      where: { tenantId },
      include: {
        user: { select: { fullName: true } },
        class: { select: { name: true } }
      },
      orderBy: [{ class: { name: 'asc' } }, { user: { fullName: 'asc' } }]
    }),
    db.globalSettings.findFirst(),
    variantId
      ? db.examVariant.findUnique({ where: { id: variantId, tenantId } })
      : null,
    // Fetch pre-assigned variants from ExamResults
    db.examResult.findMany({
      where: { examId: params.id, tenantId, variantId: { not: null } },
      select: { studentId: true, variantId: true },
    }),
  ])

  if (!exam) redirect('/admin/exams')

  // Build studentId → variantId map from pre-assigned results
  const studentVariantMap: Record<string, string> = {}
  for (const r of examResults) {
    if (r.variantId) studentVariantMap[r.studentId] = r.variantId
  }

  // Fetch all variant metadata referenced in assignments
  const usedVariantIds = [...new Set(Object.values(studentVariantMap))]
  const variantDetails = usedVariantIds.length > 0
    ? await db.examVariant.findMany({
        where: { id: { in: usedVariantIds }, tenantId },
        select: { id: true, variantNum: true, variantName: true }
      })
    : []

  const variantInfoMap: Record<string, { id: string; variantNum: number; variantName: string }> = {}
  for (const v of variantDetails) variantInfoMap[v.id] = v

  return (
    <AnswerSheetPrintClient
      exam={exam as any}
      students={students as any}
      schoolName={schoolSettings?.platformName || 'Maktab LMS'}
      variant={variant ? { id: variant.id, variantNum: variant.variantNum, variantName: variant.variantName } : null}
      studentVariantMap={studentVariantMap}
      variantInfoMap={variantInfoMap}
    />
  )
}
