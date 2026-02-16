import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { ParentPaymentsView } from './parent-payments-view'

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
                  fullName: true,
                  avatar: true
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
                },
                include: {
                  transactions: {
                    orderBy: {
                      transactionDate: 'desc'
                    },
                    include: {
                      receivedBy: {
                        select: {
                          fullName: true
                        }
                      }
                    }
                  }
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

  const children = parent.students.map(c => c.student)

  // Convert Decimal to number for client component
  const studentsData = children.map(child => ({
    ...child,
    payments: child.payments.map(payment => ({
      ...payment,
      amount: Number(payment.amount),
      paidAmount: payment.paidAmount ? Number(payment.paidAmount) : null,
      remainingAmount: payment.remainingAmount ? Number(payment.remainingAmount) : null,
      transactions: payment.transactions.map(t => ({
        ...t,
        amount: Number(t.amount)
      }))
    }))
  }))

  return <ParentPaymentsView students={studentsData} selectedChildId={searchParams.childId} />
}
