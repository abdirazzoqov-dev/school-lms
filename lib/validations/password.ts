import { z } from 'zod'

/**
 * ✅ SECURITY: Strong Password Policy
 * Prevents weak passwords that are easily guessable or crackable
 */

// Password requirements
export const PASSWORD_MIN_LENGTH = 8
export const PASSWORD_MAX_LENGTH = 128

// Common weak passwords to block
const WEAK_PASSWORDS = [
  'password',
  '12345678',
  'qwerty123',
  'admin123',
  'user1234',
  'test1234',
  'welcome1',
  'letmein1',
  '123456789',
  'password123',
]

/**
 * Password validation schema
 * Requirements:
 * - Min 8 characters
 * - At least 1 uppercase letter
 * - At least 1 lowercase letter
 * - At least 1 number
 * - At least 1 special character
 * - Not a common weak password
 */
export const passwordSchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH, `Parol kamida ${PASSWORD_MIN_LENGTH} ta belgidan iborat bo'lishi kerak`)
  .max(PASSWORD_MAX_LENGTH, `Parol maksimal ${PASSWORD_MAX_LENGTH} ta belgidan iborat bo'lishi mumkin`)
  .refine(
    (password) => /[A-Z]/.test(password),
    { message: 'Parol kamida 1 ta katta harf (A-Z) bo\'lishi kerak' }
  )
  .refine(
    (password) => /[a-z]/.test(password),
    { message: 'Parol kamida 1 ta kichik harf (a-z) bo\'lishi kerak' }
  )
  .refine(
    (password) => /[0-9]/.test(password),
    { message: 'Parol kamida 1 ta raqam (0-9) bo\'lishi kerak' }
  )
  .refine(
    (password) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
    { message: 'Parol kamida 1 ta maxsus belgi (!@#$%^&* va h.k.) bo\'lishi kerak' }
  )
  .refine(
    (password) => !WEAK_PASSWORDS.includes(password.toLowerCase()),
    { message: 'Bu parol juda oddiy. Murakkab parol tanlang' }
  )

/**
 * Password strength checker
 * Returns: weak, medium, strong, very_strong
 */
export function checkPasswordStrength(password: string): {
  strength: 'weak' | 'medium' | 'strong' | 'very_strong'
  score: number
  feedback: string[]
} {
  let score = 0
  const feedback: string[] = []

  // Length check
  if (password.length >= 12) {
    score += 2
  } else if (password.length >= 10) {
    score += 1
  } else {
    feedback.push('Parol kamida 10-12 ta belgidan iborat bo\'lishi tavsiya etiladi')
  }

  // Character variety
  if (/[A-Z]/.test(password)) score += 1
  else feedback.push('Katta harflar qo\'shing (A-Z)')

  if (/[a-z]/.test(password)) score += 1
  else feedback.push('Kichik harflar qo\'shing (a-z)')

  if (/[0-9]/.test(password)) score += 1
  else feedback.push('Raqamlar qo\'shing (0-9)')

  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score += 1
  else feedback.push('Maxsus belgilar qo\'shing (!@#$%^&*)')

  // Check for sequences
  if (/(.)\1{2,}/.test(password)) {
    score -= 1
    feedback.push('Ketma-ket bir xil belgilardan foydalanmang (aaa, 111)')
  }

  // Check for weak patterns
  if (WEAK_PASSWORDS.some(weak => password.toLowerCase().includes(weak))) {
    score -= 2
    feedback.push('Oddiy parollardan foydalanmang')
  }

  // Determine strength
  let strength: 'weak' | 'medium' | 'strong' | 'very_strong'
  if (score >= 7) {
    strength = 'very_strong'
  } else if (score >= 5) {
    strength = 'strong'
  } else if (score >= 3) {
    strength = 'medium'
  } else {
    strength = 'weak'
  }

  return { strength, score, feedback }
}

/**
 * Validate password change (old vs new)
 */
export const changePasswordSchema = z.object({
  oldPassword: z.string().min(1, 'Eski parolni kiriting'),
  newPassword: passwordSchema,
  confirmPassword: z.string().min(1, 'Parolni tasdiqlang'),
}).refine(
  (data) => data.newPassword === data.confirmPassword,
  {
    message: 'Yangi parollar mos kelmadi',
    path: ['confirmPassword'],
  }
).refine(
  (data) => data.oldPassword !== data.newPassword,
  {
    message: 'Yangi parol eski paroldan farq qilishi kerak',
    path: ['newPassword'],
  }
)

export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>

/**
 * Admin/Staff password reset schema (simplified)
 * For admin resetting user passwords
 */
export const resetPasswordSchema = z.object({
  newPassword: passwordSchema,
  confirmPassword: z.string().min(1, 'Parolni tasdiqlang'),
}).refine(
  (data) => data.newPassword === data.confirmPassword,
  {
    message: 'Parollar mos kelmadi',
    path: ['confirmPassword'],
  }
)

export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>

