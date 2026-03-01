import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { ParentExamsView } from './parent-exams-view'

export const revalidate = 0
export const dynamic = 'force-dynamic'

export default async function ParentExamsPage() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'PARENT') redirect('/unauthorized')

  const tenantId = session.user.tenantId!

  const parent = await db.parent.findUnique({
    where: { userId: session.user.id },
    include: {
      students: {
        include: {
          student: {
            include: {
              user: { select: { fullName: true, avatar: true } },
              class: { select: { name: true } },
              examResults: {
                include: {
                  exam: {
                    include: { subjects: { orderBy: { order: 'asc' } } }
                  }
                },
                orderBy: { createdAt: 'desc' }
              }
            }
          }
        }
      }
    }
  })

  if (!parent || parent.students.length === 0) {
    return (
      <div className="p-6 space-y-6">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-500 via-blue-500 to-cyan-500 p-8 text-white shadow-2xl">
          <div className="absolute inset-0 bg-black/10" />
          <div className="relative z-10">
            <h1 className="text-3xl font-bold mb-2">Imtihon Natijalari</h1>
            <p className="text-blue-100">Farzandlaringizning imtihon natijalari</p>
          </div>
        </div>
        <div className="flex items-center justify-center min-h-[300px] text-muted-foreground">
          Farzandlar topilmadi
        </div>
      </div>
    )
  }

  const studentsData = parent.students.map(({ student }) => ({
    ...student,
    examResults: student.examResults.map(r => ({
      ...r,
      totalScore: Number(r.totalScore),
      totalMax: Number(r.totalMax),
      percentage: Number(r.percentage),
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    }))
  }))

  return <ParentExamsView students={studentsData as any} />
}
