import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { User, Mail, Phone, Users, Calendar, UserCheck, AlertCircle, CheckCircle2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export const revalidate = 0
export const dynamic = 'force-dynamic'

const guardianTypeLabels = {
  MOTHER: 'Ona',
  FATHER: 'Ota',
  GUARDIAN: 'Vasiy',
  OTHER: 'Boshqa'
}

export default async function ParentProfilePage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'PARENT') {
    redirect('/unauthorized')
  }

  const tenantId = session.user.tenantId!

  // Get parent with full details
  const parent = await db.parent.findUnique({
    where: { userId: session.user.id, tenantId },
    include: {
      user: true,
      students: {
        include: {
          student: {
            include: {
              user: { select: { fullName: true, avatar: true } },
              class: { select: { name: true } }
            }
          }
        }
      }
    }
  })

  if (!parent) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <Card className="max-w-md">
          <CardContent className="py-8 text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-semibold text-muted-foreground">Profil ma'lumotlari topilmadi</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const children = parent.students.map(sp => sp.student)

  return (
    <div className="min-h-full bg-gradient-to-br from-gray-50 via-white to-gray-50 p-4 md:p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-600 via-emerald-600 to-teal-600 p-8 text-white shadow-2xl">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-2">
              <div className="p-4 bg-white/20 backdrop-blur-sm rounded-2xl">
                <User className="h-10 w-10" />
              </div>
              <div>
                <h1 className="text-4xl font-bold">Mening Profilim</h1>
                <p className="text-green-50 text-lg">Shaxsiy ma'lumotlar va farzandlar</p>
              </div>
            </div>
          </div>
          <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10 blur-2xl"></div>
          <div className="absolute -left-8 -bottom-8 h-40 w-40 rounded-full bg-white/10 blur-2xl"></div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Personal Info */}
          <Card className="border-2 hover:shadow-xl transition-shadow">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
              <CardTitle className="flex items-center gap-2">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <User className="h-5 w-5 text-blue-600" />
                </div>
                Shaxsiy Ma'lumotlar
              </CardTitle>
              <CardDescription>Asosiy aloqa ma'lumotlari</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <User className="h-5 w-5 text-gray-500 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">To'liq ism</p>
                  <p className="font-semibold text-lg">{parent.user.fullName}</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <Mail className="h-5 w-5 text-gray-500 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-semibold">{parent.user.email}</p>
                </div>
              </div>

              {parent.user.phone && (
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <Phone className="h-5 w-5 text-gray-500 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Telefon</p>
                    <p className="font-semibold">{parent.user.phone}</p>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <UserCheck className="h-5 w-5 text-gray-500 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Qarindoshlik</p>
                  <Badge className="mt-1 bg-blue-600">
                    {guardianTypeLabels[parent.guardianType as keyof typeof guardianTypeLabels] || parent.customRelationship || 'Ota-ona'}
                  </Badge>
                </div>
              </div>

              {parent.occupation && (
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <Calendar className="h-5 w-5 text-gray-500 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Kasbi</p>
                    <p className="font-semibold">{parent.occupation}</p>
                  </div>
                </div>
              )}

              {parent.workAddress && (
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <Calendar className="h-5 w-5 text-gray-500 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Ish joyi</p>
                    <p className="font-semibold">{parent.workAddress}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Children Info */}
          <Card className="border-2 hover:shadow-xl transition-shadow">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
              <CardTitle className="flex items-center gap-2">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Users className="h-5 w-5 text-purple-600" />
                </div>
                Farzandlarim
              </CardTitle>
              <CardDescription>{children.length} ta farzand</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {children.length > 0 ? (
                <div className="space-y-3">
                  {children.map((child) => (
                    <div
                      key={child.id}
                      className="flex items-center gap-3 p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg border border-purple-200 hover:shadow-md transition-shadow"
                    >
                      {child.user?.avatar ? (
                        <img
                          src={child.user.avatar}
                          alt={child.user?.fullName || 'Student'}
                          className="h-12 w-12 rounded-full object-cover border-2 border-purple-200"
                        />
                      ) : (
                        <div className="h-12 w-12 rounded-full bg-purple-200 flex items-center justify-center text-purple-700 font-bold text-lg border-2 border-purple-300">
                          {child.user?.fullName?.charAt(0) || '?'}
                        </div>
                      )}
                      <div className="flex-1">
                        <p className="font-semibold text-lg">{child.user?.fullName || 'N/A'}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {child.class?.name || 'Sinf belgilanmagan'}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {child.studentCode}
                          </Badge>
                        </div>
                      </div>
                      <Badge className={`${
                        child.status === 'ACTIVE' ? 'bg-green-600' :
                        child.status === 'GRADUATED' ? 'bg-blue-600' :
                        'bg-red-600'
                      }`}>
                        {child.status === 'ACTIVE' ? 'Faol' :
                         child.status === 'GRADUATED' ? 'Bitirgan' :
                         'Nofaol'}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="mx-auto h-12 w-12 text-muted-foreground opacity-50 mb-4" />
                  <p className="text-muted-foreground">Farzandlar topilmadi</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Emergency Contact */}
        {parent.emergencyContact && (
          <Card className="border-2 hover:shadow-xl transition-shadow">
            <CardHeader className="bg-gradient-to-r from-red-50 to-orange-50">
              <CardTitle className="flex items-center gap-2">
                <div className="p-2 bg-red-100 rounded-lg">
                  <Phone className="h-5 w-5 text-red-600" />
                </div>
                Favqulodda aloqa
              </CardTitle>
              <CardDescription>Shoshilinch holatlarda bog'lanish uchun</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 p-4 bg-red-50 rounded-lg border border-red-200">
                <Phone className="h-6 w-6 text-red-600" />
                <div>
                  <p className="text-sm text-gray-500">Telefon raqam</p>
                  <p className="font-semibold text-lg">{parent.emergencyContact}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Account Info */}
        <Card className="border-2">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-slate-50">
            <CardTitle className="flex items-center gap-2">
              <div className="p-2 bg-gray-200 rounded-lg">
                <Calendar className="h-5 w-5 text-gray-600" />
              </div>
              Hisob Ma'lumotlari
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">Yaratilgan</p>
                <p className="font-semibold">{new Date(parent.createdAt).toLocaleDateString('uz-UZ')}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">Oxirgi yangilanish</p>
                <p className="font-semibold">{new Date(parent.updatedAt).toLocaleDateString('uz-UZ')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

