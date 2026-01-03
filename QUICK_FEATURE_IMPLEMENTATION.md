# ⚡ Tezkor Feature Management - Amaliy Misol

## 🎯 QISQACHA: SMS Feature ni Faqat Ba'zi Maktablarga

---

# 1-QADAM: Database (5 daqiqa)

## Tenant model ga qo'shing:

```prisma
// prisma/schema.prisma

model Tenant {
  id                   String   @id @default(cuid())
  name                 String
  slug                 String   @unique
  
  // ... existing fields ...
  
  subscriptionPlan     SubscriptionPlan @default(BASIC)
  enabledFeatures      Json?    // ← YANGI!
  
  // ... rest
}

enum SubscriptionPlan {
  TRIAL
  BASIC
  STANDARD
  PREMIUM
  ENTERPRISE
}
```

## Migration:

```bash
npx prisma migrate dev --name add_feature_flags
```

---

# 2-QADAM: Feature Helper (5 daqiqa)

## Fayl yarating: `lib/features.ts`

```typescript
// lib/features.ts

import { db } from '@/lib/db'

export const FEATURES = {
  // Feature nomi: Minimum kerakli plan
  SMS_NOTIFICATIONS: 'PREMIUM',
  EMAIL_DIGEST: 'STANDARD',
  ADVANCED_REPORTS: 'STANDARD',
  EXCEL_EXPORT: 'BASIC',
  API_ACCESS: 'PREMIUM',
  CUSTOM_BRANDING: 'ENTERPRISE',
} as const

const PLAN_LEVELS = {
  TRIAL: 0,
  BASIC: 1,
  STANDARD: 2,
  PREMIUM: 3,
  ENTERPRISE: 4,
}

export async function hasFeature(
  tenantId: string,
  featureName: keyof typeof FEATURES
): Promise<boolean> {
  const tenant = await db.tenant.findUnique({
    where: { id: tenantId },
    select: {
      subscriptionPlan: true,
      enabledFeatures: true,
    },
  })

  if (!tenant) return false

  // 1. Check manual override (Super Admin qo'shgan)
  if (tenant.enabledFeatures) {
    const features = tenant.enabledFeatures as Record<string, boolean>
    if (features[featureName] !== undefined) {
      return features[featureName]
    }
  }

  // 2. Check by subscription plan
  const requiredPlan = FEATURES[featureName]
  const tenantLevel = PLAN_LEVELS[tenant.subscriptionPlan]
  const requiredLevel = PLAN_LEVELS[requiredPlan as keyof typeof PLAN_LEVELS]

  return tenantLevel >= requiredLevel
}
```

---

# 3-QADAM: Page da Ishlatish (3 daqiqa)

## SMS Page yarating:

```typescript
// app/(dashboard)/admin/sms/page.tsx

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { hasFeature } from '@/lib/features'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default async function SMSPage() {
  const session = await getServerSession(authOptions)
  
  if (!session) redirect('/login')

  const tenantId = session.user.tenantId!
  
  // ✅ Feature check
  const canUseSMS = await hasFeature(tenantId, 'SMS_NOTIFICATIONS')

  // ❌ Feature yo'q - upgrade prompt
  if (!canUseSMS) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Card className="max-w-lg p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">
            SMS Xabarnomalar
          </h2>
          <p className="text-muted-foreground mb-6">
            Bu funksiya faqat Premium planida mavjud
          </p>
          <Button asChild>
            <Link href="/pricing">
              Premium ga O'tish
            </Link>
          </Button>
        </Card>
      </div>
    )
  }

  // ✅ Feature bor - normal page
  return (
    <div>
      <h1>SMS Xabarnomalar</h1>
      {/* SMS functionality */}
    </div>
  )
}
```

---

# 4-QADAM: Navigation da Yashirish (2 daqiqa)

## Dashboard Nav:

