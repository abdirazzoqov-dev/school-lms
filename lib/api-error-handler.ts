/**
 * ✅ SECURITY: API Error Handler
 * Prevents information disclosure in production
 * Provides consistent error responses
 */

import { NextResponse } from 'next/server'
import { logger } from './logger'
import { Prisma } from '@prisma/client'

interface ErrorContext {
  userId?: string
  tenantId?: string | null
  action?: string
  path?: string
  method?: string
}

/**
 * Handle API errors with proper logging and safe error messages
 */
export function handleApiError(
  error: unknown,
  context?: ErrorContext
): NextResponse {
  // Log full error details to server
  logger.error('API Error', error, context)

  // Production: Return generic messages to prevent information disclosure
  if (process.env.NODE_ENV === 'production') {
    return getProductionErrorResponse(error)
  }

  // Development: Return detailed errors for debugging
  return getDevelopmentErrorResponse(error)
}

/**
 * Get safe error response for production
 */
function getProductionErrorResponse(error: unknown): NextResponse {
  // Handle specific known errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002': // Unique constraint failed
        return NextResponse.json(
          { error: 'Bu ma\'lumot allaqachon mavjud' },
          { status: 409 }
        )
      case 'P2025': // Record not found
        return NextResponse.json(
          { error: 'Ma\'lumot topilmadi' },
          { status: 404 }
        )
      case 'P2003': // Foreign key constraint failed
        return NextResponse.json(
          { error: 'Bog\'liq ma\'lumotlar mavjud. Avval ularni o\'chiring' },
          { status: 400 }
        )
      case 'P1001': // Can't reach database
        return NextResponse.json(
          { error: 'Ma\'lumotlar bazasiga ulanib bo\'lmadi' },
          { status: 503 }
        )
      default:
        return NextResponse.json(
          { error: 'Ma\'lumotlar bazasi xatosi' },
          { status: 500 }
        )
    }
  }

  // Handle validation errors
  if (error instanceof Error && error.message.includes('validation')) {
    return NextResponse.json(
      { error: 'Ma\'lumotlar noto\'g\'ri formatda' },
      { status: 400 }
    )
  }

  // Default generic error
  return NextResponse.json(
    { error: 'Serverda xatolik yuz berdi. Iltimos, keyinroq urinib ko\'ring' },
    { status: 500 }
  )
}

/**
 * Get detailed error response for development
 */
function getDevelopmentErrorResponse(error: unknown): NextResponse {
  if (error instanceof Error) {
    return NextResponse.json(
      {
        error: error.message,
        stack: error.stack,
        name: error.name,
      },
      { status: 500 }
    )
  }

  return NextResponse.json(
    {
      error: 'Unknown error',
      details: String(error),
    },
    { status: 500 }
  )
}

/**
 * Create standardized API error responses
 */
export class ApiError {
  static badRequest(message: string = 'Noto\'g\'ri so\'rov'): NextResponse {
    return NextResponse.json({ error: message }, { status: 400 })
  }

  static unauthorized(message: string = 'Autentifikatsiya talab qilinadi'): NextResponse {
    return NextResponse.json({ error: message }, { status: 401 })
  }

  static forbidden(message: string = 'Ruxsat berilmagan'): NextResponse {
    return NextResponse.json({ error: message }, { status: 403 })
  }

  static notFound(message: string = 'Topilmadi'): NextResponse {
    return NextResponse.json({ error: message }, { status: 404 })
  }

  static conflict(message: string = 'Konflikt'): NextResponse {
    return NextResponse.json({ error: message }, { status: 409 })
  }

  static tooManyRequests(message: string = 'Juda ko\'p so\'rov yuborildi'): NextResponse {
    return NextResponse.json({ error: message }, { status: 429 })
  }

  static serverError(message: string = 'Serverda xatolik'): NextResponse {
    return NextResponse.json({ error: message }, { status: 500 })
  }

  static serviceUnavailable(message: string = 'Xizmat vaqtincha mavjud emas'): NextResponse {
    return NextResponse.json({ error: message }, { status: 503 })
  }
}

/**
 * Success responses
 */
export class ApiSuccess {
  static ok(data: any, message?: string): NextResponse {
    return NextResponse.json({
      success: true,
      ...(message && { message }),
      ...data,
    })
  }

  static created(data: any, message?: string): NextResponse {
    return NextResponse.json(
      {
        success: true,
        ...(message && { message }),
        ...data,
      },
      { status: 201 }
    )
  }

  static noContent(): NextResponse {
    return new NextResponse(null, { status: 204 })
  }
}

