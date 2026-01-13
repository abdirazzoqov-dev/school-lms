# 🔍 "Table public.users does not exist" - To'liq Diagnostika va Yechim

## 📊 A) SQL TEKSHIRUV QADAMLARI

### Supabase SQL Editor'da quyidagi SQL'larni ketma-ket bajaring:

#### 1️⃣ Qaysi DB va User'ga ulanganini tekshirish

```sql
-- Database va user ma'lumotlari
SELECT 
  current_database() as database_name,
  current_user as current_user_name,
  version() as postgres_version,
  current_schema() as current_schema_name;
```

**Kutilayotgan natija:**
```
database_name: postgres
current_user_name: postgres.qlivnpgozivqzigkcixc
postgres_version: PostgreSQL 15.x
current_schema_name: public
```

---

#### 2️⃣ `public.users` bor-yo'qligini tekshirish

```sql
-- public.users jadvali bor-yo'qligini tekshirish
SELECT 
  table_schema,
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name = 'users';
```

**Agar bo'sh bo'lsa:** Jadval yo'q ❌  
**Agar natija bor bo'lsa:** Jadval mavjud ✅

---

#### 3️⃣ `users` nomiga o'xshash jadvallarni barcha schema'lardan qidirish

```sql
-- Barcha schema'larda "users" nomiga o'xshash jadvallarni qidirish
SELECT 
  table_schema,
  table_name,
  table_type
FROM information_schema.tables 
WHERE LOWER(table_name) LIKE '%user%'
ORDER BY table_schema, table_name;
```

