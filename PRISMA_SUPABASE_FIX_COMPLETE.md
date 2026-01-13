# 🔧 Prisma + Supabase + Vercel: "Table User does not exist" - To'liq Yechim

## 📊 DIAGNOZ: Sabablar (Prioritizatsiya)

### 1️⃣ **ENG MUHIM: Migrations umuman yuritilmagan** ⚠️
**Belgi:** `The table public.User does not exist`  
**Sabab:** 
- `prisma/migrations/` papkasi yo'q
- Faqat `prisma db push` ishlatilgan (development uchun)
- Production'da migrations deploy qilinmagan

**Fix:** 
- Localda: `npx prisma migrate dev --name init`
- Production: `npx prisma migrate deploy`
- Vercel build'ga migrations qo'shish

**Tekshiruv:**
```sql
-- Supabase SQL Editor
SELECT * FROM _prisma_migrations;
```
Agar bo'sh bo'lsa → migrations yo'q.

---

### 2️⃣ **Postgres Case Sensitivity: "User" vs "user"** ⚠️
**Belgi:** Prisma `public.User` deb qidiradi, lekin bazada `public.user` (kichik harf)  
**Sabab:**
- Postgres case-sensitive (double-quote bilan yaratilgan jadvallar)
- Prisma schema'da `@@map` yo'q
- `db push` katta harf bilan yaratgan, lekin query kichik harf bilan qilmoqda

**Fix:**
```prisma
model User {
  // ...
  @@map("users")  // ← Qo'shish kerak!
}
```

**Tekshiruv:**
```sql
-- Qaysi jadval nomi bor?
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('User', 'user', 'users');
```

---

### 3️⃣ **Noto'g'ri DB ga ulangan (prod connection string boshqa)** ⚠️
**Belgi:** Localda ishlaydi, Vercel'da ishlamaydi  
**Sabab:**
- Vercel env'da `DATABASE_URL` noto'g'ri
- Yoki Supabase project boshqa

**Fix:**
- Vercel → Settings → Environment Variables
- `DATABASE_URL` ni tekshirish
- Supabase dashboard'dan to'g'ri connection string olish

**Tekshiruv:**
```typescript
// Vercel runtime log'da
console.log('DB URL:', process.env.DATABASE_URL?.substring(0, 50))
```

---

### 4️⃣ **Schema namespace muammosi (public emas)** ⚠️
**Belgi:** `public.User` o'rniga boshqa schema  
**Sabab:**
- Supabase'da `auth` schema ishlatilgan
- Yoki custom schema

**Fix:**
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  schemas  = ["public"]  // ← Qo'shish
}
```

**Tekshiruv:**
```sql
-- Qaysi schemalar bor?
SELECT schema_name FROM information_schema.schemata;
```

---

### 5️⃣ **Prisma Client eski (generate qilinmagan)** ⚠️
**Belgi:** Schema o'zgardi, lekin client yangilanmagan  
**Sabab:**
- `prisma generate` ishlatilmagan
- Vercel build'da generate qilinmagan

**Fix:**
```bash
npx prisma generate
```

**Tekshiruv:**
```bash
# node_modules/@prisma/client/index.d.ts faylini tekshirish
# User model borligini ko'rish
```

---

### 6️⃣ **DIRECT_URL yo'q (migrations uchun kerak)** ⚠️
**Belgi:** Migrations ishlamaydi  
**Sabab:**
- `directUrl` comment qilingan
- Migrations direct connection talab qiladi

**Fix:**
```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")      // Pooling
  directUrl = env("DIRECT_URL")        // Direct (migrations)
}
```

---

## 🔍 TEKSHIRUV QADAMLARI (SQL)

### Supabase SQL Editor'da quyidagilarni bajaring:

```sql
-- 1. Qaysi schemalar bor?
SELECT schema_name 
FROM information_schema.schemata 
WHERE schema_name NOT IN ('pg_catalog', 'information_schema');

-- 2. public schema'da qanday jadvallar bor?
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- 3. User jadvali bor-yo'qligini tekshirish (3 variant)
SELECT 
  'User' as searched_name,
  table_name,
  CASE 
    WHEN table_name = 'User' THEN '✅ Katta harf bilan topildi'
    WHEN table_name = 'user' THEN '✅ Kichik harf bilan topildi'
    WHEN table_name = 'users' THEN '✅ Ko''plik bilan topildi'
    ELSE '❌ Topilmadi'
  END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND LOWER(table_name) IN ('user', 'users');

-- 4. Prisma migrations holati
SELECT * FROM _prisma_migrations ORDER BY finished_at DESC LIMIT 5;

