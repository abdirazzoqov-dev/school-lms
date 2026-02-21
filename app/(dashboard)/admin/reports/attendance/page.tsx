import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Calendar, Download, ArrowLeft, CheckCircle2, XCircle, Clock, Users
} from 'lucide-react'
import Link from 'next/link'

export const revalidate = 0
export const dynamic = 'force-dynamic'

export default async function AttendanceReportPage({
  searchParams
}: {
  searchParams: { month?: string; year?: string; classId?: string }
}) {
  const session = await getServerSession(authOptions)

  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'MODERATOR')) {
    redirect('/unauthorized')
  }

  const tenantId = session.user.tenantId!
  
  const currentDate = new Date()
  const selectedMonth = searchParams.month ? parseInt(searchParams.month) : currentDate.getMonth() + 1
  const selectedYear = searchParams.year ? parseInt(searchParams.year) : currentDate.getFullYear()

  // Date range for selected month
  const startDate = new Date(selectedYear, selectedMonth - 1, 1)
  const endDate = new Date(selectedYear, selectedMonth, 0, 23, 59, 59)

  // Build where clause
  const where: any = {
    tenantId,
    date: {
      gte: startDate,
      lte: endDate
    }
  }
  if (searchParams.classId) where.classId = searchParams.classId

  // Get attendance records
  const attendances = await db.attendance.findMany({
    where,
    include: {
      student: {
        include: {
          user: {
            select: {
              fullName: true
            }
          },
          class: {
            select: {
              name: true
            }
          }
        }
      },
      teacher: {
        include: {
          user: {
            select: {
              fullName: true
            }
          }
        }
      }
    }
  })

  // Get all classes for filter
  const classes = await db.class.findMany({
    where: { tenantId },
    select: {
      id: true,
      name: true,
      gradeLevel: true,
      _count: {
        select: {
          students: true
        }
      }
    },
    orderBy: {
      gradeLevel: 'asc'
    }
  })

  // Calculate statistics
  const totalRecords = attendances.length
  const presentCount = attendances.filter(a => a.status === 'PRESENT').length
  const absentCount = attendances.filter(a => a.status === 'ABSENT').length
  const lateCount = attendances.filter(a => a.status === 'LATE').length
  const excusedCount = attendances.filter(a => a.status === 'EXCUSED').length

  const presentRate = totalRecords > 0 ? (presentCount / totalRecords) * 100 : 0
  const absentRate = totalRecords > 0 ? (absentCount / totalRecords) * 100 : 0

  // Group by class
  const classCounts = new Map<string, {
    className: string
    total: number
    present: number
    absent: number
    late: number
    excused: number
  }>()

  attendances.forEach(att => {
    const className = att.student.class?.name || 'N/A'
    const current = classCounts.get(className) || {
      className,
      total: 0,
      present: 0,
      absent: 0,
      late: 0,
      excused: 0
    }
    
    current.total++
    if (att.status === 'PRESENT') current.present++
    if (att.status === 'ABSENT') current.absent++
    if (att.status === 'LATE') current.late++
    if (att.status === 'EXCUSED') current.excused++
    
    classCounts.set(className, current)
  })

  const classStats = Array.from(classCounts.values())

  const monthNames = [
    'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun',
    'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'
  ]

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/reports">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">Davomat Hisoboti</h1>
          <p className="text-muted-foreground">
            {monthNames[selectedMonth - 1]} {selectedYear} - Sinflar bo'yicha davomat statistikasi
          </p>
        </div>
        <Button asChild className="bg-green-600 hover:bg-green-700">
          <Link href={`/api/admin/reports/attendance/export?month=${selectedMonth}&year=${selectedYear}&classId=${searchParams.classId || ''}`}>
            <Download className="mr-2 h-4 w-4" />
            Excel
          </Link>
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Jami Davomatlar</p>
                <p className="text-3xl font-bold text-blue-600">{totalRecords}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-green-100">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Bor</p>
                <p className="text-3xl font-bold text-green-600">{presentCount}</p>
                <p className="text-xs text-green-600 font-medium">{presentRate.toFixed(1)}%</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-red-200 bg-gradient-to-br from-red-50 to-red-100">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Yo'q</p>
                <p className="text-3xl font-bold text-red-600">{absentCount}</p>
                <p className="text-xs text-red-600 font-medium">{absentRate.toFixed(1)}%</p>
              </div>
              <div className="p-3 bg-red-100 rounded-full">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-yellow-200 bg-gradient-to-br from-yellow-50 to-yellow-100">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Kech / Sababli</p>
                <p className="text-3xl font-bold text-yellow-600">{lateCount + excusedCount}</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-full">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Card */}
      <Card>
        <CardHeader>
          <CardTitle>Filtrlar</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 flex-wrap">
            {classes.map(cls => (
              <Link key={cls.id} href={`/admin/reports/attendance?month=${selectedMonth}&year=${selectedYear}&classId=${cls.id}`}>
                <Button variant={searchParams.classId === cls.id ? "default" : "outline"} size="sm">
                  {cls.name} ({cls._count.students})
                </Button>
              </Link>
            ))}
            <Link href={`/admin/reports/attendance?month=${selectedMonth}&year=${selectedYear}`}>
              <Button variant={!searchParams.classId ? "default" : "outline"} size="sm">
                Barchasi
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Class Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Sinflar bo'yicha statistika</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {classStats.map(stat => {
              const presentPercentage = stat.total > 0 ? (stat.present / stat.total) * 100 : 0
              
              return (
                <div key={stat.className} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="font-semibold">{stat.className}</span>
                      <Badge variant="outline">{stat.total} ta</Badge>
                    </div>
                    <span className="font-bold text-green-600">{presentPercentage.toFixed(1)}%</span>
                  </div>
                  <Progress value={presentPercentage} className="h-3" />
                  <div className="grid grid-cols-4 gap-2 text-sm">
                    <div className="text-center">
                      <p className="text-green-600 font-medium">{stat.present}</p>
                      <p className="text-muted-foreground text-xs">Bor</p>
                    </div>
                    <div className="text-center">
                      <p className="text-red-600 font-medium">{stat.absent}</p>
                      <p className="text-muted-foreground text-xs">Yo'q</p>
                    </div>
                    <div className="text-center">
                      <p className="text-yellow-600 font-medium">{stat.late}</p>
                      <p className="text-muted-foreground text-xs">Kech</p>
                    </div>
                    <div className="text-center">
                      <p className="text-blue-600 font-medium">{stat.excused}</p>
                      <p className="text-muted-foreground text-xs">Sababli</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
