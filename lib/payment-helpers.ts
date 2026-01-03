/**
 * Payment System Helpers
 * Advanced payment tracking and calculations
 */

import { db } from './db'
import { logger } from './logger'
import { Decimal } from '@prisma/client/runtime/library'

export interface MonthlyPaymentStatus {
  month: number
  year: number
  monthName: string
  requiredAmount: number
  paidAmount: number
  remainingDebt: number
  progress: number // 0-100
  status: 'NOT_DUE' | 'PENDING' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE'
  dueDate: Date
  payments: Array<{
    id: string
    amount: number
    status: string
    paidDate: Date | null
  }>
}

/**
 * Calculate monthly payment status for a student
 */
export async function calculateMonthlyPaymentStatus(
  studentId: string,
  tenantId: string,
  monthlyTuitionFee: Decimal,
  paymentDueDay: number = 5,
  months: number = 3 // Show current and next N months
): Promise<MonthlyPaymentStatus[]> {
  const today = new Date()
  const currentYear = today.getFullYear()
  const currentMonth = today.getMonth() + 1 // 1-12

  const results: MonthlyPaymentStatus[] = []
  const requiredAmount = Number(monthlyTuitionFee)

  for (let i = 0; i < months; i++) {
    let month = currentMonth + i
    let year = currentYear

    // Handle year overflow
    if (month > 12) {
      month = month - 12
      year++
    }

    // Get all payments for this month
    const payments = await db.payment.findMany({
      where: {
        studentId,
        tenantId,
        paymentType: 'TUITION',
        paymentMonth: month,
        paymentYear: year,
      },
      select: {
        id: true,
        amount: true,
        status: true,
        paidDate: true,
        dueDate: true,
      },
      orderBy: {
        createdAt: 'asc',
      }
    })

    // Calculate paid amount (only COMPLETED payments)
    const paidAmount = payments
      .filter(p => p.status === 'COMPLETED')
      .reduce((sum, p) => sum + Number(p.amount), 0)

    const remainingDebt = Math.max(0, requiredAmount - paidAmount)
    const progress = requiredAmount > 0 ? Math.min(100, (paidAmount / requiredAmount) * 100) : 0

    // Determine status
    const dueDate = new Date(year, month - 1, paymentDueDay)
    let status: MonthlyPaymentStatus['status'] = 'NOT_DUE'

    if (dueDate < today) {
      if (paidAmount >= requiredAmount) {
        status = 'PAID'
      } else if (paidAmount > 0) {
        status = 'OVERDUE' // Partially paid but overdue
      } else {
        status = 'OVERDUE'
      }
    } else {
      if (paidAmount >= requiredAmount) {
        status = 'PAID'
      } else if (paidAmount > 0) {
        status = 'PARTIALLY_PAID'
      } else {
        status = 'PENDING'
      }
    }

    results.push({
      month,
      year,
      monthName: getMonthName(month),
      requiredAmount,
      paidAmount,
      remainingDebt,
      progress: Math.round(progress),
      status,
      dueDate,
      payments: payments.map(p => ({
        id: p.id,
        amount: Number(p.amount),
        status: p.status,
        paidDate: p.paidDate,
      })),
    })
  }

  return results
}

/**
 * Auto-complete pending payments when 100% is reached
 */
