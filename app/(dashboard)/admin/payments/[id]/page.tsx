import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, DollarSign, Edit, UserCircle, Calendar, FileText, CheckCircle2, Clock, XCircle, Receipt } from 'lucide-react'
import Link from 'next/link'
import { formatNumber } from '@/lib/utils'
import { PaymentPDFButton } from '@/components/payment-pdf-button'
import { Badge } from '@/components/ui/badge'

// Optimized caching: Cache for 30 seconds for detail pages ⚡
export const revalidate = 30
export const dynamic = 'auto' // Allows Next.js to optimize route caching

export default async function PaymentDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'ADMIN') {
    redirect('/unauthorized')
  }

  const tenantId = session.user.tenantId!

  const [payment, tenant] = await Promise.all([
    db.payment.findFirst({
      where: { id: params.id, tenantId },
      include: {
        student: {
          include: {
            user: {
              select: {
                fullName: true,
              }
            },
            class: {
              select: {
                name: true
              }
            }
          }
        },
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
        },
        receivedBy: {
          select: {
            fullName: true,
            email: true,
          }
        },
        transactions: {
          orderBy: {
            transactionDate: 'desc'
          },
          include: {
            receivedBy: {
              select: {
                fullName: true,
                email: true
              }
            }
          }
        }
      }
    }),
    db.tenant.findUnique({
      where: { id: tenantId },
      select: {
        name: true,
        address: true,
        phone: true,
      }
    })
  ])

  if (!payment) {
    redirect('/admin/payments')
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle2 className="h-6 w-6 text-green-600" />
      case 'PENDING':
        return <Clock className="h-6 w-6 text-orange-600" />
      case 'FAILED':
        return <XCircle className="h-6 w-6 text-red-600" />
      default:
        return null
    }
  }

  const getStatusColor = (status: string) => {
    const colors = {
      COMPLETED: 'bg-green-100 text-green-800 border-green-200',
      PENDING: 'bg-orange-100 text-orange-800 border-orange-200',
      FAILED: 'bg-red-100 text-red-800 border-red-200',
      REFUNDED: 'bg-gray-100 text-gray-800 border-gray-200'
    }
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const isOverdue = payment.status === 'PENDING' && payment.dueDate < new Date()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/payments">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h2 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              <DollarSign className="h-8 w-8" />
              To'lov Tafsilotlari
            </h2>
            <p className="text-muted-foreground">Invoice: {payment.invoiceNumber}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <PaymentPDFButton 
            payment={{
              ...payment,
              amount: Number(payment.amount),
              paidAmount: payment.paidAmount ? Number(payment.paidAmount) : null,
              remainingAmount: payment.remainingAmount ? Number(payment.remainingAmount) : null,
              student: {
                ...payment.student,
                user: payment.student.user || undefined,
                class: payment.student.class || undefined,
              },
              parent: payment.parent ? {
                ...payment.parent,
                user: payment.parent.user || undefined
              } : undefined,
              receivedBy: payment.receivedBy ? {
                fullName: payment.receivedBy.fullName
              } : undefined
            }}
            schoolName={tenant?.name || 'Maktab'}
            schoolAddress={tenant?.address}
            schoolPhone={tenant?.phone}
          />
          {payment.status !== 'COMPLETED' && (
            <Link href={`/admin/payments/${payment.id}/edit`}>
              <Button>
                <Edit className="mr-2 h-4 w-4" />
                Tahrirlash
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Status Card */}
      <Card className={`border-2 ${getStatusColor(payment.status)}`}>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getStatusIcon(payment.status)}
              <div>
                <p className="text-sm font-medium">Status</p>
                <p className="text-2xl font-bold">{payment.status}</p>
                {isOverdue && (
                  <p className="text-sm text-red-600 font-medium">Muddati o'tgan</p>
                )}
              </div>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold">{formatNumber(Number(payment.amount))} so'm</p>
              <p className="text-sm text-muted-foreground">{payment.paymentType}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Payment Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              To'lov Ma'lumotlari
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Invoice Raqami</p>
              <p className="font-mono font-bold text-lg">{payment.invoiceNumber}</p>
            </div>
            {payment.receiptNumber && (
              <div>
                <p className="text-sm text-muted-foreground">Chek Raqami</p>
                <p className="font-mono font-medium">{payment.receiptNumber}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-muted-foreground">To'lov Maqsadi</p>
              <Badge variant="outline" className="font-medium text-base">
                {payment.paymentType === 'TUITION' && "O'qish haqi"}
                {payment.paymentType === 'BOOKS' && 'Kitoblar'}
                {payment.paymentType === 'UNIFORM' && 'Forma'}
                {payment.paymentType === 'OTHER' && 'Boshqa'}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">To'lov Usuli</p>
              <Badge className="font-medium">
                {payment.paymentMethod === 'CASH' && '💵 Naqd pul'}
                {payment.paymentMethod === 'CLICK' && '💳 Click'}
                {payment.paymentMethod === 'PAYME' && '💳 Payme'}
                {payment.paymentMethod === 'UZUM' && '💳 Uzum'}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Summa</p>
              <p className="font-bold text-2xl text-blue-600">
                {formatNumber(Number(payment.amount))} so'm
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Dates */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Sanalar
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Yaratilgan</p>
              <p className="font-medium">
                {new Date(payment.createdAt).toLocaleDateString('uz-UZ', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Muddat</p>
              <p className={`font-medium ${isOverdue ? 'text-red-600 font-bold' : ''}`}>
                {new Date(payment.dueDate).toLocaleDateString('uz-UZ')}
                {isOverdue && ' (O\'tib ketgan)'}
              </p>
            </div>
            {payment.paidDate && (
              <div>
                <p className="text-sm text-muted-foreground">To'langan Sana</p>
                <p className="font-medium text-green-600 font-bold text-lg">
                  ✅ {new Date(payment.paidDate).toLocaleDateString('uz-UZ', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            )}
            {!payment.paidDate && payment.status === 'PENDING' && (
              <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg mt-2">
                <p className="text-sm font-medium text-orange-800">
                  ⏳ To'lov kutilmoqda
                </p>
              </div>
            )}
            {payment.notes && (
              <div>
                <p className="text-sm text-muted-foreground">Izoh</p>
                <p className="font-medium">{payment.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Student Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCircle className="h-5 w-5" />
            O'quvchi Ma'lumotlari
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Link href={`/admin/students/${payment.student.id}`}>
            <div className="flex items-center justify-between p-4 rounded-lg border hover:border-primary transition-colors">
              <div>
                <p className="font-bold text-lg">{payment.student.user?.fullName}</p>
                <p className="text-sm text-muted-foreground">Kod: {payment.student.studentCode}</p>
                {payment.student.class && (
                  <p className="text-sm text-muted-foreground">Sinf: {payment.student.class.name}</p>
                )}
              </div>
              <Button variant="outline" size="sm">Ko'rish</Button>
            </div>
          </Link>
        </CardContent>
      </Card>

      {/* Parent Information */}
      {payment.parent && (
        <Card>
          <CardHeader>
            <CardTitle>Ota-ona Ma'lumotlari</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-4 rounded-lg border">
              <p className="font-bold text-lg">{payment.parent.user.fullName}</p>
              <p className="text-sm text-muted-foreground">{payment.parent.user.email}</p>
              {payment.parent.user.phone && (
                <p className="text-sm text-muted-foreground">{payment.parent.user.phone}</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Received By */}
      {payment.receivedBy && (
        <Card>
          <CardHeader>
            <CardTitle>Qabul Qildi</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-4 rounded-lg border">
              <p className="font-bold">{payment.receivedBy.fullName}</p>
              <p className="text-sm text-muted-foreground">{payment.receivedBy.email}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment Transactions History */}
      {payment.transactions && payment.transactions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              To'lovlar Tarixi ({payment.transactions.length} ta)
            </CardTitle>
            <CardDescription>
              Barcha bo'lib-bo'lib to'langan to'lovlar ro'yxati
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {payment.transactions.map((transaction, index) => (
                <div 
                  key={transaction.id} 
                  className="p-4 rounded-lg border bg-gradient-to-r from-green-50 to-emerald-50 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Badge className="bg-green-600 text-white">
                          #{index + 1}
                        </Badge>
                        <p className="font-bold text-xl text-green-700">
                          {formatNumber(Number(transaction.amount))} so'm
                        </p>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                        <div>
                          <p className="text-muted-foreground">Sana</p>
                          <p className="font-medium">
                            {new Date(transaction.transactionDate).toLocaleDateString('uz-UZ', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                        
                        <div>
                          <p className="text-muted-foreground">To'lov usuli</p>
                          <Badge variant="outline" className="font-medium">
                            {transaction.paymentMethod === 'CASH' && '💵 Naqd'}
                            {transaction.paymentMethod === 'CLICK' && '💳 Click'}
                            {transaction.paymentMethod === 'PAYME' && '💳 Payme'}
                            {transaction.paymentMethod === 'UZUM' && '💳 Uzum'}
                          </Badge>
                        </div>
                        
                        {transaction.receivedBy && (
                          <div>
                            <p className="text-muted-foreground">Qabul qildi</p>
                            <p className="font-medium">{transaction.receivedBy.fullName}</p>
                          </div>
                        )}
                        
                        {transaction.receiptNumber && (
                          <div>
                            <p className="text-muted-foreground">Chek raqami</p>
                            <p className="font-mono text-sm">{transaction.receiptNumber}</p>
                          </div>
                        )}
                      </div>
                      
                      {transaction.notes && (
                        <div className="mt-3 p-3 bg-white rounded-md border">
                          <p className="text-xs text-muted-foreground mb-1">Izoh:</p>
                          <p className="text-sm font-medium">{transaction.notes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Summary */}
            <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border-2 border-blue-200">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Jami to'langan</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatNumber(Number(payment.paidAmount || 0))} so'm
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Qoldiq</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {formatNumber(Number(payment.remainingAmount || 0))} so'm
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
