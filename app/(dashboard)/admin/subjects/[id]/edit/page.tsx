import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { EditSubjectForm } from './edit-subject-form'

export default async function EditSubjectPage({
  params,
}: {
  params: { id: string }
}) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'MODERATOR')) {
      redirect('/unauthorized')
    }

    const tenantId = session.user.tenantId!

    // Get subject
    const subject = await db.subject.findFirst({
      where: {
        id: params.id,
        tenantId
      }
    }).catch(() => null)

    if (!subject) {
      notFound()
    }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/subjects">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Orqaga
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Fanni Tahrirlash</h1>
          <p className="text-muted-foreground">
            {subject.name} fanini tahrirlash
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Fan Ma'lumotlari</CardTitle>
        </CardHeader>
        <CardContent>
          <EditSubjectForm
            subjectId={subject.id}
            initialData={{
              name: subject.name,
              code: subject.code,
              description: subject.description || '',
              color: subject.color || undefined,
            }}
          />
        </CardContent>
      </Card>
    </div>
  )
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Edit subject page error:', error)
    }
    throw error
  }
}

