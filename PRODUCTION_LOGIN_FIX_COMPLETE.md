# 🔧 Production Login Fix - To'liq Yechim

## 📊 A) TEZKOR DIAGNOZ (Prioritet bilan)

### Muammo 1: `public.users` topilmayapti

#### 1️⃣ **ENG MUHIM: Migrations prod'ga tushmagan** ⚠️⚠️⚠️

**Belgi:** 
- `The table public.users does not exist`
- Vercel runtime log'da Prisma xatosi
- Localda ishlaydi, prod'da ishlamaydi

**Sabab:**
- `prisma/migrations/` papkasi git'ga commit qilinmagan
- Yoki Vercel build'da migrations deploy qilinmagan
- Yoki migrations xato bilan tugagan

**Tekshiruv SQL:**
```sql
-- Supabase SQL Editor
SELECT COUNT(*) FROM _prisma_migrations;
-- Agar 0 bo'lsa → migrations yo'q
```

**Fix:**
```bash
# Localda migration yaratish
npx prisma migrate dev --name init

# Git commit
git add prisma/migrations
git commit -m "Add Prisma migrations"
git push

# Vercel avtomatik deploy
```

---

#### 2️⃣ **Vercel DATABASE_URL noto'g'ri project'ga qarab qolgan** ⚠️⚠️

**Belgi:**
- SQL tekshiruvda boshqa jadvallar ko'rinadi
- Yoki umuman jadvallar yo'q
- Localda ishlaydi, prod'da ishlamaydi

**Sabab:**
- Vercel env'da `DATABASE_URL` noto'g'ri Supabase project'ga qarab qolgan
- Yoki eski project'ga qarab qolgan

**Tekshiruv SQL:**
```sql
-- Qaysi jadvallar bor?
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;
-- Agar "tenants", "students" va boshqalar yo'q bo'lsa → boshqa DB
```

**Fix:**
- Vercel → Settings → Environment Variables
- `DATABASE_URL` ni to'g'ri Supabase project'dan olish
- Redeploy

---

#### 3️⃣ **Jadval `auth.users` da (Supabase Auth)** ⚠️

**Belgi:**
- SQL tekshiruvda `auth.users` ko'rinadi
- `public.users` yo'q
- Prisma `public.users` qidiryapti

**Sabab:**
- Supabase Auth `auth.users` jadvalini yaratadi
- Bu bizning application users emas!
- Bizga `public.users` kerak (Prisma orqali yaratilgan)

**Tekshiruv SQL:**
```sql
-- auth.users va public.users farqi
SELECT table_schema, table_name
FROM information_schema.tables 
WHERE table_name = 'users'
ORDER BY table_schema;
```

**Fix:**
- `public.users` jadvalini yaratish kerak (migrations orqali)
- `auth.users` va `public.users` alohida (biz `public.users` ishlatamiz)

---

#### 4️⃣ **Jadval nomi boshqa (User, Users, userlar)** ⚠️

**Belgi:**
- SQL tekshiruvda `public.User` (katta harf) ko'rinadi
- Prisma `public.users` (kichik harf) qidiryapti

**Sabab:**
- Postgres case-sensitive
- `db push` katta harf bilan yaratgan
- Prisma schema'da `@@map("users")` bor, lekin jadval `User` nomida

**Tekshiruv SQL:**
```sql
-- Case-sensitive tekshiruv
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('User', 'user', 'users', 'USER');
```

**Fix:**
- Jadvalni to'g'ri nom bilan yaratish (migrations orqali)
- Yoki `@@map("User")` qo'shish (lekin bu tavsiya qilinmaydi)

---

#### 5️⃣ **Schema mismatch (public emas)** ⚠️

**Belgi:**
- Prisma `public.users` qidiryapti
- Lekin jadval boshqa schema'da (masalan `app`, `lms`)

**Sabab:**
- Prisma schema'da `schemas = ["public"]` belgilanmagan
- Yoki database'da custom schema ishlatilgan

**Tekshiruv SQL:**
```sql
-- Barcha schema'larda users jadvalini qidirish
SELECT table_schema, table_name
FROM information_schema.tables 
WHERE table_name = 'users'
ORDER BY table_schema;
```

