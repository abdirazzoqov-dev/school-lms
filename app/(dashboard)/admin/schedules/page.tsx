import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Calendar } from 'lucide-react'
import Link from 'next/link'
import { Timetable } from '@/components/timetable'
import { getCurrentAcademicYear } from '@/lib/utils'

// Optimized caching
export const revalidate = 30
export const dynamic = 'auto'

export default async function SchedulesPage({
  searchParams,
}: {
  searchParams: { classId?: string }
}) {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'ADMIN') {
    redirect('/unauthorized')
  }

  const tenantId = session.user.tenantId!
  const academicYear = getCurrentAcademicYear()

  // Get all classes
  const classes = await db.class.findMany({
    where: { tenantId, academicYear },
    orderBy: { name: 'asc' }
  })

  // Get schedules (filtered by class if selected)
  const whereClause: any = {
    tenantId,
    academicYear
  }

  if (searchParams.classId) {
    whereClause.classId = searchParams.classId
  }

  const schedules = await db.schedule.findMany({
    where: whereClause,
    include: {
      subject: true,
      teacher: {
        include: {
          user: {
            select: { fullName: true }
          }
        }
      },
      class: true
    },
    orderBy: [
      { dayOfWeek: 'asc' },
      { startTime: 'asc' }
    ]
  })

  // Get statistics
  const totalSchedules = await db.schedule.count({
    where: { tenantId, academicYear }
  })

  const schedulesByClass = await db.schedule.groupBy({
    by: ['classId'],
    where: { tenantId, academicYear },
    _count: true
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dars Jadvali</h1>
          <p className="text-muted-foreground">
            Sinflar uchun dars jadvalini boshqaring
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href="/admin/schedules/builder">
              <Calendar className="mr-2 h-4 w-4" />
              Constructor
            </Link>
          </Button>
          <Button asChild>
            <Link href="/admin/schedules/create">
              <Plus className="mr-2 h-4 w-4" />
              Jadval Qo'shish
            </Link>
          </Button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{totalSchedules}</div>
                <p className="text-sm text-muted-foreground">Jami darslar</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <Calendar className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{schedulesByClass.length}</div>
                <p className="text-sm text-muted-foreground">Sinflar</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Calendar className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{academicYear}</div>
                <p className="text-sm text-muted-foreground">O'quv yili</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Class Filter */}
      <Card>
        <CardHeader>
          <CardTitle>Sinf tanlang</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Link href="/admin/schedules">
              <Button 
                variant={!searchParams.classId ? 'default' : 'outline'} 
                size="sm"
              >
                Barcha sinflar
              </Button>
            </Link>
            {classes.map(cls => (
              <Link key={cls.id} href={`/admin/schedules?classId=${cls.id}`}>
                <Button 
                  variant={searchParams.classId === cls.id ? 'default' : 'outline'} 
                  size="sm"
                >
                  {cls.name}
                </Button>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Timetable */}
      {searchParams.classId ? (
        <Timetable 
          schedules={schedules} 
          title={`${classes.find(c => c.id === searchParams.classId)?.name} - Dars Jadvali`}
          showTeacher={true}
        />
      ) : (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Jadvalini ko'rish uchun sinfni tanlang</p>
          </CardContent>
        </Card>
      )}

      {/* All Schedules List */}
      {!searchParams.classId && schedules.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Barcha darslar</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border overflow-x-auto">
              <table className="w-full">
                <thead className="border-b bg-muted/50">
                  <tr>
                    <th className="p-4 text-left text-sm font-medium">Sinf</th>
                    <th className="p-4 text-left text-sm font-medium">Fan</th>
                    <th className="p-4 text-left text-sm font-medium">O'qituvchi</th>
                    <th className="p-4 text-left text-sm font-medium">Kun</th>
                    <th className="p-4 text-left text-sm font-medium">Vaqt</th>
                    <th className="p-4 text-left text-sm font-medium">Xona</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {schedules.map(schedule => {
                    const days = ['', 'Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba', 'Yakshanba']
                    const isBreak = schedule.type === 'BREAK'
                    const isLunch = schedule.type === 'LUNCH'
                    const isLesson = schedule.type === 'LESSON'
                    
                    return (
                      <tr key={schedule.id} className="hover:bg-muted/50">
                        <td className="p-4 font-medium">{schedule.class.name}</td>
                        <td className="p-4">
                          {isBreak && <span className="inline-flex items-center gap-1 text-amber-700">☕ {schedule.title || 'Tanafus'}</span>}
                          {isLunch && <span className="inline-flex items-center gap-1 text-green-700">🍽️ {schedule.title || 'Tushlik'}</span>}
                          {isLesson && schedule.subject?.name}
                        </td>
                        <td className="p-4">
                          {isLesson ? schedule.teacher?.user?.fullName || '-' : '-'}
                        </td>
                        <td className="p-4">{days[schedule.dayOfWeek]}</td>
                        <td className="p-4 font-mono text-sm">
                          {schedule.startTime} - {schedule.endTime}
                        </td>
                        <td className="p-4">{schedule.roomNumber || '-'}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

