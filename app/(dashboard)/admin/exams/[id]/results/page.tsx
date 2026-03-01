import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { ExamResultsClient } from './exam-results-client'

export const dynamic = 'force-dynamic'

export default async function ExamResultsPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'MODERATOR')) {
    redirect('/unauthorized')
  }
  const tenantId = session.user.tenantId!

  const [exam, students, results] = await Promise.all([
    db.exam.findUnique({
      where: { id: params.id, tenantId },
      include: { subjects: { orderBy: { order: 'asc' } } }
    }),
    db.student.findMany({
      where: { tenantId },
      include: {
        user: { select: { fullName: true, avatar: true } },
        class: { select: { id: true, name: true } }
      },
      orderBy: [{ class: { name: 'asc' } }, { user: { fullName: 'asc' } }]
    }),
    db.examResult.findMany({
      where: { examId: params.id, tenantId },
      include: {
        student: {
          include: {
            user: { select: { fullName: true, avatar: true } },
            class: { select: { name: true } }
          }
        }
      },
      orderBy: { totalScore: 'desc' }
    })
  ])

  if (!exam) redirect('/admin/exams')

  const serializedResults = results.map(r => ({
    ...r,
    totalScore: Number(r.totalScore),
    totalMax: Number(r.totalMax),
    percentage: Number(r.percentage),
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  }))

  return (
    <ExamResultsClient
      exam={exam as any}
      students={students as any}
      existingResults={serializedResults as any}
    />
  )
}
