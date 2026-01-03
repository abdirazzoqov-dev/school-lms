import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CalendarCheck, Download, FileText, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { AttendanceChart } from '@/components/charts/attendance-chart'

// Cache for 5 minutes ⚡
export const revalidate = 300

export default async function AttendanceReportPage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'ADMIN') {
    redirect('/unauthorized')
  }

  const tenantId = session.user.tenantId!

  // Get attendance data
  const attendances = await db.attendance.findMany({
    where: { tenantId },
    include: {
      student: {
        include: {
          user: { select: { fullName: true } },
          class: { select: { name: true } }
        }
      },
      teacher: {
        include: {
          user: { select: { fullName: true } }
        }
      }
    },
    orderBy: { date: 'desc' }
  })

  // Statistics
  const totalRecords = attendances.length
  const present = attendances.filter(a => a.status === 'PRESENT').length
  const absent = attendances.filter(a => a.status === 'ABSENT').length
  const late = attendances.filter(a => a.status === 'LATE').length
  const excused = attendances.filter(a => a.status === 'EXCUSED').length

  const attendanceRate = totalRecords > 0 ? ((present / totalRecords) * 100).toFixed(1) : '0'

  // Last 7 days data
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    d.setHours(0, 0, 0, 0)
    return d
  })

  const chartData = last7Days.map(date => {
    const dayAttendances = attendances.filter(a => {
      const aDate = new Date(a.date)
      return aDate.toDateString() === date.toDateString()
    })

    return {
      date: date.toLocaleDateString('uz-UZ', { month: 'short', day: 'numeric' }),
      present: dayAttendances.filter(a => a.status === 'PRESENT').length,
      absent: dayAttendances.filter(a => a.status === 'ABSENT').length,
      late: dayAttendances.filter(a => a.status === 'LATE').length,
      total: dayAttendances.length
    }
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Davomat Hisoboti</h1>
          <p className="text-muted-foreground">
            To'liq davomat statistikasi
          </p>
        </div>
        <Link href="/admin/reports">
          <Button variant="outline">
            <FileText className="h-4 w-4 mr-2" />
            Orqaga
          </Button>
        </Link>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <CalendarCheck className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{totalRecords}</div>
                <p className="text-sm text-muted-foreground">Jami</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{present}</div>
                <p className="text-sm text-muted-foreground">Kelgan</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-red-100 rounded-lg">
                <CalendarCheck className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{absent}</div>
                <p className="text-sm text-muted-foreground">Kelmagan</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <CalendarCheck className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{late}</div>
                <p className="text-sm text-muted-foreground">Kech qolgan</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-purple-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{attendanceRate}%</div>
                <p className="text-sm text-muted-foreground">Davomat</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      <AttendanceChart data={chartData} />

      {/* Status Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Holat bo'yicha taqsimot</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="p-4 border rounded-lg bg-green-50">
              <div className="text-2xl font-bold text-green-600 mb-1">{present}</div>
              <p className="text-sm text-green-800 mb-2">Kelgan</p>
              <Badge className="bg-green-600">{((present / totalRecords) * 100).toFixed(1)}%</Badge>
            </div>
            <div className="p-4 border rounded-lg bg-red-50">
              <div className="text-2xl font-bold text-red-600 mb-1">{absent}</div>
              <p className="text-sm text-red-800 mb-2">Kelmagan</p>
              <Badge className="bg-red-600">{((absent / totalRecords) * 100).toFixed(1)}%</Badge>
            </div>
            <div className="p-4 border rounded-lg bg-yellow-50">
              <div className="text-2xl font-bold text-yellow-600 mb-1">{late}</div>
              <p className="text-sm text-yellow-800 mb-2">Kech qolgan</p>
              <Badge className="bg-yellow-600">{((late / totalRecords) * 100).toFixed(1)}%</Badge>
            </div>
            <div className="p-4 border rounded-lg bg-blue-50">
              <div className="text-2xl font-bold text-blue-600 mb-1">{excused}</div>
              <p className="text-sm text-blue-800 mb-2">Sababli</p>
              <Badge className="bg-blue-600">{((excused / totalRecords) * 100).toFixed(1)}%</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Eksport qilish</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Button>
              <Download className="h-4 w-4 mr-2" />
              PDF yuklab olish
            </Button>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Excel yuklab olish
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-3">
            Davomat hisobotini PDF yoki Excel formatida yuklab oling
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

