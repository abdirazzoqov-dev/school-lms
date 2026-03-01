'use server'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { 
  cookSchema, 
  CookFormData, 
  updateCookSchema,
  UpdateCookFormData,
  kitchenExpenseCategorySchema, 
  KitchenExpenseCategoryFormData,
  kitchenExpenseSchema,
  KitchenExpenseFormData
} from '@/lib/validations/cook'
import { revalidatePath } from 'next/cache'
import { hashPassword } from '@/lib/auth'
import { handleError } from '@/lib/error-handler'

// Helper: admin-like roles (ADMIN, SUPER_ADMIN, MODERATOR)
const isAdminLike = (role: string) =>
  role === 'ADMIN' || role === 'SUPER_ADMIN' || role === 'MODERATOR'

// ============================================
// COOK (OSHPAZ) ACTIONS
// ============================================

export async function createCook(data: CookFormData) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !isAdminLike(session.user.role)) {
      return { success: false, error: 'Ruxsat berilmagan' }
    }

    const tenantId = session.user.tenantId!

    // Validate data
    const validatedData = cookSchema.parse(data)

    // Check if email already exists
    const existingUser = await db.user.findUnique({
      where: { email: validatedData.email }
    })

    if (existingUser) {
      return { success: false, error: 'Bu email allaqachon ishlatilgan' }
    }

    // Check if cook code already exists
    const existingCook = await db.cook.findUnique({
      where: {
        tenantId_cookCode: {
          tenantId,
          cookCode: validatedData.cookCode
        }
      }
    })

    if (existingCook) {
      return { success: false, error: 'Bu oshpaz kodi allaqachon ishlatilgan' }
    }

    // Hash password
    const passwordHash = await hashPassword(validatedData.password)

    // Create user
    const user = await db.user.create({
      data: {
        email: validatedData.email,
        fullName: validatedData.fullName,
        phone: validatedData.phone || null,
        passwordHash,
        role: 'COOK',
        tenantId,
        isActive: true,
      }
    })

    // Create cook
    const cook = await db.cook.create({
      data: {
        tenantId,
        userId: user.id,
        cookCode: validatedData.cookCode,
        specialization: validatedData.specialization,
        experienceYears: validatedData.experienceYears || null,
        position: validatedData.position,
        salary: validatedData.salary || null,
        workSchedule: validatedData.workSchedule || null,
      }
    })

    revalidatePath('/admin/kitchen')
    revalidatePath('/admin/kitchen/cooks')
    
    return { 
      success: true, 
      cook,
      credentials: {
        email: validatedData.email,
        password: validatedData.password
      }
    }
  } catch (error: any) {
    return handleError(error)
  }
}

export async function updateCook(cookId: string, data: UpdateCookFormData) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !isAdminLike(session.user.role)) {
      return { success: false, error: 'Ruxsat berilmagan' }
    }

    const tenantId = session.user.tenantId!

    // Validate data
    const validatedData = updateCookSchema.parse(data)

    // Check if cook code is being changed and is unique
    if (validatedData.cookCode) {
      const existingCook = await db.cook.findFirst({
        where: {
          tenantId,
          cookCode: validatedData.cookCode,
          NOT: { id: cookId }
        }
      })

      if (existingCook) {
        return { success: false, error: 'Bu oshpaz kodi allaqachon ishlatilgan' }
      }
    }

    // Get cook with user
    const cook = await db.cook.findFirst({
      where: { id: cookId, tenantId },
      include: { user: true }
    })

    if (!cook) {
      return { success: false, error: 'Oshpaz topilmadi' }
    }

    // Update user
    await db.user.update({
      where: { id: cook.userId },
      data: {
        fullName: validatedData.fullName,
        phone: validatedData.phone || null,
      }
    })

    // Update cook
    const updatedCook = await db.cook.update({
      where: { id: cookId },
      data: {
        cookCode: validatedData.cookCode,
        specialization: validatedData.specialization,
        experienceYears: validatedData.experienceYears || null,
        position: validatedData.position,
        salary: validatedData.salary || null,
        workSchedule: validatedData.workSchedule || null,
      }
    })

    revalidatePath('/admin/kitchen')
    revalidatePath('/admin/kitchen/cooks')
    
    return { success: true, cook: updatedCook }
  } catch (error: any) {
    return handleError(error)
  }
}

