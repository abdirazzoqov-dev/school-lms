import { db } from './db'
import { UserRole } from '@prisma/client'

// Resource types in the system
export type ResourceType =
  | 'students'
  | 'teachers'
  | 'parents'
  | 'classes'
  | 'subjects'
  | 'schedules'
  | 'attendance'
  | 'grades'
  | 'payments'
  | 'expenses'
  | 'kitchen'
  | 'dormitory'
  | 'messages'
  | 'announcements'
  | 'reports'
  | 'settings'

// Action types
export type ActionType = 'CREATE' | 'READ' | 'UPDATE' | 'DELETE'

/**
 * Check if user has permission for a specific resource and action
 */
export async function hasPermission(
  userId: string,
  tenantId: string | null,
  resource: ResourceType,
  action: ActionType
): Promise<boolean> {
  // Super admin has all permissions
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { role: true, tenantId: true },
  })

  if (!user) return false

  // Super admin always has access
  if (user.role === 'SUPER_ADMIN') return true

  // Admin has all permissions for their tenant
  if (user.role === 'ADMIN' && user.tenantId === tenantId) return true

  // Moderator needs explicit permission
  if (user.role === 'MODERATOR' && tenantId) {
    const permission = await db.permission.findUnique({
      where: {
        userId_tenantId_resource_action: {
          userId,
          tenantId,
          resource,
          action,
        },
      },
    })

    return !!permission
  }

  // Other roles have no permissions by default
  return false
}

/**
 * Get all permissions for a moderator
 */
export async function getModeratorPermissions(
  userId: string,
  tenantId: string
): Promise<Array<{ resource: ResourceType; action: ActionType }>> {
  const permissions = await db.permission.findMany({
    where: {
      userId,
      tenantId,
    },
    select: {
      resource: true,
      action: true,
    },
  })

  return permissions.map((p) => ({
    resource: p.resource as ResourceType,
    action: p.action as ActionType,
  }))
}

/**
 * Check if user can access a specific route
 * This is a simplified check for route access
 */
export async function canAccessRoute(
  userId: string,
  tenantId: string | null,
  route: string
): Promise<boolean> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { role: true, tenantId: true },
  })

  if (!user) return false

  // Super admin can access everything
  if (user.role === 'SUPER_ADMIN') return true

  // Admin can access all admin routes
  if (user.role === 'ADMIN' && user.tenantId === tenantId) {
    return route.startsWith('/admin') || route.startsWith('/super-admin')
  }

  // Moderator needs READ permission for the resource
  if (user.role === 'MODERATOR' && tenantId) {
    // Map routes to resources
    const routeToResource: Record<string, ResourceType> = {
      '/admin/students': 'students',
      '/admin/teachers': 'teachers',
      '/admin/parents': 'parents',
      '/admin/classes': 'classes',
      '/admin/subjects': 'subjects',
      '/admin/schedules': 'schedules',
      '/admin/attendance': 'attendance',
      '/admin/grades': 'grades',
      '/admin/payments': 'payments',
      '/admin/expenses': 'expenses',
      '/admin/kitchen': 'kitchen',
      '/admin/dormitory': 'dormitory',
      '/admin/messages': 'messages',
      '/admin/announcements': 'announcements',
      '/admin/reports': 'reports',
      '/admin/settings': 'settings',
    }

    // Find matching resource
    const resource = Object.keys(routeToResource).find((r) => route.startsWith(r))
    if (!resource) return false

    // Check READ permission
    return hasPermission(userId, tenantId, routeToResource[resource], 'READ')
  }

  // Teacher, Parent, Cook have their own routes
  if (user.role === 'TEACHER') return route.startsWith('/teacher')
  if (user.role === 'PARENT') return route.startsWith('/parent')
  if (user.role === 'COOK') return route.startsWith('/cook')

  return false
}

/**
 * Get accessible routes for moderator
 */
export async function getAccessibleRoutes(
  userId: string,
  tenantId: string
): Promise<string[]> {
  const permissions = await getModeratorPermissions(userId, tenantId)

  const resourceToRoute: Record<ResourceType, string> = {
    students: '/admin/students',
    teachers: '/admin/teachers',
    parents: '/admin/parents',
    classes: '/admin/classes',
    subjects: '/admin/subjects',
    schedules: '/admin/schedules',
    attendance: '/admin/attendance',
    grades: '/admin/grades',
    payments: '/admin/payments',
    expenses: '/admin/expenses',
    kitchen: '/admin/kitchen',
    dormitory: '/admin/dormitory',
    messages: '/admin/messages',
    announcements: '/admin/announcements',
    reports: '/admin/reports',
    settings: '/admin/settings',
  }

  // Get unique routes that user has READ permission for
  const routes = new Set<string>()
  permissions.forEach((perm) => {
    if (perm.action === 'READ' && resourceToRoute[perm.resource]) {
      routes.add(resourceToRoute[perm.resource])
    }
  })

  // Dashboard is always accessible if user has any permission
  if (routes.size > 0) {
    routes.add('/admin')
  }

  return Array.from(routes)
}

