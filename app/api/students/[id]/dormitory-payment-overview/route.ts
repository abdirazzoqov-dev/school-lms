import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { getMonthNameUz } from '@/lib/utils/payment-helper'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'MODERATOR')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = session.user.tenantId!
    const studentId = params.id
    const searchParams = req.nextUrl.searchParams
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString())

    // Verify student belongs to tenant and has a dormitory assignment
    const student = await db.student.findFirst({
      where: { id: studentId, tenantId },
      select: {
        id: true,
        paymentDueDay: true,
        dormitoryAssignment: {
          select: {
            monthlyFee: true,
            checkInDate: true,
            status: true,
            room: {
              select: { roomNumber: true, building: { select: { name: true } } }
            },
            bed: { select: { bedNumber: true } }
          }
        }
      }
    })

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    if (!student.dormitoryAssignment) {
      return NextResponse.json({ error: 'No dormitory assignment' }, { status: 404 })
    }

    const monthlyFee = Number(student.dormitoryAssignment.monthlyFee)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const monthlyStatuses = []

    for (let month = 1; month <= 12; month++) {
      // Fetch all DORMITORY payments for this student in this month/year
      const payments = await db.payment.findMany({
        where: {
          studentId,
          tenantId,
          paymentType: 'DORMITORY',
          OR: [
            { paymentMonth: month, paymentYear: year },
            {
              paymentMonth: null,
              paidDate: {
                gte: new Date(year, month - 1, 1),
                lt: new Date(year, month, 1),
              }
            }
          ]
        },
        select: {
          id: true,
          amount: true,
          paidAmount: true,
          status: true,
          paymentMonth: true,
          paymentYear: true,
        }
      })

      // Filter by month/year for those without paymentMonth
      const filteredPayments = payments.filter(p => {
        if (p.paymentMonth !== null && p.paymentYear !== null) return true
        return false
      })

      const totalPaid = filteredPayments.reduce((sum, p) => {
        const paid = p.status === 'COMPLETED' && !p.paidAmount
          ? Number(p.amount)
          : Number(p.paidAmount || 0)
        return sum + paid
      }, 0)

      const requiredAmount = monthlyFee
      const remainingAmount = Math.max(0, requiredAmount - totalPaid)
      const percentagePaid = requiredAmount > 0
        ? Math.round((totalPaid / requiredAmount) * 100)
        : 0
      const isFullyPaid = totalPaid >= requiredAmount

      const dueDate = new Date(year, month - 1, student.paymentDueDay || 5)
      const isOverdue = today > dueDate && !isFullyPaid
      const isPending = !isFullyPaid && !isOverdue

      let status: 'completed' | 'partially_paid' | 'pending' | 'overdue' | 'not_due' = 'not_due'
      if (isFullyPaid) {
        status = 'completed'
      } else if (isOverdue) {
        status = 'overdue'
      } else if (totalPaid > 0) {
        status = 'partially_paid'
      } else if (isPending) {
        status = 'pending'
      }

      const primaryPayment = filteredPayments.find(
        p => p.status === 'PENDING' || p.status === 'PARTIALLY_PAID'
      )

      monthlyStatuses.push({
        month,
        year,
        monthName: getMonthNameUz(month),
        totalPaid,
        requiredAmount,
        remainingAmount,
        percentagePaid,
        isFullyPaid,
        isPending,
        isOverdue,
        hasPayment: filteredPayments.length > 0,
        paymentId: primaryPayment?.id ?? null,
        status,
      })
    }

    return NextResponse.json({ success: true, monthlyStatuses })
  } catch (error: any) {
    console.error('Error fetching dormitory payment overview:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