-- 5. Qaysi database ga ulangan?
SELECT current_database(), current_schema();

-- 6. Connection string'dan database nomini tekshirish
-- (Bu SQL emas, lekin foydali)
-- DATABASE_URL ichida: ...@host:port/DATABASE_NAME
```

---

## ✅ YECHIM (ENG TO'G'RI YO'L)

### BOSQICH 1: Prisma Schema Fix (Mapping qo'shish)

**Muammo:** Postgres case-sensitive, `User` model `users` jadvaliga map qilinishi kerak.

**Yechim:** Barcha modellar uchun `@@map` qo'shish:

```prisma
// prisma/schema.prisma

model User {
  // ... mavjud fieldlar ...
  
  @@map("users")  // ← QO'SHISH KERAK!
  @@index([email])
  // ... mavjud indexlar ...
}

model Tenant {
  // ...
  @@map("tenants")  // ← QO'SHISH KERAK!
}

model Student {
  // ...
  @@map("students")  // ← QO'SHISH KERAK!
}

// Va boshqa barcha modellar uchun ham shunga o'xshash
```

**Lekin:** Bu juda ko'p o'zgarish. **Eng oson yechim:** Faqat `User` model uchun:

```prisma
model User {
  // ... mavjud kodlar ...
  
  @@map("User")  // ← Postgres'da "User" (katta harf) saqlash
}
```

Yoki **eng yaxshi yechim** (PostgreSQL best practice):

```prisma
model User {
  // ... mavjud kodlar ...
  
  @@map("users")  // ← Kichik harf, ko'plik (PostgreSQL standard)
}
```

---

### BOSQICH 2: Migrations Yaratish

#### Local Development:

```bash
# 1. Schema'ni yangilash (agar mapping qo'shgan bo'lsangiz)
# prisma/schema.prisma faylni saqlang

# 2. Migration yaratish
npx prisma migrate dev --name init

# 3. Prisma Client generate (avtomatik ishlaydi)
# Lekin agar kerak bo'lsa:
npx prisma generate

# 4. Test qilish
npm run dev
```

**Natija:**
- `prisma/migrations/` papkasi yaratiladi
- `migration.sql` fayllar yaratiladi
- Database'ga migrations yuklanadi

---

### BOSQICH 3: Production (Vercel) Migrations

#### Variant A: Build Command'da (Tavsiya etiladi)

`package.json`:

```json
{
  "scripts": {
    "build": "prisma generate && prisma migrate deploy && next build",
    "vercel-build": "prisma generate && prisma migrate deploy && next build"
  }
}
```

#### Variant B: vercel-build.js Script'da

`scripts/vercel-build.js`:

```javascript
const { execSync } = require('child_process');

// Optimize DATABASE_URL for pooling
if (process.env.DATABASE_URL) {
  let url = process.env.DATABASE_URL;
  if (url.includes('supabase.com') || url.includes('pooler')) {
    const hasQuery = url.includes('?');
    if (!url.includes('pgbouncer=true')) {
      url += (hasQuery ? '&' : '?') + 'pgbouncer=true';
    }
    if (!url.includes('connection_limit')) {
      url += '&connection_limit=1';
    }
    process.env.DATABASE_URL = url;
  }
}

try {
  console.log('🚀 Starting Vercel build...');

  // 1. Prisma Client Generate
  console.log('📦 Step 1: Generating Prisma Client...');
  execSync('npx prisma generate', { stdio: 'inherit' });

  // 2. Migrations Deploy (Production)
  console.log('📤 Step 2: Deploying migrations...');
  try {
    execSync('npx prisma migrate deploy', { stdio: 'inherit' });
    console.log('✅ Migrations deployed successfully!');
  } catch (error) {
    console.error('⚠️  Migration error (continuing...):', error.message);
    // Agar migrations muammosi bo'lsa, db push ishlatish (fallback)
    console.log('🔄 Falling back to db push...');
    execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit' });
  }

  // 3. Next.js Build
  console.log('🏗️  Step 3: Building Next.js...');
  execSync('npm run build', { stdio: 'inherit' });

  console.log('✅ Build completed successfully!');
} catch (error) {
  console.error('❌ Build failed:', error);
  process.exit(1);
}
```

**MUHIM:** `prisma migrate deploy` **faqat production'da** ishlaydi. Development'da `migrate dev` ishlatiladi.

---

### BOSQICH 4: Connection String Sozlash

#### Supabase Connection Strings:

**1. DATABASE_URL (Pooling - Production):**

Supabase Dashboard → Settings → Database → Connection pooling → URI

```env
DATABASE_URL="postgresql://postgres.qlivnpgozivqzigkcixc:YOUR_PASSWORD@aws-1-ap-southeast-2.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true&connection_limit=1"
```

**2. DIRECT_URL (Direct - Migrations):**

Supabase Dashboard → Settings → Database → Connection string → Direct connection → URI

```env
DIRECT_URL="postgresql://postgres.qlivnpgozivqzigkcixc:YOUR_PASSWORD@aws-1-ap-southeast-2.pooler.supabase.com:5432/postgres?sslmode=require"
```

**Yoki** (agar IPv4 muammosi bo'lsa):

```env
DIRECT_URL="postgresql://postgres.qlivnpgozivqzigkcixc:YOUR_PASSWORD@aws-1-ap-southeast-2.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true"
```

#### Prisma Schema'da:

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")      // Pooling (Production)
  directUrl = env("DIRECT_URL")       // Direct (Migrations)
}
```

