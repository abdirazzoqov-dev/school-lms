import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Settings, Lock, Bell, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export const revalidate = 0
export const dynamic = 'force-dynamic'

export default async function ParentSettingsPage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'PARENT') {
    redirect('/unauthorized')
  }

  return (
    <div className="min-h-full bg-gradient-to-br from-gray-50 via-white to-gray-50 p-4 md:p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 p-8 text-white shadow-2xl">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-2">
              <div className="p-4 bg-white/20 backdrop-blur-sm rounded-2xl">
                <Settings className="h-10 w-10" />
              </div>
              <div>
                <h1 className="text-4xl font-bold">Sozlamalar</h1>
                <p className="text-purple-50 text-lg">Hisob va bildirishnomalar sozlamalari</p>
              </div>
            </div>
          </div>
          <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10 blur-2xl"></div>
          <div className="absolute -left-8 -bottom-8 h-40 w-40 rounded-full bg-white/10 blur-2xl"></div>
        </div>

        {/* Account Settings */}
        <Card className="border-2 hover:shadow-xl transition-shadow">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
            <CardTitle className="flex items-center gap-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <User className="h-5 w-5 text-blue-600" />
              </div>
              Hisob Sozlamalari
            </CardTitle>
            <CardDescription>Shaxsiy ma'lumotlarni tahrirlash</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <div>
                <p className="font-semibold">Profil ma'lumotlarini tahrirlash</p>
                <p className="text-sm text-gray-500">Ism, telefon va boshqa ma'lumotlar</p>
              </div>
              <Button variant="outline" disabled>
                <User className="mr-2 h-4 w-4" />
                Tahrirlash
              </Button>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <div>
                <p className="font-semibold">Email manzil</p>
                <p className="text-sm text-gray-500">{session.user.email}</p>
              </div>
              <Button variant="outline" disabled>
                O'zgartirish
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card className="border-2 hover:shadow-xl transition-shadow">
          <CardHeader className="bg-gradient-to-r from-red-50 to-orange-50">
            <CardTitle className="flex items-center gap-2">
              <div className="p-2 bg-red-100 rounded-lg">
                <Lock className="h-5 w-5 text-red-600" />
              </div>
              Xavfsizlik
            </CardTitle>
            <CardDescription>Parol va kirish sozlamalari</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <div>
                <p className="font-semibold">Parolni o'zgartirish</p>
                <p className="text-sm text-gray-500">Yangi parol o'rnatish</p>
              </div>
              <Link href="/parent/settings/change-password">
                <Button variant="outline">
                  <Lock className="mr-2 h-4 w-4" />
                  O'zgartirish
                </Button>
              </Link>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-semibold">Oxirgi kirish</p>
                <p className="text-sm text-gray-500">
                  Ma'lumot yo'q
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card className="border-2 hover:shadow-xl transition-shadow">
          <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
            <CardTitle className="flex items-center gap-2">
              <div className="p-2 bg-green-100 rounded-lg">
                <Bell className="h-5 w-5 text-green-600" />
              </div>
              Bildirishnomalar
            </CardTitle>
            <CardDescription>Email va push bildirishnomalar</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-semibold">Email bildirishnomalar</p>
                <p className="text-sm text-gray-500">Baholar, davomat va xabarlar</p>
              </div>
              <Button variant="outline" disabled>
                Faol
              </Button>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-semibold">To'lov eslatmalari</p>
                <p className="text-sm text-gray-500">To'lov muddati yaqinlashganda</p>
              </div>
              <Button variant="outline" disabled>
                Faol
              </Button>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-semibold">Davomat bildirishnomasi</p>
                <p className="text-sm text-gray-500">Farzand maktabga kelmasa</p>
              </div>
              <Button variant="outline" disabled>
                Faol
              </Button>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  )
}

