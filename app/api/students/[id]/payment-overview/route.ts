import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { calculateMonthlyPaymentProgress } from '@/lib/utils/payment-helper'

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

    // Fetch student with enrollment date
    const student = await db.student.findFirst({
      where: { id: studentId, tenantId },
      select: {
        enrollmentDate: true,
        paymentDueDay: true,
      }
    })

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    // Fetch payment leave months for this student & year
    const leaveRecords = await db.studentPaymentLeave.findMany({
      where: { studentId, year },
      select: { month: true, reason: true }
    })
    const leaveMap = new Map(leaveRecords.map(l => [l.month, l.reason]))

    const enrollmentDate = new Date(student.enrollmentDate)
    enrollmentDate.setHours(0, 0, 0, 0)

    const monthlyStatuses = []
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    for (let month = 1; month <= 12; month++) {
      // Check if month is before enrollment
      const monthStart = new Date(year, month - 1, 1)
      const isBeforeEnrollment =
        monthStart < new Date(enrollmentDate.getFullYear(), enrollmentDate.getMonth(), 1)

      if (isBeforeEnrollment) {
        monthlyStatuses.push({
          month,
          year,
          monthName: new Date(year, month - 1).toLocaleString('uz-UZ', { month: 'long' }),
          totalPaid: 0,
          requiredAmount: 0,
          percentagePaid: 0,
          isFullyPaid: false,
          isPending: false,
          isOverdue: false,
          hasPayment: false,
          paymentId: null,
          status: 'not_due' as const,
          isNotApplicable: true,
          isLeave: false,
          leaveReason: null,
        })
        continue
      }

      // Check if month is a leave month
      if (leaveMap.has(month)) {
        monthlyStatuses.push({
          month,
          year,
          monthName: new Date(year, month - 1).toLocaleString('uz-UZ', { month: 'long' }),
          totalPaid: 0,
          requiredAmount: 0,
          percentagePaid: 0,
          isFullyPaid: false,
          isPending: false,
          isOverdue: false,
          hasPayment: false,
          paymentId: null,
          status: 'not_due' as const,
          isNotApplicable: false,
          isLeave: true,
          leaveReason: leaveMap.get(month) ?? null,
        })
        continue
      }

      const progress = await calculateMonthlyPaymentProgress(
        studentId,
        tenantId,
        month,
        year
      )

      if (progress) {
        const dueDate = new Date(year, month - 1, student.paymentDueDay || 5)
        const isOverdue = today > dueDate && !progress.isFullyPaid
        const isPending = !progress.isFullyPaid && !isOverdue

        let status: 'completed' | 'partially_paid' | 'pending' | 'overdue' | 'not_due' = 'not_due'
        if (progress.isFullyPaid) {
          status = 'completed'
        } else if (isOverdue) {
          status = 'overdue'
        } else if (progress.totalPaid > 0) {
          status = 'partially_paid'
        } else if (isPending) {
          status = 'pending'
        }

        monthlyStatuses.push({
          month,
          year,
          monthName: new Date(year, month - 1).toLocaleString('uz-UZ', { month: 'long' }),
          totalPaid: progress.totalPaid,
          requiredAmount: progress.monthlyTuitionFee,
          percentagePaid: progress.percentagePaid,
          isFullyPaid: progress.isFullyPaid,
          isPending,
          isOverdue,
          hasPayment: progress.paymentCount > 0,
          paymentId: progress.paymentId,
          status,
          isNotApplicable: false,
          isLeave: false,
          leaveReason: null,
        })
      }
    }

    return NextResponse.json({
      success: true,
      monthlyStatuses,
      enrollmentDate: student.enrollmentDate,
    })
  } catch (error: any) {
    console.error('Error fetching payment overview:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
