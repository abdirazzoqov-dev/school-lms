import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { DashboardNav } from '@/components/dashboard-nav'
import { UserNav } from '@/components/user-nav'
import { TenantStatusBanner } from '@/components/tenant-status-banner'
import { GraduationCap } from 'lucide-react'
import { db } from '@/lib/db'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  try {
    const session = await getServerSession(authOptions)

    // Allow both ADMIN and SUPER_ADMIN to access admin panel
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
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
      // Silently fail - use default name
      if (process.env.NODE_ENV === 'development') {
        console.error('Error loading global settings:', error)
      }
    }

  const navItems = [
    {
      title: 'Dashboard',
      href: '/admin',
      icon: 'LayoutDashboard',
    },
    {
      title: 'O\'quvchilar',
      href: '/admin/students',
      icon: 'Users',
    },
    {
      title: 'O\'qituvchilar',
      href: '/admin/teachers',
      icon: 'GraduationCap',
    },
    {
      title: 'Ota-onalar',
      href: '/admin/parents',
      icon: 'UserCheck',
    },
    {
      title: 'Sinflar',
      href: '/admin/classes',
      icon: 'BookOpen',
    },
    {
      title: 'Fanlar',
      href: '/admin/subjects',
      icon: 'Book',
    },
    {
      title: 'Dars jadvali',
      href: '/admin/schedules',
      icon: 'Calendar',
    },
    {
      title: 'Davomat',
      href: '/admin/attendance',
      icon: 'ClipboardCheck',
    },
    {
      title: 'Baholar',
      href: '/admin/grades',
      icon: 'Award',
    },
    {
      title: 'Moliya',
      icon: 'Wallet',
      children: [
        {
          title: 'To\'lovlar',
          href: '/admin/payments',
          icon: 'DollarSign',
        },
        {
          title: 'Maoshlar',
          href: '/admin/salaries',
          icon: 'Banknote',
        },
        {
          title: 'Xarajatlar',
          href: '/admin/expenses',
          icon: 'TrendingDown',
        },
      ],
    },
    {
      title: 'Oshxona',
      href: '/admin/kitchen',
      icon: 'ChefHat',
    },
    {
      title: 'Yotoqxona',
      href: '/admin/dormitory',
      icon: 'Home',
    },
    {
      title: 'Xabarlar',
      href: '/admin/messages',
      icon: 'MessageSquare',
    },
    {
      title: 'Hisobotlar',
      href: '/admin/reports',
      icon: 'BarChart3',
    },
    {
      title: 'Sozlamalar',
      href: '/admin/settings',
      icon: 'Settings',
    },
  ]

    return (
      <div className="flex min-h-screen flex-col">
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-6 w-6 text-primary" />
              <div>
                <span className="text-xl font-bold">{platformName}</span>
                <span className="ml-2 rounded-md bg-blue-500 px-2 py-1 text-xs font-semibold text-white">
                  ADMIN
                </span>
              </div>
            </div>
            <UserNav user={session.user} />
          </div>
        </header>
        
        {/* Tenant Status Banner */}
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
  } catch (error) {
    // Log error in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Admin layout error:', error)
    }
    // Re-throw to trigger error boundary
    throw error
  }
}