**Fix:**
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  schemas  = ["public"]  // ← Qo'shish kerak
}
```

---

### Muammo 2: Super Admin Login ishlamaydi

#### 1️⃣ **ENG MUHIM: Vercel'da `.env` ishlamaydi** ⚠️⚠️⚠️

**Belgi:**
- Localda super admin login ishlaydi
- Prod'da ishlamaydi
- `.env` faylda `SUPER_ADMIN_EMAIL` va `SUPER_ADMIN_PASSWORD` bor

**Sabab:**
- Vercel'da `.env` fayl ishlamaydi!
- Faqat **Vercel Environment Variables** ishlaydi
- Seed script env'larni o'qiyapti, lekin prod'da yo'q

**Tekshiruv:**
```typescript
// Vercel runtime log'da
console.log('SUPER_ADMIN_EMAIL:', process.env.SUPER_ADMIN_EMAIL)
// Agar undefined bo'lsa → env yo'q
```

**Fix:**
- Vercel → Settings → Environment Variables
- `SUPER_ADMIN_EMAIL` va `SUPER_ADMIN_PASSWORD` qo'shish
- Seed script'ni production'da ishga tushirish

---

#### 2️⃣ **Super Admin DB'da yo'q** ⚠️⚠️

**Belgi:**
- Env'lar to'g'ri, lekin login ishlamaydi
- "Foydalanuvchi topilmadi" xatosi

**Sabab:**
- Seed script production'da ishlamagan
- Yoki `users` jadvali yo'q (yuqoridagi muammo 1)

**Tekshiruv SQL:**
```sql
-- Super admin bor-yo'qligini tekshirish
SELECT email, role, "isActive"
FROM public.users
WHERE role = 'SUPER_ADMIN';
```

**Fix:**
- Seed script'ni production'da ishga tushirish
- Yoki manual super admin yaratish

---

#### 3️⃣ **Password hash noto'g'ri** ⚠️

**Belgi:**
- User topiladi, lekin parol noto'g'ri
- "Parol noto'g'ri" xatosi

**Sabab:**
- Seed script'da hash qilingan parol boshqa
- Yoki env'dan olingan parol boshqa

**Tekshiruv:**
```typescript
// Seed script'da hash qilingan parolni tekshirish
const hashedPassword = await bcrypt.hash(superAdminPassword, 12)
console.log('Hashed password:', hashedPassword)
```

**Fix:**
- Seed script'ni qayta ishga tushirish
- Yoki parolni yangilash

---

## 📊 B) SUPABASE SQL BILAN ISBOT

### Supabase SQL Editor'da quyidagi query'larni ketma-ket bajaring:

```sql
-- ============================================
-- 1. CURRENT DATABASE/USER TEKSHIRUV
-- ============================================
SELECT 
  current_database() as database_name,
  current_user as current_user_name,
  version() as postgres_version,
  current_schema() as current_schema_name;

-- ============================================
-- 2. public.users BOR-YO'QLIGI
-- ============================================
SELECT 
  table_schema,
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name = 'users';

-- ============================================
-- 3. users NOMIGA O'XSHASH JADVALLAR (BARCHA SCHEMA'LARDA)
-- ============================================
SELECT 
  table_schema,
  table_name,
  table_type
FROM information_schema.tables 
WHERE LOWER(table_name) LIKE '%user%'
ORDER BY table_schema, table_name;

-- ============================================
-- 4. SCHEMA BO'YICHA JADVAL SONI (36 TO'G'RILIGI)
-- ============================================
SELECT 
  table_schema,
  COUNT(*) as table_count,
  STRING_AGG(table_name, ', ' ORDER BY table_name) as table_names
FROM information_schema.tables 
WHERE table_schema NOT IN ('pg_catalog', 'information_schema', 'pg_toast')
  AND table_type = 'BASE TABLE'
GROUP BY table_schema
ORDER BY table_schema;

-- ============================================
-- 5. PRISMA MIGRATIONS HOLATI
-- ============================================
-- 5a. _prisma_migrations jadvali bor-yo'qligi
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
    AND table_name = '_prisma_migrations'
) as migrations_table_exists;

-- 5b. Prisma migrations ro'yxati (agar jadval bor bo'lsa)
SELECT 
  migration_name,
  finished_at,
  applied_steps_count,
  started_at
FROM _prisma_migrations 
ORDER BY finished_at DESC 
LIMIT 10;

-- ============================================
-- 6. SUPER ADMIN BOR-YO'QLIGI
-- ============================================
SELECT 
  id,
  email,
  role,
  "isActive",
  "createdAt"
FROM public.users
WHERE role = 'SUPER_ADMIN';

