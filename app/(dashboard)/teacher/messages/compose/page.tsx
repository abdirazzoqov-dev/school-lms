import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { ComposeMessageForm } from './compose-message-form'

export default async function ComposeMessagePage({
  searchParams,
}: {
  searchParams: { replyTo?: string; parentId?: string; studentId?: string }
}) {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'TEACHER') {
    redirect('/unauthorized')
  }

  const tenantId = session.user.tenantId!

  // Get teacher
  const teacher = await db.teacher.findFirst({
    where: { userId: session.user.id }
  })

  if (!teacher) {
    redirect('/unauthorized')
  }

  // Get teacher's students' parents from Schedule (constructor-based)
  const schedules = await db.schedule.findMany({
    where: { 
      teacherId: teacher.id,
      type: 'LESSON'
    },
    select: {
      classId: true,
      class: {
        include: {
          students: {
            include: {
              user: {
                select: { fullName: true }
              },
              class: {
                select: { name: true }
              },
              parents: {
                include: {
                  parent: {
                    include: {
                      user: {
                        select: { id: true, fullName: true }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  })

  // Build list of unique parents with their students (including class info for search)
  const parentsMap = new Map()
  const studentsMap = new Map()

  schedules.forEach(schedule => {
    schedule.class?.students.forEach(student => {
      studentsMap.set(student.id, {
        id: student.id,
        name: student.user?.fullName || 'Unknown',
        className: student.class?.name || ''
      })

      student.parents.forEach(sp => {
        const parent = sp.parent
        const parentKey = parent.user.id
        
        if (!parentsMap.has(parentKey)) {
          parentsMap.set(parentKey, {
            id: parent.user.id,
            name: parent.user.fullName,
            students: []
          })
        }
        
        const parentData = parentsMap.get(parentKey)
        if (!parentData.students.find((s: any) => s.id === student.id)) {
          parentData.students.push({
            id: student.id,
            name: student.user?.fullName || 'Unknown',
            className: student.class?.name || ''
          })
        }
      })
    })
  })

  const parents = Array.from(parentsMap.values())
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
        <Link href="/teacher/messages">
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
            Ota-onaga xabar yuboring
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Xabar Tafsilotlari</CardTitle>
        </CardHeader>
        <CardContent>
          <ComposeMessageForm
            parents={parents}
            students={students}
            replyToMessage={replyToMessage}
            preselectedParentId={searchParams.parentId}
            preselectedStudentId={searchParams.studentId}
          />
        </CardContent>
      </Card>
    </div>
  )
}

