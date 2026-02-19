'use client'

import { useAdminPermissions } from './permissions-provider'

interface PermissionGateProps {
  resource: string
  action: string
  children: React.ReactNode
  fallback?: React.ReactNode
}

/**
 * Wraps content and only renders it if the current user
 * has the required permission (resource + action).
 *
 * Works in both server pages and client components.
 * Reads from AdminPermissionsProvider context in admin layout.
 *
 * Usage:
 *   <PermissionGate resource="students" action="CREATE">
 *     <Button>Yangi O'quvchi</Button>
 *   </PermissionGate>
 */
export function PermissionGate({
  resource,
  action,
  children,
  fallback = null,
}: PermissionGateProps) {
  const { can } = useAdminPermissions()
  if (!can(resource, action)) return <>{fallback}</>
  return <>{children}</>
}