export async function autoCompleteMonthlyPayments(
  studentId: string,
  tenantId: string,
  month: number,
  year: number,
  monthlyTuitionFee: Decimal
): Promise<number> {
  const start = Date.now()

  try {
    // Get all COMPLETED payments
    const completedPayments = await db.payment.findMany({
      where: {
        studentId,
        tenantId,
        paymentType: 'TUITION',
        paymentMonth: month,
        paymentYear: year,
        status: 'COMPLETED',
      },
      select: {
        amount: true,
      }
    })

    const totalPaid = completedPayments.reduce((sum, p) => sum + Number(p.amount), 0)
    const requiredAmount = Number(monthlyTuitionFee)

    // If 100% paid, auto-complete pending payments
    if (totalPaid >= requiredAmount) {
      const result = await db.payment.updateMany({
        where: {
          studentId,
          tenantId,
          paymentType: 'TUITION',
          paymentMonth: month,
          paymentYear: year,
          status: 'PENDING',
        },
        data: {
          status: 'COMPLETED',
          paidDate: new Date(),
        },
      })

      const duration = Date.now() - start
      logger.info(
        `Auto-completed ${result.count} pending payments (100% paid)`,
        {
          studentId,
          tenantId,
          month,
          year,
          duration,
          action: 'AUTO_COMPLETE_PAYMENTS',
          metadata: { totalPaid, requiredAmount },
        }
      )

      return result.count
    }

    return 0
  } catch (error) {
    logger.error('Failed to auto-complete payments', error, {
      studentId,
      tenantId,
      month,
      year,
    })
    throw error
  }
}

/**
 * Get payment summary for dashboard
 */
export async function getPaymentSummary(
  tenantId: string,
  startDate: Date,
  endDate: Date
) {
  const [completed, pending, overdue] = await Promise.all([
    // Completed payments
    db.payment.aggregate({
      where: {
        tenantId,
        status: 'COMPLETED',
        paidDate: {
          gte: startDate,
          lte: endDate,
        }
      },
      _sum: { amount: true },
      _count: true,
    }),

    // Pending payments (current month)
    db.payment.aggregate({
      where: {
        tenantId,
        status: 'PENDING',
        paymentMonth: startDate.getMonth() + 1,
        paymentYear: startDate.getFullYear(),
      },
      _sum: { amount: true },
      _count: true,
    }),

    // Overdue payments
    db.payment.aggregate({
      where: {
        tenantId,
        status: 'PENDING',
        dueDate: {
          lt: new Date(),
        }
      },
      _sum: { amount: true },
      _count: true,
    }),
  ])

  return {
    completed: {
      amount: Number(completed._sum.amount || 0),
      count: completed._count,
    },
    pending: {
      amount: Number(pending._sum.amount || 0),
      count: pending._count,
    },
    overdue: {
      amount: Number(overdue._sum.amount || 0),
      count: overdue._count,
    },
  }
}

/**
 * Get month name in Uzbek
 */
function getMonthName(month: number): string {
  const months = [
    'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun',
    'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'
  ]
  return months[month - 1] || 'Noma\'lum'
}

/**
 * Create monthly payment schedules for a student
 */
export async function createMonthlyPaymentSchedule(
  studentId: string,
  tenantId: string,
  monthlyTuitionFee: Decimal,
  paymentDueDay: number = 5,
  startMonth?: Date,
  monthsCount: number = 1
): Promise<void> {
  const start = startMonth || new Date()
  const invoicePrefix = `INV-${Date.now()}`

  const payments = []
  for (let i = 0; i < monthsCount; i++) {
    const month = start.getMonth() + 1 + i
    const year = start.getFullYear() + Math.floor((start.getMonth() + i) / 12)
    const adjustedMonth = ((month - 1) % 12) + 1

    const dueDate = new Date(year, adjustedMonth - 1, paymentDueDay)

    payments.push({
      tenantId,
      studentId,
      amount: monthlyTuitionFee,
      paymentType: 'TUITION',
      paymentMonth: adjustedMonth,
      paymentYear: year,
      status: 'PENDING',
      dueDate,
      invoiceNumber: `${invoicePrefix}-${i + 1}`,
      paymentMethod: 'CASH',
    })
  }

  await db.payment.createMany({
    data: payments as any,
  })

  logger.info(`Created ${monthsCount} monthly payment schedules`, {
    studentId,
    tenantId,
    action: 'CREATE_PAYMENT_SCHEDULE',
    metadata: { monthsCount, monthlyTuitionFee: Number(monthlyTuitionFee) },
  })
}