-- ============================================
-- 7. BARCHA PUBLIC SCHEMA JADVALLARI
-- ============================================
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;
```

---

## ✅ C) FIX PLAN

### 1. Migrations Deploy

#### Local Development:

```bash
# 1. Migration yaratish (agar yo'q bo'lsa)
npx prisma migrate dev --name init

# 2. Test qilish
npm run dev
```

#### Production (Vercel):

**Variant A: Build Command'da (Hozirgi holat)** ✅

`scripts/vercel-build.js` allaqachon migrations deploy qiladi:
```javascript
execSync('npx prisma migrate deploy', { stdio: 'inherit' })
```

**Variant B: Manual (Agar kerak bo'lsa)**

```bash
# Vercel CLI orqali
vercel env pull .env.production
npx prisma migrate deploy
```

**Qaysi holatda `db push` ishlatiladi?**

- ✅ Development'da: `npx prisma migrate dev` (tavsiya etiladi)
- ✅ Production'da: `npx prisma migrate deploy` (tavsiya etiladi)
- ⚠️ `db push`: Faqat tezkor test uchun, production'da tavsiya qilinmaydi

**Vercel'da migrate'ni qayerda ishlatish?**

- ✅ **Build script'da** (hozirgi holat) - Avtomatik, sodda
- ⚠️ **CI/CD'da** - Xavfsizroq, lekin murakkabroq
- ❌ **Manual** - Har safar qo'lda ishlatish kerak

**Tavsiya:** Build script'da (hozirgi holat) ✅

---

### 2. Users Jadvali auth.users bo'lsa

**Prisma orqali auth.users'ni o'qish tavsiya etiladimi?**

❌ **Yo'q!** `auth.users` Supabase Auth tomonidan boshqariladi. Biz `public.users` ishlatamiz.

**Agar kerak bo'lsa Prisma schema'da auth schema mapping:**

```prisma
// TAVSIYA QILINMAYDI!
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  schemas  = ["public", "auth"]  // ← Qo'shish
}

model AuthUser {
  id    String @id
  email String
  
  @@schema("auth")
  @@map("users")
}
```

**Lekin:** Bu tavsiya qilinmaydi! `auth.users` va `public.users` alohida bo'lishi kerak.

**Application users uchun strategiya:**

1. ✅ `public.users` jadvalini yaratish (migrations orqali)
2. ✅ `auth.users` va `public.users` alohida
3. ✅ Agar Supabase Auth ishlatilsa, `public.users` da `auth_user_id` field qo'shish:

```prisma
model User {
  id          String  @id @default(cuid())
  authUserId  String? @unique  // Supabase auth.users.id (agar kerak bo'lsa)
  email       String  @unique
  // ... boshqa fieldlar
}
```

**Hozirgi loyihada:** Biz Supabase Auth ishlatmaymiz, faqat `public.users` ishlatamiz ✅

---

## ✅ D) SUPER ADMIN LOGIN FIX

### 1. Vercel Environment Variables

**MUHIM:** Vercel'da `.env` fayl ishlamaydi! Faqat **Vercel Environment Variables** ishlaydi.

**Kerakli env'lar:**

#### **Required:**

- `DATABASE_URL` - Supabase connection string (pooling)
- `DIRECT_URL` - Supabase direct connection (migrations uchun, optional)
- `NEXTAUTH_URL` - Production URL (masalan: `https://yourapp.vercel.app`)
- `NEXTAUTH_SECRET` - JWT secret (random string)

#### **Super Admin uchun (Optional, lekin tavsiya etiladi):**

- `SUPER_ADMIN_EMAIL` - Super admin email (default: `admin@schoollms.uz`)
- `SUPER_ADMIN_PASSWORD` - Super admin parol (default: `SuperAdmin123!`)

**Vercel'da qo'shish:**

1. Vercel Dashboard → Project → **Settings** → **Environment Variables**
2. Quyidagilarni qo'shing:

```
Key: SUPER_ADMIN_EMAIL
Value: admin@schoollms.uz
Environment: Production, Preview, Development

Key: SUPER_ADMIN_PASSWORD
Value: SuperAdmin123!
Environment: Production, Preview, Development
```

---

### 2. Password Hashing

**Muammo:** ENV'dan plain password compare qanday qilinadi?

**Yechim:** Seed script'da hash qilinadi, DB'ga saqlanadi. Login'da compare qilinadi:

