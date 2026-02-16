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
 * 3D Colorful Icon component
 * 
 * Usage: 
 * <Icon3D name="home" size={48} />
 * 
 * Icons are rendered with vibrant gradients and 3D effects
 */
export function Icon3D({ name, size = 40, className }: Icon3DProps) {
  // Map 3D icon names to Lucide icon names
  const iconMap: Record<string, keyof typeof LucideIcons> = {
    'home': 'Home',
    'dashboard': 'LayoutDashboard',
    'calendar': 'Calendar',
    'users': 'Users',
    'clipboard-check': 'ClipboardCheck',
    'award': 'Award',
    'dollar': 'DollarSign',
    'file-text': 'FileText',
    'book': 'BookOpen',
    'message': 'MessageSquare',
    'menu': 'LayoutGrid',
  }

  // Colorful gradients for each icon type
  const iconColors: Record<string, string> = {
    'home': 'from-emerald-400 via-teal-500 to-cyan-600',
    'dashboard': 'from-blue-400 via-indigo-500 to-purple-600',
    'calendar': 'from-orange-400 via-red-500 to-pink-600',
    'users': 'from-violet-400 via-purple-500 to-fuchsia-600',
    'clipboard-check': 'from-green-400 via-emerald-500 to-teal-600',
    'award': 'from-yellow-400 via-amber-500 to-orange-600',
    'dollar': 'from-lime-400 via-green-500 to-emerald-600',
    'file-text': 'from-sky-400 via-blue-500 to-indigo-600',
    'book': 'from-pink-400 via-rose-500 to-red-600',
    'message': 'from-cyan-400 via-sky-500 to-blue-600',
    'menu': 'from-purple-400 via-violet-500 to-indigo-600',
  }

  const IconComponent = LucideIcons[iconMap[name] || 'Circle'] as React.ComponentType<{ 
    className?: string
    size?: number 
    strokeWidth?: number
  }>

  const gradient = iconColors[name] || 'from-gray-400 via-gray-500 to-gray-600'

  return (
    <div className={cn('relative flex items-center justify-center', className)}>
      <div className="relative">
        {/* Outer glow effect */}
        <div className={cn(
          'absolute inset-0 rounded-full blur-2xl opacity-40 scale-150 animate-pulse',
          `bg-gradient-to-br ${gradient}`
        )} />
        
        {/* Middle glow layer */}
        <div className={cn(
          'absolute inset-0 rounded-full blur-xl opacity-50 scale-125',
          `bg-gradient-to-br ${gradient}`
        )} />
        
        {/* Icon with gradient */}
        <div className={cn(
          'relative rounded-xl p-1.5 shadow-2xl',
          `bg-gradient-to-br ${gradient}`
        )}>
          <IconComponent 
            size={size * 0.7} 
            strokeWidth={2.5}
            className="relative text-white drop-shadow-lg hover:scale-110 transition-transform duration-300" 
          />
        </div>
      </div>
    </div>
  )
}

