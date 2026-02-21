import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { BuildingEditForm } from './building-edit-form'

interface PageProps {
  params: {
    id: string
  }
}

export default async function EditBuildingPage({ params }: PageProps) {
  const session = await getServerSession(authOptions)

  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'MODERATOR')) {
    redirect('/unauthorized')
  }

  const tenantId = session.user.tenantId!

  // Fetch building
  const building = await db.dormitoryBuilding.findFirst({
    where: {
      id: params.id,
      tenantId,
    },
  })

  if (!building) {
    redirect('/admin/dormitory/buildings')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/dormitory/buildings">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Binoni Tahrirlash</h1>
          <p className="text-muted-foreground">
            {building.name} ma'lumotlarini o'zgartirish
          </p>
        </div>
      </div>

      {/* Form */}
      <BuildingEditForm building={building} />
    </div>
  )
}

