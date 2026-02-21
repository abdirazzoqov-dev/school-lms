import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { EditGradeForm } from './edit-grade-form'

interface PageProps {
  params: {
    id: string
  }
}

export default async function EditGradePage({ params }: PageProps) {
  const session = await getServerSession(authOptions)

  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'MODERATOR')) {
    redirect('/unauthorized')
  }

  const tenantId = session.user.tenantId!

  // Get grade record
  const grade = await db.grade.findFirst({
    where: {
      id: params.id,
      tenantId,
    },
    include: {
      student: {
        include: {
          user: {
            select: {
              fullName: true,
            },
          },
        },
      },
      subject: {
        select: {
          name: true,
        },
      },
    },
  })

  if (!grade) {
    notFound()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/admin/grades/${grade.id}`}>
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Bahoni Tahrirlash</h1>
          <p className="text-muted-foreground mt-1">
            {grade.student.user?.fullName} - {grade.subject.name}
          </p>
        </div>
      </div>

      {/* Form */}
      <EditGradeForm grade={grade} />
    </div>
  )
}

