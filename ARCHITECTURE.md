# 🏗️ School LMS - Architecture Documentation

## 📋 Table of Contents
- [System Overview](#system-overview)
- [Technology Stack](#technology-stack)
- [Architecture Patterns](#architecture-patterns)
- [Database Design](#database-design)
- [Security Implementation](#security-implementation)
- [Performance Optimization](#performance-optimization)
- [API Design](#api-design)
- [Caching Strategy](#caching-strategy)

---

## 🎯 System Overview

School LMS is a **multi-tenant** SaaS application for managing schools with:
- **Multi-tenancy**: Each school has isolated data
- **Role-based access control (RBAC)**: 7 user roles
- **Subscription management**: Trial, Active, Suspended, Blocked
- **Real-time updates**: Payment tracking, attendance, grades
- **Scalable architecture**: Ready for 1000+ schools

---

## 💻 Technology Stack

### Frontend
- **Next.js 14** (App Router) - React framework with SSR/ISR
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Shadcn UI** - Accessible component library
- **Lucide React** - Icon system

### Backend
- **Next.js API Routes** - RESTful APIs
- **Server Actions** - Type-safe mutations
- **Prisma ORM** - Database toolkit
- **NextAuth.js** - Authentication

### Database
- **PostgreSQL** - Relational database
- **Docker** - Containerization

### DevOps
- **Git** - Version control
- **npm** - Package management

---

## 🏛️ Architecture Patterns

### 1. Multi-Tenant Architecture

**Data Isolation Strategy: Tenant ID in Every Table**

```typescript
// Every model has tenantId
model Student {
  id       String @id
  tenant   Tenant @relation(...)
  tenantId String // Ensures data isolation
  // ...
}
```

**Benefits:**
- ✅ Strong data isolation
- ✅ Easy to scale (shared database, shared schema)
- ✅ Cost-effective for small/medium scale
- ✅ Simple backup/restore per tenant

### 2. Role-Based Access Control (RBAC)

**Roles Hierarchy:**
```
SUPER_ADMIN (Platform Owner)
  └── ADMIN (School Administrator)
      ├── MODERATOR (Limited permissions)
      ├── TEACHER (Education staff)
      ├── PARENT (Guardian access)
      ├── STUDENT (Phase 3)
      └── COOK (Kitchen staff)
```

**Implementation:**
```typescript
// middleware.ts
if (path.startsWith('/admin')) {
  if (role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
    return redirect('/unauthorized')
  }
}

// API routes
const validation = await requireAdmin()
if (!validation.success) return validation.response
```

### 3. Server-Side Rendering (SSR) + Incremental Static Regeneration (ISR)

**Page Types:**
- **Dynamic**: Dashboard, Payments (always fresh)
- **ISR**: Student lists, Reports (cached with revalidation)
- **Static**: Public pages, Landing

**Revalidation Strategy:**
```typescript
// Dashboard: 30 seconds
export const revalidate = 30
export const dynamic = 'force-dynamic'

// Lists: 60 seconds
export const revalidate = 60

// Reports: 5 minutes
export const revalidate = 300
```

---

## 🗄️ Database Design

### Core Tables

#### 1. **Tenant** (Schools)
```prisma
model Tenant {
  id                String
  name              String
  slug              String @unique
  status            TenantStatus // TRIAL, ACTIVE, SUSPENDED, BLOCKED
  subscriptionPlan  SubscriptionPlan
  maxStudents       Int
  maxTeachers       Int
}
```

#### 2. **User** (All users)
```prisma
model User {
  id           String
  tenantId     String? // Null for SUPER_ADMIN
  email        String @unique
  phone        String?
  passwordHash String
  role         UserRole
  isActive     Boolean
}
```

#### 3. **Student**
```prisma
model Student {
  id                String
  tenantId          String
  studentCode       String @unique(per tenant)
  monthlyTuitionFee Decimal
  paymentDueDay     Int
  trialEnabled      Boolean
  trialEndDate      DateTime?
}
```

#### 4. **Payment**
```prisma
model Payment {
  id           String
  tenantId     String
  studentId    String
  amount       Decimal
  status       PaymentStatus // PENDING, COMPLETED, FAILED
  paymentMonth Int // 1-12
  paymentYear  Int
  dueDate      DateTime
  paidDate     DateTime?
}
```

### Indexing Strategy

**Composite Indexes for Performance:**
```prisma
@@index([tenantId, status])
@@index([studentId, paymentMonth, paymentYear])
@@index([tenantId, date])
@@index([userId, tenantId])
```

**Benefits:**
- ✅ Fast tenant isolation queries
- ✅ Efficient payment lookups by month
- ✅ Optimized date range queries
- ✅ Quick user session validation

---

## 🔒 Security Implementation

### 1. **Authentication**
- **bcryptjs** for password hashing (12 rounds)
- **JWT tokens** via NextAuth.js
- **Session-based** authentication (30-day expiry)

### 2. **Authorization**
```typescript
// Every API route
const validation = await validateSession(['ADMIN'])
if (!validation.success) return validation.response

// Every database query includes tenant check
where: {
  tenantId,  // ✅ Security: Tenant isolation
  id: resourceId
}
```

### 3. **Input Validation**
```typescript
// Zod schemas for all forms
export const studentSchema = z.object({
  fullName: z.string().min(3),
  monthlyTuitionFee: z.number().min(0).max(200000000),
  // ...
})

// In server actions
const validatedData = studentSchema.parse(data)
```

### 4. **SQL Injection Prevention**
- **Prisma ORM** prevents SQL injection automatically
- All queries use parameterized statements

### 5. **Rate Limiting**
```typescript
// lib/rate-limit.ts
export function withRateLimit(request, handler) {
  const ip = request.headers.get('x-forwarded-for')
  // Check rate limit
  if (isRateLimited(ip)) {
    return Response.json({ error: 'Too many requests' }, { status: 429 })
  }
  return handler()
}
```

---

## ⚡ Performance Optimization

### 1. **Database Query Optimization**

**❌ Bad (N+1 queries):**
```typescript
const students = await db.student.findMany()
for (const student of students) {
  const payments = await db.payment.findMany({ where: { studentId: student.id } })
}
```

**✅ Good (Single query with include):**
```typescript
const students = await db.student.findMany({
  include: {
    payments: true,
    _count: { select: { payments: true } } // Only count, not full data
  }
})
```

### 2. **Selective Field Loading**
```typescript
// ✅ Only fetch needed fields
select: {
  id: true,
  fullName: true,
  email: true,
  // Don't fetch passwordHash, medicalInfo, etc.
}
```

### 3. **Parallel Queries**
```typescript
// ✅ Fetch multiple data in parallel
const [students, teachers, payments] = await Promise.all([
  db.student.count({ where: { tenantId } }),
  db.teacher.count({ where: { tenantId } }),
  db.payment.aggregate({ where: { tenantId }, _sum: { amount: true } })
])
```

### 4. **Caching Strategy**

**Page-level caching:**
```typescript
// Dashboard: 30s revalidation
export const revalidate = 30

// Lists: 60s revalidation
export const revalidate = 60
```

**Path revalidation:**
```typescript
// After payment creation
revalidatePath('/admin')          // Dashboard
revalidatePath('/admin/payments') // Payment list
revalidatePath('/admin/students') // Student list
```

### 5. **Performance Tracking**
```typescript
// lib/logger.ts
export async function withTiming<T>(label: string, fn: () => Promise<T>): Promise<T> {
  const start = Date.now()
  const result = await fn()
  const duration = Date.now() - start
  logger.performance(label, duration)
  return result
}

// Usage
const students = await withTiming('fetch_students', async () => {
  return db.student.findMany({ where: { tenantId } })
})
```

---

## 🔌 API Design

### RESTful API Structure

```
GET    /api/students          - List students
GET    /api/students/[id]     - Get student details
POST   /api/students          - Create student (future)
PUT    /api/students/[id]     - Update student (future)
DELETE /api/students/[id]     - Delete student (future)
```

### Server Actions (Primary)

**Benefits over API routes:**
- ✅ Type-safe (no manual typing)
- ✅ Automatic serialization
- ✅ Better DX (no need for fetch)
- ✅ Built-in error handling

**Example:**
```typescript
// app/actions/student.ts
'use server'

export async function createStudent(data: StudentFormData) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') {
    return { success: false, error: 'Unauthorized' }
  }

  const student = await db.student.create({ data: { ... } })
  revalidatePath('/admin/students')
  return { success: true, student }
}
```

### API Response Format

```typescript
// Success
{
  "success": true,
  "data": { ... }
}

// Error
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

---

## 📊 Caching Strategy

### Multi-Level Caching

#### 1. **Next.js Page Cache** (ISR)
```typescript
export const revalidate = 60 // Revalidate every 60s
```

#### 2. **Path Revalidation**
```typescript
// Revalidate specific paths after mutations
revalidatePath('/admin')
revalidatePath('/admin/students')
```

#### 3. **Cache Tags** (Advanced)
```typescript
// Future: Tag-based revalidation
fetch(url, { next: { tags: ['students', 'payments'] } })

// Revalidate by tag
revalidateTag('students')
```

### Cache Invalidation Rules

**Student changes → Revalidate:**
- `/admin` (dashboard stats)
- `/admin/students` (student list)
- `/admin/payments` (payment list)
- `/admin/attendance` (attendance list)
- `/admin/grades` (grade list)

**Payment changes → Revalidate:**
- `/admin` (revenue stats)
- `/admin/payments` (payment list)
- `/admin/reports` (financial reports)

---

## 📈 Scalability Considerations

### Current Scale (MVP)
- **Target**: 50-200 schools
- **Students**: Up to 20,000 total
- **Database**: Single PostgreSQL instance
- **Hosting**: Vercel / VPS

### Future Scaling (When needed)

#### 1. **Database Scaling**
- **Read replicas** for read-heavy queries
- **Connection pooling** (PgBouncer)
- **Sharding by tenant** (if >100k students)

#### 2. **Caching Layer**
- **Redis** for session storage
- **Redis** for frequently accessed data
- **CDN** for static assets

#### 3. **Microservices** (Optional)
- **Payment service** (separate)
- **Notification service** (separate)
- **Reporting service** (separate)

---

## 🔧 Development Best Practices

### 1. **Code Organization**
```
app/
  ├── (dashboard)/        # Protected routes
  ├── api/                # API routes
  └── actions/            # Server actions

lib/
  ├── db.ts              # Prisma client
  ├── auth.ts            # NextAuth config
  ├── validations/       # Zod schemas
  ├── logger.ts          # Logging system
  └── cache-config.ts    # Caching config

components/
  ├── ui/                # Shadcn UI components
  └── ...                # Feature components
```

### 2. **Type Safety**
- ✅ TypeScript strict mode
- ✅ Zod for runtime validation
- ✅ Prisma for database types

### 3. **Error Handling**
```typescript
// Centralized error handler
export function handleError(error: unknown, context?: Context) {
  logger.error('Error', error, context)
  
  if (isDevelopment) {
    return { success: false, error: error.message }
  }
  return { success: false, error: 'Internal error' }
}
```

### 4. **Logging**
```typescript
// Structured logging
logger.info('Student created', {
  userId,
  tenantId,
  action: 'CREATE_STUDENT',
  resourceId: student.id,
})
```

---

## 🚀 Deployment

### Environment Variables
- `DATABASE_URL` - PostgreSQL connection
- `NEXTAUTH_SECRET` - JWT secret
- `NEXTAUTH_URL` - App URL

### Production Checklist
- [ ] Set `NODE_ENV=production`
- [ ] Configure PostgreSQL with SSL
- [ ] Enable connection pooling
- [ ] Set up error monitoring (Sentry)
- [ ] Configure CDN for static assets
- [ ] Enable rate limiting
- [ ] Set up automated backups

---

## 📝 Conclusion

This architecture provides:
- ✅ **Security**: Multi-tenant isolation, RBAC, input validation
- ✅ **Performance**: Optimized queries, caching, ISR
- ✅ **Scalability**: Ready for 50-200 schools
- ✅ **Maintainability**: Type-safe, well-structured, documented
- ✅ **DX**: Server actions, Prisma, TypeScript

**Next Steps:**
1. Add Redis for session storage
2. Implement payment gateways (Click, Payme)
3. Add SMS/Email notifications
4. Mobile app (React Native)

