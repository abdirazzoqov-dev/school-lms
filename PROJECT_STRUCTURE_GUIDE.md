# 🏗️ LOYIHA STRUKTURASI - To'liq Tushuntirish

## 📊 UMUMIY KO'RINISH

Bu **Next.js 14 App Router** asosida qurilgan **Multi-tenant SaaS** loyiha. Bitta kod bazasi, ko'p maktablar (tenants).

---

# 🗂️ FOLDER STRUKTURASI

```
lms/
├── app/                          # Next.js App Router (asosiy)
│   ├── (auth)/                   # Authentication routes (group)
│   │   ├── login/                # Login page
│   │   ├── blocked/              # Blocked tenant page
│   │   ├── payment-required/     # Suspended tenant page
│   │   └── unauthorized/         # Unauthorized page
│   │
│   ├── (dashboard)/              # Protected routes (group)
│   │   ├── super-admin/          # Super Admin panel
│   │   │   ├── layout.tsx        # Super Admin layout
│   │   │   ├── page.tsx         # Dashboard
│   │   │   ├── tenants/         # Maktablar boshqaruvi
│   │   │   ├── users/           # Barcha foydalanuvchilar
│   │   │   ├── payments/        # Barcha to'lovlar
│   │   │   └── settings/        # Platform sozlamalari
│   │   │
│   │   ├── admin/                # Maktab Admin panel
│   │   │   ├── layout.tsx        # Admin layout
│   │   │   ├── page.tsx         # Dashboard
│   │   │   ├── students/         # O'quvchilar
│   │   │   ├── teachers/         # O'qituvchilar
│   │   │   ├── classes/          # Sinflar
│   │   │   ├── payments/         # To'lovlar
│   │   │   ├── schedules/        # Dars jadvali
│   │   │   ├── reports/          # Hisobotlar
│   │   │   └── messages/         # Xabarlar
│   │   │
│   │   ├── teacher/              # O'qituvchi panel
│   │   │   ├── layout.tsx        # Teacher layout
│   │   │   ├── page.tsx         # Dashboard
│   │   │   ├── attendance/       # Davomat
│   │   │   ├── grades/           # Baholar
│   │   │   ├── materials/        # Materiallar
│   │   │   └── messages/         # Xabarlar
│   │   │
│   │   ├── parent/               # Ota-ona panel
│   │   │   ├── layout.tsx        # Parent layout
│   │   │   ├── page.tsx         # Dashboard
│   │   │   ├── children/         # Farzandlar
│   │   │   ├── grades/           # Baholar
│   │   │   ├── attendance/       # Davomat
│   │   │   └── payments/         # To'lovlar
│   │   │
│   │   └── student/              # O'quvchi panel (Phase 3)
│   │       ├── layout.tsx
│   │       └── page.tsx
│   │
│   ├── actions/                  # Server Actions (Next.js 14)
│   │   ├── student.ts            # Student CRUD operations
│   │   ├── teacher.ts            # Teacher CRUD operations
│   │   ├── payment.ts            # Payment operations
│   │   ├── grade.ts              # Grade operations
│   │   ├── attendance.ts         # Attendance operations
│   │   └── ...                   # Boshqa actions
│   │
│   ├── api/                      # API Routes (REST API)
│   │   ├── auth/                 # NextAuth endpoints
│   │   │   └── [...nextauth]/   # NextAuth handler
│   │   ├── students/             # Student API
│   │   ├── teachers/             # Teacher API
│   │   ├── payments/             # Payment API
│   │   └── upload/               # File upload API
│   │
│   ├── layout.tsx                # Root layout (barcha sahifalar)
│   ├── page.tsx                  # Home page (redirect logic)
│   └── globals.css               # Global styles
│
├── components/                   # Reusable React components
│   ├── ui/                      # shadcn/ui components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   └── ...
│   │
│   ├── dashboard-nav.tsx        # Navigation component
│   ├── user-nav.tsx            # User dropdown
│   ├── search-bar.tsx           # Search component
│   ├── pagination.tsx          # Pagination component
│   └── ...                     # Boshqa components
│
├── lib/                         # Utility functions
│   ├── auth.ts                 # Authentication helpers
│   ├── db.ts                   # Prisma client
│   ├── tenant.ts               # Tenant utilities
│   ├── tenant-security.ts     # Security helpers
│   ├── error-handler.ts        # Error handling
│   ├── rate-limit.ts           # Rate limiting
│   ├── file-validation.ts      # File validation
│   ├── utils.ts                # General utilities
│   │
│   └── validations/            # Zod schemas
│       ├── student.ts
│       ├── teacher.ts
│       ├── payment.ts
│       └── ...
│
├── prisma/                      # Database layer
│   ├── schema.prisma           # Database schema
│   └── seed.ts                # Seed data
│
├── types/                       # TypeScript types
│   └── next-auth.d.ts         # NextAuth type extensions
│
├── middleware.ts               # Next.js middleware (auth, tenant blocking)
├── next.config.js              # Next.js configuration
├── tailwind.config.ts          # Tailwind CSS config
├── package.json                # Dependencies
└── vercel.json                 # Vercel deployment config
```

