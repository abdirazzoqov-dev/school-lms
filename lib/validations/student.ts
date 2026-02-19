import { z } from 'zod'

// Qarindosh (Guardian) ma'lumotlari schema
export const guardianSchema = z.object({
  fullName: z.string().min(3, 'To\'liq ism kamida 3 ta harf bo\'lishi kerak'),
  phone: z.string()
    .min(9, 'Telefon raqami kamida 9 ta raqam bo\'lishi kerak')
    .refine(
      (val) => {
        const digitsOnly = val.replace(/[^0-9]/g, '')
        return digitsOnly.length >= 9 && digitsOnly.length <= 15
      },
      { message: 'Telefon raqami 9 dan 15 ta raqam orasida bo\'lishi kerak' }
    ),
  guardianType: z.enum(['FATHER', 'MOTHER', 'OTHER'], {
    errorMap: () => ({ message: 'Qarindoshlik turini tanlang' })
  }),
  // Agar guardianType = OTHER bo'lsa, qo'lda kiritilgan nom
  customRelationship: z.string().optional(),
  // Nazoratchi panelga kirish huquqi
  hasAccess: z.boolean().default(false),
  // Qo'shimcha (optional)
  occupation: z.string().optional(),
  workAddress: z.string().optional(),
}).refine(
  (data) => {
    // Agar guardianType = OTHER bo'lsa, customRelationship majburiy
    if (data.guardianType === 'OTHER' && !data.customRelationship) {
      return false
    }
    return true
  },
  {
    message: 'Qarindoshlik turini kiriting (masalan: Amaki, Xola, Bobo)',
    path: ['customRelationship']
  }
)

export const studentSchema = z.object({
  fullName: z.string().min(3, 'Ism kamida 3 ta harf bo\'lishi kerak'),
  email: z.string()
    .optional()
    .transform(val => val === '' ? undefined : val)
    .refine(
      val => !val || z.string().email().safeParse(val).success,
      { message: 'Email formati noto\'g\'ri. To\'g\'ri format: example@domain.com' }
    ),
  studentCode: z.string().min(2, 'O\'quvchi kodi kamida 2 ta belgi'),
  dateOfBirth: z.string().min(1, 'Tug\'ilgan sanani kiriting'),
  gender: z.enum(['MALE', 'FEMALE']),
  classId: z.string().optional(),
  groupId: z.string().optional(),
  address: z.string().optional(),
  
  // Qarindoshlar ma'lumotlari (array) - kamida 1 ta bo'lishi kerak
  guardians: z.array(guardianSchema).min(1, 'Kamida 1 ta qarindosh ma\'lumotini kiriting'),
  
  // Trial Period (Sinov muddati)
  trialEnabled: z.boolean().default(false),
  trialDays: z.number().min(1, 'Sinov muddati kamida 1 kun bo\'lishi kerak').optional(),
  
  // Dormitory info (optional)
  dormitoryBedId: z.string().optional().or(z.literal('')),
  dormitoryMonthlyFee: z.number().optional(),
  
  // Monthly tuition fee (Oylik o'qish to'lovi) - Majburiy, 0 dan 200M+ gacha
  monthlyTuitionFee: z.number().min(0, 'Oylik to\'lov summasi 0 yoki undan katta bo\'lishi kerak'),
  paymentDueDay: z.number().min(1).max(28).default(5), // Har oydagi to'lov sanasi (1-28)
  
  // Tekin o'quvchi (hech qanday to'lov yaratilmaydi)
  isFreeStudent: z.boolean().default(false),
}).refine(
  (data) => {
    // Agar trialEnabled true bo'lsa, trialDays majburiy
    if (data.trialEnabled && (!data.trialDays || data.trialDays < 1)) {
      return false
    }
    return true
  },
  {
    message: 'Sinov muddati yoqilgan bo\'lsa, sinov davomiyligini kiriting (kamida 1 kun)',
    path: ['trialDays']
  }
).refine(
  (data) => {
    // Faqat bitta qarindosh hasAccess = true bo'lishi kerak
    const accessCount = data.guardians.filter(g => g.hasAccess).length
    return accessCount === 1
  },
  {
    message: 'Faqat bitta qarindoshga nazorat paneli kirishiga ruxsat bering',
    path: ['guardians']
  }
).refine(
  (data) => {
    // Oylik to'lov summasi 0 yoki undan katta bo'lishi kerak
    return data.monthlyTuitionFee >= 0
  },
  {
    message: 'Oylik o\'qish to\'lov summasi 0 yoki undan katta bo\'lishi kerak',
    path: ['monthlyTuitionFee']
  }
)

export type GuardianFormData = z.infer<typeof guardianSchema>
export type StudentFormData = z.infer<typeof studentSchema>

