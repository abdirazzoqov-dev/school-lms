/**
 * API Route Helpers
 * Centralized utilities for API routes
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions, canAccessAdmin, isAdmin } from './auth'
import { logger } from './logger'
import { UserRole } from '@prisma/client'

/**
 * API Response wrapper for consistent responses
 */
export class ApiResponse {
  static success<T>(data: T, status: number = 200) {
    return NextResponse.json(
      { success: true, data },
      { status }
    )
  }

  static error(message: string, status: number = 400, code?: string) {
    logger.warn(`API Error: ${message}`, { metadata: { code, status } })
    return NextResponse.json(
      { success: false, error: message, code },
      { status }
    )
  }

  static unauthorized(message: string = 'Ruxsat berilmagan') {
    return NextResponse.json(
      { success: false, error: message },
      { status: 401 }
    )
  }

  static forbidden(message: string = 'Sizda bu amalni bajarish huquqi yo\'q') {
    return NextResponse.json(
      { success: false, error: message },
      { status: 403 }
    )
  }

  static notFound(message: string = 'Ma\'lumot topilmadi') {
    return NextResponse.json(
      { success: false, error: message },
      { status: 404 }
    )
  }

  static serverError(message: string = 'Serverda xatolik yuz berdi') {
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    )
  }

  static badRequest(message: string = 'Noto\'g\'ri so\'rov') {
    return NextResponse.json(
      { success: false, error: message },
      { status: 400 }
    )
  }
}

/**
 * Session validation with role check
 */
export async function validateSession(
  requiredRole?: UserRole | UserRole[]
): Promise<
  | { success: true; session: any; userId: string; tenantId: string | null }
  | { success: false; response: NextResponse }
> {
  const session = await getServerSession(authOptions)

  if (!session) {
    logger.security('Unauthorized API access attempt')
    return {
      success: false,
      response: ApiResponse.unauthorized(),
    }
  }

  // Check role if required
  if (requiredRole) {
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole]
    if (!roles.includes(session.user.role)) {
      logger.security('Forbidden API access attempt', session.user.id, {
        requiredRole,
        actualRole: session.user.role,
      })
      return {
        success: false,
        response: ApiResponse.forbidden(),
      }
    }
  }

  return {
    success: true,
    session,
    userId: session.user.id,
    tenantId: session.user.tenantId,
  }
}

/**
 * Admin-only route guard
 */
export async function requireAdmin() {
  const result = await validateSession(['ADMIN', 'SUPER_ADMIN'])
  
  if (!result.success) {
    return result
  }

  if (!result.session.user.role || !canAccessAdmin(result.session.user.role)) {
    logger.security('Non-admin tried to access admin API', result.userId)
    return {
      success: false as const,
      response: ApiResponse.forbidden('Faqat adminlar uchun'),
    }
  }

  return result
}

/**
 * Tenant isolation check
 */
export function validateTenantAccess(
  userTenantId: string | null,
  resourceTenantId: string
): boolean {
  // SUPER_ADMIN can access any tenant
  if (!userTenantId) return true
  
  // Regular users can only access their own tenant
  return userTenantId === resourceTenantId
}

/**
 * API route wrapper with error handling and timing
 */
export function apiHandler(
  handler: (req: NextRequest) => Promise<NextResponse>,
  options: {
    method?: string
    requireAuth?: boolean
    requiredRole?: UserRole | UserRole[]
  } = {}
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const start = Date.now()
    const path = req.nextUrl.pathname

    try {
      // Auth check if required
      if (options.requireAuth || options.requiredRole) {
        const validation = await validateSession(options.requiredRole)
        if (!validation.success) {
          return validation.response
        }
      }

      // Execute handler
      const response = await handler(req)
      
      // Log successful request
      const duration = Date.now() - start
      logger.apiRequest(
        options.method || req.method,
        path,
        undefined,
        undefined,
        duration
      )

      return response
    } catch (error) {
      const duration = Date.now() - start
      logger.error(`API error: ${path}`, error, {
        action: 'API_ERROR',
        duration,
        metadata: { method: req.method, path },
      })

      return ApiResponse.serverError()
    }
  }
}

/**
 * Parse and validate pagination params
 */
export function parsePaginationParams(searchParams: URLSearchParams): {
  page: number
  pageSize: number
  skip: number
} {
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
  const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '25')))
  const skip = (page - 1) * pageSize

  return { page, pageSize, skip }
}

/**
 * Build pagination response
 */
export function buildPaginationResponse<T>(
  data: T[],
  totalCount: number,
  page: number,
  pageSize: number
) {
  const totalPages = Math.ceil(totalCount / pageSize)
  
  return {
    data,
    pagination: {
      page,
      pageSize,
      totalCount,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  }
}

