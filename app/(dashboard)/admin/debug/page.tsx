import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle } from 'lucide-react'

// NO CACHE - always fresh! 
export const revalidate = 30 // Optimized for faster loads
export const dynamic = 'auto' // Optimized for better caching

export default async function DebugPage() {
  const session = await getServerSession(authOptions)

  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'MODERATOR')) {
    redirect('/unauthorized')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Debug Ma'lumotlar</h1>
        <p className="text-muted-foreground">
          Session va tenant ma'lumotlarini tekshirish
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Session Ma'lumotlari
          </CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="bg-slate-100 p-4 rounded-lg overflow-auto text-xs">
            {JSON.stringify(
              {
                userId: session.user.id,
                fullName: session.user.fullName,
                email: session.user.email,
                role: session.user.role,
                tenantId: session.user.tenantId,
                tenant: session.user.tenant,
                timestamp: new Date().toISOString(),
              },
              null,
              2
            )}
          </pre>
        </CardContent>
      </Card>

      <Card className="border-orange-200 bg-orange-50">
        <CardContent className="pt-6">
          <p className="text-sm text-orange-800">
            <strong>Tenant ID:</strong> {session.user.tenantId}
            <br />
            <strong>Maktab:</strong> {session.user.tenant?.name || 'N/A'}
            <br />
            <strong>Timestamp:</strong> {new Date().toLocaleString('uz-UZ')}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

