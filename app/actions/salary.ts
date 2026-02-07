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

/**
 * Oylik va avans to'lovlari uchun xarajat kategoriyasini olish yoki yaratish
 * Get or create expense category for salary and advance payments
 */
async function getOrCreateSalaryExpenseCategory(tenantId: string) {
  // Avval mavjud kategoriyani qidirish
  let category = await db.expenseCategory.findFirst({
    where: {
      tenantId,
      name: 'Oylik va avanslar'
    }
  })

  // Agar mavjud bo'lmasa, yangi yaratish
  if (!category) {
    category = await db.expenseCategory.create({
      data: {
        tenantId,
        name: 'Oylik va avanslar',
        description: 'O\'qituvchilar va xodimlar uchun oylik maosh va avans to\'lovlari',
        limitAmount: 0, // Limitsiz
        period: 'MONTHLY',
        color: '#8b5cf6', // Binafsha rang
        icon: 'wallet',
        isActive: true
      }
    })
  }

  return category
}

/**
 * Maosh to'lovi uchun avtomatik xarajat yaratish
 * Automatically create expense entry when salary is paid
 */
async function createExpenseForSalaryPayment(
  tenantId: string,
  amount: number,
  paymentDate: Date,
  paymentMethod: string,
  employeeName: string,
  paymentType: string,
  userId: string,
  month?: number,
  year?: number
) {
  try {
    // Xarajat kategoriyasini olish yoki yaratish
    const category = await getOrCreateSalaryExpenseCategory(tenantId)

    // Tavsif yaratish
    let description = `${employeeName} - ${paymentType === 'MONTHLY_SALARY' ? 'Oylik maosh' : 'Avans to\'lovi'}`
    if (month && year) {
      const monthNames = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr']
      description += ` (${monthNames[month - 1]} ${year})`
    }

    // Xarajat yozuvini yaratish
    await db.expense.create({
      data: {
        tenantId,
        categoryId: category.id,
        amount: new Decimal(amount),
        date: paymentDate,
        paymentMethod: paymentMethod as any,
        description,
        paidById: userId
      }
    })
  } catch (error) {
    console.error('Error creating expense for salary payment:', error)
    // Xatoni log qilamiz, lekin jarayonni to\'xtatmaymiz
  }
}

/**
 * Get existing payments for an employee in a specific month/year
 * Returns total already paid amount
 */
