import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { RoomForm } from './room-form'

export default async function CreateRoomPage() {
  const session = await getServerSession(authOptions)

  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'MODERATOR')) {
    redirect('/unauthorized')
  }

  const tenantId = session.user.tenantId!

  // Get buildings
  const buildings = await db.dormitoryBuilding.findMany({
    where: { tenantId, isActive: true },
    select: {
      id: true,
      name: true,
      code: true,
      totalFloors: true,
    },
    orderBy: { name: 'asc' },
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/dormitory/rooms">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Yangi Xona Qo'shish</h1>
          <p className="text-muted-foreground">
            Yotoqxona xonasini yaratish
          </p>
        </div>
      </div>

      {/* Form */}
      <RoomForm buildings={buildings} />
    </div>
  )
}

