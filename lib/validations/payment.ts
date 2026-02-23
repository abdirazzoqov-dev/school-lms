import { z } from 'zod'

export const paymentSchema = z.object({
  studentId: z.string().min(1, 'O\'quvchini tanlang'),
  amount: z.number().min(1, 'Summa 0 dan katta bo\'lishi kerak'),
  paymentType: z.enum(['TUITION', 'DORMITORY', 'BOOKS', 'UNIFORM', 'OTHER']),
  paymentMethod: z.enum(['CASH', 'CLICK', 'PAYME', 'UZUM']).default('CASH'),
  dueDate: z.string().min(1, 'Muddatni kiriting'),
  paidDate: z.string().optional(),
  receiptNumber: z.string().optional(),
  notes: z.string().optional(),
  // ✅ Discount fields
  discountAmount: z.number().optional(),
  discountPercentage: z.number().optional(),
  discountReason: z.string().optional(),
  originalAmount: z.number().optional(),
})

export type PaymentFormData = z.infer<typeof paymentSchema>

