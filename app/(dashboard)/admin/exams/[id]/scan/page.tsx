import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { OmrScanClient } from './omr-scan-client'

export const dynamic = 'force-dynamic'

export default async function ScanPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'MODERATOR')) {
    redirect('/unauthorized')
  }
  const tenantId = session.user.tenantId!

  const [exam, students] = await Promise.all([
    db.exam.findUnique({
      where: { id: params.id, tenantId },
      include: { subjects: { orderBy: { order: 'asc' } } }
    }),
    db.student.findMany({
      where: { tenantId },
      include: {
        user: { select: { fullName: true, avatar: true } },
        class: { select: { name: true } }
      },
      orderBy: [{ class: { name: 'asc' } }, { user: { fullName: 'asc' } }]
    })
  ])

  if (!exam) redirect('/admin/exams')

  return <OmrScanClient exam={exam as any} students={students as any} />
}
