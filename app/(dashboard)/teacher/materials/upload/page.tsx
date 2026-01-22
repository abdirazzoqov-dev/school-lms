import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { MaterialUploadForm } from './material-upload-form'

export default async function MaterialUploadPage() {
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

  // Get teacher's subjects
  const teacherSubjects = await db.classSubject.findMany({
    where: { teacherId: teacher.id },
    include: {
      subject: true,
      class: true
    }
  })

  // Get unique subjects
  const subjectsMap = new Map()
  teacherSubjects.forEach(ts => {
    if (!subjectsMap.has(ts.subject.id)) {
      subjectsMap.set(ts.subject.id, ts.subject)
    }
  })
  const subjects = Array.from(subjectsMap.values())

  // Get unique classes
  const classesMap = new Map()
  teacherSubjects.forEach(ts => {
    if (!classesMap.has(ts.class.id)) {
      classesMap.set(ts.class.id, ts.class)
    }
  })
  const classes = Array.from(classesMap.values())

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/teacher/materials">
          <Button variant="ghost" size="sm" className="hover:bg-gray-100 dark:hover:bg-gray-800">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Orqaga
          </Button>
        </Link>
        <div className="space-y-1">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Material Yuklash
          </h1>
          <p className="text-lg text-muted-foreground">
            Yangi darslik, topshiriq yoki hujjat yuklang
          </p>
        </div>
      </div>

      <Card className="border-none shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
          <CardTitle className="text-blue-600">Material Ma'lumotlari</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <MaterialUploadForm 
            subjects={subjects}
            classes={classes}
          />
        </CardContent>
      </Card>
    </div>
  )
}

