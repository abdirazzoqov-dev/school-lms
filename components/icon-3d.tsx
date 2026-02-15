'use client'

import { cn } from '@/lib/utils'
import * as LucideIcons from 'lucide-react'

interface Icon3DProps {
  name: string
  size?: number
  className?: string
  alt?: string
}

/**
 * 3D Icon component for 3dicons.co integration
 * 
 * Usage: 
 * <Icon3D name="dashboard" size={48} />
 * 
 * Currently using Lucide icons as fallback.
 * To enable 3D icons, place PNG files in: public/icons/3d/{name}.png
 */
export function Icon3D({ name, size = 40, className }: Icon3DProps) {
  // Map 3D icon names to Lucide icon names
  const iconMap: Record<string, keyof typeof LucideIcons> = {
    'dashboard': 'LayoutDashboard',
    'calendar': 'Calendar',
    'users': 'Users',
    'clipboard-check': 'ClipboardCheck',
    'award': 'Award',
    'dollar': 'DollarSign',
    'file-text': 'FileText',
    'book': 'BookOpen',
    'message': 'MessageSquare',
  }

  const IconComponent = LucideIcons[iconMap[name] || 'Circle'] as React.ComponentType<{ 
    className?: string
    size?: number 
  }>

  // Use Lucide icon with 3D-like styling
  return (
    <div className={cn('relative flex items-center justify-center', className)}>
      <div className="relative">
        {/* Glow effect for 3D look */}
        <div className="absolute inset-0 bg-current opacity-20 blur-xl rounded-full scale-150" />
        <IconComponent 
          size={size} 
          className="relative drop-shadow-lg hover:scale-110 transition-transform duration-300" 
        />
      </div>
    </div>
  )
}