```typescript
// Seed script'da (prisma/seed.ts)
const hashedPassword = await bcrypt.hash(superAdminPassword, 12)
await prisma.user.create({
  data: {
    email: superAdminEmail,
    passwordHash: hashedPassword,  // ← Hash qilingan parol
    // ...
  }
})

// Login'da (lib/auth.ts)
const isPasswordValid = await bcrypt.compare(
  credentials.password,  // ← Plain password (form'dan)
  user.passwordHash     // ← Hash qilingan parol (DB'dan)
)
```

**Muammo yo'q!** Bcrypt compare ishlaydi ✅

---

### 3. Seed Script (Idempotent)

**Hozirgi seed script allaqachon idempotent:**

```typescript
// prisma/seed.ts
const existingSuperAdmin = await prisma.user.findUnique({
  where: { email: superAdminEmail },
})

if (existingSuperAdmin) {
  console.log('✅ Super Admin already exists')
} else {
  // Create super admin
  await prisma.user.create({...})
}
```

**Lekin:** Agar parol o'zgarganda yangilash kerak bo'lsa:

```typescript
// Yangilangan versiya
const existingSuperAdmin = await prisma.user.findUnique({
  where: { email: superAdminEmail },
})

if (existingSuperAdmin) {
  // Update password if env changed
  const hashedPassword = await bcrypt.hash(superAdminPassword, 12)
  await prisma.user.update({
    where: { email: superAdminEmail },
    data: { passwordHash: hashedPassword }
  })
  console.log('✅ Super Admin password updated')
} else {
  // Create super admin
  await prisma.user.create({...})
}
```

---

### 4. Seed'ni Production'da Xavfsiz Ishga Tushirish

**Variant A: Protected Endpoint (Tavsiya etiladi)** ✅

```typescript
// app/api/admin/seed/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { execSync } from 'child_process'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    // Faqat super admin
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Seed script'ni ishga tushirish
    execSync('npm run db:seed', { stdio: 'inherit' })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: 'Seed failed' },
      { status: 500 }
    )
  }
}
```

**Variant B: Build Script'da (Xavfsiz emas)** ❌

Build script'da seed ishlatish tavsiya qilinmaydi - har safar build'da seed ishlaydi!

**Variant C: Manual Script (Bir marta)** ✅

```bash
# Vercel CLI orqali
vercel env pull .env.production
npm run db:seed
```

**Tavsiya:** Variant A (Protected Endpoint) ✅

---

## 🔧 E) ANIQ KOD PATCH

### 1. Prisma Schema Fix

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
  schemas   = ["public"]  // ← Qo'shildi
}

