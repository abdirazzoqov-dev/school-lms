import Image from 'next/image'
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
 * Icons should be placed in: public/icons/3d/{name}.png
 * Falls back to Lucide icons if 3D icon not found
 */
export function Icon3D({ name, size = 40, className, alt }: Icon3DProps) {
  // Map 3D icon names to Lucide icon names for fallback
  const iconFallbackMap: Record<string, keyof typeof LucideIcons> = {
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

  const FallbackIcon = LucideIcons[iconFallbackMap[name] || 'Circle'] as React.ComponentType<{ className?: string; size?: number }>

  return (
    <div className={cn('relative flex items-center justify-center', className)}>
      {/* Try to load 3D icon, fallback to Lucide on error */}
      <Image
        src={`/icons/3d/${name}.png`}
        alt={alt || name}
        width={size}
        height={size}
        className="object-contain drop-shadow-lg hover:scale-110 transition-transform duration-300"
        priority={false}
        loading="lazy"
        onError={(e) => {
          // Hide broken image and show fallback
          e.currentTarget.style.display = 'none'
          const parent = e.currentTarget.parentElement
          if (parent) {
            parent.classList.add('show-fallback')
          }
        }}
      />
      {/* Fallback Lucide icon (hidden by default, shown on error) */}
      <div className="absolute inset-0 items-center justify-center hidden [.show-fallback>&]:flex">
        <FallbackIcon size={size * 0.6} className="text-current animate-in fade-in-0 zoom-in-95" />
      </div>
    </div>
  )
}

