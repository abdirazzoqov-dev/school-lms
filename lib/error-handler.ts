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

  // In production, generic message
  return {
    success: false,
    error: 'Xatolik yuz berdi. Iltimos, keyinroq urinib ko\'ring.',
  }
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

