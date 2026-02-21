import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Settings, School, User, Lock, Bell, Database } from 'lucide-react'
import Link from 'next/link'

// Optimized caching
export const revalidate = 120
export const dynamic = 'auto'

export default async function AdminSettingsPage() {
  const session = await getServerSession(authOptions)

  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'MODERATOR')) {
    redirect('/unauthorized')
  }

  const tenantId = session.user.tenantId!

  // Get tenant info
  const tenant = await db.tenant.findUnique({
    where: { id: tenantId }
  })

  if (!tenant) {
    redirect('/unauthorized')
  }

  // Get statistics
  const studentsCount = await db.student.count({ where: { tenantId } })
  const teachersCount = await db.teacher.count({ where: { tenantId } })
  const classesCount = await db.class.count({ where: { tenantId } })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Sozlamalar</h1>
        <p className="text-muted-foreground">
          Maktab va tizim sozlamalari
        </p>
      </div>

      {/* Tenant Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <School className="h-5 w-5" />
            Maktab Ma'lumotlari
          </CardTitle>
          <CardDescription>
            Asosiy maktab ma'lumotlari va holati
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Maktab nomi</label>
              <p className="text-lg font-semibold">{tenant.name}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Holat</label>
              <div className="mt-1">
                {tenant.status === 'ACTIVE' && (
                  <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                    Faol
                  </Badge>
                )}
                {tenant.status === 'TRIAL' && (
                  <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
                    Sinov
                  </Badge>
                )}
                {tenant.status === 'GRACE_PERIOD' && (
                  <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
                    Grace Period
                  </Badge>
                )}
                {tenant.status === 'SUSPENDED' && (
                  <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">
                    To'xtatilgan
                  </Badge>
                )}
                {tenant.status === 'BLOCKED' && (
                  <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
                    Bloklangan
                  </Badge>
                )}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Slug</label>
              <p className="text-lg">{tenant.slug}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Yaratilgan sana</label>
              <p className="text-lg">
                {new Date(tenant.createdAt).toLocaleDateString('uz-UZ', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
          </div>

          <div className="pt-4 border-t">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold">Statistika</h4>
              <Link href="/admin/settings/school">
                <Button variant="outline" size="sm">
                  Maktab Sozlamalari
                </Button>
              </Link>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              <div className="p-3 border rounded-lg">
                <div className="text-sm text-muted-foreground">O'quvchilar</div>
                <div className="text-2xl font-bold text-blue-600">{studentsCount}</div>
              </div>
              <div className="p-3 border rounded-lg">
                <div className="text-sm text-muted-foreground">O'qituvchilar</div>
                <div className="text-2xl font-bold text-green-600">{teachersCount}</div>
              </div>
              <div className="p-3 border rounded-lg">
                <div className="text-sm text-muted-foreground">Sinflar</div>
                <div className="text-2xl font-bold text-purple-600">{classesCount}</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profil Sozlamalari
          </CardTitle>
          <CardDescription>
            Shaxsiy ma'lumotlar va sozlamalar
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Ism-familiya</label>
              <p className="text-lg font-semibold">{session.user.fullName}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Email</label>
              <p className="text-lg">{session.user.email}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Role</label>
              <Badge variant="outline">Admin</Badge>
            </div>
          </div>
          
          <div className="pt-4 border-t">
            <Link href="/admin/settings/profile">
              <Button variant="outline">
                Profilni Tahrirlash
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Xavfsizlik
          </CardTitle>
          <CardDescription>
            Parol va xavfsizlik sozlamalari
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">Parolni o'zgartirish</p>
                <p className="text-sm text-muted-foreground">
                  Hisobingiz xavfsizligi uchun parolni o'zgartiring
                </p>
              </div>
              <Link href="/admin/settings/change-password">
                <Button variant="outline" size="sm">
                  O'zgartirish
                </Button>
              </Link>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">Ikki faktorli autentifikatsiya</p>
                <p className="text-sm text-muted-foreground">
                  Qo'shimcha xavfsizlik qatlami
                </p>
              </div>
              <Badge variant="outline">Ishlab chiqilmoqda</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Bildirishnomalar
          </CardTitle>
          <CardDescription>
            Bildirishnoma sozlamalari
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">Email bildirishnomalari</p>
                <p className="text-sm text-muted-foreground">
                  Muhim voqealar haqida email orqali xabardor bo'ling
                </p>
              </div>
              <Badge variant="outline">Ishlab chiqilmoqda</Badge>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">SMS bildirishnomalari</p>
                <p className="text-sm text-muted-foreground">
                  Muhim voqealar haqida SMS orqali xabardor bo'ling
                </p>
              </div>
              <Badge variant="outline">Ishlab chiqilmoqda</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Tizim Ma'lumotlari
          </CardTitle>
          <CardDescription>
            Texnik ma'lumotlar va versiya
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Tizim versiyasi</span>
              <Badge variant="secondary">v1.0.0</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Ma'lumotlar bazasi</span>
              <Badge variant="secondary">PostgreSQL</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Oxirgi yangilanish</span>
              <span className="text-sm">{new Date().toLocaleDateString('uz-UZ')}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Info */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <Settings className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-900 mb-1">
                Sozlamalar
              </h3>
              <p className="text-sm text-blue-800">
                Bu yerda maktab va tizim sozlamalarini ko'rishingiz mumkin.
                Ba'zi funksiyalar hali ishlab chiqilmoqda va yaqin orada qo'shiladi.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

