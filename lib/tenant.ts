import { TenantStatus } from '@prisma/client'
import { db } from './db'

/**
 * Check if tenant is active and can access the system
 */
export async function checkTenantAccess(tenantId: string): Promise<{
  canAccess: boolean
  status: TenantStatus
  message?: string
}> {
  const tenant = await db.tenant.findUnique({
    where: { id: tenantId },
    select: {
      status: true,
      subscriptionEnd: true,
      trialEndsAt: true,
    },
  })

  if (!tenant) {
    return {
      canAccess: false,
      status: 'BLOCKED' as TenantStatus,
      message: 'Maktab topilmadi',
    }
  }

  const now = new Date()

  switch (tenant.status) {
    case 'ACTIVE':
      // Check if subscription has expired
      if (tenant.subscriptionEnd && tenant.subscriptionEnd < now) {
        // Move to grace period
        await db.tenant.update({
          where: { id: tenantId },
          data: { status: 'GRACE_PERIOD' },
        })
        return {
          canAccess: true,
          status: 'GRACE_PERIOD',
          message: 'Obuna muddati tugadi. 7 kun ichida to\'lov qiling.',
        }
      }
      return { canAccess: true, status: 'ACTIVE' }

    case 'TRIAL':
      // Check if trial has expired
      if (tenant.trialEndsAt && tenant.trialEndsAt < now) {
        // Move to grace period
        await db.tenant.update({
          where: { id: tenantId },
          data: { status: 'GRACE_PERIOD' },
        })
        return {
          canAccess: true,
          status: 'GRACE_PERIOD',
          message: 'Sinov muddati tugadi. To\'lov qiling.',
        }
      }
      return {
        canAccess: true,
        status: 'TRIAL',
        message: tenant.trialEndsAt
          ? `Sinov muddati: ${Math.ceil((tenant.trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))} kun qoldi`
          : undefined,
      }

    case 'GRACE_PERIOD':
      return {
        canAccess: true,
        status: 'GRACE_PERIOD',
        message: '⚠️ To\'lov qiling! Aks holda hisobingiz bloklandi.',
      }

    case 'SUSPENDED':
      return {
        canAccess: false,
        status: 'SUSPENDED',
        message: 'Hisobingiz to\'xtatilgan. To\'lov qiling.',
      }

    case 'BLOCKED':
      return {
        canAccess: false,
        status: 'BLOCKED',
        message: 'Hisobingiz bloklangan. Administrator bilan bog\'laning.',
      }

    default:
      return {
        canAccess: false,
        status: 'BLOCKED',
        message: 'Noma\'lum holat',
      }
  }
}

/**
 * Check if tenant can add more students
 */
export async function canAddStudent(tenantId: string): Promise<boolean> {
  const tenant = await db.tenant.findUnique({
    where: { id: tenantId },
    select: {
      maxStudents: true,
      _count: {
        select: { students: true },
      },
    },
  })

  if (!tenant) return false
  return tenant._count.students < tenant.maxStudents
}

/**
 * Check if tenant can add more teachers
 */
export async function canAddTeacher(tenantId: string): Promise<boolean> {
  const tenant = await db.tenant.findUnique({
    where: { id: tenantId },
    select: {
      maxTeachers: true,
      _count: {
        select: { teachers: true },
      },
    },
  })

  if (!tenant) return false
  return tenant._count.teachers < tenant.maxTeachers
}

/**
 * Get tenant usage statistics
 */
export async function getTenantUsage(tenantId: string) {
  const tenant = await db.tenant.findUnique({
    where: { id: tenantId },
    select: {
      maxStudents: true,
      maxTeachers: true,
      _count: {
        select: {
          students: true,
          teachers: true,
          classes: true,
          subjects: true,
        },
      },
    },
  })

  if (!tenant) return null

  return {
    students: {
      current: tenant._count.students,
      max: tenant.maxStudents,
      percentage: Math.round((tenant._count.students / tenant.maxStudents) * 100),
    },
    teachers: {
      current: tenant._count.teachers,
      max: tenant.maxTeachers,
      percentage: Math.round((tenant._count.teachers / tenant.maxTeachers) * 100),
    },
    classes: tenant._count.classes,
    subjects: tenant._count.subjects,
  }
}

