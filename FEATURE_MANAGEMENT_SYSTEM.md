# 🎯 Feature Management System (Professional SaaS Approach)

## 📊 MUAMMO

**Scenario:** 
- Yangi "SMS Notifications" feature yaratdingiz
- Faqat 2 ta maktab obuna bo'ldi (Premium plan)
- Boshqa maktablar Basic plan da (SMS yo'q)
- Agar kerak bo'lsa, qo'shib berish kerak
- Kerak bo'lmasa, ko'rinmasin

**Noto'g'ri Yechim ❌:**
- Har bir maktab uchun alohida code yozish
- If/else maktab nomiga qarab
- Hard-coded tenant ID lar

**To'g'ri Yechim ✅:**
- Subscription plan-based features
- Database-driven feature flags
- Tenant settings
- Clean, scalable code

---

# 🏗️ ARXITEKTURA

## 3 Qatlamli Yechim:

```
┌─────────────────────────────────────┐
│  1. SUBSCRIPTION PLANS              │
│  (BASIC, STANDARD, PREMIUM)         │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│  2. FEATURE FLAGS                   │
│  (Which features enabled)           │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│  3. TENANT SETTINGS                 │
│  (Per-tenant overrides)             │
└─────────────────────────────────────┘
```

---

# QISM 1: DATABASE SCHEMA

## 1.1 - Tenant Model ga Qo'shimchalar

```prisma
// prisma/schema.prisma

model Tenant {
  id                   String            @id @default(cuid())
  name                 String
  slug                 String            @unique
  
  // Subscription
  subscriptionPlan     SubscriptionPlan  @default(TRIAL)
  subscriptionStart    DateTime?
  subscriptionEnd      DateTime?
  status               TenantStatus      @default(TRIAL)
  
  // Feature Settings (JSON)
  enabledFeatures      Json?             // Dynamic feature flags
  featureSettings      Json?             // Feature-specific settings
  
  // ... qolgan fieldlar
}

enum SubscriptionPlan {
  TRIAL      // Bepul sinov - limited features
  BASIC      // Asosiy - basic features
  STANDARD   // O'rtacha - more features  
  PREMIUM    // To'liq - all features
  ENTERPRISE // Custom - custom features
}
```

## 1.2 - Feature Flags Table (Advanced)

```prisma
// Alohida feature management uchun
model Feature {
  id          String   @id @default(cuid())
  key         String   @unique  // "SMS_NOTIFICATIONS"
  name        String              // "SMS Xabarnomalar"
  description String?
  
  // Qaysi planlarda mavjud
  availableInTrial     Boolean @default(false)
  availableInBasic     Boolean @default(false)
  availableInStandard  Boolean @default(true)
  availableInPremium   Boolean @default(true)
  availableInEnterprise Boolean @default(true)
  
  // Status
  isActive    Boolean @default(true)
  isPublic    Boolean @default(false)  // Ommaga ochiq?
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  // Relations
  tenantFeatures TenantFeature[]
}

// Tenant-specific feature overrides
model TenantFeature {
  id        String  @id @default(cuid())
  tenant    Tenant  @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  tenantId  String
  feature   Feature @relation(fields: [featureId], references: [id], onDelete: Cascade)
  featureId String
  
  isEnabled Boolean @default(true)
  settings  Json?   // Feature-specific settings
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@unique([tenantId, featureId])
  @@index([tenantId])
  @@index([featureId])
}
```

---

# QISM 2: FEATURE UTILITY

## 2.1 - Feature Check Helper

```typescript
// lib/features.ts

import { db } from '@/lib/db'

export enum FeatureKey {
  SMS_NOTIFICATIONS = 'SMS_NOTIFICATIONS',
  EMAIL_DIGEST = 'EMAIL_DIGEST',
  ADVANCED_REPORTS = 'ADVANCED_REPORTS',
  EXCEL_EXPORT = 'EXCEL_EXPORT',
  API_ACCESS = 'API_ACCESS',
  CUSTOM_BRANDING = 'CUSTOM_BRANDING',
  BULK_OPERATIONS = 'BULK_OPERATIONS',
  MOBILE_APP = 'MOBILE_APP',
}

// Feature configuration
export const FEATURE_CONFIG = {
  [FeatureKey.SMS_NOTIFICATIONS]: {
    name: 'SMS Xabarnomalar',
    description: 'Ota-onalarga SMS orqali xabar yuborish',
    minPlan: 'PREMIUM',
  },
  [FeatureKey.EMAIL_DIGEST]: {
    name: 'Email Digest',
    description: 'Haftalik email hisobotlar',
    minPlan: 'STANDARD',
  },
  [FeatureKey.ADVANCED_REPORTS]: {
    name: 'Kengaytirilgan Hisobotlar',
    description: 'Batafsil analytics va hisobotlar',
    minPlan: 'STANDARD',
  },
  [FeatureKey.EXCEL_EXPORT]: {
    name: 'Excel Export',
    description: 'Ma\'lumotlarni Excel ga export qilish',
    minPlan: 'BASIC',
  },
  [FeatureKey.API_ACCESS]: {
    name: 'API Kirish',
    description: 'REST API orqali integratsiya',
    minPlan: 'PREMIUM',
  },
  [FeatureKey.CUSTOM_BRANDING]: {
    name: 'Custom Branding',
    description: 'O\'z logotip va ranglaringiz',
    minPlan: 'ENTERPRISE',
  },
  [FeatureKey.BULK_OPERATIONS]: {
    name: 'Bulk Operations',
    description: 'Ko\'plab ma\'lumotlarni bir vaqtda tahrirlash',
    minPlan: 'STANDARD',
  },
  [FeatureKey.MOBILE_APP]: {
    name: 'Mobile App',
    description: 'iOS va Android ilovalar',
    minPlan: 'PREMIUM',
  },
}

// Plan hierarchy
const PLAN_HIERARCHY = {
  TRIAL: 0,
  BASIC: 1,
  STANDARD: 2,
  PREMIUM: 3,
  ENTERPRISE: 4,
}

/**
 * Check if tenant has access to a feature
 */
export async function hasFeature(
  tenantId: string,
  featureKey: FeatureKey
): Promise<boolean> {
  // 1. Get tenant
  const tenant = await db.tenant.findUnique({
    where: { id: tenantId },
    select: {
      subscriptionPlan: true,
      status: true,
      enabledFeatures: true,
    },
  })

  if (!tenant) return false

  // 2. Check if tenant is blocked
  if (tenant.status === 'BLOCKED') return false

  // 3. Check tenant-specific override
  if (tenant.enabledFeatures) {
    const features = tenant.enabledFeatures as any
    if (features[featureKey] !== undefined) {
      return features[featureKey] === true
    }
  }

  // 4. Check tenant-feature table (advanced)
  const tenantFeature = await db.tenantFeature.findFirst({
    where: {
      tenantId,
      feature: { key: featureKey },
    },
  })

  if (tenantFeature) {
    return tenantFeature.isEnabled
  }

  // 5. Check by subscription plan
  const config = FEATURE_CONFIG[featureKey]
  if (!config) return false

  const tenantPlanLevel = PLAN_HIERARCHY[tenant.subscriptionPlan]
  const requiredPlanLevel = PLAN_HIERARCHY[config.minPlan as keyof typeof PLAN_HIERARCHY]

  return tenantPlanLevel >= requiredPlanLevel
}

/**
 * Get all features for a tenant
 */
export async function getTenantFeatures(tenantId: string) {
  const features: Record<string, boolean> = {}

  for (const featureKey of Object.values(FeatureKey)) {
    features[featureKey] = await hasFeature(tenantId, featureKey)
  }

  return features
}

/**
 * Check feature in server component
 */
export async function checkFeature(
  tenantId: string,
  featureKey: FeatureKey
): Promise<{ hasAccess: boolean; upgradeUrl?: string }> {
  const hasAccess = await hasFeature(tenantId, featureKey)

  if (!hasAccess) {
    return {
      hasAccess: false,
      upgradeUrl: `/upgrade?feature=${featureKey}`,
    }
  }

  return { hasAccess: true }
}
```

---

# QISM 3: SERVER-SIDE USAGE

## 3.1 - Server Component da Ishlatish

```typescript
// app/(dashboard)/admin/sms/page.tsx

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { hasFeature, FeatureKey } from '@/lib/features'
import { UpgradePrompt } from '@/components/upgrade-prompt'

export default async function SMSPage() {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect('/login')
  }

  const tenantId = session.user.tenantId!

  // Feature check
  const canUseSMS = await hasFeature(tenantId, FeatureKey.SMS_NOTIFICATIONS)

  if (!canUseSMS) {
    return (
      <UpgradePrompt
        feature="SMS Xabarnomalar"
        description="SMS xabarnomalar faqat Premium plan da mavjud"
        currentPlan="BASIC"
        requiredPlan="PREMIUM"
      />
    )
  }

  // Feature mavjud - normal page
  return (
    <div>
      <h1>SMS Xabarnomalar</h1>
      {/* SMS functionality */}
    </div>
  )
}
```

## 3.2 - API Route da Ishlatish

```typescript
// app/api/sms/send/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { hasFeature, FeatureKey } from '@/lib/features'

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const tenantId = session.user.tenantId!

  // Feature check
  const canUseSMS = await hasFeature(tenantId, FeatureKey.SMS_NOTIFICATIONS)

  if (!canUseSMS) {
    return NextResponse.json(
      {
        error: 'Feature not available',
        message: 'SMS xabarnomalar sizning planida mavjud emas',
        upgradeUrl: '/upgrade?feature=SMS_NOTIFICATIONS',
      },
      { status: 403 }
    )
  }

  // SMS yuborish logic
  // ...

  return NextResponse.json({ success: true })
}
```

---

# QISM 4: CLIENT-SIDE USAGE

## 4.1 - React Hook

```typescript
// hooks/use-features.ts

'use client'

import { useSession } from 'next-auth/react'
import { useQuery } from '@tanstack/react-query'

export function useFeatures() {
  const { data: session } = useSession()

  return useQuery({
    queryKey: ['features', session?.user.tenantId],
    queryFn: async () => {
      const res = await fetch('/api/features')
      return res.json()
    },
    enabled: !!session?.user.tenantId,
  })
}

export function useFeature(featureKey: string) {
  const { data: features, isLoading } = useFeatures()

  return {
    hasFeature: features?.[featureKey] ?? false,
    isLoading,
  }
}
```

## 4.2 - Feature Gate Component

```typescript
// components/feature-gate.tsx

'use client'

import { useFeature } from '@/hooks/use-features'
import { UpgradePrompt } from './upgrade-prompt'
import { ReactNode } from 'react'

interface FeatureGateProps {
  feature: string
  children: ReactNode
  fallback?: ReactNode
}

export function FeatureGate({ feature, children, fallback }: FeatureGateProps) {
  const { hasFeature, isLoading } = useFeature(feature)

  if (isLoading) {
    return <div>Yuklanmoqda...</div>
  }

  if (!hasFeature) {
    return fallback || <UpgradePrompt feature={feature} />
  }

  return <>{children}</>
}
```

## 4.3 - Conditional Rendering

```typescript
// components/dashboard-nav.tsx

'use client'

import { useFeatures } from '@/hooks/use-features'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'

export function DashboardNav() {
  const { data: features } = useFeatures()

  const navItems = [
    { title: 'Dashboard', href: '/admin', icon: 'Home' },
    { title: 'O\'quvchilar', href: '/admin/students', icon: 'Users' },
    { title: 'O\'qituvchilar', href: '/admin/teachers', icon: 'GraduationCap' },
    
    // Conditional nav items
    {
      title: 'SMS Xabarnomalar',
      href: '/admin/sms',
      icon: 'MessageSquare',
      feature: 'SMS_NOTIFICATIONS',
      badge: 'Premium',
    },
    {
      title: 'Kengaytirilgan Hisobotlar',
      href: '/admin/reports/advanced',
      icon: 'BarChart3',
      feature: 'ADVANCED_REPORTS',
      badge: 'Standard',
    },
    {
      title: 'API Access',
      href: '/admin/api',
      icon: 'Code',
      feature: 'API_ACCESS',
      badge: 'Premium',
    },
  ]

  return (
    <nav>
      {navItems.map((item) => {
        // Feature check
        if (item.feature && !features?.[item.feature]) {
          return null // Feature yo'q - ko'rinmasin
        }

        return (
          <Link key={item.href} href={item.href}>
            {item.title}
            {item.badge && (
              <Badge variant="secondary">{item.badge}</Badge>
            )}
          </Link>
        )
      })}
    </nav>
  )
}
```

---

# QISM 5: ADMIN PANEL (Super Admin)

## 5.1 - Feature Management Dashboard

```typescript
// app/(dashboard)/super-admin/features/page.tsx

import { db } from '@/lib/db'
import { FeatureToggle } from './feature-toggle'

export default async function FeaturesPage() {
  const features = await db.feature.findMany({
    include: {
      tenantFeatures: {
        include: {
          tenant: {
            select: {
              name: true,
              subscriptionPlan: true,
            },
          },
        },
      },
    },
  })

  return (
    <div>
      <h1>Feature Management</h1>
      
      <div className="grid gap-4">
        {features.map((feature) => (
          <FeatureCard key={feature.id} feature={feature} />
        ))}
      </div>
    </div>
  )
}
```

## 5.2 - Tenant-Specific Feature Toggle

```typescript
// app/api/admin/tenants/[id]/features/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { featureKey, enabled } = await request.json()

  // Update tenant's enabled features
  const tenant = await db.tenant.update({
    where: { id: params.id },
    data: {
      enabledFeatures: {
        ...tenant.enabledFeatures,
        [featureKey]: enabled,
      },
    },
  })

  return NextResponse.json({ success: true })
}
```

---

# QISM 6: UPGRADE FLOW

## 6.1 - Upgrade Prompt Component

```typescript
// components/upgrade-prompt.tsx

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { Lock, Sparkles } from 'lucide-react'

interface UpgradePromptProps {
  feature: string
  description?: string
  currentPlan?: string
  requiredPlan: string
}

export function UpgradePrompt({
  feature,
  description,
  currentPlan,
  requiredPlan,
}: UpgradePromptProps) {
  return (
    <div className="flex min-h-[400px] items-center justify-center">
      <Card className="max-w-lg p-8 text-center">
        <div className="mb-4 flex justify-center">
          <div className="rounded-full bg-primary/10 p-4">
            <Lock className="h-8 w-8 text-primary" />
          </div>
        </div>

        <h2 className="mb-2 text-2xl font-bold">{feature}</h2>
        
        {description && (
          <p className="mb-4 text-muted-foreground">{description}</p>
        )}

        <div className="mb-6 flex items-center justify-center gap-2">
          {currentPlan && (
            <Badge variant="secondary">{currentPlan}</Badge>
          )}
          <span className="text-muted-foreground">→</span>
          <Badge className="bg-gradient-to-r from-purple-500 to-pink-500">
            <Sparkles className="mr-1 h-3 w-3" />
            {requiredPlan}
          </Badge>
        </div>

        <p className="mb-6 text-sm text-muted-foreground">
          Bu funksiya faqat {requiredPlan} planida mavjud
        </p>

        <div className="flex gap-3">
          <Button asChild variant="outline" className="flex-1">
            <Link href="/pricing">Tariflarni Ko'rish</Link>
          </Button>
          <Button asChild className="flex-1">
            <Link href={`/upgrade?plan=${requiredPlan}`}>
              Upgrade Qilish
            </Link>
          </Button>
        </div>
      </Card>
    </div>
  )
}
```

---

# QISM 7: MIGRATION & SEEDING

## 7.1 - Initial Feature Seeding

```typescript
// prisma/seed-features.ts

import { db } from '@/lib/db'

async function seedFeatures() {
  const features = [
    {
      key: 'SMS_NOTIFICATIONS',
      name: 'SMS Xabarnomalar',
      description: 'Ota-onalarga SMS orqali xabar yuborish',
      availableInPremium: true,
      availableInEnterprise: true,
    },
    {
      key: 'EMAIL_DIGEST',
      name: 'Email Digest',
      description: 'Haftalik email hisobotlar',
      availableInStandard: true,
      availableInPremium: true,
      availableInEnterprise: true,
    },
    {
      key: 'ADVANCED_REPORTS',
      name: 'Kengaytirilgan Hisobotlar',
      description: 'Batafsil analytics va hisobotlar',
      availableInStandard: true,
      availableInPremium: true,
      availableInEnterprise: true,
    },
    {
      key: 'EXCEL_EXPORT',
      name: 'Excel Export',
      description: 'Ma\'lumotlarni Excel ga export qilish',
      availableInBasic: true,
      availableInStandard: true,
      availableInPremium: true,
      availableInEnterprise: true,
    },
  ]

  for (const feature of features) {
    await db.feature.upsert({
      where: { key: feature.key },
      update: feature,
      create: feature,
    })
  }

  console.log('✅ Features seeded!')
}

seedFeatures()
```

---

# QISM 8: REAL-WORLD EXAMPLE

## SMS Notifications Feature - To'liq Integratsiya

### 1. Database Schema
```prisma
model Tenant {
  // ... existing fields
  enabledFeatures Json? // { "SMS_NOTIFICATIONS": true }
}
```

### 2. Navigation (ko'rinishi)
```typescript
// Faqat Premium planli maktablarda ko'rinadi
{features?.SMS_NOTIFICATIONS && (
  <NavItem href="/admin/sms" icon={MessageSquare}>
    SMS Xabarnomalar
  </NavItem>
)}
```

### 3. Page (kirish)
```typescript
// app/(dashboard)/admin/sms/page.tsx
const canUseSMS = await hasFeature(tenantId, 'SMS_NOTIFICATIONS')

if (!canUseSMS) {
  return <UpgradePrompt requiredPlan="PREMIUM" />
}
```

### 4. API (funksiyasi)
```typescript
// app/api/sms/send/route.ts
if (!await hasFeature(tenantId, 'SMS_NOTIFICATIONS')) {
  return NextResponse.json({ error: 'Upgrade required' }, { status: 403 })
}
```

### 5. Super Admin (boshqaruvi)
```typescript
// Maktab #5 ga SMS feature qo'shish
await db.tenant.update({
  where: { id: 'tenant-5' },
  data: {
    enabledFeatures: {
      SMS_NOTIFICATIONS: true,
    },
  },
})
```

---

# 🎯 SUMMARY: OPTIMAL YECHIM

## Afzalliklari:

### 1. ✅ Scalable
- Yangi feature qo'shish oson
- Code clean va maintainable
- No hard-coding

### 2. ✅ Flexible
- Plan-based (BASIC, STANDARD, PREMIUM)
- Tenant-specific overrides
- Feature flags on/off

### 3. ✅ User-Friendly
- Upgrade prompts
- Clear messaging
- No broken links

### 4. ✅ Admin Control
- Super Admin dashboard
- Per-tenant feature toggle
- Real-time changes

### 5. ✅ Performance
- Cached feature checks
- Efficient queries
- No unnecessary renders

---

# 🚀 IMPLEMENTATION PLAN

## Phase 1: Database (1 soat)
```bash
# 1. Schema update
# Add enabledFeatures to Tenant model

# 2. Migration
npx prisma migrate dev --name add_feature_flags

# 3. Seed
npx tsx prisma/seed-features.ts
```

## Phase 2: Feature Utility (2 soat)
```bash
# 1. Create lib/features.ts
# 2. Implement hasFeature()
# 3. Test
```

## Phase 3: UI Components (2 soat)
```bash
# 1. FeatureGate component
# 2. UpgradePrompt component
# 3. Conditional navigation
```

## Phase 4: Admin Panel (2 soat)
```bash
# 1. Feature management page
# 2. Toggle API
# 3. Test
```

**Total: 7-8 soat** (1 kun)

---

# 💡 BEST PRACTICES

## 1. ✅ Default to False
Feature yangi bo'lsa, default false (upgrade kerak)

## 2. ✅ Graceful Degradation
Feature yo'q bo'lsa, tushinarli xabar

## 3. ✅ Clear Upgrade Path
"Upgrade qiling" tugmasi har doim

## 4. ✅ Cache Features
Har request da database ga bormaslik

## 5. ✅ Audit Log
Kim qaysi feature ni yoqdi/o'chirdi

---

Bu senior-level yechim! Clean, scalable, maintainable. 🚀

