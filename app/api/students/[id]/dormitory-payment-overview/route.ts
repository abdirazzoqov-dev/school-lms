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

    const student = await db.student.findFirst({
      where: { id: studentId, tenantId },
      select: {
        id: true,
        paymentDueDay: true,
        dormitoryAssignment: {
          select: {
            id: true,
            monthlyFee: true,
            checkInDate: true,
            checkOutDate: true,
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

    const assignment = student.dormitoryAssignment
    const monthlyFee = Number(assignment.monthlyFee)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Parse checkIn / checkOut dates — normalise to start of month
    const checkIn = new Date(assignment.checkInDate)
    const checkInYear = checkIn.getFullYear()
    const checkInMonth = checkIn.getMonth() + 1 // 1-indexed

    const checkOut = assignment.checkOutDate ? new Date(assignment.checkOutDate) : null
    const checkOutYear = checkOut ? checkOut.getFullYear() : null
    const checkOutMonth = checkOut ? checkOut.getMonth() + 1 : null

    // Fetch leave months for this student in this year
    const leaveRecords = await db.dormitoryLeave.findMany({
      where: { studentId, tenantId, year },
      select: { month: true, reason: true }
    })
    const leaveMonthSet = new Set(leaveRecords.map(l => l.month))
    const leaveReasonMap: Record<number, string | null> = {}
    for (const l of leaveRecords) leaveReasonMap[l.month] = l.reason ?? null

    const monthlyStatuses = []

    for (let month = 1; month <= 12; month++) {
      // ── 1. Months BEFORE checkIn: not applicable ──────────────────────────
      const isBeforeCheckIn =
        year < checkInYear ||
        (year === checkInYear && month < checkInMonth)

      // ── 2. Months AFTER checkOut (if student left): not applicable ─────────
      const isAfterCheckOut =
        checkOut !== null && checkOutYear !== null && checkOutMonth !== null &&
        (year > checkOutYear || (year === checkOutYear && month > checkOutMonth))

      // ── 3. Leave month: student temporarily away ───────────────────────────
      const isLeaveMonth = leaveMonthSet.has(month)

      if (isBeforeCheckIn || isAfterCheckOut) {
        monthlyStatuses.push({
          month,
          year,
          monthName: getMonthNameUz(month),
          totalPaid: 0,
          requiredAmount: 0,
          remainingAmount: 0,
          percentagePaid: 0,
          isFullyPaid: false,
          isPending: false,
          isOverdue: false,
          hasPayment: false,
          paymentId: null,
          status: 'not_due' as const,
          isLeave: false,
          leaveReason: null,
          isNotApplicable: true, // before enrollment or after checkout
        })
        continue
      }

      if (isLeaveMonth) {
        monthlyStatuses.push({
          month,
          year,
          monthName: getMonthNameUz(month),
          totalPaid: 0,
          requiredAmount: 0,
          remainingAmount: 0,
          percentagePaid: 0,
          isFullyPaid: false,
          isPending: false,
          isOverdue: false,
          hasPayment: false,
          paymentId: null,
          status: 'not_due' as const,
          isLeave: true,
          leaveReason: leaveReasonMap[month] ?? null,
          isNotApplicable: false,
        })
        continue
      }

      // ── 4. Normal month — fetch payments ───────────────────────────────────
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

      const filteredPayments = payments.filter(p =>
        p.paymentMonth !== null && p.paymentYear !== null
      )

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
        isLeave: false,
        leaveReason: null,
        isNotApplicable: false,
      })
    }

    return NextResponse.json({ success: true, monthlyStatuses })
  } catch (error: any) {
    console.error('Error fetching dormitory payment overview:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
