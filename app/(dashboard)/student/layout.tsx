import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { DashboardNav } from '@/components/dashboard-nav'
import { UserNav } from '@/components/user-nav'
import { BookOpen } from 'lucide-react'

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'STUDENT') {
    redirect('/unauthorized')
  }

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
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-primary" />
            <div>
              <span className="text-xl font-bold">{session.user.tenant?.name || 'School LMS'}</span>
              <span className="ml-2 rounded-md bg-indigo-500 px-2 py-1 text-xs font-semibold text-white">
                O'QUVCHI
              </span>
            </div>
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

