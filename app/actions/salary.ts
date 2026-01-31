'use server'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { salaryPaymentSchema, type SalaryPaymentFormData } from '@/lib/validations/salary'
import { handleError } from '@/lib/error-handler'
import { REVALIDATION_PATHS, revalidateMultiplePaths } from '@/lib/cache-config'
import { formatNumber } from '@/lib/utils'
import { Decimal } from '@prisma/client/runtime/library'

export async function createSalaryPayment(data: SalaryPaymentFormData) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return { success: false, error: 'Ruxsat berilmagan' }
    }

    const tenantId = session.user.tenantId!

    // Validate data
    const validatedData = salaryPaymentSchema.parse(data)

    // Check if teacher or staff exists
    if (validatedData.teacherId) {
      const teacher = await db.teacher.findFirst({
        where: { id: validatedData.teacherId, tenantId }
      })
      if (!teacher) {
        return { success: false, error: 'O\'qituvchi topilmadi' }
      }
    }

    if (validatedData.staffId) {
      const staff = await db.user.findFirst({
        where: { id: validatedData.staffId, tenantId }
      })
      if (!staff) {
        return { success: false, error: 'Xodim topilmadi' }
      }
    }

    // Calculate remaining amount
    const remainingAmount = validatedData.amount

    // Create salary payment
    const payment = await db.salaryPayment.create({
      data: {
        tenantId,
        teacherId: validatedData.teacherId,
        staffId: validatedData.staffId,
        type: validatedData.type,
        status: validatedData.paymentDate ? 'PAID' : 'PENDING',
        amount: validatedData.amount,
        paidAmount: validatedData.paymentDate ? validatedData.amount : 0,
        remainingAmount: validatedData.paymentDate ? 0 : remainingAmount,
        month: validatedData.month,
        year: validatedData.year,
        baseSalary: validatedData.baseSalary,
        bonusAmount: validatedData.bonusAmount || 0,
        deductionAmount: validatedData.deductionAmount || 0,
        paymentDate: validatedData.paymentDate ? new Date(validatedData.paymentDate) : undefined,
        dueDate: validatedData.dueDate ? new Date(validatedData.dueDate) : undefined,
        paymentMethod: validatedData.paymentMethod as any,
        description: validatedData.description,
        notes: validatedData.notes,
        paidById: session.user.id,
      }
    })

    revalidateMultiplePaths([...REVALIDATION_PATHS.SALARY_CHANGED], revalidatePath)
    
    return { success: true, payment }
  } catch (error: any) {
    return handleError(error)
  }
}

export async function paySalary(paymentId: string, amount: number, paymentMethod: string) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return { success: false, error: 'Ruxsat berilmagan' }
    }

    const tenantId = session.user.tenantId!

    // Get payment
    const payment = await db.salaryPayment.findFirst({
      where: { id: paymentId, tenantId }
    })

    if (!payment) {
      return { success: false, error: 'To\'lov topilmadi' }
    }

    // Calculate new amounts
    const newPaidAmount = Number(payment.paidAmount) + amount
    const newRemainingAmount = Number(payment.amount) - newPaidAmount

    // Determine new status
    let newStatus: 'PAID' | 'PARTIALLY_PAID' | 'PENDING' = 'PENDING'
    if (newRemainingAmount <= 0) {
      newStatus = 'PAID'
    } else if (newPaidAmount > 0) {
      newStatus = 'PARTIALLY_PAID'
    }

    // Update payment
    const updatedPayment = await db.salaryPayment.update({
      where: { id: paymentId },
      data: {
        paidAmount: newPaidAmount,
        remainingAmount: newRemainingAmount > 0 ? newRemainingAmount : 0,
        status: newStatus,
        paymentDate: newStatus === 'PAID' ? new Date() : payment.paymentDate,
        paymentMethod: paymentMethod as any,
        paidById: session.user.id,
      }
    })

    revalidateMultiplePaths([...REVALIDATION_PATHS.SALARY_CHANGED], revalidatePath)
    
    return { success: true, payment: updatedPayment }
  } catch (error: any) {
    return handleError(error)
  }
}

export async function updateSalaryPayment(paymentId: string, data: Partial<SalaryPaymentFormData>) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return { success: false, error: 'Ruxsat berilmagan' }
    }

    const tenantId = session.user.tenantId!

    // Get payment
    const payment = await db.salaryPayment.findFirst({
      where: { id: paymentId, tenantId }
    })

    if (!payment) {
      return { success: false, error: 'To\'lov topilmadi' }
    }

    // Update payment
    const updatedPayment = await db.salaryPayment.update({
      where: { id: paymentId },
      data: {
        amount: data.amount,
        month: data.month,
        year: data.year,
        baseSalary: data.baseSalary,
        bonusAmount: data.bonusAmount,
        deductionAmount: data.deductionAmount,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
        description: data.description,
        notes: data.notes,
      }
    })

    revalidateMultiplePaths([...REVALIDATION_PATHS.SALARY_CHANGED], revalidatePath)
    
    return { success: true, payment: updatedPayment }
  } catch (error: any) {
    return handleError(error)
  }
}

