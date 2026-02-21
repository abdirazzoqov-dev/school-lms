import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Home, 
  Building, 
  DoorClosed, 
  Users, 
  BedDouble,
  UserPlus,
  Plus,
  ArrowRight,
  Building2,
  DollarSign
} from 'lucide-react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { FixRoomsButton } from './fix-rooms-button'
import { PermissionGate } from '@/components/admin/permission-gate'

export const revalidate = 60
export const dynamic = 'auto' // Optimized for better caching

export default async function DormitoryDashboardPage() {
  const session = await getServerSession(authOptions)

  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'MODERATOR')) {
    redirect('/unauthorized')
  }

  const tenantId = session.user.tenantId!

  // Get statistics
  const [
    totalBuildings,
    activeBuildings,
    totalRooms,
    activeRooms,
    totalBeds,
    occupiedBeds,
    activeAssignments,
    maleStudents,
    femaleStudents,
    buildings,
    recentAssignments,
  ] = await Promise.all([
    db.dormitoryBuilding.count({ where: { tenantId } }),
    db.dormitoryBuilding.count({ where: { tenantId, isActive: true } }),
    db.dormitoryRoom.count({ where: { tenantId } }),
    db.dormitoryRoom.count({ where: { tenantId, isActive: true } }),
    db.dormitoryBed.count({ where: { tenantId, isActive: true } }),
    db.dormitoryBed.count({ where: { tenantId, isOccupied: true, isActive: true } }),
    db.dormitoryAssignment.count({ where: { tenantId, status: 'ACTIVE' } }),
    db.dormitoryAssignment.count({
      where: {
        tenantId,
        status: 'ACTIVE',
        student: { gender: 'MALE' },
      },
    }),
    db.dormitoryAssignment.count({
      where: {
        tenantId,
        status: 'ACTIVE',
        student: { gender: 'FEMALE' },
      },
    }),
    db.dormitoryBuilding.findMany({
      where: { tenantId, isActive: true },
      include: {
        rooms: {
          where: { isActive: true },
          include: {
            beds: {
              where: { isActive: true },
            },
            assignments: {
              where: { status: 'ACTIVE' },
            },
          },
        },
      },
      orderBy: { name: 'asc' },
    }),
    db.dormitoryAssignment.findMany({
      where: { tenantId, status: 'ACTIVE' },
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        student: {
          include: {
            user: {
              select: { fullName: true },
            },
            class: {
              select: { name: true },
            },
          },
        },
        room: {
          select: {
            roomNumber: true,
          },
        },
        bed: {
          select: {
            bedNumber: true,
          },
        },
      },
    }),
  ])

  const availableBeds = totalBeds - activeAssignments // To'g'ri: activeAssignments = band joylar
  const occupancyRate = totalBeds > 0 ? (activeAssignments / totalBeds) * 100 : 0 // activeAssignments ishlatamiz

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Home className="h-8 w-8 text-indigo-500" />
            Yotoqxona Boshqaruvi
          </h1>
          <p className="text-muted-foreground mt-1">
            Binolar, xonalar va o'quvchilar joylashuvi
          </p>
        </div>
        <div>
          <FixRoomsButton />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <PermissionGate resource="dormitory" action="CREATE">
          <Link href="/admin/dormitory/buildings/create">
            <Card className="hover:shadow-md transition-shadow cursor-pointer border-dashed border-2 hover:border-indigo-300">
              <CardContent className="flex items-center gap-4 p-6">
                <div className="p-3 rounded-full bg-indigo-100">
                  <Plus className="h-6 w-6 text-indigo-600" />
                </div>
                <div>
                  <p className="font-semibold">Bino Qo'shish</p>
                  <p className="text-sm text-muted-foreground">Yangi yotoqxona binosi</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </PermissionGate>

        <PermissionGate resource="dormitory" action="CREATE">
          <Link href="/admin/dormitory/rooms/create">
            <Card className="hover:shadow-md transition-shadow cursor-pointer border-dashed border-2 hover:border-blue-300">
              <CardContent className="flex items-center gap-4 p-6">
                <div className="p-3 rounded-full bg-blue-100">
                  <Plus className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="font-semibold">Xona Qo'shish</p>
                  <p className="text-sm text-muted-foreground">Yangi xona yaratish</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </PermissionGate>

        <Link href="/admin/dormitory/assign">
          <Card className="hover:shadow-md transition-shadow cursor-pointer border-dashed border-2 hover:border-green-300">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="p-3 rounded-full bg-green-100">
                <UserPlus className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="font-semibold">Joylashtirish</p>
                <p className="text-sm text-muted-foreground">O'quvchini xonaga joylashtirish</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-indigo-800">Binolar</CardTitle>
            <Building2 className="h-5 w-5 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-indigo-700">{totalBuildings}</div>
            <p className="text-xs text-indigo-600 mt-1">
              {activeBuildings} ta faol
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-800">Xonalar</CardTitle>
            <DoorClosed className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-700">{totalRooms}</div>
            <p className="text-xs text-blue-600 mt-1">
              {activeRooms} ta faol
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-800">Joylar</CardTitle>
            <BedDouble className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-700">{availableBeds}</div>
            <p className="text-xs text-green-600 mt-1">
              {totalBeds} dan bo'sh
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-800">Joylashgan</CardTitle>
            <Users className="h-5 w-5 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-700">{activeAssignments}</div>
            <p className="text-xs text-purple-600 mt-1">
              {occupancyRate.toFixed(1)}% band
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gender Distribution */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Jins bo'yicha taqsimot</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                  <span className="text-sm font-medium">O'g'il bolalar</span>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-blue-600">{maleStudents}</p>
                  <p className="text-xs text-muted-foreground">
                    {activeAssignments > 0 ? ((maleStudents / activeAssignments) * 100).toFixed(1) : 0}%
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-pink-500" />
                  <span className="text-sm font-medium">Qizlar</span>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-pink-600">{femaleStudents}</p>
                  <p className="text-xs text-muted-foreground">
                    {activeAssignments > 0 ? ((femaleStudents / activeAssignments) * 100).toFixed(1) : 0}%
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Assignments */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Oxirgi Joylashtirishlar</span>
              <Link href="/admin/dormitory/assignments">
                <Button variant="ghost" size="sm">
                  Barchasi <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentAssignments.length > 0 ? (
                recentAssignments.slice(0, 5).map((assignment) => (
                  <div
                    key={assignment.id}
                    className="flex items-center justify-between border-b pb-2 last:border-0"
                  >
                    <div>
                      <p className="font-medium text-sm">
                        {assignment.student.user?.fullName || 'N/A'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {assignment.student.class?.name || 'Sinf yo\'q'}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline" className="font-mono text-xs">
                        Xona {assignment.room.roomNumber}
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        Joy #{assignment.bed.bedNumber}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground py-4 text-sm">
                  Hozircha joylashtirishlar yo'q
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Buildings Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Binolar ko'rinishi</CardTitle>
              <CardDescription>Har bir binoning band bo'lish darajasi</CardDescription>
            </div>
            <Link href="/admin/dormitory/buildings">
              <Button variant="outline" size="sm">
                Barchasi <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {buildings.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {buildings.map((building) => {
                // Real-time hisoblash - barcha xonalardagi barcha joylarni hisoblash
                const buildingCapacity = building.rooms.reduce(
                  (sum, room) => sum + room.beds.length, 
                  0
                )
                // Real-time band joylar - barcha aktiv assignmentlarni hisoblash
                const buildingOccupied = building.rooms.reduce(
                  (sum, room) => sum + room.assignments.length, 
                  0
                )
                const buildingAvailable = buildingCapacity - buildingOccupied
                const buildingOccupancyRate = buildingCapacity > 0 
                  ? (buildingOccupied / buildingCapacity) * 100 
                  : 0

                return (
                  <Link key={building.id} href={`/admin/dormitory/buildings/${building.id}`}>
                    <Card className="hover:shadow-md transition-all cursor-pointer group">
                      <CardContent className="p-6">
                        <div className="space-y-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-semibold text-lg group-hover:text-indigo-600 transition-colors">
                                {building.name}
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                Kod: {building.code}
                              </p>
                            </div>
                            {building.gender && (
                              <Badge variant="outline" className={
                                building.gender === 'MALE' 
                                  ? 'bg-blue-50 text-blue-700' 
                                  : 'bg-pink-50 text-pink-700'
                              }>
                                {building.gender === 'MALE' ? 'O\'g\'il bolalar' : 'Qizlar'}
                              </Badge>
                            )}
                          </div>

                          <div className="grid grid-cols-3 gap-2 text-center">
                            <div>
                              <p className="text-2xl font-bold text-indigo-600">
                                {building.rooms.length}
                              </p>
                              <p className="text-xs text-muted-foreground">Xonalar</p>
                            </div>
                            <div>
                              <p className="text-2xl font-bold text-green-600">
                                {buildingAvailable}
                              </p>
                              <p className="text-xs text-muted-foreground">Bo'sh</p>
                            </div>
                            <div>
                              <p className="text-2xl font-bold text-orange-600">
                                {buildingOccupied}
                              </p>
                              <p className="text-xs text-muted-foreground">Band</p>
                            </div>
                          </div>

                          {/* Progress bar */}
                          <div>
                            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                              <span>Band bo'lish</span>
                              <span className="font-semibold">{buildingOccupancyRate.toFixed(1)}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full transition-all ${
                                  buildingOccupancyRate > 90
                                    ? 'bg-red-500'
                                    : buildingOccupancyRate > 70
                                    ? 'bg-orange-500'
                                    : 'bg-green-500'
                                }`}
                                style={{ width: `${buildingOccupancyRate}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <Building className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Binolar mavjud emas</h3>
              <p className="text-muted-foreground mb-4">
                Birinchi yotoqxona binosini yaratish uchun qo'shing
              </p>
              <Link href="/admin/dormitory/buildings/create">
                <Button>
                  <Building className="h-4 w-4 mr-2" />
                  Bino yaratish
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Link href="/admin/dormitory/buildings">
          <Card className="hover:shadow-lg transition-all cursor-pointer group">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-indigo-100 group-hover:bg-indigo-200 transition-colors">
                    <Building2 className="h-6 w-6 text-indigo-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-lg">Binolar</p>
                    <p className="text-sm text-muted-foreground">Yotoqxona binolarini boshqarish</p>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/dormitory/rooms">
          <Card className="hover:shadow-lg transition-all cursor-pointer group">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-blue-100 group-hover:bg-blue-200 transition-colors">
                    <DoorClosed className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-lg">Xonalar</p>
                    <p className="text-sm text-muted-foreground">Xonalar va bo'sh joylar</p>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/dormitory/assignments">
          <Card className="hover:shadow-lg transition-all cursor-pointer group">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-green-100 group-hover:bg-green-200 transition-colors">
                    <Users className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-lg">Joylashtirishlar</p>
                    <p className="text-sm text-muted-foreground">O'quvchilarni boshqarish</p>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/dormitory/payments">
          <Card className="hover:shadow-lg transition-all cursor-pointer group">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-emerald-100 group-hover:bg-emerald-200 transition-colors">
                    <DollarSign className="h-6 w-6 text-emerald-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-lg">To&apos;lovlar</p>
                    <p className="text-sm text-muted-foreground">Yotoqxona to&apos;lovlari</p>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  )
}

