'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, MessageSquare, LayoutGrid, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import { Icon3D } from '@/components/icon-3d'
import * as LucideIcons from 'lucide-react'

interface NavItem {
  title: string
  href: string
  icon: string
}

interface TeacherMobileBottomNavProps {
  items: NavItem[]
}

export function TeacherMobileBottomNav({ items }: TeacherMobileBottomNavProps) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  // Filter out Dashboard and Messages for the full menu
  const menuItems = items.filter(
    item => item.href !== '/teacher' && item.href !== '/teacher/messages'
  )

  const isActive = (href: string) => {
    if (href === '/teacher') {
      return pathname === '/teacher'
    }
    return pathname.startsWith(href)
  }

  const getIcon = (iconName: string) => {
    const Icon = LucideIcons[iconName as keyof typeof LucideIcons] as React.ComponentType<{ className?: string }>
    return Icon ? <Icon className="h-7 w-7" /> : null
  }

  // Map icon names to 3D icon file names
  const get3DIconName = (iconName: string): string => {
    const iconMap: Record<string, string> = {
      'LayoutDashboard': 'dashboard',
      'Calendar': 'calendar',
      'Users': 'users',
      'ClipboardCheck': 'clipboard-check',
      'Award': 'award',
      'DollarSign': 'dollar',
      'FileText': 'file-text',
      'BookOpen': 'book',
      'MessageSquare': 'message',
    }
    return iconMap[iconName] || 'dashboard'
  }

  return (
    <>
      {/* Bottom Navigation - Mobile Only */}
      <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden border-t bg-background/95 backdrop-blur-lg supports-[backdrop-filter]:bg-background/80 shadow-2xl">
        <div className="flex items-center justify-around h-16 px-2">
          {/* Dashboard */}
          <Link href="/teacher">
            <Button
              variant="ghost"
              className={cn(
                "flex flex-col items-center gap-1 h-auto py-2 px-4 rounded-xl transition-all duration-300",
                isActive('/teacher') && pathname === '/teacher'
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              <Icon3D name="dashboard" size={24} />
              <span className="text-xs font-medium">Dashboard</span>
            </Button>
          </Link>

          {/* Messages */}
          <Link href="/teacher/messages">
            <Button
              variant="ghost"
              className={cn(
                "flex flex-col items-center gap-1 h-auto py-2 px-4 rounded-xl transition-all duration-300 relative",
                isActive('/teacher/messages')
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              <Icon3D name="message" size={24} />
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
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setOpen(false)}
                        className={cn(
                          "flex flex-col items-center gap-3 rounded-2xl p-4 transition-all duration-300",
                          active
                            ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                            : "bg-muted/50 text-foreground hover:bg-muted hover:shadow-md"
                        )}
                      >
                        <div className={cn(
                          "flex items-center justify-center w-16 h-16 rounded-2xl transition-all duration-300",
                          active 
                            ? "bg-primary-foreground/20" 
                            : "bg-background shadow-sm"
                        )}>
                          <Icon3D name={get3DIconName(item.icon)} size={40} />
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

      {/* Spacer to prevent content from being hidden under bottom nav */}
      <div className="h-16 lg:hidden" />
    </>
  )
}

