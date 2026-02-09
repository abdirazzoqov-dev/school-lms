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

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = session.user.tenantId!
    const studentId = params.id
    const searchParams = req.nextUrl.searchParams
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString())

    // Verify student belongs to tenant
    const student = await db.student.findFirst({
      where: { id: studentId, tenantId }
    })

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    // Generate 12 months status
    const monthlyStatuses = []
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    for (let month = 1; month <= 12; month++) {
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

        // Determine status
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
          status
        })
      }
    }

    return NextResponse.json({
      success: true,
      monthlyStatuses
    })
  } catch (error: any) {
    console.error('Error fetching payment overview:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

