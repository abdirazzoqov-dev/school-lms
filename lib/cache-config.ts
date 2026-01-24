/**
 * Advanced Caching Configuration
 * Optimized revalidation strategy for different page types
 */

/**
 * Cache Duration Constants (in seconds)
 */
export const CACHE_DURATION = {
  // Static content - rarely changes
  STATIC: 3600, // 1 hour
  
  // Dashboard - frequent updates
  DASHBOARD: 30, // 30 seconds
  
  // Lists with pagination
  LIST: 60, // 1 minute
  
  // Detail pages
  DETAIL: 120, // 2 minutes
  
  // Reports and analytics
  REPORTS: 300, // 5 minutes
  
  // Settings
  SETTINGS: 600, // 10 minutes
  
  // Real-time data (attendance, messages)
  REALTIME: 10, // 10 seconds
} as const

/**
 * Cache Tags for Granular Revalidation
 */
export const CACHE_TAGS = {
  // Core entities
  STUDENTS: 'students',
  TEACHERS: 'teachers',
  CLASSES: 'classes',
  SUBJECTS: 'subjects',
  
  // Educational data
  ATTENDANCE: 'attendance',
  GRADES: 'grades',
  ASSIGNMENTS: 'assignments',
  
  // Financial
  PAYMENTS: 'payments',
  EXPENSES: 'expenses',
  
  // Communication
  MESSAGES: 'messages',
  ANNOUNCEMENTS: 'announcements',
  NOTIFICATIONS: 'notifications',
  
  // Dormitory
  DORMITORY: 'dormitory',
  
  // Kitchen
  KITCHEN: 'kitchen',
  
  // Salary
  SALARIES: 'salaries',
  
  // Schedule
  SCHEDULES: 'schedules',
  
  // Dashboard
  DASHBOARD: 'dashboard',
} as const

/**
 * Revalidation Path Groups
 * When one entity changes, these paths should be revalidated
 */
export const REVALIDATION_PATHS = {
  // Student changes affect these paths
  STUDENT_CHANGED: [
    '/admin',
    '/admin/students',
    '/admin/payments',
    '/admin/attendance',
    '/admin/grades',
    '/parent',
    '/parent/payments',
    '/parent/profile',
  ],
  
  // Teacher changes affect these paths
  TEACHER_CHANGED: [
    '/admin',
    '/admin/teachers',
    '/admin/schedules',
  ],
  
  // Payment changes affect these paths
  PAYMENT_CHANGED: [
    '/admin',
    '/admin/payments',
    '/admin/reports',
  ],
  
  // Attendance changes affect these paths
  ATTENDANCE_CHANGED: [
    '/admin',
    '/admin/attendance',
    '/admin/reports',
  ],
  
  // Grade changes affect these paths
  GRADE_CHANGED: [
    '/admin',
    '/admin/grades',
    '/admin/reports',
  ],
  
  // Expense changes affect these paths
  EXPENSE_CHANGED: [
    '/admin',
    '/admin/expenses',
    '/admin/reports',
  ],
  
  // Salary changes affect these paths
  SALARY_CHANGED: [
    '/admin',
    '/admin/salaries',
    '/admin/reports',
  ],
  
  // Class changes affect these paths
  CLASS_CHANGED: [
    '/admin',
    '/admin/classes',
    '/admin/students',
    '/admin/schedules',
  ],
  
  // Schedule changes affect these paths
  SCHEDULE_CHANGED: [
    '/admin',
    '/admin/schedules',
    '/admin/schedules/builder',
    '/teacher',
  ],
  
  // Message changes affect these paths
  MESSAGE_CHANGED: [
    '/admin/messages',
    '/teacher/messages',
    '/parent/messages',
  ],
  
  // Announcement changes affect these paths
  ANNOUNCEMENT_CHANGED: [
    '/admin/announcements',
    '/teacher',
    '/parent',
  ],
  
  // Dormitory changes affect these paths
  DORMITORY_CHANGED: [
    '/admin',
    '/admin/dormitory',
  ],
  
  // Kitchen changes affect these paths
  KITCHEN_CHANGED: [
    '/admin',
    '/admin/kitchen',
  ],
} as const

/**
 * Revalidate multiple paths at once
 */
export function revalidateMultiplePaths(paths: string[], revalidatePathFn: (path: string) => void) {
  paths.forEach(path => revalidatePathFn(path))
}

/**
 * Cache Configuration for Different Page Types
 */
export const PAGE_CACHE_CONFIG = {
  // Admin Dashboard
  admin: {
    revalidate: CACHE_DURATION.DASHBOARD,
    tags: [CACHE_TAGS.DASHBOARD, CACHE_TAGS.STUDENTS, CACHE_TAGS.PAYMENTS],
  },
  
  // Student List
  students: {
    revalidate: CACHE_DURATION.LIST,
    tags: [CACHE_TAGS.STUDENTS],
  },
  
  // Student Detail
  studentDetail: {
    revalidate: CACHE_DURATION.DETAIL,
    tags: [CACHE_TAGS.STUDENTS, CACHE_TAGS.PAYMENTS, CACHE_TAGS.GRADES, CACHE_TAGS.ATTENDANCE],
  },
  
  // Teachers List
  teachers: {
    revalidate: CACHE_DURATION.LIST,
    tags: [CACHE_TAGS.TEACHERS],
  },
  
  // Payments
  payments: {
    revalidate: CACHE_DURATION.LIST,
    tags: [CACHE_TAGS.PAYMENTS, CACHE_TAGS.STUDENTS],
  },
  
  // Attendance
  attendance: {
    revalidate: CACHE_DURATION.REALTIME,
    tags: [CACHE_TAGS.ATTENDANCE],
  },
  
  // Grades
  grades: {
    revalidate: CACHE_DURATION.LIST,
    tags: [CACHE_TAGS.GRADES],
  },
  
  // Reports
  reports: {
    revalidate: CACHE_DURATION.REPORTS,
    tags: [CACHE_TAGS.STUDENTS, CACHE_TAGS.PAYMENTS, CACHE_TAGS.ATTENDANCE, CACHE_TAGS.GRADES],
  },
  
  // Settings
  settings: {
    revalidate: CACHE_DURATION.SETTINGS,
    tags: [],
  },
} as const

/**
 * ISR (Incremental Static Regeneration) Configuration
 */
export const ISR_CONFIG = {
  // Enable ISR for static-like pages
  enabled: true,
  
  // Fallback behavior
  fallback: 'blocking', // 'blocking' or false or true
  
  // Static page generation
  generateStaticParams: true,
}

