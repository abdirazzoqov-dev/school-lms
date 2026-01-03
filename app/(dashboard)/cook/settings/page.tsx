import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Settings, User, Mail, Phone, Briefcase, Calendar } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export default async function CookSettingsPage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'COOK') {
    redirect('/unauthorized')
  }

  // Get cook record
  const cook = await db.cook.findFirst({
    where: { userId: session.user.id },
    include: {
      user: true
    }
  })

  if (!cook) {
    redirect('/unauthorized')
  }

  const positionLabels: Record<string, string> = {
    HEAD_COOK: 'Bosh Oshpaz',
    COOK: 'Oshpaz',
    ASSISTANT: 'Yordamchi',
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Settings className="h-8 w-8 text-gray-500" />
          Sozlamalar
        </h1>
        <p className="text-muted-foreground mt-1">
          Profilingiz haqida ma'lumotlar
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Personal Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Shaxsiy Ma'lumotlar
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-muted-foreground">To'liq ism</span>
              <span className="font-medium">{cook.user.fullName}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-muted-foreground flex items-center gap-2">
                <Mail className="h-4 w-4" /> Email
              </span>
              <span className="font-medium">{cook.user.email}</span>
            </div>
            {cook.user.phone && (
              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-muted-foreground flex items-center gap-2">
                  <Phone className="h-4 w-4" /> Telefon
                </span>
                <span className="font-medium">{cook.user.phone}</span>
              </div>
            )}
            <div className="flex items-center justify-between py-2">
              <span className="text-muted-foreground">Status</span>
              {cook.user.isActive ? (
                <Badge className="bg-green-100 text-green-800">Faol</Badge>
              ) : (
                <Badge className="bg-red-100 text-red-800">Nofaol</Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Work Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              Ish Ma'lumotlari
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-muted-foreground">Oshpaz kodi</span>
              <code className="px-2 py-1 bg-muted rounded font-mono">
                {cook.cookCode}
              </code>
            </div>
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-muted-foreground">Lavozim</span>
              <Badge variant="outline">
                {positionLabels[cook.position] || cook.position}
              </Badge>
            </div>
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-muted-foreground">Mutaxassislik</span>
              <span className="font-medium text-sm">{cook.specialization}</span>
            </div>
            {cook.experienceYears && (
              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-muted-foreground">Tajriba</span>
                <span className="font-medium">{cook.experienceYears} yil</span>
              </div>
            )}
            <div className="flex items-center justify-between py-2">
              <span className="text-muted-foreground flex items-center gap-2">
                <Calendar className="h-4 w-4" /> Ish boshlangan
              </span>
              <span className="font-medium">
                {new Date(cook.hireDate).toLocaleDateString('uz-UZ')}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Note */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <p className="text-sm text-blue-800">
            <strong>Eslatma:</strong> Ma'lumotlaringizni o'zgartirish uchun administrator bilan bog'laning.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

