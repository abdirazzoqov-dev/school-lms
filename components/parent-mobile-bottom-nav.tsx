'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, LayoutGrid, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import * as LucideIcons from 'lucide-react'
import { MessageSquare } from 'lucide-react'

interface NavItem {
  title: string
  href: string
  icon: string
}

interface ParentMobileBottomNavProps {
  items: NavItem[]
}

// Icon color mapping for 3D colorful icons
const iconColorMap: Record<string, { bg: string; icon: string; shadow: string }> = {
  Users: { bg: 'bg-blue-100', icon: 'text-blue-600', shadow: 'shadow-blue-200' },
  Award: { bg: 'bg-yellow-100', icon: 'text-yellow-600', shadow: 'shadow-yellow-200' },
  Calendar: { bg: 'bg-green-100', icon: 'text-green-600', shadow: 'shadow-green-200' },
  CalendarDays: { bg: 'bg-purple-100', icon: 'text-purple-600', shadow: 'shadow-purple-200' },
  FileText: { bg: 'bg-orange-100', icon: 'text-orange-600', shadow: 'shadow-orange-200' },
  DollarSign: { bg: 'bg-emerald-100', icon: 'text-emerald-600', shadow: 'shadow-emerald-200' },
  UtensilsCrossed: { bg: 'bg-pink-100', icon: 'text-pink-600', shadow: 'shadow-pink-200' },
  Phone: { bg: 'bg-indigo-100', icon: 'text-indigo-600', shadow: 'shadow-indigo-200' },
  Bell: { bg: 'bg-red-100', icon: 'text-red-600', shadow: 'shadow-red-200' },
  User: { bg: 'bg-teal-100', icon: 'text-teal-600', shadow: 'shadow-teal-200' },
  Settings: { bg: 'bg-gray-100', icon: 'text-gray-600', shadow: 'shadow-gray-200' },
}

// ── Unread count hook (polls /api/unread-count every 10s) ────────────────────
function useUnreadCount() {
  const [count, setCount] = useState(0)

  useEffect(() => {
    const fetch_ = () => {
      fetch('/api/unread-count', { cache: 'no-store' })
        .then(r => r.json())
        .then(d => setCount(d.count ?? 0))
        .catch(() => {})
    }
    fetch_() // immediate first call
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') fetch_()
    }, 10_000)
    const onVisibility = () => { if (document.visibilityState === 'visible') fetch_() }
    document.addEventListener('visibilitychange', onVisibility)
    return () => { clearInterval(timer); document.removeEventListener('visibilitychange', onVisibility) }
  }, [])

  return count
}

export function ParentMobileBottomNav({ items }: ParentMobileBottomNavProps) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const unreadCount = useUnreadCount()

  // All items except Dashboard and Messages go into the sheet menu
  const menuItems = items.filter(
    item => item.href !== '/parent' && item.href !== '/parent/messages'
  )

  const isActive = (href: string) => {
    if (href === '/parent') return pathname === '/parent'
    return pathname.startsWith(href)
  }

  const getIcon = (iconName: string, isLarge = false) => {
    const Icon = LucideIcons[iconName as keyof typeof LucideIcons] as React.ComponentType<{ className?: string }>
    const colors = iconColorMap[iconName] || { bg: 'bg-gray-100', icon: 'text-gray-600', shadow: 'shadow-gray-200' }
    const iconClass = isLarge ? 'h-7 w-7' : 'h-5 w-5'
    return Icon ? <Icon className={cn(iconClass, colors.icon)} /> : null
  }

  const getIconColors = (iconName: string) => {
    return iconColorMap[iconName] || { bg: 'bg-gray-100', icon: 'text-gray-600', shadow: 'shadow-gray-200' }
  }

  return (
    <>
      {/* Bottom Navigation — Mobile Only */}
      <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden border-t bg-background/95 backdrop-blur-lg supports-[backdrop-filter]:bg-background/80 shadow-2xl">
        <div className="flex items-center justify-around h-16 px-2">

          {/* Dashboard */}
          <Link href="/parent">
            <Button
              variant="ghost"
              className={cn(
                'flex flex-col items-center gap-1 h-auto py-2 px-4 rounded-xl transition-all duration-300',
                isActive('/parent') && pathname === '/parent'
                  ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted',
              )}
            >
              <Home className="h-5 w-5" />
              <span className="text-xs font-medium">Dashboard</span>
            </Button>
          </Link>

          {/* Messages — with unread badge */}
          <Link href="/parent/messages">
            <Button
              variant="ghost"
              className={cn(
                'flex flex-col items-center gap-1 h-auto py-2 px-4 rounded-xl transition-all duration-300 relative',
                isActive('/parent/messages')
                  ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted',
              )}
            >
              <div className="relative">
                <MessageSquare className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center shadow-lg shadow-red-500/40 animate-bounce-slow">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </div>
              <span className="text-xs font-medium">Xabarlar</span>
            </Button>
          </Link>

          {/* Menu Sheet */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                className="flex flex-col items-center gap-1 h-auto py-2 px-4 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-300"
              >
                <LayoutGrid className="h-5 w-5" />
                <span className="text-xs font-medium">Menyu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[80vh] rounded-t-3xl" hideClose>
              <SheetHeader className="border-b pb-4 mb-6">
                <div className="flex items-center justify-between">
                  <SheetTitle className="text-xl font-bold">Menyu</SheetTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setOpen(false)}
                    className="rounded-full h-8 w-8 -mr-2"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </SheetHeader>
              <div className="overflow-y-auto max-h-[calc(80vh-120px)] pb-6 px-2">
                <div className="grid grid-cols-3 gap-4">
                  {menuItems.map((item) => {
                    const active = isActive(item.href)
                    const colors = getIconColors(item.icon)
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setOpen(false)}
                        className={cn(
                          'flex flex-col items-center gap-3 rounded-2xl p-4 transition-all duration-300',
                          active
                            ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                            : 'bg-gradient-to-br from-muted/50 to-muted/30 text-foreground hover:shadow-lg hover:scale-105',
                        )}
                      >
                        <div className={cn(
                          'flex items-center justify-center w-16 h-16 rounded-2xl transition-all duration-300 shadow-md',
                          active
                            ? 'bg-primary-foreground/20'
                            : cn(colors.bg, colors.shadow, 'shadow-inner'),
                        )}>
                          {getIcon(item.icon, true)}
                        </div>
                        <span className="text-xs font-medium text-center leading-tight">{item.title}</span>
                      </Link>
                    )
                  })}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Spacer */}
      <div className="h-16 lg:hidden" />
    </>
  )
}
