'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, MessageSquare, Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
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
    return Icon ? <Icon className="h-5 w-5" /> : null
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
              <Home className="h-5 w-5" />
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
              <MessageSquare className="h-5 w-5" />
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
                <Menu className="h-5 w-5" />
                <span className="text-xs font-medium">Menyu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[80vh] rounded-t-3xl">
              <SheetHeader className="border-b pb-4">
                <div className="flex items-center justify-between">
                  <SheetTitle className="text-xl font-bold">Menyu</SheetTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setOpen(false)}
                    className="rounded-full"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </SheetHeader>
              <div className="mt-6 space-y-2 overflow-y-auto max-h-[calc(80vh-100px)] pb-6">
                {menuItems.map((item) => {
                  const active = isActive(item.href)
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-300",
                        active
                          ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      <div className={cn(
                        "flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-300",
                        active 
                          ? "bg-primary-foreground/20" 
                          : "bg-muted"
                      )}>
                        {getIcon(item.icon)}
                      </div>
                      <span>{item.title}</span>
                    </Link>
                  )
                })}
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

