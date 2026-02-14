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

  // Shu oy uchun barcha TUITION to'lovlarini olish (qisman to'lovlar ham)
  // paymentMonth/Year bo'lmasa, paidDate dan filtrlash
  const allPayments = await db.payment.findMany({
    where: {
      studentId,
      tenantId,
      paymentType: 'TUITION',
      OR: [
        {
          paymentMonth: month,
          paymentYear: year,
        },
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
      remainingAmount: true,
      paidDate: true,
      status: true,
      paymentMonth: true,
      paymentYear: true,
      tuitionFeeAtPayment: true, // ✅ Snapshot field
      discountAmount: true,      // ✅ Chegirma summasi
      discountPercentage: true,  // ✅ Chegirma foizi
      originalAmount: true       // ✅ Chegirmadan oldingi asl summa
    }
  })

  // Filter by month/year from paidDate if paymentMonth is null
  const payments = allPayments.filter(payment => {
    if (payment.paymentMonth !== null && payment.paymentYear !== null) {
      return true // Already matched by query
    }
    if (payment.paidDate) {
      const paidDate = new Date(payment.paidDate)
      return paidDate.getMonth() + 1 === month && paidDate.getFullYear() === year
    }
    return false
  })

  // Jami to'langan summa (haqiqatda to'langan)
  const totalPaid = payments.reduce((sum, payment) => {
    // Agar status COMPLETED bo'lsa va paidAmount null bo'lsa, amount ishlatamiz
    const paid = payment.status === 'COMPLETED' && !payment.paidAmount 
      ? Number(payment.amount) 
      : Number(payment.paidAmount || 0)
    return sum + paid
  }, 0)

  // ✅ CRITICAL: Use tuitionFeeAtPayment (snapshot) if available, fallback to current monthlyTuitionFee
  // This ensures completed payments are calculated against their original amount
  let requiredAmount = payments.length > 0 && payments[0].tuitionFeeAtPayment
    ? Number(payments[0].tuitionFeeAtPayment)
    : Number(student.monthlyTuitionFee)
  
  // ✅ DISCOUNT LOGIC: Agar chegirma berilgan bo'lsa, requiredAmount'ni kamaytirish
  // Bu yerda originalAmount to'lov yaratilgandagi asl summa (chegirmasiz)
  // amount esa chegirmadan keyin qolgan summa (to'lash kerak bo'lgan)
  const hasDiscount = payments.some(p => Number(p.discountAmount || 0) > 0)
  if (hasDiscount) {
    // Chegirmali to'lovlar uchun amount ishlatamiz (chegirmadan keyin qolgan summa)
    const discountedPayment = payments.find(p => Number(p.discountAmount || 0) > 0)
    if (discountedPayment) {
      requiredAmount = Number(discountedPayment.amount) // Bu chegirma qo'llanganidan keyingi summa
    }
  }
  
  const remainingAmount = Math.max(0, requiredAmount - totalPaid)
  const percentagePaid = requiredAmount > 0 ? (totalPaid / requiredAmount) * 100 : 0
  
  // ✅ DISCOUNT AWARE: Agar to'langan summa requiredAmount'ga teng yoki katta bo'lsa, 100% to'langan
  const isFullyPaid = totalPaid >= requiredAmount

  // To'lov muddati (paymentDueDay)
  const dueDay = student.paymentDueDay || 5
  const dueDate = new Date(year, month - 1, dueDay) // month - 1 chunki JS'da oylar 0'dan boshlanadi

  // ✅ Primary payment ID (PENDING yoki PARTIALLY_PAID birinchi to'lov)
  const primaryPayment = payments.find(p => p.status === 'PENDING' || p.status === 'PARTIALLY_PAID')

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
    payments,
    paymentId: primaryPayment?.id || null // ✅ To'lov qilish uchun
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

