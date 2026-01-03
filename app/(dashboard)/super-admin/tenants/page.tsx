import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Building2, CheckCircle2, Clock, AlertCircle, Ban } from 'lucide-react'
import Link from 'next/link'
import { TenantActionsDropdown } from '@/components/tenant-actions-dropdown'

// No cache - always fresh! ⚡
export const revalidate = 120 // Cache for 2 minutes
export const dynamic = 'auto' // Optimized for better caching

export default async function TenantsPage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'SUPER_ADMIN') {
    redirect('/unauthorized')
  }

  const tenants = await db.tenant.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      _count: {
        select: {
          students: true,
          teachers: true,
          users: true
        }
      }
    }
  })

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />
      case 'TRIAL':
        return <Clock className="h-4 w-4 text-blue-600" />
      case 'GRACE_PERIOD':
        return <AlertCircle className="h-4 w-4 text-orange-600" />
      case 'SUSPENDED':
        return <AlertCircle className="h-4 w-4 text-red-600" />
      case 'BLOCKED':
        return <Ban className="h-4 w-4 text-red-800" />
      default:
        return null
    }
  }

  const getStatusBadge = (status: string) => {
    const colors = {
      ACTIVE: 'bg-green-100 text-green-800',
      TRIAL: 'bg-blue-100 text-blue-800',
      GRACE_PERIOD: 'bg-orange-100 text-orange-800',
      SUSPENDED: 'bg-red-100 text-red-800',
      BLOCKED: 'bg-red-200 text-red-900'
    }
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const getPlanBadge = (plan: string) => {
    const colors = {
      BASIC: 'bg-slate-100 text-slate-800',
      STANDARD: 'bg-indigo-100 text-indigo-800',
      PREMIUM: 'bg-purple-100 text-purple-800'
    }
    return colors[plan as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Maktablar</h1>
          <p className="text-muted-foreground">
            Barcha maktablarni boshqaring
          </p>
        </div>
        <Button asChild>
          <Link href="/super-admin/tenants/create">
            <Plus className="mr-2 h-4 w-4" />
            Yangi Maktab
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {tenants.map((tenant) => (
          <Card key={tenant.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">{tenant.name}</CardTitle>
                </div>
                {getStatusIcon(tenant.status)}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <span className={`inline-block rounded-full px-2 py-1 text-xs font-semibold ${getStatusBadge(tenant.status)}`}>
                  {tenant.status}
                </span>
                <span className={`inline-block rounded-full px-2 py-1 text-xs font-semibold ${getPlanBadge(tenant.subscriptionPlan)}`}>
                  {tenant.subscriptionPlan}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Slug:</span>
                  <span className="font-mono font-medium">@{tenant.slug}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">O'quvchilar:</span>
                  <span className="font-semibold">
                    {tenant._count.students} / {tenant.maxStudents}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">O'qituvchilar:</span>
                  <span className="font-semibold">
                    {tenant._count.teachers} / {tenant.maxTeachers}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Foydalanuvchilar:</span>
                  <span className="font-semibold">{tenant._count.users}</span>
                </div>
                {tenant.subscriptionEnd && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tugash:</span>
                    <span className="text-xs">
                      {new Date(tenant.subscriptionEnd).toLocaleDateString('uz-UZ')}
                    </span>
                  </div>
                )}
                {tenant.trialEndsAt && tenant.status === 'TRIAL' && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Trial:</span>
                    <span className="text-xs text-blue-600">
                      {Math.ceil((new Date(tenant.trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} kun qoldi
                    </span>
                  </div>
                )}
              </div>
              <div className="mt-4 flex gap-2 items-center">
                <Button asChild variant="outline" size="sm" className="flex-1">
                  <Link href={`/super-admin/tenants/${tenant.id}`}>
                    Ko'rish
                  </Link>
                </Button>
                <Button asChild variant="default" size="sm" className="flex-1">
                  <Link href={`/super-admin/tenants/${tenant.id}/edit`}>
                    Tahrirlash
                  </Link>
                </Button>
                <TenantActionsDropdown tenant={tenant} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {tenants.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-muted-foreground mb-2">
              Hozircha maktablar yo'q
            </p>
            <Button asChild>
              <Link href="/super-admin/tenants/create">
                <Plus className="mr-2 h-4 w-4" />
                Birinchi maktabni qo'shing
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