export async function deactivateCook(cookId: string) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !isAdminLike(session.user.role)) {
      return { success: false, error: 'Ruxsat berilmagan' }
    }

    const tenantId = session.user.tenantId!

    const cook = await db.cook.findFirst({
      where: { id: cookId, tenantId },
      include: { user: true }
    })

    if (!cook) {
      return { success: false, error: 'Oshpaz topilmadi' }
    }

    // Deactivate user account
    await db.user.update({
      where: { id: cook.userId },
      data: { isActive: false }
    })

    revalidatePath('/admin/kitchen')
    revalidatePath('/admin/kitchen/cooks')
    
    return { success: true }
  } catch (error: any) {
    return handleError(error)
  }
}

export async function activateCook(cookId: string) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !isAdminLike(session.user.role)) {
      return { success: false, error: 'Ruxsat berilmagan' }
    }

    const tenantId = session.user.tenantId!

    const cook = await db.cook.findFirst({
      where: { id: cookId, tenantId },
      include: { user: true }
    })

    if (!cook) {
      return { success: false, error: 'Oshpaz topilmadi' }
    }

    // Activate user account
    await db.user.update({
      where: { id: cook.userId },
      data: { isActive: true }
    })

    revalidatePath('/admin/kitchen')
    revalidatePath('/admin/kitchen/cooks')
    
    return { success: true }
  } catch (error: any) {
    return handleError(error)
  }
}

export async function deleteCook(cookId: string) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !isAdminLike(session.user.role)) {
      return { success: false, error: 'Ruxsat berilmagan' }
    }

    const tenantId = session.user.tenantId!

    // Check if cook has related expenses
    const cook = await db.cook.findFirst({
      where: { id: cookId, tenantId },
      include: {
        user: true,
        _count: {
          select: { kitchenExpenses: true }
        }
      }
    })

    if (!cook) {
      return { success: false, error: 'Oshpaz topilmadi' }
    }

    if (cook._count.kitchenExpenses > 0) {
      return { 
        success: false, 
        error: 'Bu oshpaz xarajatlar kiritgan. Avval deactivate qiling.' 
      }
    }

    // Delete cook first
    await db.cook.delete({
      where: { id: cookId }
    })

    // Delete user account
    await db.user.delete({
      where: { id: cook.userId }
    })

    revalidatePath('/admin/kitchen')
    revalidatePath('/admin/kitchen/cooks')
    
    return { success: true }
  } catch (error: any) {
    return handleError(error)
  }
}

// ============================================
// KITCHEN EXPENSE CATEGORY ACTIONS
// ============================================

export async function createKitchenExpenseCategory(data: KitchenExpenseCategoryFormData) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !isAdminLike(session.user.role)) {
      return { success: false, error: 'Ruxsat berilmagan' }
    }

    const tenantId = session.user.tenantId!

    // Validate data
    const validatedData = kitchenExpenseCategorySchema.parse(data)

    // Check if category name already exists
    const existingCategory = await db.kitchenExpenseCategory.findUnique({
      where: {
        tenantId_name: {
          tenantId,
          name: validatedData.name
        }
      }
    })

    if (existingCategory) {
      return { success: false, error: 'Bu xarajat turi allaqachon mavjud' }
    }

    // Create category
    const category = await db.kitchenExpenseCategory.create({
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

    revalidatePath('/admin/kitchen')
    revalidatePath('/admin/kitchen/categories')
    
    return { success: true, category }
  } catch (error: any) {
    return handleError(error)
  }
}

export async function updateKitchenExpenseCategory(categoryId: string, data: Partial<KitchenExpenseCategoryFormData>) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !isAdminLike(session.user.role)) {
      return { success: false, error: 'Ruxsat berilmagan' }
    }

    const tenantId = session.user.tenantId!

    // Check if category exists and belongs to tenant
    const existingCategory = await db.kitchenExpenseCategory.findFirst({
      where: { id: categoryId, tenantId }
    })

    if (!existingCategory) {
      return { success: false, error: 'Xarajat turi topilmadi' }
    }

    // Check if name is being changed and is unique
    if (data.name && data.name !== existingCategory.name) {
      const duplicateName = await db.kitchenExpenseCategory.findFirst({
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
    const category = await db.kitchenExpenseCategory.update({
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

    revalidatePath('/admin/kitchen')
    revalidatePath('/admin/kitchen/categories')
    
    return { success: true, category }
  } catch (error: any) {
    return handleError(error)
  }
}

export async function deleteKitchenExpenseCategory(categoryId: string) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !isAdminLike(session.user.role)) {
      return { success: false, error: 'Ruxsat berilmagan' }
    }

    const tenantId = session.user.tenantId!

    // Check if category has expenses
    const category = await db.kitchenExpenseCategory.findFirst({
      where: { id: categoryId, tenantId },
      include: {
        _count: {
          select: { kitchenExpenses: true }
        }
      }
    })

    if (!category) {
      return { success: false, error: 'Xarajat turi topilmadi' }
    }

    if (category._count.kitchenExpenses > 0) {
      return { 
        success: false, 
        error: 'Bu xarajat turida xarajatlar mavjud. Avval xarajatlarni o\'chiring.' 
      }
    }

    // Delete category
    await db.kitchenExpenseCategory.delete({
      where: { id: categoryId }
    })

    revalidatePath('/admin/kitchen')
    revalidatePath('/admin/kitchen/categories')
    
    return { success: true }
  } catch (error: any) {
    return handleError(error)
  }
}