---

# 🎯 QANDAY ISHLAYDI?

## 1. REQUEST FLOW (So'rov Oqimi)

```
User Request
    ↓
middleware.ts (Auth check, Tenant status check)
    ↓
app/(dashboard)/admin/page.tsx (Server Component)
    ↓
getServerSession() → Session check
    ↓
db.student.findMany() → Database query
    ↓
Render UI → Client Component
```

### Middleware (`middleware.ts`)

```typescript
// Har bir request dan oldin ishlaydi
1. Authentication check (token bor-yo'q)
2. Tenant status check (BLOCKED, SUSPENDED)
3. Role-based routing (SUPER_ADMIN, ADMIN, etc.)
4. Route protection
```

**Masalan:**
- `/admin/*` → Faqat ADMIN role
- `/super-admin/*` → Faqat SUPER_ADMIN role
- Tenant BLOCKED → `/blocked` ga redirect

---

## 2. AUTHENTICATION (NextAuth.js)

### Flow:

```
Login Page
    ↓
signIn('credentials', { email, password })
    ↓
lib/auth.ts → authorize() function
    ↓
Database check (User, Password, Tenant status)
    ↓
JWT token yaratish
    ↓
Session yaratish
    ↓
Redirect to dashboard
```

### Session Structure:

```typescript
{
  user: {
    id: string
    email: string
    fullName: string
    role: 'SUPER_ADMIN' | 'ADMIN' | 'TEACHER' | 'PARENT'
    tenantId: string | null
    tenant: {
      id: string
      name: string
      status: 'TRIAL' | 'ACTIVE' | 'SUSPENDED' | 'BLOCKED'
    }
  }
}
```

---

## 3. MULTI-TENANT ARCHITECTURE

### Tenant Isolation:

```typescript
// Har bir query da tenantId check
const students = await db.student.findMany({
  where: {
    tenantId: session.user.tenantId, // ← Tenant isolation!
  }
})

// Update/Delete da ham
await db.student.update({
  where: {
    id: studentId,
    tenantId: session.user.tenantId, // ← Security!
  },
  data: {...}
})
```

### Tenant Status Blocking:

```typescript
// middleware.ts da
if (tenantStatus === 'BLOCKED') {
  redirect('/blocked')  // Umuman kira olmaydi
}

if (tenantStatus === 'SUSPENDED') {
  redirect('/payment-required')  // Faqat to'lov sahifasi
}
```

---

## 4. SERVER ACTIONS (Next.js 14)

### Nima bu?

**Server Actions** - Client dan to'g'ridan-to'g'ri server function chaqirish.

### Misol:

```typescript
// app/actions/student.ts
'use server'

export async function createStudent(data: StudentFormData) {
  // 1. Session check
  const session = await getServerSession(authOptions)
  
  // 2. Authorization check
  if (session.user.role !== 'ADMIN') {
    return { error: 'Unauthorized' }
  }
  
  // 3. Tenant isolation
  const tenantId = session.user.tenantId!
  
  // 4. Validation
  const validated = studentSchema.parse(data)
  
  // 5. Database operation
  const student = await db.student.create({
    data: {
      tenantId,
      ...validated
    }
  })
  
  // 6. Revalidate cache
  revalidatePath('/admin/students')
  
  return { success: true, student }
}
```

### Client da ishlatish:

```typescript
// Component da
import { createStudent } from '@/app/actions/student'

const handleSubmit = async (formData) => {
  const result = await createStudent(formData)
  if (result.success) {
    toast.success('O\'quvchi qo\'shildi!')
  }
}
```

**Afzalliklari:**
- ✅ Type-safe (TypeScript)
- ✅ No API routes kerak
- ✅ Automatic validation
- ✅ Server-side execution

---

## 5. API ROUTES (REST API)

### Nima uchun?

Ba'zi joylarda REST API kerak:
- External integrations
- Mobile apps
- Third-party services

### Misol:

```typescript
// app/api/students/route.ts
export async function GET() {
  const session = await getServerSession(authOptions)
  
  if (!session || !session.user.tenantId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  const students = await db.student.findMany({
    where: { tenantId: session.user.tenantId }
  })
  
  return NextResponse.json({ students })
}
```

---

## 6. DATABASE LAYER (Prisma)

### Schema:

```prisma
// prisma/schema.prisma
model Tenant {
  id        String   @id @default(cuid())
  name      String
  slug      String   @unique
  status    TenantStatus
  // ...
  users     User[]
  students  Student[]
}

model User {
  id         String   @id @default(cuid())
  email      String   @unique
  passwordHash String
  role       UserRole
  tenantId   String?
  tenant     Tenant?  @relation(...)
  // ...
}
```

### Query:

```typescript
// lib/db.ts
import { PrismaClient } from '@prisma/client'

export const db = new PrismaClient()

// Ishlatish:
const students = await db.student.findMany({
  where: { tenantId },
  include: {
    class: true,
    parents: true
  }
})
```

---

## 7. COMPONENT ARCHITECTURE

### Server Components (Default):

