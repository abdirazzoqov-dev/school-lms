import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { BookletClient } from './booklet-client'

export const revalidate = 0
export const dynamic = 'force-dynamic'

export default async function ExamBookletPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'MODERATOR')) {
    redirect('/unauthorized')
  }

  const tenantId = session.user.tenantId!

  const [exam, questionBanks, students, schoolSettings] = await Promise.all([
    db.exam.findUnique({
      where: { id: params.id, tenantId },
      include: {
        subjects: {
          orderBy: { order: 'asc' },
          include: {
            questionBank: {
              select: { id: true, subjectName: true, totalCount: true, _count: { select: { questions: true } } }
            }
          }
        },
        variants: {
          orderBy: { variantNum: 'asc' },
          include: { _count: { select: { results: true } } }
        },
        // Pre-existing student assignments stored in ExamResult
        results: {
          select: { studentId: true, variantId: true }
        }
      }
    }),
    db.questionBank.findMany({
      where: { tenantId },
      select: { id: true, subjectName: true, totalCount: true },
      orderBy: { subjectName: 'asc' }
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
  ])

  if (!exam) redirect('/admin/exams')

  // Build studentId → variantId map from existing results
  const studentVariantMap: Record<string, string> = {}
  for (const r of exam.results) {
    if (r.variantId) studentVariantMap[r.studentId] = r.variantId
  }

  return (
    <BookletClient
      exam={exam as any}
      questionBanks={questionBanks}
      students={students as any}
      studentVariantMap={studentVariantMap}
      schoolName={schoolSettings?.platformName || 'Maktab LMS'}
    />
  )
}
