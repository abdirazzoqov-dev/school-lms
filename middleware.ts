import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'
import { UserRole, TenantStatus } from '@prisma/client'
import { getRateLimitKey, checkRateLimit } from '@/lib/rate-limit'

export default withAuth(
  function middleware(req) {
    try {
      const token = req.nextauth.token
      const path = req.nextUrl.pathname

      // ✅ SECURITY: Rate Limiting - DDoS himoyasi
      // Login va API routes uchun rate limiting
      if (path.startsWith('/api') || path === '/login') {
        const key = getRateLimitKey(req)
        const rateLimitResult = checkRateLimit(key)
        
        if (!rateLimitResult.success) {
          return NextResponse.json(
            {
              error: 'Too many requests',
              message: 'Juda ko\'p so\'rov yuborildi. Iltimos, biroz kutib turing.',
            },
            {
              status: 429,
              headers: {
                'X-RateLimit-Limit': rateLimitResult.limit.toString(),
                'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
                'X-RateLimit-Reset': new Date(rateLimitResult.reset).toISOString(),
                'Retry-After': Math.ceil((rateLimitResult.reset - Date.now()) / 1000).toString(),
              },
            }
          )
        }
      }

      // If no token, let withAuth handle it (redirect to login)
      if (!token) {
        return NextResponse.next()
      }

      // Super Admin routes
      if (path.startsWith('/super-admin')) {
        if (token?.role !== 'SUPER_ADMIN') {
          return NextResponse.redirect(new URL('/unauthorized', req.url))
        }
        return NextResponse.next()
      }

      // Role-based routing
      const role = token?.role as UserRole

      // Admin routes - SUPER_ADMIN va MODERATOR ham kirishi mumkin
      if (path.startsWith('/admin')) {
        if (role !== 'ADMIN' && role !== 'SUPER_ADMIN' && role !== 'MODERATOR') {
          return NextResponse.redirect(new URL('/unauthorized', req.url))
        }
      }

      // Check tenant status for non-super-admin users (after role check)
      if (token?.role !== 'SUPER_ADMIN' && token?.tenant) {
        const tenantStatus = token.tenant.status as TenantStatus

        // BLOCKED - umuman kira olmaydi
        if (tenantStatus === 'BLOCKED') {
          return NextResponse.redirect(new URL('/blocked', req.url))
        }

        // SUSPENDED - faqat to'lov sahifasiga kiradi
        if (tenantStatus === 'SUSPENDED') {
          if (!path.startsWith('/payment-required') && !path.startsWith('/api')) {
            return NextResponse.redirect(new URL('/payment-required', req.url))
          }
        }

        // GRACE_PERIOD - warning banner ko'rsatiladi (middleware'da to'xtatmaydi)
        // TRIAL va ACTIVE - to'liq access
      }

      // Teacher routes
      if (path.startsWith('/teacher')) {
        if (role !== 'TEACHER') {
          return NextResponse.redirect(new URL('/unauthorized', req.url))
        }
      }

      // Parent routes
      if (path.startsWith('/parent')) {
        if (role !== 'PARENT') {
          return NextResponse.redirect(new URL('/unauthorized', req.url))
        }
      }

      // Student routes (Phase 3)
      if (path.startsWith('/student')) {
        if (role !== 'STUDENT') {
          return NextResponse.redirect(new URL('/unauthorized', req.url))
        }
      }

      // Cook routes (Oshxona)
      if (path.startsWith('/cook')) {
        if (role !== 'COOK') {
          return NextResponse.redirect(new URL('/unauthorized', req.url))
        }
      }

      return NextResponse.next()
    } catch (error) {
      // Log error in development
      if (process.env.NODE_ENV === 'development') {
        console.error('Middleware error:', error)
      }
      // In production, allow request to continue (let error boundary handle it)
      return NextResponse.next()
    }
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: '/login',
    },
  }
)

// Protect these routes
export const config = {
  matcher: [
    '/super-admin/:path*',
    '/admin/:path*',
    '/teacher/:path*',
    '/parent/:path*',
    '/student/:path*',
    '/cook/:path*',
    '/api/admin/:path*',
    '/api/teacher/:path*',
    '/api/parent/:path*',
    '/api/student/:path*',
    '/api/cook/:path*',
  ],
}

