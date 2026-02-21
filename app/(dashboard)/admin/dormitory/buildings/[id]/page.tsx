import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Building2, Edit, DoorClosed, BedDouble, Users, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'

interface PageProps {
  params: {
    id: string
  }
}

// Optimized caching: Cache for 30 seconds for detail pages ⚡
export const revalidate = 30
export const dynamic = 'auto' // Allows Next.js to optimize route caching

export default async function BuildingDetailPage({ params }: PageProps) {
  const session = await getServerSession(authOptions)

  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'MODERATOR')) {
    redirect('/unauthorized')
  }

  const tenantId = session.user.tenantId!

  // Get building with rooms and assignments
  const building = await db.dormitoryBuilding.findFirst({
    where: {
      id: params.id,
      tenantId,
    },
    include: {
      rooms: {
        include: {
          beds: {
            where: { isActive: true },
          },
          assignments: {
            where: { status: 'ACTIVE' },
            include: {
              student: {
                include: {
                  user: {
                    select: {
                      fullName: true,
                    },
                  },
                  class: {
                    select: {
                      name: true,
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: [
          { floor: 'asc' },
          { roomNumber: 'asc' },
        ],
      },
    },
  })

  if (!building) {
    notFound()
  }

  // Calculate statistics
  const totalRooms = building.rooms.length
  const activeRooms = building.rooms.filter(r => r.isActive).length
  const totalBeds = building.rooms.reduce((sum, r) => sum + r.capacity, 0)
  const occupiedBeds = building.rooms.reduce((sum, r) => sum + r.occupiedBeds, 0)
  const availableBeds = totalBeds - occupiedBeds
  const occupancyRate = totalBeds > 0 ? (occupiedBeds / totalBeds) * 100 : 0

  // Group rooms by floor
  const roomsByFloor = building.rooms.reduce((acc, room) => {
    if (!acc[room.floor]) {
      acc[room.floor] = []
    }
    acc[room.floor].push(room)
    return acc
  }, {} as Record<number, typeof building.rooms>)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/dormitory/buildings">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <Building2 className="h-8 w-8 text-indigo-500" />
                {building.name}
              </h1>
              {building.gender && (
                <Badge variant="outline" className={
                  building.gender === 'MALE' 
                    ? 'bg-blue-50 text-blue-700' 
                    : 'bg-pink-50 text-pink-700'
                }>
                  {building.gender === 'MALE' ? 'O\'g\'il bolalar' : 'Qizlar'}
                </Badge>
              )}
              <Badge variant={building.isActive ? 'default' : 'secondary'}>
                {building.isActive ? 'Faol' : 'Nofaol'}
              </Badge>
            </div>
            <p className="text-muted-foreground mt-1">
              Kod: {building.code} • {building.totalFloors} qavat
            </p>
          </div>
        </div>
        <Link href={`/admin/dormitory/buildings/${building.id}/edit`}>
          <Button variant="outline" className="gap-2">
            <Edit className="h-4 w-4" />
            Tahrirlash
          </Button>
        </Link>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-indigo-800">Xonalar</CardTitle>
            <DoorClosed className="h-5 w-5 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-indigo-700">{totalRooms}</div>
            <p className="text-xs text-indigo-600 mt-1">
              {activeRooms} ta faol
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-800">Bo'sh Joylar</CardTitle>
            <BedDouble className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-700">{availableBeds}</div>
            <p className="text-xs text-green-600 mt-1">
              {totalBeds} dan
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-800">Band Joylar</CardTitle>
            <Users className="h-5 w-5 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-700">{occupiedBeds}</div>
            <p className="text-xs text-orange-600 mt-1">
              O'quvchilar
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-800">Band Bo'lish</CardTitle>
            <TrendingUp className="h-5 w-5 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-700">{occupancyRate.toFixed(1)}%</div>
            <p className="text-xs text-purple-600 mt-1">
              Darajasi
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Building Info */}
      {(building.address || building.description || building.contactPerson) && (
        <Card>
          <CardHeader>
            <CardTitle>Bino Ma'lumotlari</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {building.address && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Manzil</p>
                <p className="text-sm">{building.address}</p>
              </div>
            )}
            {building.description && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Tavsif</p>
                <p className="text-sm">{building.description}</p>
              </div>
            )}
            {building.contactPerson && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Mas'ul shaxs</p>
                  <p className="text-sm">{building.contactPerson}</p>
                </div>
                {building.contactPhone && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Telefon</p>
                    <p className="text-sm">{building.contactPhone}</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Rooms by Floor */}
      <Card>
        <CardHeader>
          <CardTitle>Xonalar ({totalRooms})</CardTitle>
          <CardDescription>
            Qavatlarga bo'lingan xonalar ro'yxati
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {Object.keys(roomsByFloor)
            .sort((a, b) => Number(a) - Number(b))
            .map((floor) => {
              const floorRooms = roomsByFloor[Number(floor)]
              const floorCapacity = floorRooms.reduce((sum, r) => sum + r.capacity, 0)
              const floorOccupied = floorRooms.reduce((sum, r) => sum + r.occupiedBeds, 0)
              const floorOccupancyRate = floorCapacity > 0 ? (floorOccupied / floorCapacity) * 100 : 0

              return (
                <div key={floor} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">
                      {floor}-qavat
                      <span className="text-sm text-muted-foreground ml-2">
                        ({floorRooms.length} xona)
                      </span>
                    </h3>
                    <div className="text-sm text-muted-foreground">
                      {floorOccupied}/{floorCapacity} • {floorOccupancyRate.toFixed(0)}%
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {floorRooms.map((room) => {
                      const roomOccupancyRate = (room.occupiedBeds / room.capacity) * 100
                      const availableInRoom = room.capacity - room.occupiedBeds

                      return (
                        <Link key={room.id} href={`/admin/dormitory/rooms/${room.id}`}>
                          <Card className="hover:shadow-md transition-all cursor-pointer group">
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between mb-3">
                                <div>
                                  <p className="font-semibold text-lg font-mono">
                                    Xona {room.roomNumber}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {room.roomType}
                                  </p>
                                </div>
                                {room.gender && (
                                  <Badge variant="outline" className={
                                    room.gender === 'MALE' 
                                      ? 'bg-blue-50 text-blue-700 text-xs' 
                                      : 'bg-pink-50 text-pink-700 text-xs'
                                  }>
                                    {room.gender === 'MALE' ? 'O\'g\'il' : 'Qiz'}
                                  </Badge>
                                )}
                              </div>

                              <div className="space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-muted-foreground">Joylar:</span>
                                  <span className="font-semibold">
                                    {room.occupiedBeds}/{room.capacity}
                                  </span>
                                </div>

                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-muted-foreground">Bo'sh:</span>
                                  <span className={`font-semibold ${
                                    availableInRoom > 0 ? 'text-green-600' : 'text-red-600'
                                  }`}>
                                    {availableInRoom}
                                  </span>
                                </div>

                                <div className="w-full bg-gray-200 rounded-full h-2">
                                  <div
                                    className={`h-2 rounded-full transition-all ${
                                      roomOccupancyRate >= 100
                                        ? 'bg-red-500'
                                        : roomOccupancyRate > 0
                                        ? 'bg-orange-500'
                                        : 'bg-green-500'
                                    }`}
                                    style={{ width: `${roomOccupancyRate}%` }}
                                  />
                                </div>

                                <div className="text-xs text-muted-foreground">
                                  {Number(room.pricePerMonth) === 0
                                    ? <span className="text-emerald-600 font-semibold">🎓 Bepul</span>
                                    : `${Number(room.pricePerMonth).toLocaleString()} so'm/oy`
                                  }
                                </div>
                              </div>

                              {/* Students in room */}
                              {room.assignments.length > 0 && (
                                <div className="mt-3 pt-3 border-t">
                                  <p className="text-xs font-medium text-muted-foreground mb-2">
                                    O'quvchilar:
                                  </p>
                                  <div className="space-y-1">
                                    {room.assignments.slice(0, 2).map((assignment) => (
                                      <p key={assignment.id} className="text-xs truncate">
                                        • {assignment.student.user?.fullName}
                                      </p>
                                    ))}
                                    {room.assignments.length > 2 && (
                                      <p className="text-xs text-muted-foreground">
                                        +{room.assignments.length - 2} ta yana...
                                      </p>
                                    )}
                                  </div>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        </Link>
                      )
                    })}
                  </div>
                </div>
              )
            })}

          {totalRooms === 0 && (
            <div className="text-center py-12">
              <DoorClosed className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                Bu binoda hozircha xonalar yo'q
              </p>
              <Link href="/admin/dormitory/rooms/create">
                <Button className="mt-4">
                  <DoorClosed className="h-4 w-4 mr-2" />
                  Xona qo'shish
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