```typescript
// components/dashboard-nav.tsx

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { MessageSquare, Users, BarChart } from 'lucide-react'

export function DashboardNav({ tenantId }: { tenantId: string }) {
  const [features, setFeatures] = useState<Record<string, boolean>>({})

  useEffect(() => {
    // Load features
    fetch('/api/features')
      .then(res => res.json())
      .then(setFeatures)
  }, [])

  return (
    <nav>
      <Link href="/admin/students">
        <Users className="h-4 w-4" />
        O'quvchilar
      </Link>

      {/* ✅ Faqat feature bor bo'lsa ko'rinadi */}
      {features.SMS_NOTIFICATIONS && (
        <Link href="/admin/sms">
          <MessageSquare className="h-4 w-4" />
          SMS Xabarnomalar
        </Link>
      )}

      {features.ADVANCED_REPORTS && (
        <Link href="/admin/reports/advanced">
          <BarChart className="h-4 w-4" />
          Hisobotlar
        </Link>
      )}
    </nav>
  )
}
```

---

# 5-QADAM: API Endpoint (2 daqiqa)

## Features API:

```typescript
// app/api/features/route.ts

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { hasFeature, FEATURES } from '@/lib/features'

export async function GET() {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const tenantId = session.user.tenantId!
  const features: Record<string, boolean> = {}

  // Check all features
  for (const featureName of Object.keys(FEATURES)) {
    features[featureName] = await hasFeature(
      tenantId,
      featureName as keyof typeof FEATURES
    )
  }

  return NextResponse.json(features)
}
```

---

# 6-QADAM: Super Admin - Feature Qo'shish (3 daqiqa)

## Toggle Feature API:

```typescript
// app/api/admin/tenants/[id]/features/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { feature, enabled } = await request.json()

  const tenant = await db.tenant.findUnique({
    where: { id: params.id },
    select: { enabledFeatures: true },
  })

  const currentFeatures = (tenant?.enabledFeatures || {}) as Record<string, boolean>

  await db.tenant.update({
    where: { id: params.id },
    data: {
      enabledFeatures: {
        ...currentFeatures,
        [feature]: enabled,
      },
    },
  })

  return NextResponse.json({ success: true })
}
```

## Super Admin UI:

```typescript
// app/(dashboard)/super-admin/tenants/[id]/page.tsx

'use client'

import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'

export function TenantFeatures({ tenantId }: { tenantId: string }) {
  const features = [
    { key: 'SMS_NOTIFICATIONS', name: 'SMS Xabarnomalar' },
    { key: 'ADVANCED_REPORTS', name: 'Kengaytirilgan Hisobotlar' },
    { key: 'API_ACCESS', name: 'API Kirish' },
  ]

  const toggleFeature = async (feature: string, enabled: boolean) => {
    await fetch(`/api/admin/tenants/${tenantId}/features`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ feature, enabled }),
    })
  }

  return (
    <div className="space-y-4">
      <h3 className="font-bold">Features</h3>
      
      {features.map((feature) => (
        <div key={feature.key} className="flex items-center justify-between">
          <span>{feature.name}</span>
          <Switch
            onCheckedChange={(checked) => toggleFeature(feature.key, checked)}
          />
        </div>
      ))}
    </div>
  )
}
```

---

# ✅ TAYYOR! Endi Qanday Ishlaydi?

## Scenario 1: Maktab #1 (BASIC Plan)

```
1. Login qiladi
2. Navigationda "SMS Xabarnomalar" KO'RINMAYDI
3. Agar URL ga `/admin/sms` yozsa → Upgrade prompt
```

## Scenario 2: Maktab #2 (PREMIUM Plan)

```
1. Login qiladi
2. Navigationda "SMS Xabarnomalar" KO'RINADI ✅
3. SMS page ochiladi - ishlaydi ✅
```

## Scenario 3: Super Admin Maktab #1 ga Qo'shadi

```
1. Super Admin dashboard
2. Maktab #1 ni ochadi
3. "SMS Notifications" switchni yoqadi
4. Maktab #1 endi SMS ishlatishi mumkin! ✅
   (BASIC plan bo'lsa ham)
```

---

# 🎯 REAL EXAMPLE: Excel Export Feature

## 1. Define Feature:

