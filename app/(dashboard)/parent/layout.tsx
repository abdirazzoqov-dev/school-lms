import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { DashboardNav } from '@/components/dashboard-nav'
import { UserNav } from '@/components/user-nav'
import { TenantStatusBanner } from '@/components/tenant-status-banner'
import { ParentMobileBottomNav } from '@/components/parent-mobile-bottom-nav'
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

  // Fetch avatar from DB (not from JWT to avoid 431 cookie size errors)
  let currentAvatar: string | null = null
  try {
    const userData = await db.user.findUnique({
      where: { id: session.user.id },
      select: { avatar: true }
    })
    currentAvatar = userData?.avatar ?? null
  } catch (e) { /* ignore */ }

  // Fetch initial unread message count for instant badge display
  let initialUnreadCount = 0
  try {
    initialUnreadCount = await db.message.count({
      where: {
        receiverId: session.user.id,
        tenantId: session.user.tenantId!,
        readAt: null,
        deletedByReceiver: false, // Don't count soft-deleted messages
      },
    })
  } catch (e) { /* ignore */ }

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
      title: 'Shartnomalar',
      href: '/parent/contracts',
      icon: 'FileText',
    },
    {
      title: 'Xabarlar',
      href: '/parent/messages',
      icon: 'MessageSquare',
    },
    {
      title: 'Tezkor Bog\'lanish',
      href: '/parent/contacts',
      icon: 'Phone',
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
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-background via-background to-accent/5">
      <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60 shadow-sm">
        <div className="container flex h-16 items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3 group">
              <div className="relative">
                <div className="absolute inset-0 bg-accent/20 rounded-full blur-xl group-hover:bg-accent/30 transition-all duration-300" />
                <Users className="relative h-7 w-7 text-accent group-hover:scale-110 transition-transform duration-300" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold bg-gradient-to-r from-accent to-success bg-clip-text text-transparent">
                  {platformName}
                </span>
                <span className="hidden sm:inline-flex rounded-full bg-gradient-to-r from-green-500 to-green-600 px-3 py-1 text-xs font-semibold text-white shadow-lg shadow-green-500/30 animate-scale-in">
                  OTA-ONA
                </span>
              </div>
            </div>
          </div>
          <UserNav user={{ ...session.user, avatar: currentAvatar }} />
        </div>
      </header>
      
      {session.user.tenant && (
        <TenantStatusBanner status={session.user.tenant.status} />
      )}

      <div className="container flex-1 px-4 md:px-6 pb-20 lg:pb-6">
        <div className="flex gap-6 py-6">
          <aside className="hidden lg:block w-72 shrink-0">
            <div className="sticky top-24">
              <div className="rounded-2xl border bg-card/50 backdrop-blur-sm shadow-xl p-3 animate-slide-in">
                <DashboardNav items={navItems} initialUnreadCount={initialUnreadCount} />
              </div>
            </div>
          </aside>
          <main className="flex-1 min-w-0 animate-fade-in">{children}</main>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <ParentMobileBottomNav items={navItems} initialUnreadCount={initialUnreadCount} />
    </div>
  )
}

