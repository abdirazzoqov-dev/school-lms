import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { QuickSetupForm } from './quick-setup-form'

export default async function QuickSetupPage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'ADMIN') {
    redirect('/unauthorized')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/subjects">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Orqaga
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Tez Sozlash</h1>
          <p className="text-muted-foreground">
            Standart fanlarni bir vaqtda qo'shing
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Standart Fanlar</CardTitle>
          <CardDescription>
            O'rta maktablar uchun standart fanlar ro'yxati. Keraklilarini tanlang va qo'shing.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <QuickSetupForm />
        </CardContent>
      </Card>
    </div>
  )
}

