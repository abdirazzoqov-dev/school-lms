import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Building2, Users, TrendingUp, AlertCircle } from 'lucide-react'

// Smart caching: Revalidate every 60 seconds ⚡
export const revalidate = 60
export const dynamic = 'auto' // Optimized for better caching

export default async function SuperAdminDashboard() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'SUPER_ADMIN') {
    redirect('/unauthorized')
  }

  // Get statistics
  const [totalTenants, activeTenants, trialTenants, blockedTenants] = await Promise.all([
    db.tenant.count(),
    db.tenant.count({ where: { status: 'ACTIVE' } }),
    db.tenant.count({ where: { status: 'TRIAL' } }),
    db.tenant.count({ where: { status: 'BLOCKED' } }),
  ])

  const recentTenants = await db.tenant.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      slug: true,
      status: true,
      subscriptionPlan: true,
      createdAt: true,
    },
  })

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Super Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Salom, {session.user.fullName}! Barcha maktablarni boshqaring.
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Jami Maktablar</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTenants}</div>
            <p className="text-xs text-muted-foreground">Barcha maktablar</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Faol</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{activeTenants}</div>
            <p className="text-xs text-muted-foreground">To'lov qilgan</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sinov</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{trialTenants}</div>
            <p className="text-xs text-muted-foreground">Trial davrda</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bloklangan</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{blockedTenants}</div>
            <p className="text-xs text-muted-foreground">Bloklangan</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Tenants */}
      <Card>
        <CardHeader>
          <CardTitle>Oxirgi qo'shilgan maktablar</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentTenants.map((tenant) => (
              <div
                key={tenant.id}
                className="flex items-center justify-between border-b pb-3 last:border-0"
              >
                <div>
                  <p className="font-medium">{tenant.name}</p>
                  <p className="text-sm text-muted-foreground">@{tenant.slug}</p>
                </div>
                <div className="text-right">
                  <span
                    className={`inline-block rounded-full px-2 py-1 text-xs font-semibold ${
                      tenant.status === 'ACTIVE'
                        ? 'bg-green-100 text-green-800'
                        : tenant.status === 'TRIAL'
                        ? 'bg-blue-100 text-blue-800'
                        : tenant.status === 'BLOCKED'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {tenant.status}
                  </span>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {tenant.subscriptionPlan}
                  </p>
                </div>
              </div>
            ))}
            {recentTenants.length === 0 && (
              <p className="text-center text-sm text-muted-foreground">
                Hozircha maktablar yo'q
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

