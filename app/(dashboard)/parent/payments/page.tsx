import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import {
  DollarSign, TrendingUp, Clock, CheckCircle2, Calendar, User
} from 'lucide-react'
import { formatNumber } from '@/lib/utils'
import Link from 'next/link'

export const revalidate = 0
export const dynamic = 'force-dynamic'

export default async function ParentPaymentsPage({
  searchParams
}: {
  searchParams: { childId?: string }
}) {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'PARENT') {
    redirect('/unauthorized')
  }

  const tenantId = session.user.tenantId!

  // Get parent
  const parent = await db.parent.findUnique({
    where: {
      userId: session.user.id
    },
    include: {
      students: {
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
              },
              payments: {
                orderBy: {
                  createdAt: 'desc'
                }
              }
            }
          }
        }
      }
    }
  })

  if (!parent) {
    redirect('/unauthorized')
  }

  // Get all children's students
  const children = parent.students.map(c => c.student)

  // Filter by child if specified
  const filteredChildren = searchParams.childId
    ? children.filter(c => c.id === searchParams.childId)
    : children

  // Calculate overall statistics
  const allPayments = filteredChildren.flatMap(child => child.payments)
  
  const totalAmount = allPayments.reduce((sum, p) => sum + Number(p.amount), 0)
  const totalPaid = allPayments.reduce((sum, p) => sum + Number(p.paidAmount || 0), 0)
  const totalRemaining = allPayments.reduce((sum, p) => sum + Number(p.remainingAmount || 0), 0)

  const completedPayments = allPayments.filter(p => p.status === 'COMPLETED' && Number(p.remainingAmount) === 0).length
  const pendingPayments = allPayments.filter(p => p.status === 'PENDING' || Number(p.remainingAmount) > 0).length

  const monthNames = [
    'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun',
    'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'
  ]

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-600 via-emerald-600 to-teal-600 p-8 text-white shadow-2xl">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                  <DollarSign className="h-8 w-8" />
                </div>
                <h1 className="text-4xl font-bold">Farzandlarim To'lovlari</h1>
              </div>
              <p className="text-green-50 text-lg">
                Barcha to'lovlar va to'lov tarixi
              </p>
            </div>
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10 blur-2xl"></div>
        <div className="absolute -left-8 -bottom-8 h-40 w-40 rounded-full bg-white/10 blur-2xl"></div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Jami Summa</p>
                <p className="text-2xl font-bold text-blue-600">{formatNumber(totalAmount)}</p>
                <p className="text-xs text-muted-foreground mt-1">so'm</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <DollarSign className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-green-100">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">To'langan</p>
                <p className="text-2xl font-bold text-green-600">{formatNumber(totalPaid)}</p>
                <p className="text-xs text-muted-foreground mt-1">so'm</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-orange-100">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Qolgan</p>
                <p className="text-2xl font-bold text-orange-600">{formatNumber(totalRemaining)}</p>
                <p className="text-xs text-muted-foreground mt-1">so'm</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">To'lovlar</p>
                <p className="text-2xl font-bold text-purple-600">{allPayments.length}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {completedPayments} ✓ • {pendingPayments} ⏳
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter by Child */}
      {children.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Farzand tanlash</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 flex-wrap">
              <Link href="/parent/payments">
                <Button variant={!searchParams.childId ? "default" : "outline"} size="sm">
                  Barchasi
                </Button>
              </Link>
              {children.map(child => (
                <Link key={child.id} href={`/parent/payments?childId=${child.id}`}>
                  <Button variant={searchParams.childId === child.id ? "default" : "outline"} size="sm">
                    <User className="h-4 w-4 mr-2" />
                    {child.user?.fullName || 'N/A'}
                  </Button>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payments by Child */}
      <div className="space-y-4">
        {filteredChildren.map(child => {
          const childPayments = child.payments
          const childTotalAmount = childPayments.reduce((sum, p) => sum + Number(p.amount), 0)
          const childTotalPaid = childPayments.reduce((sum, p) => sum + Number(p.paidAmount || 0), 0)
          const childTotalRemaining = childPayments.reduce((sum, p) => sum + Number(p.remainingAmount || 0), 0)
          const childProgress = childTotalAmount > 0 ? Math.round((childTotalPaid / childTotalAmount) * 100) : 0

          return (
            <Card key={child.id} className="border-2">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      {child.user?.fullName || 'N/A'}
                    </CardTitle>
                    <CardDescription>
                      {child.class?.name || 'N/A'} • {childPayments.length} ta to'lov
                    </CardDescription>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-blue-600">{formatNumber(childTotalPaid)}</p>
                    <p className="text-sm text-muted-foreground">/ {formatNumber(childTotalAmount)} so'm</p>
                  </div>
                </div>
                
                {/* Overall Progress for Child */}
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Umumiy to'lov</span>
                    <span className="text-sm font-bold text-blue-600">{childProgress}%</span>
                  </div>
                  <Progress value={childProgress} className="h-3" />
                </div>
              </CardHeader>
              
              <CardContent className="pt-6">
                <div className="space-y-3">
                  {childPayments.map(payment => {
                    const paidAmount = Number(payment.paidAmount || 0)
                    const totalAmount = Number(payment.amount)
                    const remainingAmount = Number(payment.remainingAmount || 0)
                    const percentage = totalAmount > 0 ? Math.round((paidAmount / totalAmount) * 100) : 0

                    return (
                      <div key={payment.id} className="p-4 border-2 rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex items-start justify-between gap-4 mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap mb-2">
                              {/* Type Badge */}
                              {payment.paymentType === 'TUITION' && (
                                <Badge className="bg-blue-600">📚 O'qish haqi</Badge>
                              )}
                              {payment.paymentType === 'BOOKS' && (
                                <Badge className="bg-purple-600">📖 Darsliklar</Badge>
                              )}
                              {payment.paymentType === 'UNIFORM' && (
                                <Badge className="bg-green-600">👔 Forma</Badge>
                              )}
                              {payment.paymentType === 'OTHER' && (
                                <Badge className="bg-gray-600">📦 Boshqa</Badge>
                              )}

                              {/* Status Badge */}
                              {percentage === 100 && remainingAmount === 0 && (
                                <Badge className="bg-green-600">✓ To'langan</Badge>
                              )}
                              {percentage > 0 && percentage < 100 && (
                                <Badge className="bg-orange-600">⚡ Qisman</Badge>
                              )}
                              {percentage === 0 && (
                                <Badge className="bg-amber-600">⏳ Kutilmoqda</Badge>
                              )}

                              {/* Month Badge */}
                              {payment.paymentMonth && payment.paymentYear && (
                                <Badge variant="outline" className="text-xs">
                                  <Calendar className="h-3 w-3 mr-1" />
                                  {monthNames[payment.paymentMonth - 1]} {payment.paymentYear}
                                </Badge>
                              )}
                            </div>

                            {payment.notes && (
                              <p className="text-sm text-muted-foreground mb-2">
                                📝 {payment.notes}
                              </p>
                            )}
                          </div>

                          <div className="text-right">
                            <p className="text-xl font-bold text-green-600">
                              {formatNumber(paidAmount)}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              / {formatNumber(totalAmount)} so'm
                            </p>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="mb-3">
                          <Progress value={percentage} className="h-2" />
                        </div>

                        {/* Amount Breakdown */}
                        <div className="grid grid-cols-2 gap-2">
                          <div className="bg-green-50 border border-green-200 rounded px-3 py-2">
                            <p className="text-xs text-green-600">To'landi</p>
                            <p className="text-sm font-bold text-green-700">
                              {formatNumber(paidAmount)} so'm
                            </p>
                          </div>
                          {remainingAmount > 0 && (
                            <div className="bg-orange-50 border border-orange-200 rounded px-3 py-2">
                              <p className="text-xs text-orange-600">Qoldi</p>
                              <p className="text-sm font-bold text-orange-700">
                                {formatNumber(remainingAmount)} so'm
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Payment Date */}
                        {payment.paidDate && (
                          <p className="text-xs text-muted-foreground mt-2">
                            📅 To'langan: {new Date(payment.paidDate).toLocaleDateString('uz-UZ', {
                              day: '2-digit',
                              month: 'long',
                              year: 'numeric'
                            })}
                          </p>
                        )}
                      </div>
                    )
                  })}

                  {childPayments.length === 0 && (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">To'lovlar topilmadi</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {filteredChildren.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="inline-block p-4 bg-gradient-to-br from-gray-100 to-slate-100 rounded-full mb-4">
              <DollarSign className="h-16 w-16 text-muted-foreground opacity-50" />
            </div>
            <p className="text-lg font-semibold text-muted-foreground mb-2">
              Farzandlar topilmadi
            </p>
            <p className="text-sm text-muted-foreground">
              Sizga biriktirilgan farzandlar yo'q
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
