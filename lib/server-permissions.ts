/**
 * Server-side permission helper for server actions.
 * Allows ADMIN/SUPER_ADMIN unconditionally.
 * Checks DB permissions for MODERATOR.
 */
import { getServerSession } from 'next-auth'
import { authOptions } from './auth'
import { getUserPermissions, hasPermission } from './permissions'
import type { PermissionAction } from './permissions'

export type AdminCheckResult = {
  allowed: boolean
  session: Awaited<ReturnType<typeof getServerSession>>
  tenantId: string | null
}

/**
 * Call at the start of every admin server action.
 * Returns { allowed, session, tenantId }.
 * ADMIN / SUPER_ADMIN → always allowed.
 * MODERATOR           → allowed only if they have the given permission.
 */
export async function requireAdminOrPermission(
  resource: string,
  action: PermissionAction
): Promise<AdminCheckResult> {
  const session = await getServerSession(authOptions)

  if (!session) {
    return { allowed: false, session: null, tenantId: null }
  }

  const { role } = session.user
  const tenantId = session.user.tenantId ?? null

  // ADMIN and SUPER_ADMIN can do everything
  if (role === 'ADMIN' || role === 'SUPER_ADMIN') {
    return { allowed: true, session, tenantId }
  }

  // MODERATOR: check specific DB permission
  if (role === 'MODERATOR' && tenantId) {
    const perms = await getUserPermissions(session.user.id, tenantId)
    const allowed = hasPermission(perms, resource, action)
    return { allowed, session, tenantId }
  }

  return { allowed: false, session, tenantId }
}

