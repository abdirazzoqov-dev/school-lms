'use client'

import { TenantStatus } from '@prisma/client'
import { AlertCircle, AlertTriangle, Info } from 'lucide-react'

interface TenantStatusBannerProps {
  status: TenantStatus
}

export function TenantStatusBanner({ status }: TenantStatusBannerProps) {
  if (status === 'ACTIVE' || status === 'TRIAL') {
    return null
  }

  const configs = {
    GRACE_PERIOD: {
      icon: AlertTriangle,
      bg: 'bg-orange-50 border-orange-200',
      text: 'text-orange-800',
      message: '⚠️ Obuna muddati tugadi. 7 kun ichida to\'lov qiling, aks holda hisobingiz to\'xtatiladi!'
    },
    SUSPENDED: {
      icon: AlertCircle,
      bg: 'bg-red-50 border-red-200',
      text: 'text-red-800',
      message: '🚫 Hisobingiz to\'xtatilgan. Xizmatdan foydalanish uchun to\'lov qiling!'
    },
    BLOCKED: {
      icon: AlertCircle,
      bg: 'bg-red-100 border-red-300',
      text: 'text-red-900',
      message: '⛔ Hisobingiz bloklangan. Administrator bilan bog\'laning!'
    }
  }

  const config = configs[status]
  if (!config) return null

  const Icon = config.icon

  return (
    <div className={`border-b ${config.bg} px-4 py-3`}>
      <div className="container flex items-center gap-2">
        <Icon className={`h-5 w-5 ${config.text}`} />
        <p className={`font-medium ${config.text}`}>
          {config.message}
        </p>
      </div>
    </div>
  )
}

