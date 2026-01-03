import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Edit, Award, User, BookOpen, GraduationCap, Calendar } from 'lucide-react'
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

export default async function GradeDetailPage({ params }: PageProps) {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'ADMIN') {
    redirect('/unauthorized')
  }

  const tenantId = session.user.tenantId!

  // Get grade record
  const grade = await db.grade.findFirst({
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
            },
          },
          class: {
            select: {
              name: true,
            },
          },
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

  if (!grade) {
    notFound()
  }

  const percentage = Number(grade.percentage || 0)
  const score = Number(grade.score)
  const maxScore = Number(grade.maxScore)

  const getGradeLevel = () => {
    if (percentage >= 90) return { label: '5 (A\'lo)', color: 'bg-green-500' }
    if (percentage >= 70) return { label: '4 (Yaxshi)', color: 'bg-blue-500' }
    if (percentage >= 60) return { label: '3 (Qoniqarli)', color: 'bg-orange-500' }
    return { label: '2 (Qoniqarsiz)', color: 'bg-red-500' }
  }

  const gradeLevel = getGradeLevel()

  const getGradeTypeBadge = () => {
    const types: Record<string, { label: string; color: string }> = {
      ORAL: { label: 'Og\'zaki', color: 'bg-blue-100 text-blue-700' },
      WRITTEN: { label: 'Yozma', color: 'bg-green-100 text-green-700' },
      TEST: { label: 'Test', color: 'bg-purple-100 text-purple-700' },
      EXAM: { label: 'Imtihon', color: 'bg-orange-100 text-orange-700' },
      QUARTER: { label: 'Chorak', color: 'bg-indigo-100 text-indigo-700' },
      FINAL: { label: 'Yillik', color: 'bg-pink-100 text-pink-700' },
    }

    const typeInfo = types[grade.gradeType] || { label: grade.gradeType, color: 'bg-gray-100 text-gray-700' }

    return (
      <Badge variant="outline" className={typeInfo.color}>
        {typeInfo.label}
      </Badge>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/grades">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Baho Tafsilotlari</h1>
            <p className="text-muted-foreground mt-1">
              {grade.subject.name} - {grade.student.user?.fullName}
            </p>
          </div>
        </div>
        <Link href={`/admin/grades/${grade.id}/edit`}>
          <Button className="gap-2">
            <Edit className="h-4 w-4" />
            Tahrirlash
          </Button>
        </Link>
      </div>

      {/* Score Card */}
      <Card className="border-2 border-yellow-200 bg-gradient-to-br from-yellow-50 to-orange-50">
        <CardContent className="pt-6">
          <div className="text-center space-y-3">
            <Award className="h-16 w-16 text-yellow-500 mx-auto" />
            <div>
              <p className="text-6xl font-bold text-yellow-600">
                {score}
              </p>
              <p className="text-xl text-muted-foreground">
                / {maxScore} ball
              </p>
            </div>
            <div className="flex items-center justify-center gap-4">
              <Badge className={`text-lg px-4 py-2 ${gradeLevel.color}`}>
                {gradeLevel.label}
              </Badge>
              <p className="text-2xl font-bold text-yellow-600">
                {percentage.toFixed(1)}%
              </p>
            </div>
          </div>
        </CardContent>
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
                {grade.student.user?.fullName || 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">O'quvchi kodi</p>
              <p className="text-sm font-mono">{grade.student.studentCode}</p>
            </div>
            {grade.student.class && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Sinf</p>
                <Badge variant="outline">{grade.student.class.name}</Badge>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Grade Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Baho Ma'lumotlari
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Fan</p>
              <p className="text-lg font-semibold">{grade.subject.name}</p>
              <p className="text-xs text-muted-foreground">{grade.subject.code}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Turi</p>
              {getGradeTypeBadge()}
            </div>
            <div className="grid grid-cols-2 gap-4">
              {grade.quarter && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Chorak</p>
                  <p className="text-sm font-semibold">{grade.quarter}-chorak</p>
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-muted-foreground">O'quv yili</p>
                <p className="text-sm font-semibold">{grade.academicYear}</p>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Sana</p>
              <div className="flex items-center gap-2 mt-1">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm font-semibold">
                  {new Date(grade.date).toLocaleDateString('uz-UZ')}
                </p>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">O'qituvchi</p>
              <div className="flex items-center gap-2 mt-1">
                <GraduationCap className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm font-semibold">
                  {grade.teacher.user?.fullName || 'N/A'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Notes */}
      {grade.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Izoh</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{grade.notes}</p>
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
            Yaratilgan: {new Date(grade.createdAt).toLocaleString('uz-UZ')}
          </p>
          <p>
            Yangilangan: {new Date(grade.updatedAt).toLocaleString('uz-UZ')}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

