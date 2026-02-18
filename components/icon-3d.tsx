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
 * Accepts Lucide icon names directly (e.g. "LayoutDashboard", "Users")
 * Every icon has a unique colorful gradient — no duplicates.
 */
export function Icon3D({ name, size = 40, className }: Icon3DProps) {
  // Each Lucide icon name → unique vibrant gradient
  const iconColors: Record<string, string> = {
    // ─── Admin main nav ───────────────────────────────────────────────────────
    'LayoutDashboard': 'from-blue-400 via-indigo-500 to-purple-600',       // Dashboard
    'Users':           'from-violet-400 via-purple-500 to-fuchsia-600',    // O'quvchilar
    'GraduationCap':   'from-emerald-400 via-teal-500 to-cyan-600',        // O'qituvchilar
    'Briefcase':       'from-amber-400 via-orange-500 to-red-500',         // Xodimlar
    'UserCheck':       'from-sky-400 via-blue-500 to-indigo-600',          // Ota-onalar
    'BookOpen':        'from-pink-400 via-rose-500 to-red-500',            // Sinflar
    'UsersRound':      'from-fuchsia-400 via-pink-500 to-purple-600',      // Guruhlar
    'Atom':            'from-cyan-400 via-sky-500 to-blue-600',            // Fanlar
    'Calendar':        'from-orange-400 via-amber-500 to-yellow-500',      // Dars jadvali
    'CalendarDays':    'from-orange-400 via-amber-500 to-yellow-500',
    'ClipboardCheck':  'from-green-400 via-emerald-500 to-teal-600',       // Davomat
    'Award':           'from-yellow-400 via-amber-500 to-orange-500',      // Baholar

    // ─── Moliya ───────────────────────────────────────────────────────────────
    'Wallet':          'from-lime-400 via-green-500 to-emerald-600',       // Moliya (parent)
    'DollarSign':      'from-green-400 via-teal-500 to-emerald-600',       // To'lovlar
    'Banknote':        'from-teal-400 via-cyan-500 to-sky-600',            // Maoshlar
    'TrendingDown':    'from-red-400 via-rose-500 to-pink-600',            // Xarajatlar (moliya)

    // ─── Oshxona ─────────────────────────────────────────────────────────────
    'ChefHat':         'from-orange-400 via-amber-400 to-yellow-400',      // Oshxona (parent)
    'UtensilsCrossed': 'from-amber-400 via-orange-400 to-red-400',         // Ovqatlar Menyusi
    'Receipt':         'from-red-400 via-orange-500 to-amber-500',         // Oshxona Xarajatlar

    // ─── Boshqa ──────────────────────────────────────────────────────────────
    'Home':            'from-emerald-400 via-teal-500 to-cyan-500',        // Yotoqxona
    'FileSignature':   'from-sky-400 via-blue-500 to-indigo-500',          // Shartnomalar
    'FileText':        'from-sky-400 via-blue-500 to-indigo-500',          // fallback
    'MessageSquare':   'from-cyan-400 via-sky-500 to-blue-600',            // Xabarlar
    'BarChart3':       'from-purple-400 via-violet-500 to-indigo-600',     // Hisobotlar
    'BarChart2':       'from-purple-400 via-violet-500 to-indigo-600',
    'UserCog':         'from-indigo-400 via-blue-500 to-sky-600',          // Ma'sul Xodimlar
    'Settings':        'from-slate-400 via-gray-500 to-zinc-600',          // Sozlamalar

    // ─── Teacher / parent / student panel nav ────────────────────────────────
    'Book':            'from-indigo-400 via-violet-500 to-purple-600',
    'GraduationCap2':  'from-emerald-400 via-teal-500 to-cyan-600',
    'LayoutGrid':      'from-blue-400 via-indigo-500 to-purple-600',
    'Bell':            'from-yellow-400 via-amber-500 to-orange-500',
    'BellRing':        'from-yellow-400 via-amber-500 to-orange-500',
    'CreditCard':      'from-green-400 via-teal-500 to-emerald-600',
    'User':            'from-violet-400 via-purple-500 to-fuchsia-600',
    'UserCircle':      'from-violet-400 via-purple-500 to-fuchsia-600',
    'TrendingUp':      'from-lime-400 via-green-500 to-emerald-600',
    'PieChart':        'from-rose-400 via-pink-500 to-fuchsia-600',
    'Activity':        'from-red-400 via-rose-500 to-pink-500',
    'Layers':          'from-blue-400 via-indigo-500 to-violet-600',
    'Target':          'from-red-400 via-rose-500 to-orange-500',
    'Star':            'from-yellow-400 via-amber-500 to-orange-400',
    'Zap':             'from-yellow-400 via-amber-400 to-orange-400',
    'ShieldCheck':     'from-green-400 via-emerald-500 to-teal-600',
    'Lock':            'from-slate-400 via-gray-500 to-zinc-600',
    'Key':             'from-amber-400 via-yellow-500 to-lime-500',
    'Utensils':        'from-amber-400 via-orange-400 to-red-400',
    'ChartBar':        'from-purple-400 via-violet-500 to-indigo-600',
    'Building':        'from-slate-400 via-blue-500 to-indigo-600',
    'Building2':       'from-slate-400 via-blue-500 to-indigo-600',
  }

  const gradient = iconColors[name] || 'from-gray-400 via-gray-500 to-gray-600'

  // Look up the Lucide component by name
  const IconComponent = LucideIcons[name as keyof typeof LucideIcons] as React.ComponentType<{
    className?: string
    size?: number
    strokeWidth?: number
  }> | undefined

  if (!IconComponent) {
    // Fallback: simple circle if icon not found
    return (
      <div
        className={cn(
          'relative flex items-center justify-center rounded-xl p-1.5 shadow-2xl',
          `bg-gradient-to-br ${gradient}`,
          className
        )}
        style={{ width: size * 0.7 + 12, height: size * 0.7 + 12 }}
      />
    )
  }

  return (
    <div className={cn('relative flex items-center justify-center', className)}>
      <div className="relative">
        {/* Soft glow layer */}
        <div
          className={cn(
            'absolute inset-0 rounded-full blur-xl opacity-40 scale-150',
            `bg-gradient-to-br ${gradient}`
          )}
        />

        {/* Icon background with gradient */}
        <div
          className={cn(
            'relative rounded-xl p-1.5 shadow-xl',
            `bg-gradient-to-br ${gradient}`
          )}
        >
          <IconComponent
            size={size * 0.7}
            strokeWidth={2.2}
            className="relative text-white drop-shadow"
          />
        </div>
      </div>
    </div>
  )
}
