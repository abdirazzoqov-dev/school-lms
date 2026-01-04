'use server'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { paymentSchema, PaymentFormData } from '@/lib/validations/payment'
import { revalidatePath } from 'next/cache'
import { generateRandomString, formatNumber } from '@/lib/utils'
import { handleError } from '@/lib/error-handler'
import { Decimal } from '@prisma/client/runtime/library'

import { autoCompleteMonthlyPayments } from '@/lib/payment-helpers'
import { logger } from '@/lib/logger'

// Helper: Auto-complete monthly payments (moved to payment-helpers.ts)
async function checkAndUpdateMonthlyTuitionStatus(
  studentId: string,
  tenantId: string,
  month: number,
  year: number,
  monthlyTuitionFee: Decimal
) {
  try {
    const completedCount = await autoCompleteMonthlyPayments(
      studentId,
      tenantId,
      month,
      year,
      monthlyTuitionFee
    )
    return completedCount > 0
  } catch (error) {
    logger.error('Failed to check monthly tuition status', error as Error)
    return false
  }
}

export async function createPayment(data: PaymentFormData) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return { success: false, error: 'Ruxsat berilmagan' }
    }

    const tenantId = session.user.tenantId!

    // Validate data
    const validatedData = paymentSchema.parse(data)

    // Get student and parent info (with tenant check)
    const student = await db.student.findFirst({
      where: { 
        id: validatedData.studentId,
        tenantId, // Security: Ensure tenant isolation
      },
      include: {
        parents: {
          include: {
            parent: true
          },
          where: {
            hasAccess: true // Get primary guardian (hasAccess = true)
          },
          take: 1
        }
      }
    })

    if (!student) {
      return { success: false, error: 'O\'quvchi topilmadi' }
    }

    // Generate invoice number
    const invoiceNumber = `INV-${new Date().getFullYear()}-${generateRandomString(8)}`

    // Get primary guardian (hasAccess = true)
    const primaryGuardian = student.parents.find(sp => sp.hasAccess)

    // Determine payment month/year from dueDate
    const dueDate = new Date(validatedData.dueDate)
    const paymentMonth = dueDate.getMonth() + 1 // 1-12
    const paymentYear = dueDate.getFullYear()

    // Create payment with paidAmount and remainingAmount
    const isPaid = !!validatedData.paidDate
    const totalAmount = validatedData.amount
    const paidAmount = isPaid ? totalAmount : 0
    const remainingAmount = isPaid ? 0 : totalAmount
    
    const payment = await db.payment.create({
      data: {
        tenantId,
        studentId: validatedData.studentId,
        parentId: primaryGuardian?.parent.id || null,
        amount: totalAmount,
        paidAmount: paidAmount,
        remainingAmount: remainingAmount,
        paymentType: validatedData.paymentType,
        paymentMethod: validatedData.paymentMethod,
        dueDate: new Date(validatedData.dueDate),
        paidDate: isPaid ? new Date(validatedData.paidDate!) : null,
        status: isPaid ? 'COMPLETED' : 'PENDING',
        paymentMonth,
        paymentYear,
        invoiceNumber,
        receivedById: isPaid ? session.user.id : null,
        receiptNumber: validatedData.receiptNumber || null,
        notes: validatedData.notes || null,
      }
    })

    // If payment is completed and it's a TUITION payment, check if monthly tuition is fully paid
    if (validatedData.paidDate && validatedData.paymentType === 'TUITION' && student.monthlyTuitionFee) {
      await checkAndUpdateMonthlyTuitionStatus(
        student.id,
        tenantId,
        paymentMonth,
        paymentYear,
        student.monthlyTuitionFee
      )
    }

    revalidatePath('/admin/payments', 'page')
    revalidatePath('/admin', 'page')
    revalidatePath('/admin/students', 'page')
    
    return { success: true, payment }
  } catch (error: any) {
    return handleError(error)
  }
}

