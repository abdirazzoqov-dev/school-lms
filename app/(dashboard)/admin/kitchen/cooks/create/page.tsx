import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { ChefHat, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { CookForm } from './cook-form'

export default async function CreateCookPage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'ADMIN') {
    redirect('/unauthorized')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/kitchen/cooks">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <ChefHat className="h-8 w-8 text-orange-500" />
            Yangi Oshpaz Qo'shish
          </h1>
          <p className="text-muted-foreground mt-1">
            Oshxonaga yangi xodim qo'shing
          </p>
        </div>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Oshpaz Ma'lumotlari</CardTitle>
          <CardDescription>
            Yangi oshpaz uchun kerakli ma'lumotlarni kiriting
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CookForm />
        </CardContent>
      </Card>
    </div>
  )
}

