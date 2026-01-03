import { z } from 'zod'

export const tenantSchema = z.object({
  name: z.string().min(3, 'Maktab nomi kamida 3 ta harf bo\'lishi kerak'),
  slug: z.string()
    .min(3, 'Slug kamida 3 ta harf bo\'lishi kerak')
    .max(50, 'Slug 50 ta harfdan ko\'p bo\'lmasligi kerak')
    .regex(/^[a-z0-9-]+$/, 'Faqat kichik harflar, raqamlar va - ishlatish mumkin'),
  email: z.string().email('Email noto\'g\'ri').optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  subscriptionPlan: z.enum(['BASIC', 'STANDARD', 'PREMIUM']),
  trialDays: z.number().min(0).max(90).default(30),
})

export type TenantFormData = z.infer<typeof tenantSchema>

