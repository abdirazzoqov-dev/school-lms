import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Edit, Calendar, User, BookOpen, GraduationCap } from 'lucide-react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'

interface PageProps {
  params: {
    id: string
  }
}

// Optimized caching: Cache for 30 seconds for detail pages ⚡
export const revalidate = 30
export const dynamic = 'auto' // Allows Next.js to optimize route caching

export default async function AttendanceDetailPage({ params }: PageProps) {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'ADMIN') {
    redirect('/unauthorized')
  }

  const tenantId = session.user.tenantId!

  // Get attendance record
  const attendance = await db.attendance.findFirst({
    where: {
      id: params.id,
      tenantId,
    },
    include: {
      student: {
        include: {
          user: {
            select: {
              fullName: true,
              email: true,
              phone: true,
            },
          },
          class: {
            select: {
              name: true,
            },
          },
        },
      },
      class: {
        select: {
          name: true,
        },
      },
      subject: {
        select: {
          name: true,
          code: true,
        },
      },
      teacher: {
        include: {
          user: {
            select: {
              fullName: true,
            },
          },
        },
      },
    },
  })

  if (!attendance) {
    notFound()
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PRESENT':
        return <Badge className="bg-green-500">Kelgan</Badge>
      case 'ABSENT':
        return <Badge className="bg-red-500">Kelmagan</Badge>
      case 'LATE':
        return <Badge className="bg-orange-500">Kech keldi</Badge>
      case 'EXCUSED':
        return <Badge className="bg-blue-500">Sababli</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/attendance">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Davomat Tafsilotlari</h1>
            <p className="text-muted-foreground mt-1">
              {new Date(attendance.date).toLocaleDateString('uz-UZ', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
        </div>
        <Link href={`/admin/attendance/${attendance.id}/edit`}>
          <Button className="gap-2">
            <Edit className="h-4 w-4" />
            Tahrirlash
          </Button>
        </Link>
      </div>

      {/* Status Card */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Holat</span>
            {getStatusBadge(attendance.status)}
          </CardTitle>
        </CardHeader>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Student Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              O'quvchi Ma'lumotlari
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm font-medium text-muted-foreground">To'liq ism</p>
              <p className="text-lg font-semibold">
                {attendance.student.user?.fullName || 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">O'quvchi kodi</p>
              <p className="text-sm font-mono">{attendance.student.studentCode}</p>
            </div>
            {attendance.student.user?.email && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Email</p>
                <p className="text-sm">{attendance.student.user.email}</p>
              </div>
            )}
            {attendance.student.user?.phone && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Telefon</p>
                <p className="text-sm">{attendance.student.user.phone}</p>
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-muted-foreground">Sinf</p>
              <Badge variant="outline">{attendance.class?.name || attendance.group?.name || '—'}</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Lesson Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Dars Ma'lumotlari
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Sana</p>
              <div className="flex items-center gap-2 mt-1">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm font-semibold">
                  {new Date(attendance.date).toLocaleDateString('uz-UZ')}
                </p>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Fan</p>
              <p className="text-lg font-semibold">{attendance.subject.name}</p>
              <p className="text-xs text-muted-foreground">{attendance.subject.code}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">O'qituvchi</p>
              <div className="flex items-center gap-2 mt-1">
                <GraduationCap className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm font-semibold">
                  {attendance.teacher.user?.fullName || 'N/A'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Notes */}
      {attendance.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Izoh</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{attendance.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Metadata */}
      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle className="text-sm">Tizim Ma'lumotlari</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-xs text-muted-foreground">
          <p>
            Yaratilgan: {new Date(attendance.createdAt).toLocaleString('uz-UZ')}
          </p>
          <p>
            Yangilangan: {new Date(attendance.updatedAt).toLocaleString('uz-UZ')}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

