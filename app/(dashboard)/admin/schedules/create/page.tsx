import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { ScheduleForm } from './schedule-form'
import { getCurrentAcademicYear } from '@/lib/utils'

export default async function CreateSchedulePage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'ADMIN') {
    redirect('/unauthorized')
  }

  const tenantId = session.user.tenantId!
  const academicYear = getCurrentAcademicYear()

  // Get classes
  const classes = await db.class.findMany({
    where: { tenantId, academicYear },
    orderBy: { name: 'asc' }
  })

  // Get groups
  const groups = await db.group.findMany({
    where: { tenantId, academicYear },
    orderBy: { name: 'asc' }
  })

  // Get subjects
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
      user: { fullName: 'asc' }
    }
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/schedules">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Orqaga
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Dars Qo'shish</h1>
          <p className="text-muted-foreground">
            Sinf yoki guruh uchun yangi dars qo'shing
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dars Ma'lumotlari</CardTitle>
        </CardHeader>
        <CardContent>
          <ScheduleForm
            classes={classes}
            groups={groups}
            subjects={subjects}
            teachers={teachers}
            academicYear={academicYear}
          />
        </CardContent>
      </Card>
    </div>
  )
}

