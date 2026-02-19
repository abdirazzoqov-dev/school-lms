import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ShieldAlert } from 'lucide-react'

export default async function UnauthorizedPage() {
  // If user is MODERATOR (staff) they should be in /admin — redirect them automatically
  const session = await getServerSession(authOptions)
  if (session?.user?.role === 'MODERATOR') {
    redirect('/admin')
  }
  if (session?.user?.role === 'ADMIN' || session?.user?.role === 'SUPER_ADMIN') {
    redirect('/admin')
  }
  if (session?.user?.role === 'TEACHER') {
    redirect('/teacher')
  }
  if (session?.user?.role === 'PARENT') {
    redirect('/parent')
  }
  if (session?.user?.role === 'COOK') {
    redirect('/cook')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-red-50 to-orange-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-destructive text-white">
            <ShieldAlert className="h-10 w-10" />
          </div>
          <div className="space-y-2">
            <CardTitle className="text-3xl font-bold">Ruxsat berilmagan</CardTitle>
            <CardDescription className="text-base">
              Siz bu sahifaga kirish huquqiga ega emassiz
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <Button asChild className="w-full">
            <Link href="/login">Loginga qaytish</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
