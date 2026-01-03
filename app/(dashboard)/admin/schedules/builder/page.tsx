import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Calendar, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import { getCurrentAcademicYear } from '@/lib/utils'
import { ScheduleBuilder } from '@/components/schedule-builder/schedule-builder'
import { Toaster } from 'sonner'
import { cn } from '@/lib/utils'

export const revalidate = 0
export const dynamic = 'force-dynamic'

export default async function ScheduleBuilderPage({
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
    orderBy: { gradeLevel: 'asc' }
  })

  // Get selected class or first class
  const selectedClassId = searchParams.classId || classes[0]?.id
  
  if (!selectedClassId) {
    return (
      <div className="space-y-6 p-6">
        <Card>
          <CardContent className="py-16 text-center">
            <Calendar className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Sinflar yo'q</h2>
            <p className="text-muted-foreground mb-4">
              Dars jadvali yaratish uchun avval sinf yarating
            </p>
            <Button asChild>
              <Link href="/admin/classes/create">
                Sinf yaratish
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const classItem = classes.find(c => c.id === selectedClassId)!

  // Get all subjects for tenant (not just class subjects)
  const subjects = await db.subject.findMany({
    where: { tenantId },
    orderBy: { name: 'asc' }
  })

  // Get teachers
  const teachers = await db.teacher.findMany({
    where: { tenantId },
    include: {
      user: {
        select: {
          fullName: true
        }
      }
    },
    orderBy: {
      user: {
        fullName: 'asc'
      }
    }
  })

  // Get existing schedules
  const existingSchedules = await db.schedule.findMany({
    where: {
      tenantId,
      classId: selectedClassId,
      academicYear
    },
    include: {
      subject: true,
      teacher: {
        include: {
          user: {
            select: {
              fullName: true
            }
          }
        }
      }
    }
  })

  return (
    <div className="space-y-6 p-6">
      <Toaster position="top-right" richColors />
      
      {/* Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/admin/schedules">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold">Dars Jadvali Constructor</h1>
            <p className="text-sm lg:text-base text-muted-foreground">
              Drag & Drop interfeysi bilan dars jadvalini yarating
            </p>
          </div>
        </div>
        
        {/* Quick Stats */}
        <div className="flex items-center gap-3 text-sm">
          <div className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg">
            <span className="font-semibold">{subjects.length}</span>
            <span>Fanlar</span>
          </div>
          <div className="flex items-center gap-1 px-3 py-1.5 bg-green-50 text-green-700 rounded-lg">
            <span className="font-semibold">{teachers.length}</span>
            <span>O'qituvchilar</span>
          </div>
        </div>
      </div>

      {/* Class Selector */}
      {classes.length > 0 && (
        <Card className="border-2 border-purple-200">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <span className="text-sm font-semibold flex items-center gap-2">
                <Calendar className="h-4 w-4 text-purple-600" />
                Sinf tanlang:
              </span>
              <div className="flex items-center gap-2 flex-wrap">
                {classes.map(cls => (
                  <Button
                    key={cls.id}
                    variant={cls.id === selectedClassId ? 'default' : 'outline'}
                    size="sm"
                    asChild
                    className={cn(
                      "transition-all",
                      cls.id === selectedClassId && "shadow-md"
                    )}
                  >
                    <Link href={`/admin/schedules/builder?classId=${cls.id}`}>
                      {cls.name}
                      {cls.id === selectedClassId && (
                        <CheckCircle2 className="ml-2 h-3 w-3" />
                      )}
                    </Link>
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Builder Component */}
      <ScheduleBuilder
        classItem={classItem}
        teachers={teachers}
        subjects={subjects}
        existingSchedules={existingSchedules}
      />
    </div>
  )
}