```typescript
// lib/features.ts
export const FEATURES = {
  EXCEL_EXPORT: 'BASIC', // Barcha planlar (BASIC+)
}
```

## 2. Button da Check:

```typescript
// components/student-list.tsx
import { hasFeature } from '@/lib/features'

export async function StudentList({ tenantId }: { tenantId: string }) {
  const canExport = await hasFeature(tenantId, 'EXCEL_EXPORT')

  return (
    <div>
      {/* Student table */}
      
      {canExport && (
        <Button onClick={exportToExcel}>
          Excel ga Export
        </Button>
      )}
      
      {!canExport && (
        <Button disabled>
          Excel ga Export (Premium)
        </Button>
      )}
    </div>
  )
}
```

---

# 📊 SUBSCRIPTION PLANS

## Qaysi Feature Qaysi Planga?

```typescript
export const PLAN_FEATURES = {
  TRIAL: [
    // Faqat basic features
    'VIEW_STUDENTS',
    'VIEW_TEACHERS',
  ],
  
  BASIC: [
    // TRIAL + 
    'EXCEL_EXPORT',
    'BASIC_REPORTS',
    'FILE_UPLOAD',
  ],
  
  STANDARD: [
    // BASIC +
    'EMAIL_DIGEST',
    'ADVANCED_REPORTS',
    'BULK_OPERATIONS',
  ],
  
  PREMIUM: [
    // STANDARD +
    'SMS_NOTIFICATIONS',
    'API_ACCESS',
    'PRIORITY_SUPPORT',
  ],
  
  ENTERPRISE: [
    // PREMIUM +
    'CUSTOM_BRANDING',
    'DEDICATED_SERVER',
    'SLA_GUARANTEE',
  ],
}
```

---

# 🔄 UPDATE QILISH

## Yangi Feature Qo'shish:

```typescript
// 1. lib/features.ts ga qo'shing
export const FEATURES = {
  // ... existing
  NEW_FEATURE: 'PREMIUM',  // ← YANGI
}

// 2. Component da ishlatish
const canUse = await hasFeature(tenantId, 'NEW_FEATURE')

// 3. Navigation ga qo'shish
{features.NEW_FEATURE && (
  <Link href="/admin/new-feature">
    Yangi Feature
  </Link>
)}
```

**Bo'ldi!** Git push qiling, Vercel avtomatik deploy! 🚀

---

# 💰 PRICING PAGE

```typescript
// app/(marketing)/pricing/page.tsx

export default function PricingPage() {
  const plans = [
    {
      name: 'Basic',
      price: '500,000',
      features: [
        'Excel Export',
        'Basic Reports',
        '200 ta o\'quvchi',
      ],
    },
    {
      name: 'Standard',
      price: '1,000,000',
      features: [
        'Barcha Basic features',
        'Email Digest',
        'Advanced Reports',
        '500 ta o\'quvchi',
      ],
    },
    {
      name: 'Premium',
      price: '2,000,000',
      features: [
        'Barcha Standard features',
        'SMS Notifications',
        'API Access',
        'Cheksiz o\'quvchi',
      ],
      popular: true,
    },
  ]

  return <PricingCards plans={plans} />
}
```

---

# 🎊 XULOSA

## Siz Faqat:

1. ✅ `lib/features.ts` da feature define qilasiz
2. ✅ Page da `hasFeature()` check qilasiz
3. ✅ Navigation da conditional render qilasiz
4. ✅ Git push qilasiz

## Sistema Avtomatik:

1. ✅ Plan-based access control
2. ✅ Super Admin override
3. ✅ Upgrade prompts
4. ✅ Clean UI (featureni ko'rinmaydigan)

## Natija:

- ✅ Scalable (100+ feature bo'lsa ham)
- ✅ Maintainable (code clean)
- ✅ Flexible (per-tenant control)
- ✅ Professional (real SaaS approach)

---

**Senior developer sifatida tavsiya:** Bu yechim! ✨

Batafsil: **FEATURE_MANAGEMENT_SYSTEM.md**