---

### BOSQICH 5: Vercel Environment Variables

Vercel Dashboard → Project → Settings → Environment Variables:

**Production:**
- `DATABASE_URL` = (Pooling connection string)
- `DIRECT_URL` = (Direct connection string) - **Agar migrations kerak bo'lsa**

**Preview:**
- Xuddi shu qiymatlar

**Development:**
- Xuddi shu qiymatlar (yoki local `.env`)

---

## 📋 DEPLOY CHECKLIST

### Pre-Deploy:

- [ ] **Localda migrations yaratilgan:**
  ```bash
  npx prisma migrate dev --name init
  ```

- [ ] **Prisma schema'da `@@map` qo'shilgan** (agar kerak bo'lsa):
  ```prisma
  model User {
    // ...
    @@map("users")
  }
  ```

- [ ] **`prisma/migrations/` papkasi mavjud** va git'ga commit qilingan

- [ ] **`.env` faylda `DATABASE_URL` va `DIRECT_URL` to'g'ri**

- [ ] **Localda test qilingan:**
  ```bash
  npm run build
  ```

### Vercel Deploy:

- [ ] **Vercel Environment Variables sozlangan:**
  - `DATABASE_URL` (Pooling)
  - `DIRECT_URL` (Direct) - migrations uchun

- [ ] **Build script to'g'ri:**
  - `package.json` → `"build": "prisma generate && prisma migrate deploy && next build"`
  - Yoki `vercel-build.js` script to'g'ri

- [ ] **Git push qilingan:**
  ```bash
  git add .
  git commit -m "fix: add Prisma migrations and schema mapping"
  git push origin main
  ```

- [ ] **Vercel avtomatik deploy boshlangan**

### Post-Deploy Tekshiruv:

- [ ] **Supabase Dashboard → Table Editor:**
  - `User` yoki `users` jadvali ko'rinishi kerak
  - Boshqa jadvallar ham ko'rinishi kerak

- [ ] **Supabase SQL Editor:**
  ```sql
  SELECT * FROM _prisma_migrations;
  ```
  - Migrations ro'yxati ko'rinishi kerak

- [ ] **Vercel Runtime Logs:**
  - `prisma migrate deploy` muvaffaqiyatli ishlagan
  - Xatolar yo'q

- [ ] **Production'da test:**
  - Login qilish
  - User query ishlashi kerak

---

## 🚀 TEZKOR YECHIM (Agar hozir deploy kerak bo'lsa)

### Variant 1: db push (Tezkor, lekin migrations yo'q)

```bash
# Localda
npx prisma db push

# Vercel'da (build script'da)
# vercel-build.js ichida:
execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit' });
```

**Muammo:** Migrations yo'q, lekin ishlaydi.

### Variant 2: Migrations (To'g'ri, lekin uzoqroq)

```bash
# 1. Localda migration yaratish
npx prisma migrate dev --name init

# 2. Git push
git add prisma/migrations
git commit -m "Add Prisma migrations"
git push

# 3. Vercel avtomatik deploy
# Build script'da: prisma migrate deploy
```

**Yaxshi:** Migrations bor, production'da xavfsiz.

---

## 🎯 YAKUNIY TAVSIYA

**Eng yaxshi yechim:**

1. ✅ **Prisma schema'ga `@@map("users")` qo'shing** (PostgreSQL standard)
2. ✅ **Localda `npx prisma migrate dev --name init`** (migrations yaratish)
3. ✅ **Vercel build script'ga `prisma migrate deploy` qo'shing**
4. ✅ **Vercel env'ga `DATABASE_URL` va `DIRECT_URL` qo'shing**
5. ✅ **Deploy va test qiling**

Bu yechim **production-ready** va **xavfsiz**! 🎉

