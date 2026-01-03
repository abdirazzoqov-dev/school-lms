/**
 * Application Constants
 * Centralized configuration values
 */

// ============================================
// SUBSCRIPTION PLANS
// ============================================

export const SUBSCRIPTION_LIMITS = {
  BASIC: {
    maxStudents: 50,
    maxTeachers: 10,
    price: 500000, // so'm/oy
  },
  STANDARD: {
    maxStudents: 200,
    maxTeachers: 30,
    price: 1500000, // so'm/oy
  },
  PREMIUM: {
    maxStudents: 9999,
    maxTeachers: 9999,
    price: 3000000, // so'm/oy
  },
} as const

// ============================================
// TRIAL AND GRACE PERIODS
// ============================================

export const SUBSCRIPTION_PERIODS = {
  TRIAL_DAYS: 30,
  GRACE_PERIOD_DAYS: 7,
} as const

// ============================================
// FILE UPLOAD
// ============================================

export const FILE_UPLOAD = {
  MAX_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  ALLOWED_DOCUMENT_TYPES: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  ALLOWED_MATERIAL_TYPES: ['application/pdf', 'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'],
} as const

// ============================================
// PAGINATION
// ============================================

export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 50,
  MAX_PAGE_SIZE: 100,
} as const

// ============================================
// ACADEMIC YEAR
// ============================================

export const ACADEMIC_YEAR = {
  START_MONTH: 9, // September
  END_MONTH: 6, // June
} as const

// ============================================
// GRADE TYPES
// ============================================

export const GRADE_TYPES = {
  ORAL: 'Og\'zaki',
  WRITTEN: 'Yozma',
  TEST: 'Test',
  EXAM: 'Imtihon',
  QUARTER: 'Chorak',
  FINAL: 'Yillik',
} as const

// ============================================
// ATTENDANCE STATUS
// ============================================

export const ATTENDANCE_STATUS = {
  PRESENT: 'Bor',
  ABSENT: 'Yo\'q',
  LATE: 'Kech keldi',
  EXCUSED: 'Sababli',
} as const

// ============================================
// PAYMENT METHODS
// ============================================

export const PAYMENT_METHODS = {
  CASH: 'Naqd',
  CLICK: 'Click',
  PAYME: 'Payme',
  UZUM: 'Uzum',
} as const

// ============================================
// PAYMENT STATUS
// ============================================

export const PAYMENT_STATUS = {
  PENDING: 'Kutilmoqda',
  COMPLETED: 'To\'langan',
  FAILED: 'Muvaffaqiyatsiz',
  REFUNDED: 'Qaytarilgan',
} as const

// ============================================
// PAYMENT TYPES
// ============================================

export const PAYMENT_TYPES = {
  TUITION: 'O\'qish haqi',
  BOOKS: 'Darsliklar',
  UNIFORM: 'Forma',
  OTHER: 'Boshqa',
} as const

// ============================================
// TENANT STATUS
// ============================================

export const TENANT_STATUS = {
  TRIAL: 'Sinov davri',
  ACTIVE: 'Faol',
  GRACE_PERIOD: 'Muhlat davri',
  SUSPENDED: 'To\'xtatilgan',
  BLOCKED: 'Bloklangan',
} as const

// ============================================
// USER ROLES
// ============================================

export const USER_ROLES = {
  SUPER_ADMIN: 'Super Administrator',
  ADMIN: 'Administrator',
  MODERATOR: 'Moderator',
  TEACHER: 'O\'qituvchi',
  PARENT: 'Ota-ona',
  STUDENT: 'O\'quvchi',
  COOK: 'Oshpaz',
} as const

// ============================================
// WEEKDAYS (0 = Sunday, 6 = Saturday)
// ============================================

export const WEEKDAYS = {
  0: 'Yakshanba',
  1: 'Dushanba',
  2: 'Seshanba',
  3: 'Chorshanba',
  4: 'Payshanba',
  5: 'Juma',
  6: 'Shanba',
} as const

// ============================================
// VALIDATION RULES
// ============================================

export const VALIDATION_RULES = {
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_REQUIRES_NUMBER: true,
  PASSWORD_REQUIRES_UPPERCASE: true,
  PASSWORD_REQUIRES_SPECIAL: true,
  
  PHONE_REGEX: /^\+998\s?\d{2}\s?\d{3}\s?\d{2}\s?\d{2}$/,
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  
  STUDENT_CODE_MIN_LENGTH: 3,
  TEACHER_CODE_MIN_LENGTH: 3,
  
  CLASS_NAME_MAX_LENGTH: 50,
  SUBJECT_CODE_MAX_LENGTH: 10,
} as const

// ============================================
// RATE LIMITING
// ============================================

export const RATE_LIMITS = {
  API_REQUESTS_PER_MINUTE: 60,
  LOGIN_ATTEMPTS: 5,
  LOGIN_LOCKOUT_MINUTES: 15,
} as const

// ============================================
// SESSION
// ============================================

export const SESSION = {
  MAX_AGE: 30 * 24 * 60 * 60, // 30 days in seconds
  UPDATE_AGE: 24 * 60 * 60, // 24 hours in seconds
} as const

// ============================================
// DEFAULT VALUES
// ============================================

export const DEFAULTS = {
  PARENT_PASSWORD: 'Parent123!',
  STUDENT_PASSWORD: 'Student123!',
  TEACHER_PASSWORD: 'Teacher123!',
  ADMIN_PASSWORD: 'Admin123!',
  
  CLASS_MAX_STUDENTS: 30,
  SUBJECT_HOURS_PER_WEEK: 2,
  
  INVOICE_PREFIX: 'INV',
  RECEIPT_PREFIX: 'REC',
} as const

// ============================================
// NOTIFICATION TYPES
// ============================================

export const NOTIFICATION_TYPES = {
  GRADE: 'Yangi baho',
  ATTENDANCE: 'Davomat',
  PAYMENT: 'To\'lov',
  ANNOUNCEMENT: 'E\'lon',
  MESSAGE: 'Xabar',
  SYSTEM: 'Tizim',
} as const

// ============================================
// PRIORITY LEVELS
// ============================================

export const PRIORITY_LEVELS = {
  LOW: 'Past',
  MEDIUM: 'O\'rta',
  HIGH: 'Yuqori',
  URGENT: 'Shoshilinch',
} as const

// ============================================
// DATE FORMATS
// ============================================

export const DATE_FORMATS = {
  DISPLAY: 'dd MMMM yyyy',
  DISPLAY_WITH_TIME: 'dd MMMM yyyy, HH:mm',
  INPUT: 'yyyy-MM-dd',
  API: 'yyyy-MM-dd\'T\'HH:mm:ss',
} as const

// ============================================
// COLORS (for UI)
// ============================================

export const COLORS = {
  PRIMARY: '#3B82F6',
  SECONDARY: '#6B7280',
  SUCCESS: '#10B981',
  WARNING: '#F59E0B',
  DANGER: '#EF4444',
  INFO: '#3B82F6',
} as const

// ============================================
// EXPORT FORMATS
// ============================================

export const EXPORT_FORMATS = {
  PDF: 'pdf',
  EXCEL: 'xlsx',
  CSV: 'csv',
} as const

