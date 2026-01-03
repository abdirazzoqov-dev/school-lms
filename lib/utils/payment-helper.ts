/**
 * Payment Helper Functions
 * O'quvchilarning oylik to'lovlarini hisoblash va kuzatish uchun
 */

import { db } from '@/lib/db'
import { Decimal } from '@prisma/client/runtime/library'

/**
 * O'quvchining ma'lum bir oy uchun to'lovlarini hisoblash
 */
export async function calculateMonthlyPaymentProgress(
  studentId: string,
  tenantId: string,
  month: number,
  year: number
) {
  // Student va uning oylik to'lovini olish
  const student = await db.student.findFirst({
    where: { id: studentId, tenantId },
    select: {
      monthlyTuitionFee: true,
      paymentDueDay: true,
      user: {
        select: {
          fullName: true
        }
      }
    }
  })

  if (!student || !student.monthlyTuitionFee) {
    return null
  }

  // Shu oy uchun barcha TUITION to'lovlarini olish
  const payments = await db.payment.findMany({
    where: {
      studentId,
      tenantId,
      paymentType: 'TUITION',
      paymentMonth: month,
      paymentYear: year,
      status: 'COMPLETED',
    },
    select: {
      id: true,
      amount: true,
      paidDate: true,
      status: true
    }
  })

  // Jami to'langan summa
  const totalPaid = payments.reduce((sum, payment) => {
    return sum + Number(payment.amount)
  }, 0)

  const requiredAmount = Number(student.monthlyTuitionFee)
  const remainingAmount = Math.max(0, requiredAmount - totalPaid)
  const percentagePaid = requiredAmount > 0 ? (totalPaid / requiredAmount) * 100 : 0
  const isFullyPaid = totalPaid >= requiredAmount

  // To'lov muddati (paymentDueDay)
  const dueDay = student.paymentDueDay || 5
  const dueDate = new Date(year, month - 1, dueDay) // month - 1 chunki JS'da oylar 0'dan boshlanadi

  return {
    studentName: student.user?.fullName || 'Noma\'lum',
    monthlyTuitionFee: requiredAmount,
    totalPaid,
    remainingAmount,
    percentagePaid: Math.round(percentagePaid),
    isFullyPaid,
    dueDate,
    dueDay,
    paymentCount: payments.length,
    payments
  }
}

/**
 * O'quvchi uchun keyingi 3 oyning to'lov holatini ko'rsatish
 */
export async function getUpcomingPaymentSchedule(
  studentId: string,
  tenantId: string
) {
  const student = await db.student.findFirst({
    where: { id: studentId, tenantId },
    select: {
      monthlyTuitionFee: true,
      paymentDueDay: true,
      user: {
        select: {
          fullName: true
        }
      }
    }
  })

  if (!student || !student.monthlyTuitionFee) {
    return []
  }

  const schedule = []
  const currentDate = new Date()
  
  // Keyingi 3 oy uchun
  for (let i = 0; i < 3; i++) {
    const targetDate = new Date(currentDate)
    targetDate.setMonth(targetDate.getMonth() + i)
    
    const month = targetDate.getMonth() + 1
    const year = targetDate.getFullYear()
    
    const progress = await calculateMonthlyPaymentProgress(
      studentId,
      tenantId,
      month,
      year
    )
    
    if (progress) {
      schedule.push({
        month,
        year,
        monthName: targetDate.toLocaleString('uz-UZ', { month: 'long' }),
        ...progress
      })
    }
  }

  return schedule
}

/**
 * Barcha o'quvchilar uchun joriy oyning to'lov holatini olish
 */
export async function getAllStudentsCurrentMonthStatus(tenantId: string) {
  const currentDate = new Date()
  const month = currentDate.getMonth() + 1
  const year = currentDate.getFullYear()

  // Oylik to'lovi bo'lgan barcha aktiv o'quvchilar
  const students = await db.student.findMany({
    where: {
      tenantId,
      status: 'ACTIVE',
      monthlyTuitionFee: {
        not: null
      }
    },
    select: {
      id: true,
      studentCode: true,
      monthlyTuitionFee: true,
      paymentDueDay: true,
      user: {
        select: {
          fullName: true
        }
      }
    }
  })

  const results = []

  for (const student of students) {
    const progress = await calculateMonthlyPaymentProgress(
      student.id,
      tenantId,
      month,
      year
    )

    if (progress) {
      results.push({
        studentId: student.id,
        studentCode: student.studentCode,
        studentName: student.user?.fullName || 'Noma\'lum',
        ...progress
      })
    }
  }

  return results
}

/**
 * Format money (so'm)
 */
export function formatMoney(amount: number): string {
  return new Intl.NumberFormat('uz-UZ').format(amount)
}

/**
 * Get month name in Uzbek
 */
export function getMonthNameUz(month: number): string {
  const months = [
    'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun',
    'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'
  ]
  return months[month - 1] || ''
}

/**
 * Check if payment is overdue
 */
export function isPaymentOverdue(dueDate: Date): boolean {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return dueDate < today
}

