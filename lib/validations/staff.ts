import { z } from 'zod'

export const staffSchema = z.object({
  fullName: z.string().min(3, 'Ism kamida 3 belgidan iborat bo\'lishi kerak'),
  email: z.string().email('Noto\'g\'ri email format').toLowerCase(),
  phone: z.string().optional(),
  password: z.string().min(6, 'Parol kamida 6 belgidan iborat bo\'lishi kerak').optional(),
  staffCode: z.string().min(2, 'Xodim kodi kamida 2 belgidan iborat bo\'lishi kerak'),
  position: z.string().min(2, 'Lavozim kiritilishi shart'),
  department: z.string().optional(),
  education: z.string().optional(),
  monthlySalary: z.number().min(0, 'Oylik maosh 0 dan katta bo\'lishi kerak').optional(),
})

export type StaffFormData = z.infer<typeof staffSchema>