export async function updatePayment(paymentId: string, data: Partial<PaymentFormData>) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return { success: false, error: 'Ruxsat berilmagan' }
    }

    const tenantId = session.user.tenantId!

    // Get current payment to check student info
    const currentPayment = await db.payment.findFirst({
      where: { id: paymentId, tenantId },
      include: {
        student: true
      }
    })

    if (!currentPayment) {
      return { success: false, error: 'To\'lov topilmadi' }
    }

    // Prepare update data
    const updateData: any = {
      amount: data.amount,
      paymentType: data.paymentType,
      paymentMethod: data.paymentMethod,
      notes: data.notes || null,
      receiptNumber: data.receiptNumber || null,
    }

    // Update paymentMonth/Year if dueDate changes
    if (data.dueDate) {
      const newDueDate = new Date(data.dueDate)
      updateData.dueDate = newDueDate
      updateData.paymentMonth = newDueDate.getMonth() + 1
      updateData.paymentYear = newDueDate.getFullYear()
    }

    // If paidDate is provided, update status and amounts
    if (data.paidDate) {
      updateData.paidDate = new Date(data.paidDate)
      updateData.status = 'COMPLETED'
      updateData.receivedById = session.user.id
      
      // Set paidAmount and remainingAmount when payment is completed
      const totalAmount = data.amount !== undefined ? data.amount : currentPayment.amount
      updateData.paidAmount = totalAmount
      updateData.remainingAmount = 0
    } else if (data.paidDate === '') {
      // If paidDate is cleared (set to empty string), mark as pending
      updateData.paidDate = null
      updateData.status = 'PENDING'
      updateData.receivedById = null
      
      // Reset paidAmount and remainingAmount
      const totalAmount = data.amount !== undefined ? data.amount : currentPayment.amount
      updateData.paidAmount = 0
      updateData.remainingAmount = totalAmount
    }
    
    // If amount changes, recalculate remainingAmount
    if (data.amount !== undefined && !data.paidDate) {
      const currentPaidAmount = currentPayment.paidAmount || 0
      updateData.remainingAmount = data.amount - Number(currentPaidAmount)
    }

    // Update payment (with tenant check)
    const payment = await db.payment.update({
      where: { 
        id: paymentId,
        tenantId, // Security: Ensure tenant isolation
      },
      data: updateData
    })

    // If payment is now completed and it's TUITION, check monthly status
    if (data.paidDate && (data.paymentType === 'TUITION' || currentPayment.paymentType === 'TUITION') && currentPayment.student.monthlyTuitionFee) {
      await checkAndUpdateMonthlyTuitionStatus(
        currentPayment.studentId,
        tenantId,
        payment.paymentMonth || currentPayment.paymentMonth || new Date().getMonth() + 1,
        payment.paymentYear || currentPayment.paymentYear || new Date().getFullYear(),
        currentPayment.student.monthlyTuitionFee
      )
    }

    revalidatePath('/admin/payments', 'page')
    revalidatePath('/admin', 'page')
    revalidatePath('/admin/students', 'page')
    
    return { success: true, payment }
  } catch (error: any) {
    return handleError(error)
  }
}

export async function deletePayment(paymentId: string) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return { success: false, error: 'Ruxsat berilmagan' }
    }

    const tenantId = session.user.tenantId!

    // Check payment status
    const payment = await db.payment.findFirst({
      where: { id: paymentId, tenantId }
    })

    if (!payment) {
      return { success: false, error: 'To\'lov topilmadi' }
    }

    // Prevent deletion of completed payments
    if (payment.status === 'COMPLETED') {
      return { 
        success: false, 
        error: 'To\'langan to\'lovni o\'chirib bo\'lmaydi. Agar xato bo\'lsa, REFUNDED statusga o\'zgartiring.' 
      }
    }

    // Safe to delete pending/failed payments (with tenant check)
    await db.payment.delete({
      where: { 
        id: paymentId,
        tenantId, // Security: Ensure tenant isolation
      }
    })

    revalidatePath('/admin/payments')
    revalidatePath('/admin') // Dashboard yangilansin
    
    return { success: true }
  } catch (error: any) {
    return handleError(error)
  }
}

// Bulk Operations
export async function bulkDeletePayments(paymentIds: string[]) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return { success: false, error: 'Ruxsat berilmagan' }
    }

    const tenantId = session.user.tenantId!

    // Check which payments are safe to delete (not completed)
    const payments = await db.payment.findMany({
      where: { 
        id: { in: paymentIds },
        tenantId 
      }
    })

    const safeToDelete = payments.filter(p => p.status !== 'COMPLETED')

    if (safeToDelete.length === 0) {
      return { 
        success: false, 
        error: 'Hech bir to\'lovni o\'chirib bo\'lmaydi. To\'langan to\'lovlarni o\'chirib bo\'lmaydi.' 
      }
    }

    const safeIds = safeToDelete.map(p => p.id)

    const result = await db.payment.deleteMany({
      where: { id: { in: safeIds } }
    })

    revalidatePath('/admin/payments')
    revalidatePath('/admin') // Dashboard yangilansin
    
    return { 
      success: true, 
      deleted: result.count,
      skipped: paymentIds.length - result.count
    }
  } catch (error: any) {
    return handleError(error)
  }
}

