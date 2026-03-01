import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  ClipboardCheck, Plus, FileText, Users, BarChart3,
  CheckCircle2, Clock, Archive, BookOpen, Calendar
} from 'lucide-react'
import Link from 'next/link'
import { PermissionGate } from '@/components/admin/permission-gate'
import { ExamsListClient } from './exams-list-client'

export const revalidate = 0
export const dynamic = 'force-dynamic'

export default async function ExamsPage() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'MODERATOR')) {
    redirect('/unauthorized')
  }

  const tenantId = session.user.tenantId!

  const exams = await db.exam.findMany({
    where: { tenantId },
    include: {
      subjects: { orderBy: { order: 'asc' } },
      results: { select: { id: true } },
      _count: { select: { results: true } }
    },
    orderBy: { createdAt: 'desc' }
  })

  // Stats
  const total = exams.length
  const published = exams.filter(e => e.status === 'PUBLISHED').length
  const completed = exams.filter(e => e.status === 'COMPLETED').length
  const totalResults = exams.reduce((s, e) => s + e._count.results, 0)

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-blue-600 to-cyan-600 p-8 text-white shadow-2xl">
        <div className="absolute inset-0 bg-black/10" />
        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                <ClipboardCheck className="h-8 w-8" />
              </div>
              <h1 className="text-4xl font-bold">Imtihonlar</h1>
            </div>
            <p className="text-blue-100 text-lg">
              Test va imtihon o'tkazish, javob varaqlari generatsiya qilish va natijalarni boshqarish
            </p>
          </div>
          <PermissionGate resource="grades" action="CREATE">
            <Button asChild size="lg" className="bg-white text-blue-600 hover:bg-blue-50 shadow-lg">
              <Link href="/admin/exams/create">
                <Plus className="mr-2 h-5 w-5" />
                Yangi Imtihon
              </Link>
            </Button>
          </PermissionGate>
        </div>
        <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -left-8 -bottom-8 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Jami Imtihonlar', value: total, icon: ClipboardCheck, color: 'indigo' },
          { label: 'Faol (Nashr etilgan)', value: published, icon: CheckCircle2, color: 'green' },
          { label: 'Yakunlangan', value: completed, icon: Archive, color: 'blue' },
          { label: 'Jami Natijalar', value: totalResults, icon: BarChart3, color: 'amber' },
        ].map(stat => (
          <Card key={stat.label} className={`border-2 border-${stat.color}-200 dark:border-${stat.color}-800 bg-gradient-to-br from-${stat.color}-50 to-${stat.color}-100 dark:from-${stat.color}-950 dark:to-${stat.color}-900/80 hover:shadow-lg transition-all group`}>
            <CardContent className="pt-5">
              <div className="flex items-center justify-between mb-2">
                <div className={`p-2.5 bg-${stat.color}-500 rounded-xl group-hover:scale-110 transition-transform`}>
                  <stat.icon className="h-5 w-5 text-white" />
                </div>
              </div>
              <p className={`text-sm text-${stat.color}-600 dark:text-${stat.color}-400 font-medium`}>{stat.label}</p>
              <p className={`text-3xl font-bold text-${stat.color}-700 dark:text-${stat.color}-300`}>{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Exams list */}
      <Card className="border-2">
        <CardHeader className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-950/30 dark:to-blue-950/30">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <div className="h-8 w-1 bg-gradient-to-b from-indigo-600 to-blue-600 rounded-full" />
                Imtihonlar Ro'yxati
              </CardTitle>
              <CardDescription className="mt-1">{total} ta imtihon</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <ExamsListClient exams={exams as any} />
        </CardContent>
      </Card>
    </div>
  )
}
