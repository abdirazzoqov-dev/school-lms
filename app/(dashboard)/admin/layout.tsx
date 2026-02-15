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
      title: 'Shartnomalar',
      href: '/admin/contracts',
      icon: 'FileText',
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
      <div className="flex min-h-screen flex-col bg-gradient-to-br from-background via-background to-muted/30">
        <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60 shadow-sm">
          <div className="container flex h-16 items-center justify-between px-4 md:px-6">
            <div className="flex items-center gap-3">
              <MobileNav items={navItems} />
              <div className="flex items-center gap-3 group">
                <div className="relative">
                  <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl group-hover:bg-primary/30 transition-all duration-300" />
                  <GraduationCap className="relative h-7 w-7 text-primary group-hover:scale-110 transition-transform duration-300" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                    {platformName}
                  </span>
                  <span className="hidden sm:inline-flex rounded-full bg-gradient-to-r from-blue-500 to-blue-600 px-3 py-1 text-xs font-semibold text-white shadow-lg shadow-blue-500/30 animate-scale-in">
                    ADMIN
                  </span>
                </div>
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
          <div className="flex gap-6 py-6">
            {/* Desktop Sidebar */}
            <aside className="hidden lg:block w-72 shrink-0">
              <div className="sticky top-24">
                <div className="rounded-2xl border bg-card/50 backdrop-blur-sm shadow-xl p-3 animate-slide-in">
                  <DashboardNav items={navItems} />
                </div>
              </div>
            </aside>
            {/* Main Content */}
            <main className="flex-1 min-w-0 animate-fade-in">{children}</main>
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

