import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText, Download, TrendingUp, Users, Calendar } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { PermissionGate } from '@/components/admin/permission-gate'

// Optimized caching  
export const revalidate = 300
export const dynamic = 'auto'

export default async function ReportsPage() {
  const session = await getServerSession(authOptions)

  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'MODERATOR')) {
    redirect('/unauthorized')
  }

  const reportTypes = [
    {
      title: 'O\'quvchilar hisoboti',
      description: 'Barcha o\'quvchilar bo\'yicha batafsil hisobot',
      icon: Users,
      href: '/admin/reports/students',
      color: 'text-blue-600 bg-blue-100'
    },
    {
      title: 'Davomat hisoboti',
      description: 'Sinflar bo\'yicha davomat statistikasi',
      icon: Calendar,
      href: '/admin/reports/attendance',
      color: 'text-green-600 bg-green-100'
    },
    {
      title: 'Baholar hisoboti',
      description: 'O\'quvchilar baholari va o\'rtacha ko\'rsatkichlar',
      icon: TrendingUp,
      href: '/admin/reports/grades',
      color: 'text-purple-600 bg-purple-100'
    },
    {
      title: 'Moliyaviy hisobot',
      description: 'To\'lovlar va daromadlar statistikasi',
      icon: Download,
      href: '/admin/reports/financial',
      color: 'text-orange-600 bg-orange-100'
    }
  ]

  return (
    <div className="space-y-4 md:space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Hisobotlar</h1>
        <p className="text-sm md:text-base text-muted-foreground">
          Turli hisobotlarni ko\'ring va yuklab oling
        </p>
      </div>

      <div className="grid gap-3 md:gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {reportTypes.map((report) => {
          const Icon = report.icon
          return (
            <Card key={report.href} className="hover:shadow-lg transition-shadow">
              <CardHeader className="p-4 md:p-6">
                <div className="flex items-center gap-3 md:gap-4">
                  <div className={`p-2 md:p-3 rounded-lg ${report.color}`}>
                    <Icon className="h-5 w-5 md:h-6 md:w-6" />
                  </div>
                  <div>
                    <CardTitle className="text-base md:text-lg">{report.title}</CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4 md:p-6 pt-0">
                <p className="text-xs md:text-sm text-muted-foreground mb-3 md:mb-4">
                  {report.description}
                </p>
                <PermissionGate resource="reports" action="READ">
                  <Link href={report.href}>
                    <Button className="w-full" size="sm">
                      <FileText className="mr-2 h-4 w-4" />
                      Hisobotni ko\'rish
                    </Button>
                  </Link>
                </PermissionGate>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card>
        <CardHeader className="p-4 md:p-6">
          <CardTitle className="text-base md:text-lg">Tezkor hisobotlar</CardTitle>
        </CardHeader>
        <CardContent className="p-4 md:p-6 pt-0">
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
            <div className="space-y-2">
              <h3 className="font-semibold text-sm md:text-base">Oylik hisobotlar</h3>
              <p className="text-xs md:text-sm text-muted-foreground">
                Oxirgi oy uchun avtomatik hisobotlar
              </p>
              <PermissionGate resource="reports" action="READ">
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1 md:flex-none">
                    <Download className="mr-2 h-4 w-4" />
                    PDF
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1 md:flex-none">
                    <Download className="mr-2 h-4 w-4" />
                    Excel
                  </Button>
                </div>
              </PermissionGate>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-sm md:text-base">Choraklik hisobotlar</h3>
              <p className="text-xs md:text-sm text-muted-foreground">
                Oxirgi chorak uchun umumiy hisobot
              </p>
              <PermissionGate resource="reports" action="READ">
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1 md:flex-none">
                    <Download className="mr-2 h-4 w-4" />
                    PDF
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1 md:flex-none">
                    <Download className="mr-2 h-4 w-4" />
                    Excel
                  </Button>
                </div>
              </PermissionGate>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

