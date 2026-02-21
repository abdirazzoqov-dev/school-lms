import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, DoorClosed, Edit, BedDouble, Users, DollarSign, Building2 } from 'lucide-react'
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

export default async function RoomDetailPage({ params }: PageProps) {
  const session = await getServerSession(authOptions)

  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'MODERATOR')) {
    redirect('/unauthorized')
  }

  const tenantId = session.user.tenantId!

  // Get room with beds and assignments
  const room = await db.dormitoryRoom.findFirst({
    where: {
      id: params.id,
      tenantId,
    },
    include: {
      building: {
        select: {
          name: true,
          code: true,
        },
      },
      beds: {
        where: { isActive: true },
        orderBy: { bedNumber: 'asc' },
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
          bed: {
            select: {
              bedNumber: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      },
    },
  })

  if (!room) {
    notFound()
  }

  // Calculate statistics
  const totalBeds = room.beds.length
  const occupiedBeds = room.beds.filter(b => b.isOccupied).length
  const availableBeds = totalBeds - occupiedBeds
  const occupancyRate = totalBeds > 0 ? (occupiedBeds / totalBeds) * 100 : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/admin/dormitory/buildings/${room.buildingId}`}>
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <DoorClosed className="h-8 w-8 text-blue-500" />
                Xona {room.roomNumber}
              </h1>
              {room.gender && (
                <Badge variant="outline" className={
                  room.gender === 'MALE' 
                    ? 'bg-blue-50 text-blue-700' 
                    : 'bg-pink-50 text-pink-700'
                }>
                  {room.gender === 'MALE' ? 'O\'g\'il bolalar' : 'Qizlar'}
                </Badge>
              )}
              <Badge variant={room.isActive ? 'default' : 'secondary'}>
                {room.isActive ? 'Faol' : 'Nofaol'}
              </Badge>
            </div>
            <p className="text-muted-foreground mt-1">
              {room.building.name} • {room.floor}-qavat • {room.roomType}
            </p>
          </div>
        </div>
        <Link href={`/admin/dormitory/rooms/${room.id}/edit`}>
          <Button variant="outline" className="gap-2">
            <Edit className="h-4 w-4" />
            Tahrirlash
          </Button>
        </Link>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-800">Jami Joylar</CardTitle>
            <BedDouble className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-700">{totalBeds}</div>
            <p className="text-xs text-blue-600 mt-1">
              To'shaklar
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
              Mavjud
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
            <DollarSign className="h-5 w-5 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-700">{occupancyRate.toFixed(0)}%</div>
            <p className="text-xs text-purple-600 mt-1">
              Darajasi
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Room Info */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Xona Ma'lumotlari</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Bino</p>
                <p className="text-sm font-semibold">{room.building.name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Qavat</p>
                <p className="text-sm font-semibold">{room.floor}-qavat</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Sig'im</p>
                <p className="text-sm font-semibold">{room.capacity} joy</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Turi</p>
                <p className="text-sm font-semibold">{room.roomType}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Oylik narx</p>
                <p className="text-sm font-semibold text-green-600">
                  {Number(room.pricePerMonth).toLocaleString()} so'm
                </p>
              </div>
            </div>

            {room.description && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Tavsif</p>
                <p className="text-sm">{room.description}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Occupancy Progress */}
        <Card>
          <CardHeader>
            <CardTitle>Band Bo'lish Holati</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Band joylar</span>
                <span className="text-sm font-semibold">{occupiedBeds}/{totalBeds}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div
                  className={`h-4 rounded-full transition-all ${
                    occupancyRate >= 100
                      ? 'bg-red-500'
                      : occupancyRate > 50
                      ? 'bg-orange-500'
                      : 'bg-green-500'
                  }`}
                  style={{ width: `${occupancyRate}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-2">
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">{availableBeds}</p>
                <p className="text-xs text-green-700">Bo'sh</p>
              </div>
              <div className="text-center p-3 bg-orange-50 rounded-lg">
                <p className="text-2xl font-bold text-orange-600">{occupiedBeds}</p>
                <p className="text-xs text-orange-700">Band</p>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <p className="text-2xl font-bold text-purple-600">{occupancyRate.toFixed(0)}%</p>
                <p className="text-xs text-purple-700">Darajasi</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Beds Layout */}
      <Card>
        <CardHeader>
          <CardTitle>Joylar Joylashuvi</CardTitle>
          <CardDescription>
            Xonadagi barcha to'shaklar va ularning holati
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {room.beds.map((bed) => {
              const assignment = room.assignments.find(a => a.bedId === bed.id)
              
              return (
                <div
                  key={bed.id}
                  className={`p-4 border-2 rounded-lg transition-all ${
                    bed.isOccupied
                      ? 'border-red-300 bg-red-50'
                      : 'border-green-300 bg-green-50'
                  }`}
                >
                  <div className="flex flex-col items-center text-center space-y-2">
                    <BedDouble className={`h-8 w-8 ${
                      bed.isOccupied ? 'text-red-600' : 'text-green-600'
                    }`} />
                    <p className="font-bold text-lg">#{bed.bedNumber}</p>
                    <Badge variant={bed.isOccupied ? 'destructive' : 'default'} className={
                      bed.isOccupied ? '' : 'bg-green-500'
                    }>
                      {bed.isOccupied ? 'Band' : 'Bo\'sh'}
                    </Badge>
                    {bed.description && (
                      <p className="text-xs text-muted-foreground">{bed.description}</p>
                    )}
                    {assignment && (
                      <div className="pt-2 border-t w-full">
                        <p className="text-xs font-medium truncate">
                          {assignment.student.user?.fullName}
                        </p>
                        {assignment.student.class && (
                          <p className="text-xs text-muted-foreground">
                            {assignment.student.class.name}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Students List */}
      {room.assignments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Joylashgan O'quvchilar ({room.assignments.length})
            </CardTitle>
            <CardDescription>
              Hozirda bu xonada yashovchi o'quvchilar ro'yxati
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {room.assignments.map((assignment) => (
                <Link
                  key={assignment.id}
                  href={`/admin/students/${assignment.studentId}`}
                >
                  <div className="flex items-center justify-between p-4 border rounded-lg hover:shadow-md transition-all cursor-pointer group">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-blue-100 rounded-full">
                        <Users className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-semibold group-hover:text-blue-600 transition-colors">
                          {assignment.student.user?.fullName}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-sm text-muted-foreground">
                            {assignment.student.studentCode}
                          </p>
                          {assignment.student.class && (
                            <Badge variant="outline" className="text-xs">
                              {assignment.student.class.name}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-2">
                        <BedDouble className="h-4 w-4 text-muted-foreground" />
                        <p className="text-sm font-medium">Joy #{assignment.bed.bedNumber}</p>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {Number(assignment.monthlyFee).toLocaleString()} so'm/oy
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {room.assignments.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BedDouble className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Xona bo'sh</h3>
            <p className="text-muted-foreground text-center mb-4">
              Bu xonada hozircha hech kim yashamaydi
            </p>
            <Link href="/admin/dormitory/assign">
              <Button>
                <Users className="h-4 w-4 mr-2" />
                O'quvchi joylashtirish
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

