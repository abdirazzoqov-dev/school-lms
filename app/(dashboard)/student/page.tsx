import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'

export default async function StudentDashboard() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'STUDENT') {
    redirect('/unauthorized')
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">O'quvchi Dashboard</h1>
        <p className="text-muted-foreground">
          Salom, {session.user.fullName}!
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <p className="text-lg font-medium text-muted-foreground">
              🚧 O'quvchi paneli Phase 3da qo'shiladi
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Hozircha ota-onalar orqali ma'lumotlarni ko'rish mumkin
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

