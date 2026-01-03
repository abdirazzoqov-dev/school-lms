import { db } from '@/lib/db'

/**
 * Generate unique expense receipt number
 * Format: EXP-YYYY-NNN (e.g. EXP-2025-001)
 */
export async function generateExpenseReceiptNumber(tenantId: string): Promise<string> {
  const year = new Date().getFullYear()
  const prefix = `EXP-${year}-`

  // Get the latest expense for this year
  const latestExpense = await db.expense.findFirst({
    where: {
      tenantId,
      receiptNumber: {
        startsWith: prefix
      }
    },
    orderBy: {
      createdAt: 'desc'
    },
    select: {
      receiptNumber: true
    }
  })

  let nextNumber = 1

  if (latestExpense?.receiptNumber) {
    // Extract the number from the last receipt (EXP-2025-001 -> 001)
    const lastNumber = latestExpense.receiptNumber.split('-').pop()
    if (lastNumber) {
      nextNumber = parseInt(lastNumber, 10) + 1
    }
  }

  // Format: EXP-2025-001, EXP-2025-002, etc.
  const receiptNumber = `${prefix}${String(nextNumber).padStart(3, '0')}`

  return receiptNumber
}

/**
 * Validate if receipt number is unique
 */
export async function isReceiptNumberUnique(
  receiptNumber: string,
  tenantId: string,
  excludeExpenseId?: string
): Promise<boolean> {
  const existing = await db.expense.findFirst({
    where: {
      tenantId,
      receiptNumber,
      ...(excludeExpenseId && { NOT: { id: excludeExpenseId } })
    }
  })

  return !existing
}