model User {
  // ... mavjud kodlar ...
  
  @@map("users")  // ← Hozirgi holat to'g'ri
}
```

---

### 2. Seed Script Yangilash (Password Update)

```typescript
// prisma/seed.ts
async function main() {
  console.log('🌱 Starting seed...')

  const superAdminEmail = process.env.SUPER_ADMIN_EMAIL || 'admin@schoollms.uz'
  const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD || 'SuperAdmin123!'

  const existingSuperAdmin = await prisma.user.findUnique({
    where: { email: superAdminEmail },
  })

  const hashedPassword = await bcrypt.hash(superAdminPassword, 12)

  if (existingSuperAdmin) {
    // Update password if changed
    await prisma.user.update({
      where: { email: superAdminEmail },
      data: {
        passwordHash: hashedPassword,
        isActive: true,
        role: 'SUPER_ADMIN',
      },
    })
    console.log('✅ Super Admin updated')
  } else {
    await prisma.user.create({
      data: {
        email: superAdminEmail,
        fullName: 'Super Administrator',
        passwordHash: hashedPassword,
        role: 'SUPER_ADMIN',
        isActive: true,
      },
    })
    console.log('✅ Super Admin created')
  }

  console.log(`   Email: ${superAdminEmail}`)
  console.log(`   Password: ${superAdminPassword}`)
}
```

---

### 3. Protected Seed Endpoint

```typescript
// app/api/admin/seed/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { execSync } from 'child_process'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    execSync('npm run db:seed', { stdio: 'inherit' })
    
    return NextResponse.json({ 
      success: true,
      message: 'Seed completed successfully'
    })
  } catch (error: any) {
    console.error('Seed error:', error)
    return NextResponse.json(
      { error: error.message || 'Seed failed' },
      { status: 500 }
    )
  }
}
```

---

### 4. Package.json Scripts

```json
{
  "scripts": {
    "db:seed": "tsx prisma/seed.ts",
    "db:seed:prod": "NODE_ENV=production tsx prisma/seed.ts"
  }
}
```

---

### 5. Login Service Error Handling

```typescript
// lib/auth.ts
async authorize(credentials) {
  try {
    // ... mavjud kodlar ...
    
    const user = await db.user.findUnique({
      where: { email: credentials.email.toLowerCase() },
      // ...
    })

    if (!user) {
      throw new Error('Foydalanuvchi topilmadi')
    }

    // ... qolgan kodlar ...
  } catch (error: any) {
    // Database connection error
    if (error.code === 'P1001' || error.message.includes('does not exist')) {
      console.error('Database error:', error)
      throw new Error('Database connection failed. Please contact administrator.')
    }
    throw error
  }
}
```

---

## 📋 DEPLOY CHECKLIST

### Pre-Deploy:

- [ ] **Prisma schema yangilandi:**
  - `schemas = ["public"]` qo'shildi ✅
  - `@@map("users")` mavjud ✅

- [ ] **Migrations yaratildi:**
  ```bash
  npx prisma migrate dev --name init
  ```

- [ ] **Git commit:**
  ```bash
  git add prisma/schema.prisma prisma/migrations
  git commit -m "fix: add Prisma migrations and schema config"
  git push
  ```

### Vercel Environment Variables:

#### **Required:**

- [ ] `DATABASE_URL` - Supabase pooling connection
- [ ] `DIRECT_URL` - Supabase direct connection (optional)
- [ ] `NEXTAUTH_URL` - Production URL
- [ ] `NEXTAUTH_SECRET` - JWT secret

#### **Super Admin:**

- [ ] `SUPER_ADMIN_EMAIL` - Super admin email
- [ ] `SUPER_ADMIN_PASSWORD` - Super admin parol

### Supabase:

- [ ] **Redirect URLs** (agar NextAuth ishlatilsa):
  - Supabase Dashboard → Auth → URL Configuration
  - Site URL: `https://yourapp.vercel.app`
  - Redirect URLs: `https://yourapp.vercel.app/api/auth/callback/*`

### Deploy:

- [ ] **Git push:**
  ```bash
  git push origin main
  ```

- [ ] **Vercel avtomatik deploy** yoki qo'lda:
  - Dashboard → Deployments → Latest → "Redeploy"

- [ ] **Build log tekshiruv:**
  - `✅ Migrations deployed successfully!` ko'rinishi kerak
  - Xatolar yo'q

### Post-Deploy:

- [ ] **Supabase SQL Editor'da tekshiruv:**
  ```sql
  SELECT COUNT(*) FROM public.users;
  SELECT * FROM public.users WHERE role = 'SUPER_ADMIN';
  ```

- [ ] **Seed script ishga tushirish:**
  - Protected endpoint orqali: `POST /api/admin/seed`
  - Yoki manual: Vercel CLI orqali

- [ ] **Production'da test:**
  - Super admin login ishlaydi
  - `db.user.findUnique()` xatosi yo'q

---

## ✅ TEKSHIRUV

### Supabase SQL Editor'da:

```sql
-- 1. public.users borligini tekshirish
SELECT COUNT(*) FROM public.users;

-- 2. Super admin borligini tekshirish
SELECT email, role, "isActive" 
FROM public.users 
WHERE role = 'SUPER_ADMIN';

-- 3. Prisma migrations holati
SELECT COUNT(*) FROM _prisma_migrations;
```

### Vercel Build Logs'da:

- `✅ Migrations deployed successfully!` ko'rinishi kerak
- Xatolar yo'q

### Production'da:

- [ ] Super admin login ishlaydi
- [ ] `db.user.findUnique()` xatosi yo'q
- [ ] Boshqa user'lar ham login qila oladi

---

## 🎯 YAKUNIY TAVSIYA

**Eng muhim qadamlari:**

1. ✅ **SQL tekshiruvlar** (yuqoridagi SQL query'lar)
2. ✅ **Migrations deploy** (build script'da avtomatik)
3. ✅ **Vercel env'lar** (`SUPER_ADMIN_EMAIL`, `SUPER_ADMIN_PASSWORD`)
4. ✅ **Seed script ishga tushirish** (protected endpoint orqali)
5. ✅ **Production test**

**Agar muammo bo'lsa:** SQL tekshiruv natijalarini yuboring - men aniq yechimni beraman! 🎯

