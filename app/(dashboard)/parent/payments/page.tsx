import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { DollarSign, CreditCard, Clock, CheckCircle2, XCircle } from 'lucide-react'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import Link from 'next/link'

export default async function ParentPaymentsPage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'PARENT') {
    redirect('/unauthorized')
  }

  const tenantId = session.user.tenantId!

  // Get parent
  const parent = await db.parent.findFirst({
    where: { userId: session.user.id },
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
              }
            }
          }
        }
      }
    }
  })

  if (!parent || parent.students.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">To'lovlar</h1>
          <p className="text-muted-foreground">
            To'lovlar tarixi va holati
          </p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <DollarSign className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Farzandlar topilmadi</h3>
              <p className="text-muted-foreground">
                Sizning profilingizga farzandlar biriktirilmagan
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const children = parent.students.map(sp => sp.student)
  const childrenIds = children.map(c => c.id)

  // Get all payments for children
  const payments = await db.payment.findMany({
    where: {
      tenantId,
      studentId: { in: childrenIds }
    },
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
      }
    },
    orderBy: {
      createdAt: 'desc'  // Fixed: paymentDate doesn't exist in Payment model
    }
  })

  // Calculate statistics
  const totalPaid = payments
    .filter(p => p.status === 'COMPLETED')
    .reduce((sum, p) => sum + Number(p.amount), 0)

  const totalPending = payments
    .filter(p => p.status === 'PENDING')
    .reduce((sum, p) => sum + Number(p.amount), 0)

  const totalOverdue = payments
    .filter(p => p.status === 'PENDING' && p.dueDate < new Date())
    .reduce((sum, p) => sum + Number(p.amount), 0)

  const totalAmount = payments.reduce((sum, p) => sum + Number(p.amount), 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">To'lovlar</h1>
        <p className="text-muted-foreground">
          Farzandlarim uchun to'lovlar tarixi va holati
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{formatCurrency(totalPaid)}</div>
                <p className="text-sm text-muted-foreground">To'langan</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{formatCurrency(totalPending)}</div>
                <p className="text-sm text-muted-foreground">Kutilmoqda</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-red-100 rounded-lg">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{formatCurrency(totalOverdue)}</div>
                <p className="text-sm text-muted-foreground">Muddati o'tgan</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{formatCurrency(totalAmount)}</div>
                <p className="text-sm text-muted-foreground">Jami</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Children Cards */}
      <div className="grid gap-6 md:grid-cols-1">
        {children.map((child) => {
          const childPayments = payments.filter(p => p.studentId === child.id)
          
          return (
            <Card key={child.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{child.user?.fullName || 'O\'quvchi'}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {child.class?.name || 'Sinfga biriktirilmagan'}
                    </p>
                  </div>
                  <Badge variant="outline">
                    {childPayments.length} ta to'lov
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {childPayments.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    To'lovlar tarixi yo'q
                  </div>
                ) : (
                  <div className="rounded-md border overflow-x-auto">
                    <table className="w-full">
                      <thead className="border-b bg-muted/50">
                        <tr>
                          <th className="p-3 text-left text-sm font-medium">Hisob raqami</th>
                          <th className="p-3 text-left text-sm font-medium">Turi</th>
                          <th className="p-3 text-left text-sm font-medium">Summa</th>
                          <th className="p-3 text-left text-sm font-medium">Sana</th>
                          <th className="p-3 text-left text-sm font-medium">Holat</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {childPayments.map((payment) => (
                          <tr key={payment.id} className="hover:bg-muted/50">
                            <td className="p-3">
                              <span className="font-mono text-sm">{payment.invoiceNumber}</span>
                            </td>
                            <td className="p-3">
                              <Badge variant="outline">
                                {payment.paymentType === 'TUITION' && 'O\'quv to\'lovi'}
                                {payment.paymentType === 'BOOKS' && 'Kitoblar'}
                                {payment.paymentType === 'UNIFORM' && 'Forma'}
                                {payment.paymentType === 'OTHER' && 'Boshqa'}
                              </Badge>
                            </td>
                            <td className="p-3 font-semibold">
                              {formatCurrency(Number(payment.amount))}
                            </td>
                            <td className="p-3 text-sm text-muted-foreground">
                              {payment.paidDate ? formatDateTime(payment.paidDate) : 'To\'lanmagan'}
                            </td>
                            <td className="p-3">
                              {payment.status === 'COMPLETED' && (
                                <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                                  To'langan
                                </Badge>
                              )}
                              {payment.status === 'PENDING' && (
                                <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
                                  {payment.dueDate < new Date() ? 'Muddati o\'tgan' : 'Kutilmoqda'}
                                </Badge>
                              )}
                              {payment.status === 'FAILED' && (
                                <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
                                  Muvaffaqiyatsiz
                                </Badge>
                              )}
                              {payment.status === 'REFUNDED' && (
                                <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">
                                  Qaytarilgan
                                </Badge>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Info Card */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <CreditCard className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-900 mb-1">
                To'lovlar haqida
              </h3>
              <p className="text-sm text-blue-800">
                Bu yerda farzandlaringiz uchun qilingan barcha to'lovlarni ko'rishingiz mumkin.
                To'lovlar tarixi, holati va summasi haqida to'liq ma'lumot berilgan.
                Muddati o'tgan to'lovlar mavjud bo'lsa, ularni tez orada to'lashingiz tavsiya etiladi.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
