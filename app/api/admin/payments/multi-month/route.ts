import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { handleApiError } from '@/lib/api-error-handler'

/**
 * TOPSHIRIQ 3: Bir nechta oy uchun to'lov API
 * 
 * Senior Software Engineer yechimi:
 * - O'quvchi bir vaqtda bir nechta oy uchun to'lov qilishi mumkin
 * - Har bir oy uchun alohida payment record yaratiladi
 * - Har bir payment o'sha oyning narxini snapshot sifatida saqlaydi
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !['ADMIN', 'ACCOUNTANT'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Ruxsat yo\'q' },
        { status: 403 }
      )
    }

    const tenantId = session.user.tenantId!
    const body = await req.json()
    
    const { 
      studentId,       // O'quvchi ID
      startMonth,      // Boshlang'ich oy (1-12)
      startYear,       // Boshlang'ich yil
      monthsCount,     // Necha oy uchun
      paymentAmount,   // To'langan summa
      paymentMethod = 'CASH', // To'lov usuli
      paidDate = new Date().toISOString().split('T')[0] // To'lov sanasi
    } = body

    // Validation
    if (!studentId || !startMonth || !startYear || !monthsCount) {
      return NextResponse.json(
        { error: 'Barcha ma\'lumotlarni kiriting' },
        { status: 400 }
      )
    }

    if (monthsCount < 1 || monthsCount > 12) {
      return NextResponse.json(
        { error: 'Oylar soni 1 dan 12 gacha bo\'lishi kerak' },
        { status: 400 }
      )
    }

    // O'quvchini topish
    const student = await db.student.findFirst({
      where: { id: studentId, tenantId }
    })

    if (!student) {
      return NextResponse.json(
        { error: 'O\'quvchi topilmadi' },
        { status: 404 }
      )
    }

    const monthlyFee = Number(student.monthlyTuitionFee || 0)
    if (monthlyFee === 0) {
      return NextResponse.json(
        { error: 'O\'quvchining oylik to\'lovi belgilanmagan' },
        { status: 400 }
      )
    }

    // ✅ Bir nechta oy uchun to'lovlar yaratish
    const payments = []
    let currentMonth = startMonth
    let currentYear = startYear
    const totalAmount = monthlyFee * monthsCount
    let remainingPayment = paymentAmount ? parseFloat(paymentAmount.toString()) : 0

    for (let i = 0; i < monthsCount; i++) {
      // Oy o'tganda yilni ham o'zgartirish
      if (currentMonth > 12) {
        currentMonth = 1
        currentYear++
      }

      // Shu oy uchun to'lov bormi tekshirish
      const existingPayment = await db.payment.findFirst({
        where: {
          tenantId,
          studentId,
          paymentMonth: currentMonth,
          paymentYear: currentYear,
          paymentType: 'TUITION'
        }
      })

      if (existingPayment) {
        // Mavjud to'lovni yangilash
        const paidForThisMonth = Math.min(remainingPayment, monthlyFee)
        const newPaidAmount = Number(existingPayment.paidAmount) + paidForThisMonth
        const newStatus = newPaidAmount >= Number(existingPayment.amount) ? 'COMPLETED' : 
                         newPaidAmount > 0 ? 'PARTIALLY_PAID' : 'PENDING'

        await db.payment.update({
          where: { id: existingPayment.id },
          data: {
            paidAmount: newPaidAmount,
            remainingAmount: Number(existingPayment.amount) - newPaidAmount,
            status: newStatus,
            paidDate: newStatus !== 'PENDING' ? new Date(paidDate) : null,
            receivedById: session.user.id
          }
        })

        remainingPayment -= paidForThisMonth
      } else {
        // Yangi to'lov yaratish
        const paidForThisMonth = Math.min(remainingPayment, monthlyFee)
        const status = paidForThisMonth >= monthlyFee ? 'COMPLETED' : 
                      paidForThisMonth > 0 ? 'PARTIALLY_PAID' : 'PENDING'

        // Invoice number generatsiya
        const lastPayment = await db.payment.findFirst({
          where: { tenantId },
          orderBy: { createdAt: 'desc' },
          select: { invoiceNumber: true }
        })

        const lastNumber = lastPayment ? 
          parseInt(lastPayment.invoiceNumber.split('-').pop() || '0') : 0
        const invoiceNumber = `INV-${currentYear}-${String(lastNumber + 1 + i).padStart(6, '0')}`

        // Due date hisoblash
        const dueDay = student.paymentDueDay || 5
        const dueDate = new Date(currentYear, currentMonth - 1, dueDay)

        const payment = await db.payment.create({
          data: {
            tenantId,
            studentId,
            amount: monthlyFee,
            paidAmount: paidForThisMonth,
            remainingAmount: monthlyFee - paidForThisMonth,
            tuitionFeeAtPayment: monthlyFee, // ✅ Snapshot
            paymentType: 'TUITION',
            paymentMethod,
            status,
            paymentMonth: currentMonth,
            paymentYear: currentYear,
            invoiceNumber,
            dueDate,
            paidDate: status !== 'PENDING' ? new Date(paidDate) : null,
            receivedById: status !== 'PENDING' ? session.user.id : null
          }
        })

        payments.push(payment)
        remainingPayment -= paidForThisMonth
      }

      currentMonth++
    }

    return NextResponse.json({
      success: true,
      message: `${monthsCount} oy uchun to'lovlar yaratildi`,
      payments,
      totalAmount,
      paidAmount: paymentAmount
    })

  } catch (error: any) {
    return handleApiError(error, {
      tenantId: session?.user?.tenantId,
      userId: session?.user?.id,
      action: 'create-multi-month-payment'
    })
  }
}

