import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { AnnouncementForm } from './announcement-form'

export default async function CreateAnnouncementPage() {
  const session = await getServerSession(authOptions)

  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'MODERATOR')) {
    redirect('/unauthorized')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/announcements">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Orqaga
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Yangi E'lon</h1>
          <p className="text-muted-foreground">
            Maktab e'lonini yarating
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>E'lon Tafsilotlari</CardTitle>
        </CardHeader>
        <CardContent>
          <AnnouncementForm />
        </CardContent>
      </Card>
    </div>
  )
}

