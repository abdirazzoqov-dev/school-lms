import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Users, Plus, UserPlus } from 'lucide-react'
import Link from 'next/link'
import { ParentsTable } from './parents-table'

export const revalidate = 30 // Optimized for faster loads
export const dynamic = 'auto' // Optimized for better caching

interface SearchParams {
  search?: string
  class?: string
  status?: string
}

export default async function ParentsPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'ADMIN') {
    redirect('/unauthorized')
  }

  const tenantId = session.user.tenantId!

  // Build where clause
  const whereClause: any = {
    tenantId,
  }

  // Search filter
  if (searchParams.search) {
    whereClause.user = {
      OR: [
        { fullName: { contains: searchParams.search, mode: 'insensitive' } },
        { email: { contains: searchParams.search, mode: 'insensitive' } },
        { phone: { contains: searchParams.search, mode: 'insensitive' } },
      ],
    }
  }

  // Status filter
  if (searchParams.status) {
    whereClause.user = {
      ...whereClause.user,
      isActive: searchParams.status === 'active',
    }
  }

  // Get parents with their children
  const parents = await db.parent.findMany({
    where: whereClause,
    include: {
      user: {
        select: {
          fullName: true,
          email: true,
          phone: true,
          isActive: true,
        },
      },
      students: {
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
    orderBy: {
      createdAt: 'desc',
    },
  })

  // Get all classes for filter
  const classes = await db.class.findMany({
    where: { tenantId },
    select: {
      id: true,
      name: true,
    },
    orderBy: { name: 'asc' },
  })

  // Filter by class if specified
  let filteredParents = parents
  if (searchParams.class) {
    filteredParents = parents.filter((parent) =>
      parent.students.some((sp) => sp.student.classId === searchParams.class)
    )
  }

  // Statistics
  const totalParents = filteredParents.length
  const activeParents = filteredParents.filter(
    (p) => p.user?.isActive
  ).length
  const totalChildren = filteredParents.reduce(
    (sum, p) => sum + p.students.length,
    0
  )
  const parentsWithMultipleChildren = filteredParents.filter(
    (p) => p.students.length > 1
  ).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Users className="h-8 w-8 text-blue-500" />
            Qarindoshlar
          </h1>
          <p className="text-muted-foreground mt-1">
            O'quvchilarning qarindoshlari va ularning farzandlari haqida ma'lumot
          </p>
        </div>
        <Link href="/admin/parents/create">
          <Button className="gap-2">
            <UserPlus className="h-4 w-4" />
            Yangi Ota-ona
          </Button>
        </Link>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Jami Ota-onalar
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalParents}</div>
            <p className="text-xs text-muted-foreground">
              Ro'yxatga olingan
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Faol Ota-onalar
            </CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {activeParents}
            </div>
            <p className="text-xs text-muted-foreground">
              Faol hisoblar
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Jami Farzandlar
            </CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {totalChildren}
            </div>
            <p className="text-xs text-muted-foreground">
              O'quvchilar
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Ko'p Farzandli
            </CardTitle>
            <Users className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {parentsWithMultipleChildren}
            </div>
            <p className="text-xs text-muted-foreground">
              2+ farzandli
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Ota-onalar ro'yxati</CardTitle>
          <CardDescription>
            Barcha ota-onalar va ularning farzandlari haqida ma'lumot
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ParentsTable 
            parents={filteredParents} 
            classes={classes}
            searchParams={searchParams}
          />
        </CardContent>
      </Card>
    </div>
  )
}

