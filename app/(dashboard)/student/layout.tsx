import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { DashboardNav } from '@/components/dashboard-nav'
import { MobileNav } from '@/components/mobile-nav'
import { UserNav } from '@/components/user-nav'
import { BookOpen } from 'lucide-react'
import { db } from '@/lib/db'

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'STUDENT') {
    redirect('/unauthorized')
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

  const navItems = [
    {
      title: 'Dashboard',
      href: '/student',
      icon: 'LayoutDashboard',
    },
    {
      title: 'Baholarim',
      href: '/student/grades',
      icon: 'Award',
    },
    {
      title: 'Davomatim',
      href: '/student/attendance',
      icon: 'Calendar',
    },
    {
      title: 'Uy Vazifalari',
      href: '/student/assignments',
      icon: 'FileText',
    },
    {
      title: 'Dars Materiallari',
      href: '/student/materials',
      icon: 'BookOpen',
    },
    {
      title: 'Bildirishnomalar',
      href: '/student/notifications',
      icon: 'Bell',
    },
  ]

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 md:h-16 items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-2 md:gap-3">
            <MobileNav items={navItems} />
            <BookOpen className="h-5 w-5 md:h-6 md:w-6 text-primary" />
            <div className="flex items-center gap-1.5 md:gap-2">
              <span className="text-base md:text-xl font-bold truncate max-w-[120px] sm:max-w-none">{session.user.tenant?.name || 'School LMS'}</span>
              <span className="rounded-md bg-indigo-500 px-1.5 py-0.5 md:px-2 md:py-1 text-[10px] md:text-xs font-semibold text-white">
                O'QUVCHI
              </span>
            </div>
          </div>
          <UserNav user={{ ...session.user, avatar: currentAvatar }} />
        </div>
      </header>

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

