import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Building2, Plus } from 'lucide-react'
import Link from 'next/link'
import { BuildingsTable } from './buildings-table'
import { PermissionGate } from '@/components/admin/permission-gate'

export const revalidate = 30 // Optimized for faster loads
export const dynamic = 'auto' // Optimized for better caching

export default async function BuildingsPage() {
  const session = await getServerSession(authOptions)

  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'MODERATOR')) {
    redirect('/unauthorized')
  }

  const tenantId = session.user.tenantId!

  // Get all buildings with room counts
  const buildings = await db.dormitoryBuilding.findMany({
    where: { tenantId },
    include: {
      rooms: {
        select: {
          id: true,
          capacity: true,
          occupiedBeds: true,
          isActive: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  const totalBuildings = buildings.length
  const activeBuildings = buildings.filter((b) => b.isActive).length
  const totalCapacity = buildings.reduce((sum, b) => sum + b.totalCapacity, 0)
  const totalOccupied = buildings.reduce((sum, b) => sum + b.occupiedBeds, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Building2 className="h-8 w-8 text-indigo-500" />
            Yotoqxona Binolari
          </h1>
          <p className="text-muted-foreground mt-1">
            Barcha yotoqxona binolarini boshqaring
          </p>
        </div>
        <PermissionGate resource="dormitory" action="CREATE">
          <Link href="/admin/dormitory/buildings/create">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Yangi Bino
            </Button>
          </Link>
        </PermissionGate>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Jami Binolar
            </CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalBuildings}</div>
            <p className="text-xs text-muted-foreground">
              Ro'yxatda
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Faol Binolar
            </CardTitle>
            <Building2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {activeBuildings}
            </div>
            <p className="text-xs text-muted-foreground">
              Ishlayotgan
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Jami Joy
            </CardTitle>
            <Building2 className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {totalCapacity}
            </div>
            <p className="text-xs text-muted-foreground">
              Sig'im
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Band Joylar
            </CardTitle>
            <Building2 className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {totalOccupied}
            </div>
            <p className="text-xs text-muted-foreground">
              {totalCapacity > 0 ? ((totalOccupied / totalCapacity) * 100).toFixed(1) : 0}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Binolar ro'yxati</CardTitle>
          <CardDescription>
            Barcha yotoqxona binolari va ularning holati
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BuildingsTable buildings={buildings} />
        </CardContent>
      </Card>
    </div>
  )
}

