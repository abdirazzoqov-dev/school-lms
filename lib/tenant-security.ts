/**
 * Tenant Security Utilities
 * Ensures tenant isolation in all database operations
 */

import { db } from './db'

/**
 * Ensure resource belongs to tenant before update/delete
 */
export async function ensureTenantAccess<T extends { tenantId: string }>(
  model: any,
  id: string,
  tenantId: string
): Promise<T> {
  const item = await model.findFirst({
    where: { id, tenantId },
  })

  if (!item) {
    throw new Error('Resource not found or access denied')
  }

  return item as T
}

/**
 * Safe update with tenant check
 */
export async function safeUpdate<T extends { tenantId: string }>(
  model: any,
  id: string,
  tenantId: string,
  data: any
): Promise<T> {
  // First check access
  await ensureTenantAccess(model, id, tenantId)

  // Then update with tenantId in where clause
  const updated = await model.update({
    where: {
      id,
      tenantId, // Double check
    },
    data,
  })

  return updated as T
}

/**
 * Safe delete with tenant check
 */
export async function safeDelete(
  model: any,
  id: string,
  tenantId: string
): Promise<void> {
  // First check access
  await ensureTenantAccess(model, id, tenantId)

  // Then delete with tenantId in where clause
  await model.delete({
    where: {
      id,
      tenantId, // Double check
    },
  })
}

