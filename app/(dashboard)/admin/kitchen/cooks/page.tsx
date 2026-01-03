import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  ChefHat, 
  Plus, 
  MoreVertical,
  User,
  Mail,
  Phone,
  Briefcase,
  Calendar
} from 'lucide-react'
import Link from 'next/link'
import { formatNumber, formatDate } from '@/lib/utils'
import { CooksTable } from './cooks-table'

export const revalidate = 60
export const dynamic = 'auto' // Optimized for better caching

export default async function CooksPage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'ADMIN') {
    redirect('/unauthorized')
  }

  const tenantId = session.user.tenantId!

  // Get all cooks
  const cooks = await db.cook.findMany({
    where: { tenantId },
    include: {
      user: {
        select: {
          fullName: true,
          email: true,
          phone: true,
          isActive: true,
          lastLogin: true
        }
      },
      _count: {
        select: { kitchenExpenses: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <ChefHat className="h-8 w-8 text-orange-500" />
            Oshpazlar
          </h1>
          <p className="text-muted-foreground mt-1">
            Oshxona xodimlarini boshqaring
          </p>
        </div>
        <Link href="/admin/kitchen/cooks/create">
          <Button className="bg-orange-500 hover:bg-orange-600">
            <Plus className="mr-2 h-4 w-4" />
            Yangi Oshpaz
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-100">
                <ChefHat className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{cooks.length}</p>
                <p className="text-xs text-muted-foreground">Jami oshpazlar</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100">
                <User className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {cooks.filter(c => c.user.isActive).length}
                </p>
                <p className="text-xs text-muted-foreground">Faol</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100">
                <Briefcase className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {cooks.filter(c => c.position === 'HEAD_COOK').length}
                </p>
                <p className="text-xs text-muted-foreground">Bosh oshpaz</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100">
                <Calendar className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {cooks.reduce((acc, c) => acc + c._count.kitchenExpenses, 0)}
                </p>
                <p className="text-xs text-muted-foreground">Jami xarajatlar</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cooks Table */}
      <Card>
        <CardHeader>
          <CardTitle>Oshpazlar Ro'yxati</CardTitle>
        </CardHeader>
        <CardContent>
          <CooksTable cooks={cooks} />
        </CardContent>
      </Card>
    </div>
  )
}