export async function getEmployeeMonthlyPayments(
  employeeId: string,
  employeeType: 'teacher' | 'staff',
  month: number,
  year: number
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return { success: false, error: 'Ruxsat berilmagan', totalPaid: 0, payments: [] }
    }

    const tenantId = session.user.tenantId!

    // Fetch all payments for this employee in this month/year
    const payments = await db.salaryPayment.findMany({
      where: {
        tenantId,
        month,
        year,
        status: {
          in: ['PAID', 'PARTIALLY_PAID']
        },
        ...(employeeType === 'teacher' 
          ? { teacherId: employeeId } 
          : { staffId: employeeId }
        )
      },
      select: {
        id: true,
        type: true,
        paidAmount: true,
        createdAt: true,
        description: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Calculate total paid
    const totalPaid = payments.reduce((sum, p) => sum + Number(p.paidAmount), 0)

    return {
      success: true,
      totalPaid,
      payments: payments.map(p => ({
        id: p.id,
        type: p.type,
        amount: Number(p.paidAmount),
        date: p.createdAt,
        description: p.description
      }))
    }
  } catch (error: any) {
    console.error('Get employee monthly payments error:', error)
    return { success: false, error: error.message, totalPaid: 0, payments: [] }
  }
}

export async function createSalaryPayment(data: SalaryPaymentFormData) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return { success: false, error: 'Ruxsat berilmagan' }
    }

    const tenantId = session.user.tenantId!

    // Validate data
    const validatedData = salaryPaymentSchema.parse(data)

    // Check if teacher or staff exists and get employee info
    let employeeName = 'Xodim'
    if (validatedData.teacherId) {
      const teacher = await db.teacher.findFirst({
        where: { id: validatedData.teacherId, tenantId },
        include: {
          user: {
            select: { fullName: true }
          }
        }
      })
      if (!teacher) {
        return { success: false, error: 'O\'qituvchi topilmadi' }
      }
      employeeName = teacher.user.fullName || 'O\'qituvchi'
    }

    if (validatedData.staffId) {
      const staff = await db.staff.findFirst({
        where: { id: validatedData.staffId, tenantId },
        include: {
          user: {
            select: { fullName: true }
          }
        }
      })
      if (!staff) {
        return { success: false, error: 'Xodim topilmadi' }
      }
      employeeName = staff.user.fullName || 'Xodim'
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

    // ✅ Agar to'lov qilingan bo'lsa, avtomatik xarajat yaratish
    if (validatedData.paymentDate) {
      await createExpenseForSalaryPayment(
        tenantId,
        Number(validatedData.amount),
        new Date(validatedData.paymentDate),
        validatedData.paymentMethod || 'CASH',
        employeeName,
        validatedData.type,
        session.user.id,
        validatedData.month,
        validatedData.year
      )
    }

    // ✅ Salary va Expense sahifalarini yangilash
    revalidateMultiplePaths([
      ...REVALIDATION_PATHS.SALARY_CHANGED,
      ...REVALIDATION_PATHS.EXPENSE_CHANGED
    ], revalidatePath)
    
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

    // Get payment with employee info
    const payment = await db.salaryPayment.findFirst({
      where: { id: paymentId, tenantId },
      include: {
        teacher: {
          include: {
            user: {
              select: { fullName: true }
            }
          }
        },
        staff: {
          include: {
            user: {
              select: { fullName: true }
            }
          }
        }
      }
    })

    if (!payment) {
      return { success: false, error: 'To\'lov topilmadi' }
    }

    // Get employee name
    const employeeName = payment.teacher?.user.fullName || payment.staff?.user.fullName || 'Xodim'

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

    // ✅ To'lov amalga oshirilganda avtomatik xarajat yaratish
    await createExpenseForSalaryPayment(
      tenantId,
      amount,
      new Date(),
      paymentMethod,
      employeeName,
      payment.type,
      session.user.id,
      payment.month || undefined,
      payment.year || undefined
    )

    // ✅ Salary va Expense sahifalarini yangilash
    revalidateMultiplePaths([
      ...REVALIDATION_PATHS.SALARY_CHANGED,
      ...REVALIDATION_PATHS.EXPENSE_CHANGED
    ], revalidatePath)
    
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

    // ✅ Salary va Expense sahifalarini yangilash
    revalidateMultiplePaths([
      ...REVALIDATION_PATHS.SALARY_CHANGED,
      ...REVALIDATION_PATHS.EXPENSE_CHANGED
    ], revalidatePath)
    
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

    // ✅ Salary va Expense sahifalarini yangilash
    revalidateMultiplePaths([
      ...REVALIDATION_PATHS.SALARY_CHANGED,
      ...REVALIDATION_PATHS.EXPENSE_CHANGED
    ], revalidatePath)
    
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

    // ✅ Qisman to'lov amalga oshirilganda avtomatik xarajat yaratish
    await createExpenseForSalaryPayment(
      tenantId,
      amount,
      new Date(),
      paymentMethod || 'CASH',
      employeeName,
      currentPayment.type,
      session.user.id,
      currentPayment.month || undefined,
      currentPayment.year || undefined
    )

    // ✅ Salary va Expense sahifalarini yangilash
    revalidateMultiplePaths([
      ...REVALIDATION_PATHS.SALARY_CHANGED,
      ...REVALIDATION_PATHS.EXPENSE_CHANGED
    ], revalidatePath)
    
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
