/**
 * Server-side helper functions
 * Safe wrappers for common operations
 */

import { getServerSession } from 'next-auth'
import { authOptions } from './auth'
import { redirect } from 'next/navigation'
import { db } from './db'
import { UserRole } from '@prisma/client'

/**
 * Safe getServerSession with error handling
 */
export async function getSafeServerSession() {
  try {
    return await getServerSession(authOptions)
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error getting session:', error)
    }
    return null
  }
}

/**
 * Require authentication and return session
 * Redirects to login if not authenticated
 */
export async function requireAuth() {
  const session = await getSafeServerSession()
  
  if (!session) {
    redirect('/login')
  }
  
  return session
}

/**
 * Require specific role(s)
 * Redirects to unauthorized if role doesn't match
 */
export async function requireRole(requiredRoles: UserRole | UserRole[]) {
  const session = await requireAuth()
  const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles]
  
  if (!roles.includes(session.user.role)) {
    redirect('/unauthorized')
  }
  
  return session
}

/**
 * Require admin role (ADMIN or SUPER_ADMIN)
 */
export async function requireAdmin() {
  return requireRole(['ADMIN', 'SUPER_ADMIN'])
}

/**
 * Safe database query wrapper
 * Returns null on error instead of throwing
 */
export async function safeQuery<T>(
  queryFn: () => Promise<T>,
  fallback: T
): Promise<T> {
  try {
    return await queryFn()
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Database query error:', error)
    }
    return fallback
  }
}

/**
 * Check database connection
 */
export async function isDatabaseConnected(): Promise<boolean> {
  try {
    if (!db) return false
    await db.$queryRaw`SELECT 1`
    return true
  } catch {
    return false
  }
}

