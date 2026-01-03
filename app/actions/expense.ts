'use server'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { 
  expenseCategorySchema, 
  ExpenseCategoryFormData,
  expenseSchema,
  ExpenseFormData 
} from '@/lib/validations/expense'
import { revalidatePath } from 'next/cache'
import { handleError } from '@/lib/error-handler'

// ============================================
// EXPENSE CATEGORY ACTIONS
// ============================================

export async function createExpenseCategory(data: ExpenseCategoryFormData) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return { success: false, error: 'Ruxsat berilmagan' }
    }

    const tenantId = session.user.tenantId!

    // Validate data
    const validatedData = expenseCategorySchema.parse(data)

    // Check if category name already exists
    const existingCategory = await db.expenseCategory.findFirst({
      where: {
        tenantId,
        name: validatedData.name
      }
    })

    if (existingCategory) {
      return { success: false, error: 'Bu xarajat turi allaqachon mavjud' }
    }

    // Create expense category
    const category = await db.expenseCategory.create({
      data: {
        tenantId,
        name: validatedData.name,
        description: validatedData.description,
        limitAmount: validatedData.limitAmount,
        period: validatedData.period,
        color: validatedData.color,
        icon: validatedData.icon,
        isActive: validatedData.isActive,
      }
    })

    revalidatePath('/admin/expenses/categories')
    revalidatePath('/admin')
    
    return { success: true, category }
  } catch (error: any) {
    return handleError(error)
  }
}

export async function updateExpenseCategory(categoryId: string, data: Partial<ExpenseCategoryFormData>) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return { success: false, error: 'Ruxsat berilmagan' }
    }

    const tenantId = session.user.tenantId!

    // Check if category exists and belongs to tenant
    const existingCategory = await db.expenseCategory.findFirst({
      where: { id: categoryId, tenantId }
    })

    if (!existingCategory) {
      return { success: false, error: 'Xarajat turi topilmadi' }
    }

    // Check if name is being changed and is unique
    if (data.name && data.name !== existingCategory.name) {
      const duplicateName = await db.expenseCategory.findFirst({
        where: {
          tenantId,
          name: data.name,
          NOT: { id: categoryId }
        }
      })

      if (duplicateName) {
        return { success: false, error: 'Bu nom allaqachon ishlatilgan' }
      }
    }

    // Update category
    const category = await db.expenseCategory.update({
      where: { id: categoryId },
      data: {
        name: data.name,
        description: data.description,
        limitAmount: data.limitAmount,
        period: data.period,
        color: data.color,
        icon: data.icon,
        isActive: data.isActive,
      }
    })

    revalidatePath('/admin/expenses/categories')
    revalidatePath('/admin')
    
    return { success: true, category }
  } catch (error: any) {
    return handleError(error)
  }
}

export async function deleteExpenseCategory(categoryId: string) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return { success: false, error: 'Ruxsat berilmagan' }
    }

    const tenantId = session.user.tenantId!

    // Check if category has expenses
    const category = await db.expenseCategory.findFirst({
      where: { id: categoryId, tenantId },
      include: {
        _count: {
          select: { expenses: true }
        }
      }
    })

    if (!category) {
      return { success: false, error: 'Xarajat turi topilmadi' }
    }

    if (category._count.expenses > 0) {
      return { 
        success: false, 
        error: 'Bu xarajat turida xarajatlar mavjud. Avval xarajatlarni o\'chiring.' 
      }
    }

    // Delete category
    await db.expenseCategory.delete({
      where: { id: categoryId }
    })

    revalidatePath('/admin/expenses/categories')
    revalidatePath('/admin')
    
    return { success: true }
  } catch (error: any) {
    return handleError(error)
  }
}

// ============================================
// EXPENSE ACTIONS
// ============================================

export async function createExpense(data: ExpenseFormData) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return { success: false, error: 'Ruxsat berilmagan' }
    }

    const tenantId = session.user.tenantId!

    // Validate data
    const validatedData = expenseSchema.parse(data)

    // Verify category exists and belongs to tenant
    const category = await db.expenseCategory.findFirst({
      where: {
        id: validatedData.categoryId,
        tenantId
      }
    })

    if (!category) {
      return { success: false, error: 'Xarajat turi topilmadi' }
    }

    // Create expense
    const expense = await db.expense.create({
      data: {
        tenantId,
        categoryId: validatedData.categoryId,
        amount: validatedData.amount,
        date: new Date(validatedData.date),
        paymentMethod: validatedData.paymentMethod,
        receiptNumber: validatedData.receiptNumber,
        description: validatedData.description,
        paidById: session.user.id,
      }
    })

    revalidatePath('/admin/expenses')
    revalidatePath('/admin')
    
    return { success: true, expense }
  } catch (error: any) {
    return handleError(error)
  }
}

export async function updateExpense(expenseId: string, data: Partial<ExpenseFormData>) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return { success: false, error: 'Ruxsat berilmagan' }
    }

    const tenantId = session.user.tenantId!

    // Check if expense exists and belongs to tenant
    const existingExpense = await db.expense.findFirst({
      where: { id: expenseId, tenantId }
    })

    if (!existingExpense) {
      return { success: false, error: 'Xarajat topilmadi' }
    }

    // Update expense
    const expense = await db.expense.update({
      where: { id: expenseId },
      data: {
        categoryId: data.categoryId,
        amount: data.amount,
        date: data.date ? new Date(data.date) : undefined,
        paymentMethod: data.paymentMethod,
        receiptNumber: data.receiptNumber,
        description: data.description,
      }
    })

    revalidatePath('/admin/expenses')
    revalidatePath('/admin')
    
    return { success: true, expense }
  } catch (error: any) {
    return handleError(error)
  }
}

export async function deleteExpense(expenseId: string) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return { success: false, error: 'Ruxsat berilmagan' }
    }

    const tenantId = session.user.tenantId!

    // Check if expense exists and belongs to tenant
    const expense = await db.expense.findFirst({
      where: { id: expenseId, tenantId }
    })

    if (!expense) {
      return { success: false, error: 'Xarajat topilmadi' }
    }

    // Delete expense
    await db.expense.delete({
      where: { id: expenseId }
    })

    revalidatePath('/admin/expenses')
    revalidatePath('/admin')
    
    return { success: true }
  } catch (error: any) {
    return handleError(error)
  }
}

// Helper functions moved to lib/expense-helpers.ts

