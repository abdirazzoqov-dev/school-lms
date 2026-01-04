/**
 * Error Handler Utility
 * Prevents information disclosure in production
 */

import { logger } from './logger'

export function handleError(error: unknown, context?: {
  userId?: string
  tenantId?: string
  action?: string
}): {
  success: false
  error: string
} {
  // Log full error to server with context
  logger.error('Application error', error, context)

  // In development, show more details
  if (process.env.NODE_ENV === 'development') {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error'
    return {
      success: false,
      error: errorMessage,
    }
  }

  // In production, generic message (no information disclosure)
  return {
    success: false,
    error: 'Xatolik yuz berdi. Iltimos, keyinroq urinib ko\'ring.',
  }
}

/**
 * Safe error message for production
 * Prevents information disclosure
 */
export function getSafeErrorMessage(error: unknown): string {
  if (process.env.NODE_ENV === 'development') {
    return error instanceof Error ? error.message : 'Unknown error'
  }
  
  // Production: generic message
  if (error instanceof Error) {
    // Check for specific error types
    if (error.message.includes('P1001') || error.message.includes('Can\'t reach database')) {
      return 'Ma\'lumotlar bazasiga ulanib bo\'lmadi. Iltimos, keyinroq urinib ko\'ring.'
    }
    if (error.message.includes('P2002') || error.message.includes('Unique constraint')) {
      return 'Bu ma\'lumot allaqachon mavjud.'
    }
    if (error.message.includes('P2025') || error.message.includes('Record not found')) {
      return 'Ma\'lumot topilmadi.'
    }
  }
  
  return 'Xatolik yuz berdi. Iltimos, keyinroq urinib ko\'ring.'
}

/**
 * Handle Prisma errors specifically
 */
export function handlePrismaError(error: any, context?: {
  userId?: string
  tenantId?: string
  action?: string
}): {
  success: false
  error: string
} {
  logger.error('Prisma database error', error, context)

  // Common Prisma errors
  if (error.code === 'P2002') {
    // Unique constraint violation
    return {
      success: false,
      error: 'Bu ma\'lumot allaqachon mavjud.',
    }
  }

  if (error.code === 'P2025') {
    // Record not found
    return {
      success: false,
      error: 'Ma\'lumot topilmadi.',
    }
  }

  if (error.code === 'P2003') {
    // Foreign key constraint
    return {
      success: false,
      error: 'Bu ma\'lumot boshqa joyda ishlatilmoqda.',
    }
  }

  // Generic error
  return handleError(error)
}

