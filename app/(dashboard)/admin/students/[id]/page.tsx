import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ArrowLeft, UserCircle, Users, BookOpen, Calendar, DollarSign, Edit, GraduationCap, Phone, Radio, Clock, Camera } from 'lucide-react'
import Link from 'next/link'
import { formatNumber } from '@/lib/utils'
import { ConvertTrialButton } from './convert-trial-button'
import { getUpcomingPaymentSchedule } from '@/lib/utils/payment-helper'
import { MonthlyPaymentProgress } from '@/components/monthly-payment-progress'
import { PermissionGate } from '@/components/admin/permission-gate'

// Optimized caching: Cache for 30 seconds for detail pages ⚡
export const revalidate = 30
export const dynamic = 'auto' // Allows Next.js to optimize route caching

export default async function StudentDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)

  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'MODERATOR')) {
    redirect('/unauthorized')
  }

  const tenantId = session.user.tenantId!

  const student = await db.student.findFirst({
    where: { id: params.id, tenantId },
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          email: true,
          avatar: true,
        }
      },
      class: {
        include: {
          classTeacher: {
            include: {
              user: {
                select: {
                  fullName: true
                }
              }
            }
          }
        }
      },
      parents: {
        include: {
          parent: {
            include: {
              user: {
                select: {
                  fullName: true,
                  email: true,
                  phone: true,
                }
              }
            }
          }
        }
      },
      grades: {
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          subject: true,
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
      },
      attendances: {
        orderBy: { date: 'desc' },
        take: 20,
        include: {
          subject: true
        }
      },
      payments: {
        orderBy: { createdAt: 'desc' },
        take: 10
      }
    }
  })

  if (!student) {
    redirect('/admin/students')
  }

  const getStatusColor = (status: string) => {
    const colors = {
      ACTIVE: 'bg-green-100 text-green-800',
      GRADUATED: 'bg-blue-100 text-blue-800',
      EXPELLED: 'bg-red-100 text-red-800'
    }
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const getAttendanceColor = (status: string) => {
    const colors = {
      PRESENT: 'text-green-600',
      ABSENT: 'text-red-600',
      LATE: 'text-orange-600',
      EXCUSED: 'text-blue-600'
    }
    return colors[status as keyof typeof colors] || 'text-gray-600'
  }

  const totalPayments = student.payments.reduce((sum, p) => sum + Number(p.amount), 0)
  const paidPayments = student.payments.reduce((sum, p) => {
    // Agar COMPLETED bo'lsa va paidAmount null bo'lsa, amount ishlatamiz
    const paid = p.status === 'COMPLETED' && !p.paidAmount ? Number(p.amount) : Number(p.paidAmount || 0)
    return sum + paid
  }, 0)
  const pendingPayments = student.payments.reduce((sum, p) => sum + Number(p.remainingAmount || 0), 0)

  // Get upcoming payment schedule (next 3 months)
  const paymentSchedule = await getUpcomingPaymentSchedule(student.id, tenantId)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <Link href="/admin/students">
            <Button variant="ghost" size="icon" className="mt-1 shrink-0">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          {/* Large avatar */}
          <div className="relative shrink-0">
            <div className="w-20 h-20 rounded-full overflow-hidden shadow-xl border-4 border-white dark:border-gray-800 ring-2 ring-blue-500/20">
              {student.user?.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={student.user.avatar}
                  alt={student.user.fullName || 'O\'quvchi'}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-3xl">
                  {(student.user?.fullName || student.parents[0]?.parent.user.fullName || '?').charAt(0)}
                </div>
              )}
            </div>
            {student.status === 'ACTIVE' && (
              <span className="absolute bottom-0 right-0 w-5 h-5 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full" />
            )}
          </div>
          <div className="pt-1">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
              {student.user?.fullName || student.parents[0]?.parent.user.fullName || `O'quvchi (${student.studentCode})`}
            </h2>
            <p className="text-muted-foreground text-sm">ID: {student.studentCode}</p>
            {student.class && (
              <p className="text-sm text-blue-600 font-medium mt-0.5">{student.class.name}</p>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          {student.trialEnabled && (
            <ConvertTrialButton 
              studentId={student.id} 
              studentName={student.user?.fullName || student.parents[0]?.parent.user.fullName || `O'quvchi ${student.studentCode}`}
            />
          )}
          <PermissionGate resource="students" action="UPDATE">
            <Link href={`/admin/students/${student.id}/edit`}>
              <Button>
                <Edit className="mr-2 h-4 w-4" />
                Tahrirlash
              </Button>
            </Link>
          </PermissionGate>
        </div>
      </div>

      {/* Trial Period Information */}
      {student.trialEnabled && student.trialEndDate && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-800">
              <Clock className="h-5 w-5" />
              Sinov Muddati
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <p className="text-sm text-muted-foreground">Boshlanish</p>
                <p className="font-medium">
                  {student.trialStartDate ? new Date(student.trialStartDate).toLocaleDateString('uz-UZ') : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tugash</p>
                <p className="font-medium">
                  {new Date(student.trialEndDate).toLocaleDateString('uz-UZ')}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Holat</p>
                <p className="font-semibold">
                  {(() => {
                    const now = new Date()
                    const endDate = new Date(student.trialEndDate)
                    const isExpired = endDate < now
                    const daysLeft = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
                    
                    if (isExpired) {
                      return <span className="text-red-600">Tugagan ({student.trialDays} kun)</span>
                    } else {
                      return <span className="text-orange-600">{daysLeft} kun qoldi</span>
                    }
                  })()}
                </p>
              </div>
            </div>
            <div className="mt-4 p-3 bg-white rounded-lg border border-orange-200">
              <p className="text-sm text-orange-800">
                💡 Sinov muddati tugagandan keyin, o'quvchini asosiy o'quvchilar ro'yxatiga o'tkazish uchun yuqoridagi tugmani bosing.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        {/* Basic Information */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Asosiy Ma'lumotlar</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground">To'liq Ism</p>
              <p className="font-medium">
                {student.user?.fullName || student.parents[0]?.parent.user.fullName || `O'quvchi (${student.studentCode})`}
              </p>
              {!student.user && (
                <p className="text-xs text-orange-600 mt-1">
                  ⚠️ User account yaratilmagan. <Link href="/admin/students/migrate" className="underline">Migration</Link> qiling.
                </p>
              )}
            </div>
            <div>
              <p className="text-sm text-muted-foreground">O'quvchi Kodi</p>
              <p className="font-mono font-medium">{student.studentCode}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Tug'ilgan Sana</p>
              <p className="font-medium">
                {student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString('uz-UZ') : 'N/A'}
              </p>
            </div>
            {student.user?.email && (
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{student.user.email}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-muted-foreground">Jinsi</p>
              <p className="font-medium">{student.gender === 'MALE' ? 'O\'g\'il bola' : 'Qiz bola'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <span className={`inline-block rounded-full px-2 py-1 text-xs font-semibold ${getStatusColor(student.status)}`}>
                {student.status}
              </span>
            </div>
            {student.address && (
              <div className="md:col-span-2">
                <p className="text-sm text-muted-foreground">Manzil</p>
                <p className="font-medium">{student.address}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <BookOpen className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold">{student.grades.length}</p>
                  <p className="text-sm text-muted-foreground">Baholar</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Calendar className="h-8 w-8 text-green-600" />
                <div>
                  <p className="text-2xl font-bold">{student.attendances.length}</p>
                  <p className="text-sm text-muted-foreground">Davomat</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <DollarSign className="h-8 w-8 text-orange-600" />
                <div>
                  <p className="text-2xl font-bold">{student.payments.length}</p>
                  <p className="text-sm text-muted-foreground">To'lovlar</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Class Information */}
      {student.class && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              Sinf Ma'lumotlari
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <div>
              <p className="text-sm text-muted-foreground">Sinf</p>
              <p className="font-medium text-lg">{student.class.name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Xona</p>
              <p className="font-medium">{student.class.roomNumber || 'N/A'}</p>
            </div>
            {student.class.classTeacher && (
              <div>
                <p className="text-sm text-muted-foreground">Sinf Rahbari</p>
                <p className="font-medium">{student.class.classTeacher.user.fullName}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Guardians Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Qarindoshlari Ma'lumotlari
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {student.parents.map((sp) => (
              <div key={sp.parent.id} className="flex items-center justify-between p-3 rounded-lg border">
                <div>
                  <p className="font-medium">{sp.parent.user.fullName}</p>
                  {sp.parent.user.phone && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {sp.parent.user.phone}
                    </p>
                  )}
                  {sp.parent.occupation && (
                    <p className="text-xs text-muted-foreground">{sp.parent.occupation}</p>
                  )}
                </div>
                <div className="text-right">
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                    {sp.parent.guardianType === 'FATHER' ? 'Ota' : 
                     sp.parent.guardianType === 'MOTHER' ? 'Ona' : 
                     sp.parent.customRelationship || 'Boshqa'}
                  </span>
                  {sp.hasAccess && (
                    <p className="text-xs text-green-600 font-medium mt-1 flex items-center gap-1 justify-end">
                      <Radio className="h-3 w-3" />
                      Nazoratchi
                    </p>
                  )}
                </div>
              </div>
            ))}
            {student.parents.length === 0 && (
              <p className="text-center text-muted-foreground py-4">
                Qarindoshlar ma'lumotlari topilmadi
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tabs: Grades, Attendance, Payments */}
      <Tabs defaultValue="grades" className="space-y-4">
        <TabsList>
          <TabsTrigger value="grades">Baholar ({student.grades.length})</TabsTrigger>
          <TabsTrigger value="attendance">Davomat ({student.attendances.length})</TabsTrigger>
          <TabsTrigger value="payments">To'lovlar ({student.payments.length})</TabsTrigger>
        </TabsList>

        {/* Grades Tab */}
        <TabsContent value="grades">
          <Card>
            <CardHeader>
              <CardTitle>So'nggi Baholar</CardTitle>
              <CardDescription>Oxirgi 10 ta baho</CardDescription>
            </CardHeader>
            <CardContent>
              {student.grades.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b">
                      <tr>
                        <th className="p-3 text-left text-sm font-medium">Fan</th>
                        <th className="p-3 text-left text-sm font-medium">Baho</th>
                        <th className="p-3 text-left text-sm font-medium">Turi</th>
                        <th className="p-3 text-left text-sm font-medium">Sana</th>
                        <th className="p-3 text-left text-sm font-medium">O'qituvchi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {student.grades.map((grade) => (
                        <tr key={grade.id}>
                          <td className="p-3">{grade.subject.name}</td>
                          <td className="p-3">
                            <span className="font-bold text-lg">{Number(grade.score)}</span>
                            <span className="text-muted-foreground">/{Number(grade.maxScore)}</span>
                          </td>
                          <td className="p-3">
                            <span className="text-xs bg-slate-100 px-2 py-1 rounded">
                              {grade.gradeType}
                            </span>
                          </td>
                          <td className="p-3 text-sm text-muted-foreground">
                            {new Date(grade.createdAt).toLocaleDateString('uz-UZ')}
                          </td>
                          <td className="p-3 text-sm">
                            {grade.teacher.user.fullName}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  Hozircha baholar yo'q
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Attendance Tab */}
        <TabsContent value="attendance">
          <Card>
            <CardHeader>
              <CardTitle>Davomat</CardTitle>
              <CardDescription>Oxirgi 20 kun</CardDescription>
            </CardHeader>
            <CardContent>
              {student.attendances.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b">
                      <tr>
                        <th className="p-3 text-left text-sm font-medium">Sana</th>
                        <th className="p-3 text-left text-sm font-medium">Fan</th>
                        <th className="p-3 text-left text-sm font-medium">Status</th>
                        <th className="p-3 text-left text-sm font-medium">Izoh</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {student.attendances.map((att) => (
                        <tr key={att.id}>
                          <td className="p-3 text-sm">
                            {new Date(att.date).toLocaleDateString('uz-UZ')}
                          </td>
                          <td className="p-3">{att.subject.name}</td>
                          <td className="p-3">
                            <span className={`font-semibold ${getAttendanceColor(att.status)}`}>
                              {att.status}
                            </span>
                          </td>
                          <td className="p-3 text-sm text-muted-foreground">
                            {att.notes || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  Hozircha davomat yo'q
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payments Tab */}
        <TabsContent value="payments">
          <div className="space-y-4">
            {/* Monthly Payment Progress */}
            {paymentSchedule.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Oylik To'lov Jadvali
                  </CardTitle>
                  <CardDescription>
                    Oylik to'lov: {student.monthlyTuitionFee ? formatNumber(Number(student.monthlyTuitionFee)) : '0'} so'm
                    {student.paymentDueDay && ` • Muddat: har oyning ${student.paymentDueDay}-sanasi`}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-3">
                    {paymentSchedule.map((schedule) => (
                      <MonthlyPaymentProgress
                        key={`${schedule.month}-${schedule.year}`}
                        month={schedule.month}
                        year={schedule.year}
                        monthlyTuitionFee={schedule.monthlyTuitionFee}
                        totalPaid={schedule.totalPaid}
                        remainingAmount={schedule.remainingAmount}
                        percentagePaid={schedule.percentagePaid}
                        isFullyPaid={schedule.isFullyPaid}
                        dueDate={schedule.dueDate}
                        paymentCount={schedule.paymentCount}
                        paymentId={schedule.paymentId}
                        studentId={student.id}
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Payment Summary */}
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">Jami</p>
                  <p className="text-2xl font-bold">{formatNumber(totalPayments)} so'm</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">To'langan</p>
                  <p className="text-2xl font-bold text-green-600">{formatNumber(paidPayments)} so'm</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">Qarzdorlik</p>
                  <p className="text-2xl font-bold text-orange-600">{formatNumber(pendingPayments)} so'm</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>To'lovlar Tarixi</CardTitle>
                <CardDescription>Oxirgi 10 ta to'lov</CardDescription>
              </CardHeader>
              <CardContent>
                {student.payments.length > 0 ? (
                  <div className="space-y-3">
                    {student.payments.map((payment) => (
                      <div key={payment.id} className="flex items-center justify-between p-3 rounded-lg border">
                        <div className="flex-1">
                          <p className="font-medium">{payment.paymentType}</p>
                          <p className="text-sm text-muted-foreground">
                            Invoice: {payment.invoiceNumber}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Muddat: {new Date(payment.dueDate).toLocaleDateString('uz-UZ')}
                            {payment.paidDate && ` • To'langan: ${new Date(payment.paidDate).toLocaleDateString('uz-UZ')}`}
                          </p>
                          {Number(payment.paidAmount || 0) > 0 && Number(payment.paidAmount) < Number(payment.amount) && (
                            <div className="mt-2 text-xs">
                              <div className="flex items-center gap-2">
                                <div className="w-full bg-gray-200 rounded-full h-2 max-w-[200px]">
                                  <div 
                                    className="bg-green-500 h-2 rounded-full" 
                                    style={{ width: `${(Number(payment.paidAmount) / Number(payment.amount)) * 100}%` }}
                                  />
                                </div>
                                <span className="text-muted-foreground whitespace-nowrap">
                                  {Math.round((Number(payment.paidAmount) / Number(payment.amount)) * 100)}%
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="text-right ml-4">
                          <div className="space-y-1">
                            {Number(payment.paidAmount || 0) > 0 && (
                              <p className="text-sm text-green-600 font-semibold">
                                To'langan: {formatNumber(Number(payment.paidAmount))} so'm
                              </p>
                            )}
                            <p className="font-bold text-lg">{formatNumber(Number(payment.amount))} so'm</p>
                            {Number(payment.remainingAmount || 0) > 0 && (
                              <p className="text-xs text-orange-600">
                                Qarz: {formatNumber(Number(payment.remainingAmount))} so'm
                              </p>
                            )}
                          </div>
                          <span className={`inline-block mt-2 text-xs px-2 py-1 rounded-full ${
                            payment.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                            payment.status === 'PENDING' ? 'bg-orange-100 text-orange-800' :
                            payment.status === 'PARTIALLY_PAID' ? 'bg-blue-100 text-blue-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {payment.status === 'PARTIALLY_PAID' ? 'QISMAN TO\'LANGAN' : payment.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    Hozircha to'lovlar yo'q
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
