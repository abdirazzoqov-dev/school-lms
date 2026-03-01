import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { ParentTestResultsView } from './parent-test-results-view'

export const revalidate = 0
export const dynamic = 'force-dynamic'

export default async function ParentTestResultsPage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'PARENT') {
    redirect('/unauthorized')
  }

  const tenantId = session.user.tenantId!

  const parent = await db.parent.findUnique({
    where: { userId: session.user.id },
    include: {
      students: {
        include: {
          student: {
            include: {
              user: { select: { fullName: true, avatar: true } },
              class: { select: { id: true, name: true } },
              grades: {
                where: { gradeType: { in: ['TEST', 'EXAM'] } },
                include: {
                  subject: { select: { id: true, name: true, color: true } },
                  teacher: {
                    include: { user: { select: { fullName: true } } }
                  }
                },
                orderBy: { date: 'desc' }
              }
            }
          }
        }
      }
    }
  })

  if (!parent || parent.students.length === 0) {
    return (
      <div className="space-y-6 animate-fade-in p-6">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-500 via-purple-500 to-indigo-500 p-8 text-white shadow-2xl">
          <div className="absolute inset-0 bg-black/10" />
          <div className="relative z-10">
            <h1 className="text-3xl font-bold mb-2">Test Natijalari</h1>
            <p className="text-violet-100">Farzandlaringizning test va imtihon natijalari</p>
          </div>
        </div>
        <div className="flex items-center justify-center min-h-[300px]">
          <p className="text-muted-foreground">Farzandlar topilmadi</p>
        </div>
      </div>
    )
  }

  const studentsData = parent.students.map(({ student }) => ({
    ...student,
    grades: student.grades.map(g => ({
      ...g,
      score: Number(g.score),
      maxScore: Number(g.maxScore),
      percentage: g.percentage ? Number(g.percentage) : null,
      date: g.date.toISOString(),
      createdAt: g.createdAt.toISOString(),
      updatedAt: g.updatedAt.toISOString(),
    }))
  }))

  return <ParentTestResultsView students={studentsData as any} />
}
