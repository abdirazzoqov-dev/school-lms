import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { DoorClosed, Plus, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { RoomsTable } from './rooms-table'
import { PermissionGate } from '@/components/admin/permission-gate'

export const revalidate = 30 // Optimized for faster loads
export const dynamic = 'auto' // Optimized for better caching

interface SearchParams {
  building?: string
  status?: string
  availability?: string
}

export default async function RoomsPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const session = await getServerSession(authOptions)

  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'MODERATOR')) {
    redirect('/unauthorized')
  }

  const tenantId = session.user.tenantId!

  // Build where clause
  const whereClause: any = { tenantId, isActive: true }

  if (searchParams.building) {
    whereClause.buildingId = searchParams.building
  }

  if (searchParams.availability === 'available') {
    whereClause.occupiedBeds = { lt: db.dormitoryRoom.fields.capacity }
  } else if (searchParams.availability === 'full') {
    whereClause.occupiedBeds = { gte: db.dormitoryRoom.fields.capacity }
  }

  // Get rooms with beds info
  const rooms = await db.dormitoryRoom.findMany({
    where: whereClause,
    include: {
      building: {
        select: {
          name: true,
          code: true,
        },
      },
      beds: {
        where: { isActive: true },
        select: {
          id: true,
          bedNumber: true,
          isOccupied: true,
          bedType: true,
        },
        orderBy: { bedNumber: 'asc' },
      },
      assignments: {
        where: { status: 'ACTIVE' },
        select: {
          id: true,
          student: {
            select: {
              user: {
                select: {
                  fullName: true,
                },
              },
            },
          },
        },
      },
    },
    orderBy: [
      { building: { name: 'asc' } },
      { floor: 'asc' },
      { roomNumber: 'asc' },
    ],
  })

  // Get buildings for filter
  const buildings = await db.dormitoryBuilding.findMany({
    where: { tenantId, isActive: true },
    select: {
      id: true,
      name: true,
      code: true,
    },
    orderBy: { name: 'asc' },
  })

  // Statistics
  const totalRooms = rooms.length
  const fullRooms = rooms.filter((r) => r.occupiedBeds >= r.capacity).length
  const partiallyOccupied = rooms.filter(
    (r) => r.occupiedBeds > 0 && r.occupiedBeds < r.capacity
  ).length
  const emptyRooms = rooms.filter((r) => r.occupiedBeds === 0).length
  const serializedRooms = rooms.map((room) => ({
    ...room,
    pricePerMonth: Number(room.pricePerMonth),
    roomType: room.roomType as 'STANDARD' | 'LUXURY' | 'SUITE',
  }))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin/dormitory">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <DoorClosed className="h-8 w-8 text-blue-500" />
              Xonalar
            </h1>
            <p className="text-muted-foreground mt-1">
              Barcha xonalar va bo'sh joylar haqida ma'lumot
            </p>
          </div>
        </div>
        <PermissionGate resource="dormitory" action="CREATE">
          <Link href="/admin/dormitory/rooms/create">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Yangi Xona
            </Button>
          </Link>
        </PermissionGate>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Jami Xonalar
            </CardTitle>
            <DoorClosed className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRooms}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Bo'sh Xonalar
            </CardTitle>
            <DoorClosed className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {emptyRooms}
            </div>
            <p className="text-xs text-muted-foreground">
              To'liq bo'sh
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Qisman Band
            </CardTitle>
            <DoorClosed className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {partiallyOccupied}
            </div>
            <p className="text-xs text-muted-foreground">
              Bo'sh joy bor
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              To'lgan Xonalar
            </CardTitle>
            <DoorClosed className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {fullRooms}
            </div>
            <p className="text-xs text-muted-foreground">
              Bo'sh joy yo'q
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Xonalar ro'yxati</CardTitle>
          <CardDescription>
            Barcha xonalar va ularning band bo'lish holati
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RoomsTable 
            rooms={serializedRooms} 
            buildings={buildings}
            searchParams={searchParams}
          />
        </CardContent>
      </Card>
    </div>
  )
}
