import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { db } from './db'
import { UserRole } from '@prisma/client'

export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
    // ✅ SECURITY: Reduced session duration for better security
    // 7 days instead of 30 days - stolen tokens expire faster
    maxAge: 7 * 24 * 60 * 60, // 7 days
    // Update session age every hour
    updateAge: 60 * 60, // 1 hour
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Telefon/Email va parol kiriting')
        }

        try {
          // Determine if input is phone or email
          const isPhone = /^[\d\s\+\-\(\)]+$/.test(credentials.email.trim())
          
          // Find user by phone or email
          let user
          if (isPhone) {
          // Clean phone number (remove spaces, +, -, etc.)
          const cleanPhone = credentials.email.replace(/[\s\+\-\(\)]/g, '')
          
          user = await db.user.findFirst({
            where: {
              phone: {
                contains: cleanPhone
              },
              role: 'PARENT' // Faqat parent'lar telefon orqali kiradi
            },
            include: {
              tenant: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  status: true,
                  subscriptionPlan: true,
                  subscriptionEnd: true,
                  trialEndsAt: true,
                },
              },
            },
          })
        } else {
          // Email orqali qidiruv — case-insensitive (boshqa rollar uchun)
          user = await db.user.findFirst({
            where: { email: { equals: credentials.email.trim(), mode: 'insensitive' } },
            include: {
              tenant: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  status: true,
                  subscriptionPlan: true,
                  subscriptionEnd: true,
                  trialEndsAt: true,
                },
              },
            },
          })
        }

        if (!user) {
          throw new Error('Foydalanuvchi topilmadi')
        }

        // Check if user is active
        if (!user.isActive) {
          throw new Error('Hisobingiz faol emas')
        }

        // Check password
        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        )

        if (!isPasswordValid) {
          throw new Error('Parol noto\'g\'ri')
        }

        // Super admin can always login (no tenant check)
        if (user.role === 'SUPER_ADMIN') {
          return {
            id: user.id,
            email: user.email,
            fullName: user.fullName,
            avatar: user.avatar,
            role: user.role,
            tenantId: null,
            tenant: null,
          }
        }

        // Check tenant status for non-super-admin users
        if (!user.tenant) {
          throw new Error('Maktab topilmadi')
        }

        // Check tenant status
        const { status } = user.tenant

        // Block if tenant is BLOCKED
        if (status === 'BLOCKED') {
          throw new Error('Hisobingiz bloklangan. Administrator bilan bog\'laning.')
        }

        // Allow SUSPENDED but will be restricted in middleware
        // Allow GRACE_PERIOD with warning
        // Allow ACTIVE and TRIAL

          // Update last login
          await db.user.update({
            where: { id: user.id },
            data: { lastLogin: new Date() },
          })

          return {
            id: user.id,
            email: user.email,
            fullName: user.fullName,
            avatar: user.avatar,
            role: user.role,
            tenantId: user.tenantId,
            tenant: user.tenant,
          }
        } catch (error: any) {
          // Database connection error or table not found
          if (error.code === 'P1001' || error.message?.includes('does not exist')) {
            console.error('Database error:', error)
            throw new Error('Database connection failed. Please contact administrator.')
          }
          // Re-throw other errors
          throw error
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
        token.tenantId = user.tenantId
        token.tenant = user.tenant
        token.fullName = user.fullName
        // NOTE: avatar is NOT stored in JWT to keep cookie size small
        // (base64 images can be 50-100KB which causes HTTP 431 errors)
        // Avatar is fetched from DB in each layout server component instead
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        session.user.role = token.role as UserRole
        session.user.tenantId = token.tenantId as string | null
        session.user.tenant = token.tenant as any
        session.user.fullName = token.fullName as string
        // avatar is intentionally omitted from session/JWT
      }
      return session
    },
  },
  debug: process.env.NODE_ENV === 'development',
}

/**
 * Hash password
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

/**
 * Verify password
 */
export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

/**
 * Check if user has permission
 */
export function hasPermission(userRole: UserRole, requiredRoles: UserRole[]): boolean {
  return requiredRoles.includes(userRole)
}

/**
 * Check if user is super admin
 */
export function isSuperAdmin(role: UserRole): boolean {
  return role === 'SUPER_ADMIN'
}

/**
 * Check if user is admin (maktab admin or super admin)
 */
export function isAdmin(role: UserRole): boolean {
  return role === 'SUPER_ADMIN' || role === 'ADMIN'
}

/**
 * Check if user is teacher
 */
export function isTeacher(role: UserRole): boolean {
  return role === 'TEACHER'
}

/**
 * Check if user is parent
 */
export function isParent(role: UserRole): boolean {
  return role === 'PARENT'
}

/**
 * Check if user is student
 */
export function isStudent(role: UserRole): boolean {
  return role === 'STUDENT'
}

/**
 * Check if user is cook (oshxona xodimi)
 */
export function isCook(role: UserRole): boolean {
  return role === 'COOK'
}

/**
 * Check if user can access admin panel (ADMIN or SUPER_ADMIN)
 */
export function canAccessAdmin(role: UserRole): boolean {
  return role === 'ADMIN' || role === 'SUPER_ADMIN'
}

/**
 * Safe getServerSession wrapper with error handling
 * Prevents crashes when database connection fails
 */
export async function getSafeSession() {
  try {
    const { getServerSession } = await import('next-auth')
    const session = await getServerSession(authOptions)
    return session
  } catch (error) {
    // Log error in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error getting session:', error)
    }
    // Return null in production to prevent crash
    return null
  }
}

