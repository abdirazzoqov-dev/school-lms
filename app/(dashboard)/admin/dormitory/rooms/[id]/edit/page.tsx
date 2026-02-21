import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { RoomEditForm } from './room-edit-form'

interface PageProps {
  params: {
    id: string
  }
}

export default async function EditRoomPage({ params }: PageProps) {
  const session = await getServerSession(authOptions)

  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'MODERATOR')) {
    redirect('/unauthorized')
  }

  const tenantId = session.user.tenantId!

  // Fetch room with building info
  const room = await db.dormitoryRoom.findFirst({
    where: {
      id: params.id,
      tenantId,
    },
    include: {
      building: {
        select: {
          id: true,
          name: true,
          code: true,
          totalFloors: true,
        },
      },
    },
  })

  if (!room) {
    redirect('/admin/dormitory/rooms')
  }

  // Get all buildings for the dropdown
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

  // Convert Decimal to number and ensure roomType is correct type
  const roomData = {
    ...room,
    pricePerMonth: Number(room.pricePerMonth),
    roomType: room.roomType as 'STANDARD' | 'LUXURY' | 'SUITE',
  }

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
          <h1 className="text-3xl font-bold">Xonani Tahrirlash</h1>
          <p className="text-muted-foreground">
            {room.roomNumber} xonasi ma'lumotlarini o'zgartirish
          </p>
        </div>
      </div>

      {/* Form */}
      <RoomEditForm room={roomData} buildings={buildings} />
    </div>
  )
}

