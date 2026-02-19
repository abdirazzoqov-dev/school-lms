'use client'

import { createContext, useContext } from 'react'

// perms format: { students: ['READ','CREATE'], ... }
// __role: ['ADMIN'] means full access (no restrictions)
export type AdminPerms = Record<string, string[]>

const PermissionsCtx = createContext<AdminPerms>({ __role: ['ADMIN'] })

export function AdminPermissionsProvider({
  permissions,
  children,
}: {
  permissions: AdminPerms
  children: React.ReactNode
}) {
  return (
    <PermissionsCtx.Provider value={permissions}>
      {children}
    </PermissionsCtx.Provider>
  )
}

/**
 * Use inside any admin client component.
 *
 * const { can, isAdmin } = useAdminPermissions()
 * can('students', 'CREATE')  // → true/false
 */
export function useAdminPermissions() {
  const perms = useContext(PermissionsCtx)

  const isAdmin =
    perms.__role?.includes('ADMIN') || perms.__role?.includes('SUPER_ADMIN')

  const can = (resource: string, action: string): boolean => {
    if (isAdmin) return true
    return (perms[resource] || []).some(
      (a) => a === action || a === 'ALL'
    )
  }

  return { can, isAdmin, perms }
}

