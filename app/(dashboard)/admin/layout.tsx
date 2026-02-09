import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { DashboardNav } from '@/components/dashboard-nav'
import { MobileNav } from '@/components/mobile-nav'
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
      title: 'Xodimlar',
      href: '/admin/staff',
      icon: 'Briefcase',
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
      title: 'Guruhlar',
      href: '/admin/groups',
      icon: 'Users',
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
          title: 'To\'lov Panoramasi',
          href: '/admin/payments/student-overview',
          icon: 'BarChart3',
        },
        {
          title: 'Maoshlar',
          href: '/admin/salaries',
          icon: 'Banknote',
        },
        {
          title: 'Maosh Panoramasi',
          href: '/admin/salaries/employee-overview',
          icon: 'BarChart2',
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
      icon: 'ChefHat',
      children: [
        {
          title: 'Ovqatlar Menyusi',
          href: '/admin/meals',
          icon: 'UtensilsCrossed',
        },
        {
          title: 'Xarajatlar',
          href: '/admin/kitchen',
          icon: 'TrendingDown',
        },
      ],
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
      title: 'Ma\'sul Xodimlar',
      href: '/admin/contacts',
      icon: 'Users',
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
          <div className="container flex h-14 md:h-16 items-center justify-between px-4 md:px-6">
            <div className="flex items-center gap-2 md:gap-3">
              <MobileNav items={navItems} />
              <GraduationCap className="h-5 w-5 md:h-6 md:w-6 text-primary" />
              <div className="flex items-center gap-1.5 md:gap-2">
                <span className="text-base md:text-xl font-bold truncate max-w-[120px] sm:max-w-none">{platformName}</span>
                <span className="rounded-md bg-blue-500 px-1.5 py-0.5 md:px-2 md:py-1 text-[10px] md:text-xs font-semibold text-white">
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

        <div className="container flex-1 px-4 md:px-6">
          <div className="flex gap-4 lg:gap-6 py-4 md:py-6">
            {/* Desktop Sidebar */}
            <aside className="hidden lg:block w-64 shrink-0">
              <div className="sticky top-20">
                <DashboardNav items={navItems} />
              </div>
            </aside>
            {/* Main Content */}
            <main className="flex-1 min-w-0">{children}</main>
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

