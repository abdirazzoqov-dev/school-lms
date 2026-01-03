import { UserRole, TenantStatus, SubscriptionPlan } from '@prisma/client'
import NextAuth, { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      role: UserRole
      tenantId: string | null
      fullName: string
      avatar: string | null
      tenant: {
        id: string
        name: string
        slug: string
        status: TenantStatus
        subscriptionPlan: SubscriptionPlan
        subscriptionEnd: Date | null
        trialEndsAt: Date | null
      } | null
    } & DefaultSession['user']
  }

  interface User {
    id: string
    role: UserRole
    tenantId: string | null
    fullName: string
    avatar: string | null
    tenant: {
      id: string
      name: string
      slug: string
      status: TenantStatus
      subscriptionPlan: SubscriptionPlan
      subscriptionEnd: Date | null
      trialEndsAt: Date | null
    } | null
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: UserRole
    tenantId: string | null
    fullName: string
    avatar: string | null
    tenant: {
      id: string
      name: string
      slug: string
      status: TenantStatus
      subscriptionPlan: SubscriptionPlan
      subscriptionEnd: Date | null
      trialEndsAt: Date | null
    } | null
  }
}