```typescript
// app/(dashboard)/admin/students/page.tsx
export default async function StudentsPage() {
  // Server-side data fetching
  const session = await getServerSession(authOptions)
  const students = await db.student.findMany({
    where: { tenantId: session.user.tenantId }
  })
  
  // Render
  return (
    <div>
      <h1>O'quvchilar</h1>
      <StudentsTable students={students} />
    </div>
  )
}
```

### Client Components:

```typescript
// components/students-table.tsx
'use client'

import { useState } from 'react'

export function StudentsTable({ students }) {
  const [selected, setSelected] = useState([])
  
  // Client-side interactivity
  return (
    <table>
      {/* ... */}
    </table>
  )
}
```

**Qachon Client Component?**
- `useState`, `useEffect` ishlatilsa
- Event handlers (onClick, onChange)
- Browser APIs (localStorage, window)

---

## 8. ROUTING (Next.js App Router)

### File-based Routing:

```
app/
├── page.tsx                    → /
├── login/
│   └── page.tsx               → /login
├── (dashboard)/
│   └── admin/
│       ├── page.tsx           → /admin
│       └── students/
│           ├── page.tsx       → /admin/students
│           └── [id]/
│               └── page.tsx   → /admin/students/:id
```

### Route Groups:

```
(auth)/     → Group (URL da ko'rinmaydi)
(dashboard)/ → Group (URL da ko'rinmaydi)
```

**Nima uchun?**
- Layout sharing
- Route organization

---

## 9. STATE MANAGEMENT

### Server State:
- **React Server Components** - Automatic
- **Server Actions** - Form submissions
- **Next.js Cache** - `revalidatePath()`

### Client State:
- **useState** - Local state
- **Zustand** - Global state (optional)
- **React Query** - Server state caching (optional)

---

## 10. SECURITY LAYERS

### 1. Authentication (NextAuth.js)
```typescript
// JWT tokens
// Password hashing (bcrypt)
// Session management
```

### 2. Authorization (Middleware)
```typescript
// Role-based access
// Route protection
// Tenant status check
```

### 3. Tenant Isolation
```typescript
// Har bir query da tenantId check
// Update/Delete da tenantId validation
```

### 4. Input Validation (Zod)
```typescript
// Form validation
// API validation
// Type safety
```

### 5. SQL Injection Prevention
```typescript
// Prisma ORM (parameterized queries)
// No raw SQL
```

---

# 🔄 DATA FLOW EXAMPLE

## O'quvchi Qo'shish:

```
1. User form to'ldiradi
   ↓
2. Client Component (form)
   ↓
3. createStudent() Server Action chaqiriladi
   ↓
4. lib/auth.ts → Session check
   ↓
5. lib/validations/student.ts → Validation
   ↓
6. lib/db.ts → Prisma query
   ↓
7. Database → INSERT
   ↓
8. revalidatePath() → Cache clear
   ↓
9. Response → Client
   ↓
10. Toast notification
   ↓
11. Router refresh → New data
```

---

# 📦 KEY DEPENDENCIES

## Core:
- **Next.js 14** - Framework
- **React 18** - UI library
- **TypeScript** - Type safety

## Database:
- **Prisma** - ORM
- **PostgreSQL** - Database

## Auth:
- **NextAuth.js** - Authentication
- **bcryptjs** - Password hashing

## UI:
- **Tailwind CSS** - Styling
- **shadcn/ui** - Component library
- **Lucide React** - Icons

## Forms:
- **React Hook Form** - Form handling
- **Zod** - Validation

## Utils:
- **date-fns** - Date manipulation
- **recharts** - Charts

---

# 🎯 ARCHITECTURE PATTERNS

## 1. **Multi-Tenant SaaS**
- Bitta kod, ko'p maktablar
- Tenant isolation
- Subscription management

## 2. **Server-First**
- Server Components (default)
- Server Actions (mutations)
- Minimal client JavaScript

## 3. **Type Safety**
- TypeScript everywhere
- Zod validation
- Prisma types

## 4. **Security by Default**
- Tenant isolation
- Role-based access
- Input validation

---

# 🚀 DEPLOYMENT

## Vercel (Serverless):
```
GitHub Push
    ↓
Vercel Build
    ↓
Prisma Migrate
    ↓
Next.js Build
    ↓
Deploy
```

## Environment Variables:
```env
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=...
NEXTAUTH_URL=https://...
```

---

# 📊 STATISTICS

- **Total Files:** 200+
- **Components:** 50+
- **Pages:** 40+
- **Server Actions:** 11
- **API Routes:** 8
- **Database Models:** 20+

---

# 🎓 XULOSA

Bu loyiha **modern, scalable, secure** arxitektura asosida qurilgan:

1. ✅ **Next.js 14 App Router** - Latest features
2. ✅ **Multi-tenant SaaS** - Scalable
3. ✅ **Type-safe** - TypeScript + Zod
4. ✅ **Secure** - Multiple security layers
5. ✅ **Server-first** - Performance
6. ✅ **Production-ready** - Vercel deployment

**Professional-level architecture!** 🚀

