import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  ArrowLeft, 
  Mail, 
  Phone, 
  MapPin, 
  Briefcase, 
  Users, 
  GraduationCap,
  Edit,
  DollarSign,
  Calendar
} from 'lucide-react'
import Link from 'next/link'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { formatNumber } from '@/lib/utils'

// Optimized caching: Cache for 30 seconds for detail pages ⚡
export const revalidate = 30
export const dynamic = 'auto' // Allows Next.js to optimize route caching

interface PageProps {
  params: {
    id: string
  }
}

export default async function ParentDetailPage({ params }: PageProps) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'MODERATOR')) {
      redirect('/unauthorized')
    }

    const tenantId = session.user.tenantId!

    // Get parent details
    const parent = await db.parent.findFirst({
    where: {
      id: params.id,
      tenantId,
    },
    select: {
      id: true,
      guardianType: true,
      customRelationship: true,
      occupation: true,
      workAddress: true,
      emergencyContact: true,
      user: {
        select: {
          fullName: true,
          email: true,
          phone: true,
          isActive: true,
          createdAt: true,
        },
      },
      students: {
        select: {
          hasAccess: true,
          student: {
            select: {
              id: true,
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
        },
      },
      payments: {
        take: 10,
        orderBy: {
          createdAt: 'desc',
        },
        select: {
          id: true,
          amount: true,
          paymentType: true,
          paymentMethod: true,
          status: true,
          createdAt: true,
          student: {
            select: {
              user: {
                select: {
                  fullName: true,
                },
              },
            },
          },
        },
      },
    },
  })

  if (!parent) {
    notFound()
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  // Calculate payment statistics
  const totalPayments = parent.payments.reduce(
    (sum, p) => sum + Number(p.amount),
    0
  )
  const completedPayments = parent.payments.filter(
    (p) => p.status === 'COMPLETED'
  ).length
  const pendingPayments = parent.payments.filter(
    (p) => p.status === 'PENDING'
  ).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/parents">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Ota-ona ma'lumotlari</h1>
            <p className="text-muted-foreground">
              To'liq ma'lumot va farzandlar haqida
            </p>
          </div>
        </div>
        <Link href={`/admin/parents/${parent.id}/edit`}>
          <Button className="gap-2">
            <Edit className="h-4 w-4" />
            Tahrirlash
          </Button>
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Main Info */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Shaxsiy Ma'lumotlar</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-start gap-4">
              <Avatar className="h-20 w-20">
                <AvatarFallback className="bg-blue-100 text-blue-700 text-2xl">
                  {getInitials(parent.user?.fullName || 'N/A')}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h2 className="text-2xl font-bold">
                  {parent.user?.fullName || 'N/A'}
                </h2>
                <p className="text-muted-foreground capitalize">
                  {parent.customRelationship ||
                   (parent.guardianType === 'FATHER' ? 'Ota' :
                    parent.guardianType === 'MOTHER' ? 'Ona' :
                    parent.guardianType === 'OTHER' ? 'Boshqa' : 'Qarib')}
                </p>
                <div className="mt-2">
                  <Badge
                    variant={parent.user?.isActive ? 'default' : 'secondary'}
                    className={
                      parent.user?.isActive
                        ? 'bg-green-500 hover:bg-green-600'
                        : ''
                    }
                  >
                    {parent.user?.isActive ? 'Faol' : 'Nofaol'}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  <span className="text-sm font-medium">Email</span>
                </div>
                <p className="text-sm">{parent.user?.email || 'N/A'}</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  <span className="text-sm font-medium">Telefon</span>
                </div>
                <p className="text-sm">{parent.user?.phone || 'N/A'}</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Briefcase className="h-4 w-4" />
                  <span className="text-sm font-medium">Kasb</span>
                </div>
                <p className="text-sm">{parent.occupation || 'Ko\'rsatilmagan'}</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span className="text-sm font-medium">Ish joyi</span>
                </div>
                <p className="text-sm">{parent.workAddress || 'Ko\'rsatilmagan'}</p>
              </div>

              {parent.emergencyContact && (
                <div className="space-y-2 md:col-span-2">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    <span className="text-sm font-medium">Favqulodda aloqa</span>
                  </div>
                  <p className="text-sm">{parent.emergencyContact}</p>
                </div>
              )}
            </div>

            <div className="pt-4 border-t">
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Calendar className="h-4 w-4" />
                <span>
                  Ro'yxatdan o'tgan:{' '}
                  {parent.user?.createdAt
                    ? new Date(parent.user.createdAt).toLocaleDateString('uz-UZ')
                    : 'N/A'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Stats */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">
                Jami To'lovlar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatNumber(totalPayments)} so'm
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {parent.payments.length} ta to'lov
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">
                To'langan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {completedPayments}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Muvaffaqiyatli
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">
                Kutilmoqda
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {pendingPayments}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                To'lanmagan
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Children */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Farzandlar
          </CardTitle>
          <CardDescription>
            Ushbu ota-onaning farzandlari ro'yxati
          </CardDescription>
        </CardHeader>
        <CardContent>
          {parent.students.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {parent.students.map((sp) => (
                <Link
                  key={sp.student.id}
                  href={`/admin/students/${sp.student.id}`}
                  className="block"
                >
                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-12 w-12">
                          <AvatarFallback className="bg-green-100 text-green-700">
                            {getInitials(sp.student.user?.fullName || 'N/A')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <h3 className="font-semibold">
                            {sp.student.user?.fullName || 'N/A'}
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                            <GraduationCap className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">
                              {sp.student.class?.name || 'Sinf biriktirilmagan'}
                            </span>
                          </div>
                          {sp.hasAccess && (
                            <Badge variant="outline" className="mt-2 text-xs">
                              Asosiy ota-ona
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                Farzandlar hali biriktirilmagan
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Payments */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Oxirgi To'lovlar
          </CardTitle>
          <CardDescription>
            So'nggi 10 ta to'lov tarixi
          </CardDescription>
        </CardHeader>
        <CardContent>
          {parent.payments.length > 0 ? (
            <div className="space-y-4">
              {parent.payments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between border-b pb-3 last:border-0"
                >
                  <div>
                    <p className="font-medium">
                      {payment.student.user?.fullName || 'N/A'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {payment.paymentType} • {payment.paymentMethod}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(payment.createdAt).toLocaleDateString('uz-UZ')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg">
                      {formatNumber(Number(payment.amount))} so'm
                    </p>
                    <Badge
                      variant={
                        payment.status === 'COMPLETED'
                          ? 'default'
                          : payment.status === 'PENDING'
                          ? 'secondary'
                          : 'destructive'
                      }
                      className={
                        payment.status === 'COMPLETED'
                          ? 'bg-green-500 hover:bg-green-600'
                          : ''
                      }
                    >
                      {payment.status === 'COMPLETED'
                        ? 'To\'langan'
                        : payment.status === 'PENDING'
                        ? 'Kutilmoqda'
                        : payment.status === 'FAILED'
                        ? 'Muvaffaqiyatsiz'
                        : 'Qaytarilgan'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                Hozircha to'lovlar mavjud emas
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Parent detail page error:', error)
    }
    throw error
  }
}
