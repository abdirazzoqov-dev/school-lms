import { db } from '@/lib/db'

/**
 * Calculate total expenses for a category within its period
 */
export async function getCategoryExpenseTotal(categoryId: string, tenantId: string) {
  const category = await db.expenseCategory.findFirst({
    where: { id: categoryId, tenantId }
  })

  if (!category) return 0

  // Calculate date range based on period
  const now = new Date()
  let startDate = new Date()

  switch (category.period) {
    case 'DAILY':
      startDate.setHours(0, 0, 0, 0)
      break
    case 'WEEKLY':
      startDate.setDate(now.getDate() - now.getDay()) // Start of week
      startDate.setHours(0, 0, 0, 0)
      break
    case 'MONTHLY':
      startDate.setDate(1) // Start of month
      startDate.setHours(0, 0, 0, 0)
      break
    case 'YEARLY':
      startDate.setMonth(0, 1) // Start of year
      startDate.setHours(0, 0, 0, 0)
      break
  }

  const total = await db.expense.aggregate({
    where: {
      categoryId,
      tenantId,
      date: {
        gte: startDate
      }
    },
    _sum: {
      amount: true
    }
  })

  return Number(total._sum.amount || 0)
}

/**
 * Get warning level based on usage percentage
 */
export function getWarningLevel(percentage: number): 'success' | 'warning' | 'danger' {
  if (percentage < 70) return 'success'
  if (percentage < 85) return 'warning'
  return 'danger'
}

