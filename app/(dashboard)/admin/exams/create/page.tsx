import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { ExamCreateForm } from './exam-create-form'

export const dynamic = 'force-dynamic'

export default async function CreateExamPage() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'MODERATOR')) {
    redirect('/unauthorized')
  }

  const tenantId = session.user.tenantId!

  const questionBanks = await db.questionBank.findMany({
    where: { tenantId },
    select: {
      id: true,
      subjectName: true,
      totalCount: true,
      questions: {
        select: { order: true, correctAnswer: true },
        orderBy: { order: 'asc' }
      }
    },
    orderBy: { subjectName: 'asc' }
  })

  return <ExamCreateForm questionBanks={questionBanks as any} />
}
