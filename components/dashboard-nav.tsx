'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import * as Icons from 'lucide-react'
import { Icon3D } from '@/components/icon-3d'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

interface NavItem {
  title: string
  href?: string
  icon: string
  children?: NavItem[]
}

interface DashboardNavProps {
  items: NavItem[]
}

export function DashboardNav({ items }: DashboardNavProps) {
  const pathname = usePathname()

  const renderNavItem = (item: NavItem, index: number) => {
    // If item has children, render as accordion
    if (item.children && item.children.length > 0) {
      const hasActiveChild = item.children.some((child) => {
        if (!child.href) return false
        const isDashboard = child.href === '/admin' || child.href === '/super-admin' || child.href === '/teacher' || child.href === '/parent'
        return isDashboard
          ? pathname === child.href
          : pathname === child.href || pathname?.startsWith(child.href + '/')
      })

      return (
        <Accordion
          key={item.title}
          type="single"
          collapsible
          className="w-full"
          style={{ animationDelay: `${index * 50}ms` }}
        >
          <AccordionItem value={item.title} className="border-none">
            <AccordionTrigger
              className={cn(
                'group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-300 hover:no-underline',
                hasActiveChild
                  ? 'bg-gradient-to-r from-primary to-secondary text-white shadow-lg shadow-primary/30'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground hover:shadow-sm'
              )}
            >
              <div className={cn(
                'flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-300',
                hasActiveChild
                  ? 'bg-white/10'
                  : 'bg-muted/50 group-hover:bg-background'
              )}>
                {/* Pass Lucide icon name directly */}
                <Icon3D name={item.icon} size={24} />
              </div>
              <span className="flex-1 text-left">{item.title}</span>
            </AccordionTrigger>
            <AccordionContent className="pt-2 pb-1">
              <div className="ml-3 space-y-1 border-l-2 border-primary/20 pl-3">
                {item.children.map((child, childIndex) => {
                  const isDashboard = child.href === '/admin' || child.href === '/super-admin' || child.href === '/teacher' || child.href === '/parent'
                  const isActive = child.href && (isDashboard
                    ? pathname === child.href
                    : pathname === child.href || pathname?.startsWith(child.href + '/'))

                  return (
                    <Link
                      key={child.href}
                      href={child.href || '#'}
                      prefetch={true}
                      className={cn(
                        'group flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-all duration-300 animate-fade-in',
                        isActive
                          ? 'bg-primary/10 text-primary'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground hover:translate-x-1'
                      )}
                      style={{ animationDelay: `${childIndex * 30}ms` }}
                    >
                      {/* Small 3D icon for children */}
                      <Icon3D name={child.icon} size={18} />
                      {child.title}
                    </Link>
                  )
                })}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      )
    }

    // Regular nav item without children
    if (!item.href) return null

    const isDashboard = item.href === '/admin' || item.href === '/super-admin' || item.href === '/teacher' || item.href === '/parent'
    const isActive = isDashboard
      ? pathname === item.href
      : pathname === item.href || pathname?.startsWith(item.href + '/')

    return (
      <Link
        key={item.href}
        href={item.href}
        prefetch={true}
        className={cn(
          'group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-300 animate-slide-in',
          isActive
            ? 'bg-gradient-to-r from-primary to-secondary text-white shadow-lg shadow-primary/30 scale-[1.02]'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground hover:shadow-sm hover:scale-[1.02]'
        )}
        style={{ animationDelay: `${index * 50}ms` }}
      >
        <div className={cn(
          'flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-300',
          isActive
            ? 'bg-white/10'
            : 'bg-muted/50 group-hover:bg-background'
        )}>
          {/* Pass Lucide icon name directly — unique color per icon */}
          <Icon3D name={item.icon} size={24} />
        </div>
        <span className="flex-1">{item.title}</span>
        {isActive && (
          <div className="h-2 w-2 rounded-full bg-white animate-pulse-slow" />
        )}
      </Link>
    )
  }

  return (
    <nav className="space-y-2 p-2">
      {items.map((item, index) => renderNavItem(item, index))}
    </nav>
  )
}