export async function deleteSalaryPayment(paymentId: string) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return { success: false, error: 'Ruxsat berilmagan' }
    }

    const tenantId = session.user.tenantId!

    // Check if payment exists
    const payment = await db.salaryPayment.findFirst({
      where: { id: paymentId, tenantId }
    })

    if (!payment) {
      return { success: false, error: 'To\'lov topilmadi' }
    }

    // Delete payment
    await db.salaryPayment.delete({
      where: { id: paymentId }
    })

    revalidateMultiplePaths([...REVALIDATION_PATHS.SALARY_CHANGED], revalidatePath)
    
    return { success: true }
  } catch (error: any) {
    return handleError(error)
  }
}

export async function getSalaryStatistics(tenantId: string, month?: number, year?: number) {
  try {
    const where: any = { tenantId }
    
    if (month && year) {
      where.month = month
      where.year = year
    }

    const totalPaid = await db.salaryPayment.aggregate({
      where: { ...where, status: 'PAID' },
      _sum: { paidAmount: true }
    })

    const totalPending = await db.salaryPayment.aggregate({
      where: { ...where, status: { in: ['PENDING', 'PARTIALLY_PAID'] } },
      _sum: { remainingAmount: true }
    })

    const paymentsByType = await db.salaryPayment.groupBy({
      by: ['type'],
      where,
      _sum: { paidAmount: true },
      _count: true
    })

    return {
      totalPaid: Number(totalPaid._sum.paidAmount || 0),
      totalPending: Number(totalPending._sum.remainingAmount || 0),
      paymentsByType
    }
  } catch (error: any) {
    console.error('Get salary statistics error:', error)
    return null
  }
}

/**
 * Add partial salary payment - Bo'lib-bo'lib maosh to'lash
 * Similar to addPartialPayment for student payments
 */
export async function addPartialSalaryPayment(
  paymentId: string, 
  amount: number, 
  paymentMethod?: string, 
  notes?: string
) {
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
    const currentPayment = await db.salaryPayment.findFirst({
      where: { id: paymentId, tenantId },
      include: {
        teacher: {
          include: {
            user: {
              select: {
                fullName: true
              }
            }
          }
        },
        staff: {
          select: {
            staffCode: true,
            position: true,
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
    if (currentPayment.status === 'PAID') {
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
    let newStatus: 'PENDING' | 'PARTIALLY_PAID' | 'PAID' = 'PARTIALLY_PAID'
    if (newRemainingAmount <= 0) {
      newStatus = 'PAID'
    } else if (newPaidAmount === 0) {
      newStatus = 'PENDING'
    }

    // Get employee name
    const employeeName = currentPayment.teacher?.user.fullName || currentPayment.staff?.user.fullName || 'N/A'

    // Update payment
    const updatedPayment = await db.salaryPayment.update({
      where: { 
        id: paymentId,
        tenantId 
      },
      data: {
        paidAmount: new Decimal(newPaidAmount),
        remainingAmount: new Decimal(newRemainingAmount >= 0 ? newRemainingAmount : 0),
        status: newStatus,
        paymentDate: newStatus === 'PAID' ? new Date() : (currentPayment.paymentDate || new Date()), // Keep first payment date or set current
        paidById: session.user.id,
        notes: notes ? `${currentPayment.notes || ''}\n[${new Date().toLocaleDateString('uz-UZ')}] +${formatNumber(Number(amount))} so'm (${paymentMethod || 'N/A'})${notes ? ': ' + notes : ''}`.trim() : currentPayment.notes,
      }
    })

    revalidateMultiplePaths([...REVALIDATION_PATHS.SALARY_CHANGED], revalidatePath)
    
    return { 
      success: true, 
      payment: updatedPayment,
      message: `${formatNumber(Number(amount))} so'm qo'shildi. ${newStatus === 'PAID' ? '✅ To\'lov to\'liq yakunlandi!' : `Qoldi: ${formatNumber(Number(newRemainingAmount))} so'm`}`,
      employeeName,
      isCompleted: newStatus === 'PAID'
    }
  } catch (error: any) {
    return handleError(error)
  }
}
