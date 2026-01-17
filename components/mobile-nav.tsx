'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import * as Icons from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Menu } from 'lucide-react'
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

interface MobileNavProps {
  items: NavItem[]
}

export function MobileNav({ items }: MobileNavProps) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  const renderNavItem = (item: NavItem) => {
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
        <Accordion key={item.title} type="single" collapsible className="w-full">
          <AccordionItem value={item.title} className="border-none">
            <AccordionTrigger
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:no-underline',
                hasActiveChild
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              {Icon && <Icon className="h-4 w-4" />}
              <span className="flex-1 text-left">{item.title}</span>
            </AccordionTrigger>
            <AccordionContent className="pt-1 pb-0">
              <div className="ml-4 space-y-1 border-l-2 border-border pl-4">
                {item.children.map((child) => {
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
                      onClick={() => setOpen(false)}
                      className={cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                      )}
                    >
                      {ChildIcon && <ChildIcon className="h-4 w-4" />}
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
        onClick={() => setOpen(false)}
        className={cn(
          'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
          isActive
            ? 'bg-primary text-primary-foreground'
            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
        )}
      >
        {Icon && <Icon className="h-4 w-4" />}
        {item.title}
      </Link>
    )
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 p-0">
        <div className="flex flex-col h-full">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold">Menyu</h2>
          </div>
          <nav className="flex-1 overflow-y-auto p-4 space-y-1">
            {items.map((item) => renderNavItem(item))}
          </nav>
        </div>
      </SheetContent>
    </Sheet>
  )
}

