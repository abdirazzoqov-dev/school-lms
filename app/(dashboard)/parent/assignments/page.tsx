import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileText, Calendar, User } from 'lucide-react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { formatDateTime } from '@/lib/utils'

export default async function ParentAssignmentsPage({
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
          class: {
            select: { id: true, name: true }
          }
        }
      }
    }
  })

  if (children.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Uy Vazifalari</h1>
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
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
        <h1 className="text-3xl font-bold">Uy Vazifalari</h1>
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Farzandingiz sinfga biriktirilmagan</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Get assignments for student's class
  const assignments = await db.assignment.findMany({
    where: {
      tenantId,
      classId: selectedStudent.classId
    },
    include: {
      subject: {
        select: { name: true }
      },
      teacher: {
        include: {
          user: {
            select: { fullName: true }
          }
        }
      }
    },
    orderBy: { dueDate: 'desc' }
  })

  // Statistics
  const totalAssignments = assignments.length
  const activeAssignments = assignments.filter(a => new Date(a.dueDate) > new Date()).length
  const overdueAssignments = assignments.filter(a => new Date(a.dueDate) < new Date()).length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Uy Vazifalari</h1>
        <p className="text-muted-foreground">
          Farzandingizning uy vazifalari
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
                  href={`/parent/assignments?studentId=${student.id}`}
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

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{totalAssignments}</div>
                <p className="text-sm text-muted-foreground">Jami vazifalar</p>
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
                <div className="text-2xl font-bold">{activeAssignments}</div>
                <p className="text-sm text-muted-foreground">Faol vazifalar</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-red-100 rounded-lg">
                <Calendar className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{overdueAssignments}</div>
                <p className="text-sm text-muted-foreground">Muddati o'tgan</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Assignments List */}
      <Card>
        <CardHeader>
          <CardTitle>Uy vazifalari ro'yxati</CardTitle>
        </CardHeader>
        <CardContent>
          {assignments.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Hozircha uy vazifalari yo'q</p>
            </div>
          ) : (
            <div className="space-y-4">
              {assignments.map((assignment) => {
                const isOverdue = new Date(assignment.dueDate) < new Date()
                const isDueSoon = new Date(assignment.dueDate) < new Date(Date.now() + 24 * 60 * 60 * 1000) && !isOverdue

                return (
                  <Card key={assignment.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="pt-6">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold text-lg">{assignment.title}</h3>
                              {isOverdue && (
                                <Badge variant="destructive">Muddati o'tgan</Badge>
                              )}
                              {isDueSoon && (
                                <Badge variant="outline" className="border-yellow-500 text-yellow-700">
                                  Tez orada
                                </Badge>
                              )}
                            </div>

                            {assignment.description && (
                              <p className="text-sm text-muted-foreground mb-3">
                                {assignment.description}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2 text-sm">
                          <Badge variant="outline">
                            {assignment.subject.name}
                          </Badge>
                          <span className="text-muted-foreground flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {assignment.teacher.user.fullName}
                          </span>
                          <span className="text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Muddati: {formatDateTime(new Date(assignment.dueDate))}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Message */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <FileText className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-900 mb-1">
                Uy vazifalari moduli
              </h3>
              <p className="text-sm text-blue-800">
                Bu modul hozirda ishlab chiqilmoqda. Tez orada farzandingizning uy vazifalarini 
                topshirish holati va o'qituvchi baholashini ko'rish imkoniyati qo'shiladi.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

