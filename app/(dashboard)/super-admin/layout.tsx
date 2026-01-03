import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { DashboardNav } from '@/components/dashboard-nav'
import { UserNav } from '@/components/user-nav'
import { Building2 } from 'lucide-react'
import { db } from '@/lib/db'

export default async function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'SUPER_ADMIN') {
    redirect('/unauthorized')
  }

  // Get global platform name
  let platformName = 'School LMS'
  try {
    const settings = await db.globalSettings.findFirst()
    if (settings) {
      platformName = settings.platformName
    }
  } catch (error) {
    console.error('Error loading global settings:', error)
  }

  const navItems = [
    {
      title: 'Dashboard',
      href: '/super-admin',
      icon: 'Building2',
    },
    {
      title: 'Maktablar',
      href: '/super-admin/tenants',
      icon: 'Building2',
    },
    {
      title: 'To\'lovlar',
      href: '/super-admin/payments',
      icon: 'CreditCard',
    },
    {
      title: 'Foydalanuvchilar',
      href: '/super-admin/users',
      icon: 'Users',
    },
    {
      title: 'Sozlamalar',
      href: '/super-admin/settings',
      icon: 'Settings',
    },
  ]

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">{platformName}</span>
            <span className="ml-2 rounded-md bg-primary px-2 py-1 text-xs font-semibold text-white">
              SUPER ADMIN
            </span>
          </div>
          <UserNav user={session.user} />
        </div>
      </header>
      <div className="container flex-1">
        <div className="flex gap-6 py-6">
          <aside className="w-64">
            <DashboardNav items={navItems} />
          </aside>
          <main className="flex-1">{children}</main>
        </div>
      </div>
    </div>
  )
}