// ============================================
// KITCHEN EXPENSE ACTIONS
// ============================================

export async function createKitchenExpense(data: KitchenExpenseFormData) {
  try {
    const session = await getServerSession(authOptions)
    
    // Allow ADMIN, SUPER_ADMIN, MODERATOR and COOK to create expenses
    if (!session || (!isAdminLike(session.user.role) && session.user.role !== 'COOK')) {
      return { success: false, error: 'Ruxsat berilmagan' }
    }

    const tenantId = session.user.tenantId!

    // Validate data
    const validatedData = kitchenExpenseSchema.parse(data)

    // Verify category exists and belongs to tenant
    const category = await db.kitchenExpenseCategory.findFirst({
      where: {
        id: validatedData.categoryId,
        tenantId
      }
    })

    if (!category) {
      return { success: false, error: 'Xarajat turi topilmadi' }
    }

    // Get cook ID if user is a cook
    let createdById: string | null = null
    if (session.user.role === 'COOK') {
      const cook = await db.cook.findFirst({
        where: { userId: session.user.id }
      })
      if (cook) {
        createdById = cook.id
      }
    }

    // Create expense
    const expense = await db.kitchenExpense.create({
      data: {
        tenantId,
        categoryId: validatedData.categoryId,
        amount: validatedData.amount,
        date: new Date(validatedData.date),
        paymentMethod: validatedData.paymentMethod,
        receiptNumber: validatedData.receiptNumber,
        description: validatedData.description,
        itemName: validatedData.itemName,
        quantity: validatedData.quantity,
        unit: validatedData.unit,
        supplier: validatedData.supplier,
        createdById,
      }
    })

    revalidatePath('/admin/kitchen')
    revalidatePath('/admin/kitchen/expenses')
    revalidatePath('/cook')
    revalidatePath('/admin') // Dashboard: thisMonthKitchenExpenses, balance
    
    return { success: true, expense }
  } catch (error: any) {
    return handleError(error)
  }
}

export async function updateKitchenExpense(expenseId: string, data: Partial<KitchenExpenseFormData>) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || (!isAdminLike(session.user.role) && session.user.role !== 'COOK')) {
      return { success: false, error: 'Ruxsat berilmagan' }
    }

    const tenantId = session.user.tenantId!

    // Check if expense exists and belongs to tenant
    const existingExpense = await db.kitchenExpense.findFirst({
      where: { id: expenseId, tenantId }
    })

    if (!existingExpense) {
      return { success: false, error: 'Xarajat topilmadi' }
    }

    // Update expense
    const expense = await db.kitchenExpense.update({
      where: { id: expenseId },
      data: {
        categoryId: data.categoryId,
        amount: data.amount,
        date: data.date ? new Date(data.date) : undefined,
        paymentMethod: data.paymentMethod,
        receiptNumber: data.receiptNumber,
        description: data.description,
        itemName: data.itemName,
        quantity: data.quantity,
        unit: data.unit,
        supplier: data.supplier,
      }
    })

    revalidatePath('/admin/kitchen')
    revalidatePath('/admin/kitchen/expenses')
    revalidatePath('/cook')
    revalidatePath('/admin') // Dashboard: thisMonthKitchenExpenses, balance
    
    return { success: true, expense }
  } catch (error: any) {
    return handleError(error)
  }
}

export async function deleteKitchenExpense(expenseId: string) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !isAdminLike(session.user.role)) {
      return { success: false, error: 'Ruxsat berilmagan' }
    }

    const tenantId = session.user.tenantId!

    // Check if expense exists and belongs to tenant
    const expense = await db.kitchenExpense.findFirst({
      where: { id: expenseId, tenantId }
    })

    if (!expense) {
      return { success: false, error: 'Xarajat topilmadi' }
    }

    // Delete expense
    await db.kitchenExpense.delete({
      where: { id: expenseId }
    })

    revalidatePath('/admin/kitchen')
    revalidatePath('/admin/kitchen/expenses')
    revalidatePath('/cook')
    revalidatePath('/admin') // Dashboard: thisMonthKitchenExpenses, balance
    
    return { success: true }
  } catch (error: any) {
    return handleError(error)
  }
}

