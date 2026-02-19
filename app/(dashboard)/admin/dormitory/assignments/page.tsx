import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Users, Plus } from 'lucide-react'
import Link from 'next/link'
import { AssignmentsTable } from './assignments-table'

export const revalidate = 30 // Optimized for faster loads
export const dynamic = 'auto' // Optimized for better caching

export default async function AssignmentsPage() {
  const session = await getServerSession(authOptions)

  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'MODERATOR')) {
    redirect('/unauthorized')
  }

  const tenantId = session.user.tenantId!

  // Get all assignments
  const assignments = await db.dormitoryAssignment.findMany({
    where: { tenantId },
    include: {
      student: {
        select: {
          id: true,
          studentCode: true,
          gender: true,
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
      room: {
        include: {
          building: {
            select: {
              name: true,
              code: true,
            },
          },
        },
      },
      bed: {
        select: {
          bedNumber: true,
        },
      },
      assignedBy: {
        select: {
          fullName: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  // Statistics
  const activeAssignments = assignments.filter((a) => a.status === 'ACTIVE').length
  const checkedOut = assignments.filter((a) => a.status === 'CHECKED_OUT').length
  const suspended = assignments.filter((a) => a.status === 'SUSPENDED').length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Users className="h-8 w-8 text-green-500" />
            Joylashtirishlar
          </h1>
          <p className="text-muted-foreground mt-1">
            O'quvchilarning yotoqxonaga joylashtirilgan ro'yxati
          </p>
        </div>
        <Link href="/admin/dormitory/assign">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Yangi Joylashtirish
          </Button>
        </Link>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Jami Joylashtirishlar
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{assignments.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Faol
            </CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {activeAssignments}
            </div>
            <p className="text-xs text-muted-foreground">
              Hozir joylashgan
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Chiqib ketgan
            </CardTitle>
            <Users className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {checkedOut}
            </div>
            <p className="text-xs text-muted-foreground">
              Checked out
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              To'xtatilgan
            </CardTitle>
            <Users className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {suspended}
            </div>
            <p className="text-xs text-muted-foreground">
              Suspended
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Joylashtirishlar ro'yxati</CardTitle>
          <CardDescription>
            Barcha o'quvchilarning yotoqxonadagi joylashuvi
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AssignmentsTable assignments={assignments} />
        </CardContent>
      </Card>
    </div>
  )
}

