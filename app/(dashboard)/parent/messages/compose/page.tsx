import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { ComposeMessageForm } from './compose-message-form'

export default async function ParentComposeMessagePage({
  searchParams,
}: {
  searchParams: { replyTo?: string }
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

  // Get parent's children with their teachers
  const children = await db.studentParent.findMany({
    where: { parentId: parent.id },
    include: {
      student: {
        include: {
          user: {
            select: { fullName: true }
          },
          class: {
            include: {
              // Include class teacher (Sinf rahbari)
              classTeacher: {
                include: {
                  user: {
                    select: { id: true, fullName: true }
                  }
                }
              },
              // Include subject teachers
              classSubjects: {
                include: {
                  teacher: {
                    include: {
                      user: {
                        select: { id: true, fullName: true }
                      }
                    }
                  },
                  subject: {
                    select: { name: true }
                  }
                }
              }
            }
          }
        }
      }
    }
  })

  // Build list of unique teachers
  const teachersMap = new Map()
  const studentsMap = new Map()

  children.forEach(({ student }) => {
    studentsMap.set(student.id, {
      id: student.id,
      name: student.user?.fullName || 'Unknown'
    })

    // Add class teacher (Sinf rahbari) - FIRST PRIORITY
    if (student.class?.classTeacher) {
      const classTeacher = student.class.classTeacher
      const teacherKey = classTeacher.user.id
      
      if (!teachersMap.has(teacherKey)) {
        teachersMap.set(teacherKey, {
          id: classTeacher.user.id,
          name: classTeacher.user.fullName,
          subjects: ['Sinf rahbari'],
          isClassTeacher: true
        })
      }
    }

    // Add subject teachers
    student.class?.classSubjects.forEach(cs => {
      const teacher = cs.teacher
      const teacherKey = teacher.user.id
      
      if (!teachersMap.has(teacherKey)) {
        teachersMap.set(teacherKey, {
          id: teacher.user.id,
          name: teacher.user.fullName,
          subjects: [],
          isClassTeacher: false
        })
      }
      
      const teacherData = teachersMap.get(teacherKey)
      if (!teacherData.subjects.find((s: any) => s === cs.subject.name)) {
        teacherData.subjects.push(cs.subject.name)
      }
    })
  })

  const teachers = Array.from(teachersMap.values())
  const students = Array.from(studentsMap.values())

  // If replying to a message
  let replyToMessage = null
  if (searchParams.replyTo) {
    replyToMessage = await db.message.findFirst({
      where: {
        id: searchParams.replyTo,
        tenantId,
        receiverId: session.user.id
      },
      include: {
        sender: {
          select: { id: true, fullName: true }
        }
      }
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/parent/messages">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Orqaga
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">
            {replyToMessage ? 'Javob Yozish' : 'Yangi Xabar'}
          </h1>
          <p className="text-muted-foreground">
            O'qituvchiga xabar yuboring
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Xabar Tafsilotlari</CardTitle>
        </CardHeader>
        <CardContent>
          <ComposeMessageForm
            teachers={teachers}
            students={students}
            replyToMessage={replyToMessage}
          />
        </CardContent>
      </Card>
    </div>
  )
}

