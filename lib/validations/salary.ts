import { z } from 'zod'

export const salaryPaymentSchema = z.object({
  teacherId: z.string().optional(),
  staffId: z.string().optional(),
  type: z.enum(['FULL_SALARY', 'ADVANCE', 'BONUS', 'DEDUCTION']),
  amount: z.number().min(0, 'Summa 0 dan kam bo\'lmasligi kerak'),
  month: z.number().min(1).max(12).optional(),
  year: z.number().min(2020).max(2100).optional(),
  baseSalary: z.number().min(0).optional(),
  bonusAmount: z.number().min(0).optional(),
  deductionAmount: z.number().min(0).optional(),
  paymentDate: z.string().optional(),
  dueDate: z.string().optional(),
  paymentMethod: z.enum(['CASH', 'BANK', 'CLICK', 'PAYME', 'UZUM', 'OTHER']).optional(),
  description: z.string().optional(),
  notes: z.string().optional(),
}).refine(
  (data) => data.teacherId || data.staffId,
  {
    message: 'O\'qituvchi yoki xodim tanlanishi shart',
    path: ['teacherId'],
  }
)

export type SalaryPaymentFormData = z.infer<typeof salaryPaymentSchema>

export const monthNames = [
  'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun',
  'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'
]

export const currentMonth = new Date().getMonth() + 1
export const currentYear = new Date().getFullYear()

