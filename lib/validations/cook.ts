import { z } from 'zod'

// Cook (Oshpaz) yaratish uchun schema
export const cookSchema = z.object({
  fullName: z.string().min(3, 'Ism kamida 3 ta harf bo\'lishi kerak'),
  email: z.string().email('Email noto\'g\'ri'),
  phone: z.string().optional(),
  password: z.string().min(6, 'Parol kamida 6 ta belgidan iborat bo\'lishi kerak'),
  cookCode: z.string().min(2, 'Oshpaz kodi kamida 2 ta belgi'),
  specialization: z.string().min(2, 'Mutaxassislikni kiriting'),
  experienceYears: z.number().min(0).optional(),
  position: z.enum(['COOK', 'HEAD_COOK', 'ASSISTANT']).default('COOK'),
  salary: z.number().min(0).optional(),
  workSchedule: z.string().optional(),
})

export type CookFormData = z.infer<typeof cookSchema>

// Cook yangilash uchun schema (parol majburiy emas)
export const updateCookSchema = z.object({
  fullName: z.string().min(3, 'Ism kamida 3 ta harf bo\'lishi kerak'),
  phone: z.string().optional(),
  cookCode: z.string().min(2, 'Oshpaz kodi kamida 2 ta belgi'),
  specialization: z.string().min(2, 'Mutaxassislikni kiriting'),
  experienceYears: z.number().min(0).optional(),
  position: z.enum(['COOK', 'HEAD_COOK', 'ASSISTANT']),
  salary: z.number().min(0).optional(),
  workSchedule: z.string().optional(),
})

export type UpdateCookFormData = z.infer<typeof updateCookSchema>

// Oshxona xarajat kategoriyasi schema
export const kitchenExpenseCategorySchema = z.object({
  name: z.string().min(2, 'Nom kamida 2 ta belgidan iborat bo\'lishi kerak'),
  description: z.string().optional(),
  limitAmount: z.number().min(0, 'Limit 0 dan katta bo\'lishi kerak'),
  period: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY']).default('MONTHLY'),
  color: z.string().optional(),
  icon: z.string().optional(),
  isActive: z.boolean().default(true),
})

export type KitchenExpenseCategoryFormData = z.infer<typeof kitchenExpenseCategorySchema>

// Oshxona xarajati schema
export const kitchenExpenseSchema = z.object({
  categoryId: z.string().min(1, 'Kategoriya tanlang'),
  amount: z.number().min(0, 'Summa 0 dan katta bo\'lishi kerak'),
  date: z.string().min(1, 'Sanani kiriting'),
  paymentMethod: z.enum(['CASH', 'CLICK', 'PAYME', 'UZUM']).default('CASH'),
  receiptNumber: z.string().optional(),
  description: z.string().optional(),
  itemName: z.string().optional(),
  quantity: z.number().min(0).optional(),
  unit: z.string().optional(),
  supplier: z.string().optional(),
})

export type KitchenExpenseFormData = z.infer<typeof kitchenExpenseSchema>

