import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { EditParentForm } from './edit-parent-form'

interface PageProps {
  params: {
    id: string
  }
}

export default async function EditParentPage({ params }: PageProps) {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'ADMIN') {
    redirect('/unauthorized')
  }

  const tenantId = session.user.tenantId!

  // Get parent details
  const parent = await db.parent.findFirst({
    where: {
      id: params.id,
      tenantId,
    },
    select: {
      id: true,
      guardianType: true,
      customRelationship: true,
      occupation: true,
      workAddress: true,
      emergencyContact: true,
      user: {
        select: {
          fullName: true,
          email: true,
          phone: true,
          isActive: true,
        },
      },
    },
  })

  if (!parent) {
    notFound()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/admin/parents/${parent.id}`}>
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Ota-onani tahrirlash</h1>
          <p className="text-muted-foreground">
            {parent.user?.fullName} ma'lumotlarini yangilash
          </p>
        </div>
      </div>

      {/* Form */}
      <EditParentForm parent={parent} />
    </div>
  )
}

