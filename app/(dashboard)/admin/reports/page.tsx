import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText, Download, TrendingUp, Users, Calendar } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

// Optimized caching  
export const revalidate = 300
export const dynamic = 'auto'

export default async function ReportsPage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'ADMIN') {
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
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Hisobotlar</h1>
        <p className="text-muted-foreground">
          Turli hisobotlarni ko\'ring va yuklab oling
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {reportTypes.map((report) => {
          const Icon = report.icon
          return (
            <Card key={report.href} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-lg ${report.color}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{report.title}</CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  {report.description}
                </p>
                <Link href={report.href}>
                  <Button className="w-full" size="sm">
                    <FileText className="mr-2 h-4 w-4" />
                    Hisobotni ko\'rish
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tezkor hisobotlar</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <h3 className="font-semibold">Oylik hisobotlar</h3>
              <p className="text-sm text-muted-foreground">
                Oxirgi oy uchun avtomatik hisobotlar
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Download className="mr-2 h-4 w-4" />
                  PDF
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="mr-2 h-4 w-4" />
                  Excel
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold">Choraklik hisobotlar</h3>
              <p className="text-sm text-muted-foreground">
                Oxirgi chorak uchun umumiy hisobot
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Download className="mr-2 h-4 w-4" />
                  PDF
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="mr-2 h-4 w-4" />
                  Excel
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

