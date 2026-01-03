import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'
import { UserRole, TenantStatus } from '@prisma/client'

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const path = req.nextUrl.pathname

    // Super Admin routes
    if (path.startsWith('/super-admin')) {
      if (token?.role !== 'SUPER_ADMIN') {
        return NextResponse.redirect(new URL('/unauthorized', req.url))
      }
      return NextResponse.next()
    }

    // Role-based routing
    const role = token?.role as UserRole

    // Admin routes - SUPER_ADMIN ham kirishi mumkin
    if (path.startsWith('/admin')) {
      if (role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
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
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
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

