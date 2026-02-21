import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { getUserPermissions } from '@/lib/permissions'
import { StaffPermissionsEditClient } from './staff-permissions-edit-client'
import { ArrowLeft, Briefcase, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

export default async function StaffPermissionsPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)

  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'MODERATOR')) {
    redirect('/unauthorized')
  }

  const tenantId = session.user.tenantId!
  const staffId = params.id

  const staff = await db.staff.findFirst({
    where: { id: staffId, tenantId },
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          email: true,
          avatar: true,
          role: true,
          isActive: true,
        },
      },
    },
  })

  if (!staff) notFound()

  // Fetch current permissions for this staff user
  const permissionsMap = await getUserPermissions(staff.user.id, tenantId)

  // Convert to matrix format: { resource: { action: bool } }
  const permMatrix: Record<string, Record<string, boolean>> = {}
  for (const [resource, actions] of Object.entries(permissionsMap)) {
    permMatrix[resource] = {}
    for (const action of actions) {
      permMatrix[resource][action] = true
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/staff">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex items-center gap-4 flex-1">
          {staff.user.avatar ? (
            <img
              src={staff.user.avatar}
              alt={staff.user.fullName}
              className="h-12 w-12 rounded-full object-cover border-2 border-cyan-200"
            />
          ) : (
            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-cyan-500 to-teal-600 flex items-center justify-center text-white font-bold text-lg">
              {staff.user.fullName[0]}
            </div>
          )}
          <div>
            <h2 className="text-2xl font-bold">{staff.user.fullName}</h2>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-muted-foreground text-sm">{staff.position}</p>
              {staff.department && (
                <Badge variant="outline" className="text-xs">{staff.department}</Badge>
              )}
              <Badge
                variant="outline"
                className={staff.user.isActive ? 'text-green-700 border-green-300 bg-green-50' : 'text-red-700 border-red-300 bg-red-50'}
              >
                {staff.user.isActive ? 'Faol' : 'Bloklangan'}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Permissions Edit */}
      <StaffPermissionsEditClient
        staffUserId={staff.user.id}
        staffName={staff.user.fullName}
        initialPermissions={permMatrix}
      />
    </div>
  )
}