**Kutilayotgan natijalar:**
- `auth.users` - Supabase auth schema (bu bizniki emas!)
- `public.users` - Bizning application users (kerakli)
- `public.User` - Case-sensitive variant (muammo bo'lishi mumkin)

---

#### 4️⃣ Barcha schema'lar bo'yicha jadval sonini chiqarish (36 to'g'riligini tekshirish)

```sql
-- Barcha schema'lar bo'yicha jadval soni
SELECT 
  table_schema,
  COUNT(*) as table_count,
  STRING_AGG(table_name, ', ' ORDER BY table_name) as table_names
FROM information_schema.tables 
WHERE table_schema NOT IN ('pg_catalog', 'information_schema', 'pg_toast')
  AND table_type = 'BASE TABLE'
GROUP BY table_schema
ORDER BY table_schema;
```

**Kutilayotgan natija:**
```
table_schema | table_count | table_names
-------------|-------------|-------------
auth         | 1           | users
public       | 35          | tenants, students, teachers, ...
```

**36 soni:** `auth.users` (1) + `public.*` (35) = 36 ✅

---

#### 5️⃣ Prisma migrations mavjudligini tekshirish

```sql
-- Prisma migrations holati
SELECT 
  migration_name,
  finished_at,
  applied_steps_count,
  started_at
FROM _prisma_migrations 
ORDER BY finished_at DESC 
LIMIT 10;
```

**Agar bo'sh bo'lsa:** Migrations yo'q ❌  
**Agar natija bor bo'lsa:** Migrations mavjud ✅

**Qo'shimcha tekshiruv:**
```sql
-- _prisma_migrations jadvali bor-yo'qligini tekshirish
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
    AND table_name = '_prisma_migrations'
) as migrations_table_exists;
```

---

## 🎯 B) EHTIMOLLIY SABABLAR (Prioritizatsiya)

### 1️⃣ **ENG MUHIM: Migrations prod'ga tushmagan** ⚠️⚠️⚠️

**Belgi:** 
- `public.users` jadvali yo'q
- `_prisma_migrations` bo'sh yoki yo'q
- Supabase dashboard'da "Tables: 36" (lekin `auth.users` + boshqa jadvallar)

**Sabab:**
- Vercel build'da migrations deploy qilinmagan
- Yoki migrations xato bilan tugagan
- Yoki `db push` ishlatilgan, lekin prod'ga tushmagan

**Tekshiruv SQL:**
```sql
-- Yuqoridagi 5-qadam natijasini ko'rish
SELECT * FROM _prisma_migrations;
```

**Fix:**
```bash
# Localda migration yaratish (agar yo'q bo'lsa)
npx prisma migrate dev --name init

# Prod'ga deploy
npx prisma migrate deploy
```

---

### 2️⃣ **Vercel DATABASE_URL boshqa project'ga qarab qolgan** ⚠️⚠️

**Belgi:**
- Localda ishlaydi, prod'da ishlamaydi
- SQL tekshiruvda boshqa jadvallar ko'rinadi
- Yoki umuman jadvallar yo'q

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

### 3️⃣ **Jadval `auth.users` da (Supabase Auth)** ⚠️

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
SELECT 
  'auth.users' as table_name,
  COUNT(*) as row_count
FROM auth.users
UNION ALL
SELECT 
  'public.users' as table_name,
  COUNT(*) as row_count
FROM public.users;  -- Bu xato beradi agar jadval yo'q bo'lsa
```

**Fix:**
- `public.users` jadvalini yaratish kerak (migrations orqali)
- `auth.users` va `public.users` alohida (biz `public.users` ishlatamiz)

---

### 4️⃣ **Schema mismatch (public o'rniga boshqa)** ⚠️

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

### 5️⃣ **Case sensitivity muammosi (`User` vs `users`)** ⚠️

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

## ✅ C) FIX VARIANTLARI

### Variant 1: Migrations Deploy (ENG TO'G'RI YO'L)

**Belgi:** `_prisma_migrations` bo'sh yoki `public.users` yo'q  
**Sabab:** Migrations prod'ga tushmagan

**Fix:**

#### QADAM 1: Localda migration yaratish (agar yo'q bo'lsa)

```bash
# Terminal'da
npx prisma migrate dev --name init
```

**Natija:**
- `prisma/migrations/` papkasi yaratiladi
- `public.users` va boshqa jadvallar yaratiladi

#### QADAM 2: Git commit va push

```bash
git add prisma/migrations
git commit -m "Add Prisma migrations"
git push origin main
```

#### QADAM 3: Vercel'da migrations deploy

Vercel avtomatik deploy qiladi yoki qo'lda:
- Dashboard → Deployments → Latest → "Redeploy"

**Build log'da ko'rinishi kerak:**
```
✅ Migrations deployed successfully!
```

#### QADAM 4: Tekshiruv

```sql
-- public.users jadvali borligini tekshirish
SELECT COUNT(*) FROM public.users;
```

---

### Variant 2: Vercel DATABASE_URL To'g'rilash

**Belgi:** SQL tekshiruvda boshqa jadvallar ko'rinadi yoki umuman yo'q  
**Sabab:** Vercel env'da `DATABASE_URL` noto'g'ri project'ga qarab qolgan

**Fix:**

#### QADAM 1: Supabase'dan to'g'ri connection string olish

1. **Supabase Dashboard** → **Settings** → **Database**
2. **Connection string** bo'limida:
   - **Method:** "Connection pooling"
   - **URI** ni tanlang
   - **Copy** qiling

**Format:**
```
postgresql://postgres.qlivnpgozivqzigkcixc:YOUR_PASSWORD@aws-1-ap-southeast-2.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true&connection_limit=1
```

#### QADAM 2: Vercel Environment Variables

Vercel Dashboard → Project → **Settings** → **Environment Variables**:

- **Key:** `DATABASE_URL`
- **Value:** (Yuqoridagi connection string)
- **Environment:** Production, Preview, Development

#### QADAM 3: Redeploy

Vercel avtomatik redeploy qiladi.

#### QADAM 4: Tekshiruv

```sql
-- Qaysi jadvallar bor?
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;
```

---

### Variant 3: Schema Mapping (auth.users vs public.users)

**Belgi:** `auth.users` mavjud, `public.users` yo'q  
**Sabab:** Supabase Auth `auth.users` yaratadi, lekin bizga `public.users` kerak

**Fix:**

#### MUHIM: `auth.users` va `public.users` alohida!

- **`auth.users`**: Supabase Auth tomonidan yaratiladi (biz buni ishlatmaymiz)
- **`public.users`**: Bizning application users (Prisma orqali yaratiladi)

**Yechim:** `public.users` jadvalini yaratish kerak (migrations orqali)

```bash
# Localda migration yaratish
npx prisma migrate dev --name init

# Prod'ga deploy
npx prisma migrate deploy
```

**Agar `auth.users` dan ma'lumotlarni import qilish kerak bo'lsa:**

```sql
-- auth.users dan public.users ga import (agar kerak bo'lsa)
INSERT INTO public.users (id, email, "fullName", "passwordHash", role, "isActive", "createdAt", "updatedAt")
SELECT 
  id::text,
  email,
  COALESCE(raw_user_meta_data->>'full_name', email) as "fullName",
  encrypted_password as "passwordHash",
  'STUDENT' as role,  -- Default role
  true as "isActive",
  created_at as "createdAt",
  updated_at as "updatedAt"
FROM auth.users
ON CONFLICT (email) DO NOTHING;
```

**Lekin:** Bu tavsiya qilinmaydi - `auth.users` va `public.users` alohida bo'lishi kerak!

---

### Variant 4: Prisma Schema Fix (Schema Mapping)

**Belgi:** Jadval boshqa schema'da yoki case-sensitive muammo  
**Sabab:** Schema mismatch yoki case sensitivity

**Fix:**

#### QADAM 1: Prisma schema'ga schema belgilash

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  schemas  = ["public"]  // ← Qo'shish kerak
}
```

#### QADAM 2: Model mapping to'g'rilash

```prisma
model User {
  // ... mavjud kodlar ...
  
  @@map("users")  // ← Kichik harf, ko'plik (PostgreSQL standard)
}
```

#### QADAM 3: Migration yaratish va deploy

```bash
npx prisma migrate dev --name fix_schema_mapping
npx prisma migrate deploy  # Prod'da
```

---

## 🎯 YAKUNIY ANIQ PATCH

### 1. Prisma Schema (Agar schema belgilash kerak bo'lsa)

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
  schemas   = ["public"]  // ← Qo'shish (agar kerak bo'lsa)
}

model User {
  // ... mavjud kodlar ...
  
  @@map("users")  // ← Hozirgi holat to'g'ri
}
```

### 2. Migration Yaratish (Agar migrations yo'q bo'lsa)

```bash
# Localda
npx prisma migrate dev --name init

# Git commit
git add prisma/migrations
git commit -m "Add Prisma migrations"
git push origin main

# Vercel avtomatik deploy qiladi
```

### 3. Vercel Build Script (Hozirgi holat to'g'ri)

`scripts/vercel-build.js` allaqachon migrations deploy qiladi:
```javascript
execSync('npx prisma migrate deploy', { stdio: 'inherit' })
```

---

## 📋 DEPLOY CHECKLIST

### Pre-Deploy:

- [ ] **SQL tekshiruvlar bajarildi:**
  - Database va user tekshirildi
  - `public.users` bor-yo'qligi tekshirildi
  - Barcha schema'larda `users` qidirildi
  - Jadval soni tekshirildi (36)
  - Prisma migrations holati tekshirildi

- [ ] **Muammo aniqlandi:**
  - [ ] Migrations yo'q
  - [ ] DATABASE_URL noto'g'ri
  - [ ] Jadval `auth.users` da
  - [ ] Schema mismatch
  - [ ] Case sensitivity

### Fix Qadamlari:

- [ ] **Agar migrations yo'q bo'lsa:**
  ```bash
  npx prisma migrate dev --name init
  git add prisma/migrations
  git commit -m "Add Prisma migrations"
  git push
  ```

- [ ] **Agar DATABASE_URL noto'g'ri bo'lsa:**
  - Vercel → Settings → Environment Variables
  - `DATABASE_URL` ni to'g'ri Supabase project'dan olish
  - Redeploy

- [ ] **Agar schema mismatch bo'lsa:**
  - Prisma schema'ga `schemas = ["public"]` qo'shish
  - Migration yaratish va deploy

### Post-Deploy Tekshiruv:

- [ ] **Supabase SQL Editor'da:**
  ```sql
  SELECT COUNT(*) FROM public.users;
  ```
  - Natija > 0 bo'lishi kerak

- [ ] **Vercel Runtime Logs:**
  - `✅ Migrations deployed successfully!` ko'rinishi kerak
  - Xatolar yo'q

- [ ] **Production'da test:**
  - Login qilish ishlaydi
  - `db.user.findUnique()` xatosi yo'q

---

## 🔍 MINIMAL SAVOLLAR

1. **Vercel env'da `DATABASE_URL` qayerdan olingan?**
   - Supabase project ID qanday?
   - Connection string to'g'ri project'ga tegishlimi?

2. **Supabase project reference:**
   - Project ID: `qlivnpgozivqzigkcixc` (URL'dan)
   - Region: `ap-southeast-2`
   - Bu to'g'ri project'ga tegishlimi?

3. **Prisma schema'da User model:**
   - `@@map("users")` mavjud ✅
   - `schemas = ["public"]` mavjudmi? (tekshirish kerak)

---

## 🎯 ENG EHTIMOLLIY YECHIM

**90% ehtimollik:** Migrations prod'ga tushmagan!

**Tezkor yechim:**

1. **SQL tekshiruvlar** (yuqoridagi 5 qadam)
2. **Agar `_prisma_migrations` bo'sh bo'lsa:**
   ```bash
   npx prisma migrate dev --name init
   git add prisma/migrations
   git commit -m "Add Prisma migrations"
   git push
   ```
3. **Vercel redeploy**
4. **Tekshiruv**

---

## ✅ TEKSHIRUV

### Supabase SQL Editor'da:

```sql
-- 1. public.users borligini tekshirish
SELECT COUNT(*) FROM public.users;

-- 2. Prisma migrations holati
SELECT COUNT(*) FROM _prisma_migrations;

-- 3. Barcha jadvallar ro'yxati
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;
```

### Vercel Build Logs'da:

- `✅ Migrations deployed successfully!` ko'rinishi kerak
- Xatolar yo'q

### Production'da:

- Login qilish ishlaydi
- `db.user.findUnique()` xatosi yo'q

---

## 🚀 TEZKOR YECHIM

Agar hozir deploy kerak bo'lsa:

1. **SQL tekshiruvlar** (yuqoridagi 5 qadam)
2. **Muammoni aniqlash**
3. **Fix qadamlari** (yuqoridagi variantlar)
4. **Deploy va test**

**Eng muhimi:** SQL tekshiruvlar natijasini yuboring - men aniq yechimni beraman! 🎯

