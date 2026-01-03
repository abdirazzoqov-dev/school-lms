import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { DashboardNav } from '@/components/dashboard-nav'
import { UserNav } from '@/components/user-nav'
import { TenantStatusBanner } from '@/components/tenant-status-banner'
import { Users } from 'lucide-react'
import { db } from '@/lib/db'

export default async function ParentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'PARENT') {
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
      href: '/parent',
      icon: 'LayoutDashboard',
    },
    {
      title: 'Farzandlarim',
      href: '/parent/children',
      icon: 'Users',
    },
    {
      title: 'Baholar',
      href: '/parent/grades',
      icon: 'Award',
    },
    {
      title: 'Davomat',
      href: '/parent/attendance',
      icon: 'Calendar',
    },
    {
      title: 'Uy Vazifalari',
      href: '/parent/assignments',
      icon: 'FileText',
    },
    {
      title: 'To\'lovlar',
      href: '/parent/payments',
      icon: 'DollarSign',
    },
    {
      title: 'Xabarlar',
      href: '/parent/messages',
      icon: 'MessageSquare',
    },
    {
      title: 'Bildirishnomalar',
      href: '/parent/notifications',
      icon: 'Bell',
    },
  ]

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            <div>
              <span className="text-xl font-bold">{platformName}</span>
              <span className="ml-2 rounded-md bg-green-500 px-2 py-1 text-xs font-semibold text-white">
                OTA-ONA
              </span>
            </div>
          </div>
          <UserNav user={session.user} />
        </div>
      </header>
      
      {session.user.tenant && (
        <TenantStatusBanner status={session.user.tenant.status} />
      )}

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

