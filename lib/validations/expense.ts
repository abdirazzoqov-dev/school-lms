import { z } from 'zod'

// ============================================
// EXPENSE CATEGORY VALIDATION
// ============================================

export const expenseCategorySchema = z.object({
  name: z.string().min(1, 'Xarajat nomi kiritilishi shart'),
  description: z.string().optional(),
  limitAmount: z.number().min(0, 'Limit 0 dan kichik bo\'lmasligi kerak'),
  period: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'], {
    required_error: 'Muddat tanlanishi shart'
  }),
  color: z.string().optional(),
  icon: z.string().optional(),
  isActive: z.boolean().default(true),
})

export type ExpenseCategoryFormData = z.infer<typeof expenseCategorySchema>

// ============================================
// EXPENSE VALIDATION
// ============================================

export const expenseSchema = z.object({
  categoryId: z.string().min(1, 'Xarajat turi tanlanishi shart'),
  amount: z.number().min(1, 'Miqdor 0 dan katta bo\'lishi kerak'),
  date: z.string().min(1, 'Sana kiritilishi shart'),
  paymentMethod: z.enum(['CASH', 'CLICK', 'PAYME', 'UZUM'], {
    required_error: 'To\'lov usuli tanlanishi shart'
  }),
  receiptNumber: z.string().optional(),
  description: z.string().optional(),
})

export type ExpenseFormData = z.infer<typeof expenseSchema>

// ============================================
// HELPERS
// ============================================

export const EXPENSE_PERIODS = {
  DAILY: 'Kunlik',
  WEEKLY: 'Haftalik', 
  MONTHLY: 'Oylik',
  YEARLY: 'Yillik',
} as const

export const EXPENSE_PERIOD_OPTIONS = [
  { value: 'DAILY', label: 'Kunlik' },
  { value: 'WEEKLY', label: 'Haftalik' },
  { value: 'MONTHLY', label: 'Oylik' },
  { value: 'YEARLY', label: 'Yillik' },
]

// Default colors for expense categories
export const EXPENSE_COLORS = [
  '#EF4444', // Red
  '#F59E0B', // Orange
  '#10B981', // Green
  '#3B82F6', // Blue
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#14B8A6', // Teal
  '#F97316', // Orange-red
]

// Icons for expense categories
export const EXPENSE_ICONS = [
  'DollarSign',
  'Building',
  'Users',
  'Zap',
  'Tool',
  'Home',
  'Car',
  'ShoppingCart',
  'FileText',
  'TrendingUp',
]