export async function bulkChangePaymentStatus(
  paymentIds: string[], 
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED'
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return { success: false, error: 'Ruxsat berilmagan' }
    }

    const tenantId = session.user.tenantId!

    // Get payments to check if they need monthly tuition status update
    const paymentsToUpdate = await db.payment.findMany({
      where: { 
        id: { in: paymentIds },
        tenantId 
      },
      include: {
        student: {
          select: {
            id: true,
            monthlyTuitionFee: true
          }
        }
      }
    })

    // Update each payment individually to sync paidAmount with status
    let updatedCount = 0
    
    for (const payment of paymentsToUpdate) {
      const updateData: any = {
        status,
      }

      // Sync paidAmount and remainingAmount based on status
      if (status === 'COMPLETED') {
        // Mark as fully paid
        updateData.paidAmount = payment.amount
        updateData.remainingAmount = 0
        updateData.paidDate = new Date()
        updateData.receivedById = session.user.id
      } else if (status === 'PENDING' || status === 'FAILED' || status === 'REFUNDED') {
        // Mark as unpaid
        updateData.paidAmount = 0
        updateData.remainingAmount = payment.amount
        updateData.paidDate = null
        updateData.receivedById = null
      }

      await db.payment.update({
        where: { 
          id: payment.id,
          tenantId 
        },
        data: updateData
      })

      updatedCount++

      // If status is COMPLETED, check monthly tuition for TUITION payments
      if (status === 'COMPLETED' && payment.paymentType === 'TUITION' && payment.student.monthlyTuitionFee) {
        await checkAndUpdateMonthlyTuitionStatus(
          payment.studentId,
          tenantId,
          payment.paymentMonth || new Date().getMonth() + 1,
          payment.paymentYear || new Date().getFullYear(),
          payment.student.monthlyTuitionFee
        )
      }
    }

    revalidatePath('/admin/payments', 'page')
    revalidatePath('/admin', 'page')
    
    return { success: true, updated: updatedCount }
  } catch (error: any) {
    return handleError(error)
  }
}

/**
 * Add partial payment to an existing payment
 * Supports installment/partial payments where students pay in multiple installments
 */
export async function addPartialPayment(paymentId: string, amount: number, paymentMethod?: string, notes?: string) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return { success: false, error: 'Ruxsat berilmagan' }
    }

    const tenantId = session.user.tenantId!

    // Validate amount
    if (amount <= 0) {
      return { success: false, error: 'Summa 0 dan katta bo\'lishi kerak' }
    }

    // Get current payment
    const currentPayment = await db.payment.findFirst({
      where: { id: paymentId, tenantId },
      include: {
        student: {
          select: {
            id: true,
            monthlyTuitionFee: true,
            user: {
              select: {
                fullName: true
              }
            }
          }
        }
      }
    })

    if (!currentPayment) {
      return { success: false, error: 'To\'lov topilmadi' }
    }

    // Check if payment is already completed
    if (currentPayment.status === 'COMPLETED') {
      return { success: false, error: 'Bu to\'lov allaqachon to\'liq to\'langan' }
    }

    // Check if adding this amount exceeds the total
    const currentPaidAmount = Number(currentPayment.paidAmount) || 0
    const totalAmount = Number(currentPayment.amount)
    const newPaidAmount = currentPaidAmount + amount

    if (newPaidAmount > totalAmount) {
      return { 
        success: false, 
        error: `Qo'shilayotgan summa jami summadan oshib ketdi. Maksimal: ${formatNumber(Number(totalAmount - currentPaidAmount))} so'm` 
      }
    }

    // Calculate new remaining amount
    const newRemainingAmount = totalAmount - newPaidAmount

    // Determine new status
    let newStatus: 'PENDING' | 'PARTIALLY_PAID' | 'COMPLETED' = 'PARTIALLY_PAID'
    if (newRemainingAmount <= 0) {
      newStatus = 'COMPLETED'
    } else if (newPaidAmount === 0) {
      newStatus = 'PENDING'
    }

    // Update payment
    const updatedPayment = await db.payment.update({
      where: { 
        id: paymentId,
        tenantId 
      },
      data: {
        paidAmount: newPaidAmount,
        remainingAmount: newRemainingAmount >= 0 ? newRemainingAmount : 0,
        status: newStatus,
        paidDate: newStatus === 'COMPLETED' ? new Date() : (currentPayment.paidDate || new Date()), // Keep first payment date or set current
        receivedById: session.user.id,
        notes: notes ? `${currentPayment.notes || ''}\n[${new Date().toLocaleDateString('uz-UZ')}] +${formatNumber(Number(amount))} so'm (${paymentMethod || 'N/A'})${notes ? ': ' + notes : ''}`.trim() : currentPayment.notes,
      }
    })

    // If payment is now completed and it's TUITION, check monthly status
    if (newStatus === 'COMPLETED' && currentPayment.paymentType === 'TUITION' && currentPayment.student.monthlyTuitionFee) {
      await checkAndUpdateMonthlyTuitionStatus(
        currentPayment.studentId,
        tenantId,
        currentPayment.paymentMonth || new Date().getMonth() + 1,
        currentPayment.paymentYear || new Date().getFullYear(),
        currentPayment.student.monthlyTuitionFee
      )
    }

    revalidatePath('/admin/payments', 'page')
    revalidatePath('/admin', 'page')
    revalidatePath('/admin/students', 'page')
    
    return { 
      success: true, 
      payment: updatedPayment,
      message: `${formatNumber(Number(amount))} so'm qo'shildi. ${newStatus === 'COMPLETED' ? '✅ To\'lov to\'liq yakunlandi!' : `Qoldi: ${formatNumber(Number(newRemainingAmount))} so'm`}`,
      studentName: currentPayment.student.user?.fullName || 'N/A',
      isCompleted: newStatus === 'COMPLETED'
    }
  } catch (error: any) {
    return handleError(error)
  }
}
