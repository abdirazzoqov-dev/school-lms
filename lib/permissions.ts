import { db } from './db'

// ============================================================
// ADMIN RESOURCE DEFINITIONS
// Each resource maps to a nav page in the admin panel
// ============================================================
export const ADMIN_RESOURCES = [
  { key: 'dashboard',  label: 'Dashboard',          href: '/admin',           icon: 'LayoutDashboard' },
  { key: 'students',   label: "O'quvchilar",         href: '/admin/students',  icon: 'Users' },
  { key: 'teachers',   label: "O'qituvchilar",        href: '/admin/teachers',  icon: 'GraduationCap' },
  { key: 'staff',      label: 'Xodimlar',            href: '/admin/staff',     icon: 'Briefcase' },
  { key: 'parents',    label: 'Ota-onalar',          href: '/admin/parents',   icon: 'UserCheck' },
  { key: 'classes',    label: 'Sinflar',             href: '/admin/classes',   icon: 'BookOpen' },
  { key: 'groups',     label: 'Guruhlar',            href: '/admin/groups',    icon: 'UsersRound' },
  { key: 'subjects',   label: 'Fanlar',              href: '/admin/subjects',  icon: 'Atom' },
  { key: 'schedules',  label: 'Dars jadvali',        href: '/admin/schedules', icon: 'Calendar' },
  { key: 'attendance', label: 'Davomat',             href: '/admin/attendance',icon: 'ClipboardCheck' },
  { key: 'grades',     label: 'Baholar',             href: '/admin/grades',    icon: 'Award' },
  { key: 'payments',   label: "To'lovlar",           href: '/admin/payments',  icon: 'DollarSign' },
  { key: 'salaries',   label: 'Maoshlar',            href: '/admin/salaries',  icon: 'Banknote' },
  { key: 'expenses',   label: 'Xarajatlar',          href: '/admin/expenses',  icon: 'TrendingDown' },
  { key: 'meals',      label: 'Ovqatlar Menyusi',    href: '/admin/meals',     icon: 'UtensilsCrossed' },
  { key: 'kitchen',    label: 'Oshxona Xarajatlar',  href: '/admin/kitchen',   icon: 'Receipt' },
  { key: 'dormitory',  label: 'Yotoqxona',           href: '/admin/dormitory', icon: 'Home' },
  { key: 'contracts',      label: 'Shartnomalar',        href: '/admin/contracts',      icon: 'FileSignature' },
  { key: 'messages',       label: 'Xabarlar',            href: '/admin/messages',       icon: 'MessageSquare' },
  { key: 'announcements',  label: "E'lonlar",            href: '/admin/announcements',  icon: 'Megaphone' },
  { key: 'reports',        label: 'Hisobotlar',          href: '/admin/reports',        icon: 'BarChart3' },
  { key: 'contacts',       label: "Ma'sul Xodimlar",     href: '/admin/contacts',       icon: 'UserCog' },
  { key: 'settings',       label: 'Sozlamalar',          href: '/admin/settings',       icon: 'Settings' },
] as const

export type ResourceKey = typeof ADMIN_RESOURCES[number]['key']
export type PermissionAction = 'CREATE' | 'READ' | 'UPDATE' | 'DELETE'

// Map href prefix → resource key (for route-based lookups)
export const HREF_TO_RESOURCE: Record<string, string> = ADMIN_RESOURCES.reduce(
  (acc, r) => { acc[r.href] = r.key; return acc },
  {} as Record<string, string>
)

// Given an href, return the resource key (most specific match wins)
export function getResourceFromHref(href?: string): string | null {
  if (!href) return null
  // Sort by href length descending so specific routes match before '/admin' prefix
  const sorted = [...ADMIN_RESOURCES].sort((a, b) => b.href.length - a.href.length)
  const match = sorted.find(r => href === r.href || href.startsWith(r.href + '/'))
  return match ? match.key : null
}

// ============================================================
// SERVER-SIDE: fetch user permissions from DB
// Returns: { students: ['READ','CREATE'], ... }
// ============================================================
export async function getUserPermissions(
  userId: string,
  tenantId: string
): Promise<Record<string, string[]>> {
  const perms = await db.permission.findMany({
    where: { userId, tenantId },
    select: { resource: true, action: true },
  })
  return perms.reduce((acc, p) => {
    if (!acc[p.resource]) acc[p.resource] = []
    acc[p.resource].push(p.action)
    return acc
  }, {} as Record<string, string[]>)
}

// ============================================================
// CHECK: does user have permission?
// ============================================================
export function hasPermission(
  permissions: Record<string, string[]>,
  resource: string,
  action: PermissionAction
): boolean {
  const actions = permissions[resource] || []
  return actions.includes(action) || actions.includes('ALL')
}

// ============================================================
// FILTER nav items for MODERATOR users
// navItem format (compatible with admin layout navItems):
//   { title, href?, icon, children?: [...] }
// ============================================================
export function filterNavByPermissions(
  navItems: any[],
  permissions: Record<string, string[]>
): any[] {
  const filtered: any[] = []

  for (const item of navItems) {
    if (item.children) {
      // Group item: filter children
      const visibleChildren = item.children.filter((child: any) => {
        const resource = getResourceFromHref(child.href)
        if (!resource) return true // keep items without resource mapping
        return hasPermission(permissions, resource, 'READ')
      })
      if (visibleChildren.length > 0) {
        filtered.push({ ...item, children: visibleChildren })
      }
    } else {
      const resource = getResourceFromHref(item.href)
      if (!resource) {
        filtered.push(item) // keep items without resource mapping (e.g., dashboard)
      } else if (hasPermission(permissions, resource, 'READ')) {
        filtered.push(item)
      }
    }
  }

  return filtered
}
