import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { DashboardNav } from '@/components/dashboard-nav'
import { MobileNav } from '@/components/mobile-nav'
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
      title: 'Dars Jadvali',
      href: '/parent/schedule',
      icon: 'CalendarDays',
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
      title: 'Ovqatlar Menyusi',
      href: '/parent/meals',
      icon: 'UtensilsCrossed',
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
    {
      title: 'Profil',
      href: '/parent/profile',
      icon: 'User',
    },
    {
      title: 'Sozlamalar',
      href: '/parent/settings',
      icon: 'Settings',
    },
  ]

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 md:h-16 items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-2 md:gap-3">
            <MobileNav items={navItems} />
            <Users className="h-5 w-5 md:h-6 md:w-6 text-primary" />
            <div className="flex items-center gap-1.5 md:gap-2">
              <span className="text-base md:text-xl font-bold truncate max-w-[120px] sm:max-w-none">{platformName}</span>
              <span className="rounded-md bg-green-500 px-1.5 py-0.5 md:px-2 md:py-1 text-[10px] md:text-xs font-semibold text-white">
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

      <div className="container flex-1 px-4 md:px-6">
        <div className="flex gap-4 lg:gap-6 py-4 md:py-6">
          <aside className="hidden lg:block w-64 shrink-0">
            <div className="sticky top-20">
              <DashboardNav items={navItems} />
            </div>
          </aside>
          <main className="flex-1 min-w-0">{children}</main>
        </div>
      </div>
    </div>
  )
}

