import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Building2, Users, GraduationCap, CheckCircle2, Clock, AlertCircle, Ban, Edit, Calendar } from 'lucide-react'
import Link from 'next/link'

// Optimized caching: Cache for 60 seconds for tenant detail ⚡
export const revalidate = 60
export const dynamic = 'auto' // Allows Next.js to optimize route caching

export default async function TenantDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'SUPER_ADMIN') {
    redirect('/unauthorized')
  }

  const tenant = await db.tenant.findUnique({
    where: { id: params.id },
    include: {
      _count: {
        select: {
          students: true,
          teachers: true,
          classes: true,
          users: true,
          subjects: true,
        }
      },
      users: {
        where: { role: 'ADMIN' },
        select: {
          id: true,
          fullName: true,
          email: true,
          createdAt: true,
        }
      }
    }
  })

  if (!tenant) {
    redirect('/super-admin/tenants')
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />
      case 'TRIAL':
        return <Clock className="h-5 w-5 text-blue-600" />
      case 'GRACE_PERIOD':
        return <AlertCircle className="h-5 w-5 text-orange-600" />
      case 'SUSPENDED':
        return <AlertCircle className="h-5 w-5 text-red-600" />
      case 'BLOCKED':
        return <Ban className="h-5 w-5 text-red-800" />
      default:
        return null
    }
  }

  const getStatusColor = (status: string) => {
    const colors = {
      ACTIVE: 'bg-green-100 text-green-800 border-green-200',
      TRIAL: 'bg-blue-100 text-blue-800 border-blue-200',
      GRACE_PERIOD: 'bg-orange-100 text-orange-800 border-orange-200',
      SUSPENDED: 'bg-red-100 text-red-800 border-red-200',
      BLOCKED: 'bg-red-200 text-red-900 border-red-300'
    }
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const getPlanColor = (plan: string) => {
    const colors = {
      BASIC: 'bg-slate-100 text-slate-800',
      STANDARD: 'bg-indigo-100 text-indigo-800',
      PREMIUM: 'bg-purple-100 text-purple-800'
    }
    return colors[plan as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const studentsPercentage = (tenant._count.students / tenant.maxStudents) * 100
  const teachersPercentage = (tenant._count.teachers / tenant.maxTeachers) * 100

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/super-admin/tenants">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h2 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              <Building2 className="h-8 w-8" />
              {tenant.name}
            </h2>
            <p className="text-muted-foreground">@{tenant.slug}</p>
          </div>
        </div>
        <Link href={`/super-admin/tenants/${tenant.id}/edit`}>
          <Button>
            <Edit className="mr-2 h-4 w-4" />
            Tahrirlash
          </Button>
        </Link>
      </div>

      {/* Status Card */}
      <Card className={`border-2 ${getStatusColor(tenant.status)}`}>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getStatusIcon(tenant.status)}
              <div>
                <p className="text-sm font-medium">Holat</p>
                <p className="text-2xl font-bold">{tenant.status}</p>
              </div>
            </div>
            <div className={`rounded-full px-4 py-2 text-sm font-semibold ${getPlanColor(tenant.subscriptionPlan)}`}>
              {tenant.subscriptionPlan}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Asosiy Ma'lumotlar</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Maktab Nomi</p>
              <p className="font-medium">{tenant.name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Slug</p>
              <p className="font-mono font-medium">@{tenant.slug}</p>
            </div>
            {tenant.email && (
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{tenant.email}</p>
              </div>
            )}
            {tenant.phone && (
              <div>
                <p className="text-sm text-muted-foreground">Telefon</p>
                <p className="font-medium">{tenant.phone}</p>
              </div>
            )}
            {tenant.address && (
              <div>
                <p className="text-sm text-muted-foreground">Manzil</p>
                <p className="font-medium">{tenant.address}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Subscription Info */}
        <Card>
          <CardHeader>
            <CardTitle>Obuna Ma'lumotlari</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Plan</p>
              <p className="font-medium text-lg">{tenant.subscriptionPlan}</p>
            </div>
            {tenant.trialEndsAt && tenant.status === 'TRIAL' && (
              <div>
                <p className="text-sm text-muted-foreground">Sinov muddati tugaydi</p>
                <p className="font-medium text-blue-600">
                  {new Date(tenant.trialEndsAt).toLocaleDateString('uz-UZ')}
                  <span className="text-sm ml-2">
                    ({Math.ceil((new Date(tenant.trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} kun)
                  </span>
                </p>
              </div>
            )}
            {tenant.subscriptionEnd && (
              <div>
                <p className="text-sm text-muted-foreground">Obuna tugaydi</p>
                <p className="font-medium">
                  {new Date(tenant.subscriptionEnd).toLocaleDateString('uz-UZ')}
                </p>
              </div>
            )}
            <div>
              <p className="text-sm text-muted-foreground">Yaratilgan</p>
              <p className="font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {new Date(tenant.createdAt).toLocaleDateString('uz-UZ')}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Usage Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Foydalanish Statistikasi</CardTitle>
          <CardDescription>Limitlar va joriy foydalanish</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Students */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-600" />
                  <span className="font-medium">O'quvchilar</span>
                </div>
                <span className="text-sm font-semibold">
                  {tenant._count.students} / {tenant.maxStudents}
                  <span className="text-muted-foreground ml-2">
                    ({studentsPercentage.toFixed(0)}%)
                  </span>
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className={`h-2.5 rounded-full ${
                    studentsPercentage > 90 ? 'bg-red-600' :
                    studentsPercentage > 70 ? 'bg-orange-600' : 'bg-blue-600'
                  }`}
                  style={{ width: `${Math.min(studentsPercentage, 100)}%` }}
                ></div>
              </div>
            </div>

            {/* Teachers */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <GraduationCap className="h-4 w-4 text-purple-600" />
                  <span className="font-medium">O'qituvchilar</span>
                </div>
                <span className="text-sm font-semibold">
                  {tenant._count.teachers} / {tenant.maxTeachers}
                  <span className="text-muted-foreground ml-2">
                    ({teachersPercentage.toFixed(0)}%)
                  </span>
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className={`h-2.5 rounded-full ${
                    teachersPercentage > 90 ? 'bg-red-600' :
                    teachersPercentage > 70 ? 'bg-orange-600' : 'bg-purple-600'
                  }`}
                  style={{ width: `${Math.min(teachersPercentage, 100)}%` }}
                ></div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-600">{tenant._count.students}</p>
              <p className="text-sm text-muted-foreground">O'quvchilar</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-purple-600">{tenant._count.teachers}</p>
              <p className="text-sm text-muted-foreground">O'qituvchilar</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">{tenant._count.classes}</p>
              <p className="text-sm text-muted-foreground">Sinflar</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-orange-600">{tenant._count.users}</p>
              <p className="text-sm text-muted-foreground">Foydalanuvchilar</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Admin Users */}
      <Card>
        <CardHeader>
          <CardTitle>Admin Foydalanuvchilar</CardTitle>
          <CardDescription>Maktab administratorlari</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {tenant.users.map((user) => (
              <div key={user.id} className="flex items-center justify-between p-3 rounded-lg border">
                <div>
                  <p className="font-medium">{user.fullName}</p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
                <p className="text-xs text-muted-foreground">
                  {new Date(user.createdAt).toLocaleDateString('uz-UZ')}
                </p>
              </div>
            ))}
            {tenant.users.length === 0 && (
              <p className="text-center text-muted-foreground py-4">
                Admin foydalanuvchilar topilmadi
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

