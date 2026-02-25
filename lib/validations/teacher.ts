import { z } from 'zod'

export const teacherSchema = z.object({
  fullName: z.string().min(3, 'Ism kamida 3 ta harf bo\'lishi kerak'),
  email: z.string().email('Email noto\'g\'ri').toLowerCase(),
  phone: z.string().optional(),
  teacherCode: z.string().min(2, 'O\'qituvchi kodi kamida 2 ta belgi'),
  specialization: z.string().min(3, 'Mutaxassislikni kiriting'),
  education: z.string().optional(),
  experienceYears: z.number().min(0).max(50).optional(),
  monthlySalary: z.number().min(0, 'Oylik maosh 0 dan katta bo\'lishi kerak').optional(),
  password: z.string().min(6, 'Parol kamida 6 ta belgi bo\'lishi kerak'),
})

export type TeacherFormData = z.infer<typeof teacherSchema>

