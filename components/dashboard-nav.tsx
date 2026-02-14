'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import * as Icons from 'lucide-react'
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
    const Icon = Icons[item.icon as keyof typeof Icons] as any
    
    // If item has children, render as accordion
    if (item.children && item.children.length > 0) {
      // Check if any child is active
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
                "p-2 rounded-lg transition-all duration-300",
                hasActiveChild 
                  ? "bg-white/20" 
                  : "bg-muted group-hover:bg-background"
              )}>
                {Icon && <Icon className="h-4 w-4" />}
              </div>
              <span className="flex-1 text-left">{item.title}</span>
            </AccordionTrigger>
            <AccordionContent className="pt-2 pb-1">
              <div className="ml-3 space-y-1 border-l-2 border-primary/20 pl-6">
                {item.children.map((child, childIndex) => {
                  const ChildIcon = Icons[child.icon as keyof typeof Icons] as any
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
                        'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-300 animate-fade-in',
                        isActive
                          ? 'bg-primary/10 text-primary border-l-2 border-primary -ml-px'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground hover:translate-x-1'
                      )}
                      style={{ animationDelay: `${childIndex * 30}ms` }}
                    >
                      {ChildIcon && (
                        <ChildIcon className={cn(
                          "h-3.5 w-3.5 transition-transform duration-300",
                          isActive ? "text-primary" : "group-hover:scale-110"
                        )} />
                      )}
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
    
    // Check if this is an exact match item (like /admin or /super-admin)
    const isDashboard = item.href === '/admin' || item.href === '/super-admin' || item.href === '/teacher' || item.href === '/parent'
    
    // For dashboard items, require exact match
    // For other items, match if pathname starts with the href
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
          "p-2 rounded-lg transition-all duration-300",
          isActive 
            ? "bg-white/20" 
            : "bg-muted group-hover:bg-background"
        )}>
          {Icon && <Icon className="h-4 w-4" />}
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

