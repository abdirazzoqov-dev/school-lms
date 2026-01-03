import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { Timetable } from '@/components/timetable'
import { Card, CardContent } from '@/components/ui/card'
import { Calendar } from 'lucide-react'
import { getCurrentAcademicYear } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default async function ParentSchedulePage({
  searchParams,
}: {
  searchParams: { studentId?: string }
}) {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'PARENT') {
    redirect('/unauthorized')
  }

  const tenantId = session.user.tenantId!

  // Get parent
  const parent = await db.parent.findFirst({
    where: { userId: session.user.id }
  })

  if (!parent) {
    redirect('/unauthorized')
  }

  // Get parent's children
  const children = await db.studentParent.findMany({
    where: { parentId: parent.id },
    include: {
      student: {
        include: {
          user: {
            select: { fullName: true }
          },
          class: true
        }
      }
    }
  })

  if (children.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Dars Jadvali</h1>
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Sizga farzandlar biriktirilmagan</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const selectedStudentId = searchParams.studentId || children[0].student.id
  const selectedStudent = children.find(c => c.student.id === selectedStudentId)?.student

  if (!selectedStudent || !selectedStudent.classId) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Dars Jadvali</h1>
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Farzandingiz sinfga biriktirilmagan</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const academicYear = getCurrentAcademicYear()

  // Get class schedule
  const schedules = await db.schedule.findMany({
    where: {
      tenantId,
      classId: selectedStudent.classId,
      academicYear
    },
    include: {
      subject: true,
      teacher: {
        include: {
          user: {
            select: { fullName: true }
          }
        }
      }
    },
    orderBy: [
      { dayOfWeek: 'asc' },
      { startTime: 'asc' }
    ]
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dars Jadvali</h1>
        <p className="text-muted-foreground">
          Farzandingizning dars jadvali
        </p>
      </div>

      {/* Child Selector */}
      {children.length > 1 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-2">
              {children.map(({ student }) => (
                <Link 
                  key={student.id} 
                  href={`/parent/schedule?studentId=${student.id}`}
                >
                  <Button 
                    variant={selectedStudentId === student.id ? 'default' : 'outline'}
                    size="sm"
                  >
                    {student.user?.fullName} ({student.class?.name})
                  </Button>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Timetable */}
      <Timetable 
        schedules={schedules}
        title={`${selectedStudent.user?.fullName} - ${selectedStudent.class?.name}`}
        showTeacher={true}
        showClass={false}
      />
    </div>
  )
}

