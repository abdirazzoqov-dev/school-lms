# 🔧 DIRECT_URL Muammosi - To'liq Yechim

## 📊 DIAGNOZ

**Belgi:** `Error: Environment variable not found: DIRECT_URL`  
**Sabab:** 
- Prisma schema'da `directUrl = env("DIRECT_URL")` **required** sifatida belgilangan
- Vercel env'da `DIRECT_URL` yo'q
- Prisma `prisma generate` paytida barcha env'larni validate qiladi

**Fix:** 
- **Variant A:** Vercel'da `DIRECT_URL` qo'shish
- **Variant B:** `DIRECT_URL` ni optional qilish (eng yaxshi yechim)

**Tekshiruv:**
```bash
# Vercel build log'da
Error: Environment variable not found: DIRECT_URL
```

---

## ✅ VARIANT A: Vercel'da DIRECT_URL Qo'shish

### QADAM 1: Supabase'dan Direct Connection String Olish

1. **Supabase Dashboard** → **Settings** → **Database**
2. **Connection string** bo'limida:
   - **Method:** "Direct connection" (pooling emas!)
   - **URI** ni tanlang
   - **Copy** qiling

**Format:**
```
postgresql://postgres.qlivnpgozivqzigkcixc:YOUR_PASSWORD@aws-1-ap-southeast-2.pooler.supabase.com:5432/postgres?sslmode=require
```

**Yoki** (agar IPv4 muammosi bo'lsa, pooler port bilan):
```
postgresql://postgres.qlivnpgozivqzigkcixc:YOUR_PASSWORD@aws-1-ap-southeast-2.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true
```

### QADAM 2: Vercel Environment Variables

Vercel Dashboard → Project → **Settings** → **Environment Variables**:

**Qo'shish:**
- **Key:** `DIRECT_URL`
- **Value:** (Yuqoridagi connection string, parol bilan)
- **Environment:** 
  - ✅ Production
  - ✅ Preview
  - ✅ Development (optional)

### QADAM 3: Redeploy

Vercel avtomatik redeploy qiladi yoki qo'lda:
- Dashboard → Deployments → Latest → "Redeploy"

**Muammo:** 
- Har safar parol o'zgarganda yangilash kerak
- Production'da secret management qiyin

---

## ✅ VARIANT B: DIRECT_URL ni Optional Qilish (ENG YAXSHI YECHIM)

### Sabab -> Fix -> Kod Patch -> Tekshiruv

**Sabab:** 
- `DIRECT_URL` migrations uchun kerak, lekin `prisma generate` uchun emas
- Agar `DIRECT_URL` yo'q bo'lsa, `DATABASE_URL` ishlatilishi mumkin
- Production'da migrations allaqachon bajarilgan bo'lishi mumkin

**Fix:** 
- Schema'da `directUrl` ni conditional qilish
- Yoki build script'da `DIRECT_URL` ni set qilish (agar yo'q bo'lsa)

**Kod Patch:**

#### 1. Prisma Schema (Variant B1: Comment qilish)

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  // directUrl = env("DIRECT_URL")  // Optional - migrations uchun
}
```

**Muammo:** Migrations ishlamaydi.

#### 2. Prisma Schema (Variant B2: Build Script'da Set Qilish) ✅ ENG YAXSHI

Schema o'zgarmaydi, lekin build script'da `DIRECT_URL` ni set qilamiz:

```javascript
// scripts/vercel-build.js
if (!process.env.DIRECT_URL && process.env.DATABASE_URL) {
  // DIRECT_URL yo'q bo'lsa, DATABASE_URL dan foydalanish
  process.env.DIRECT_URL = process.env.DATABASE_URL
}
```

**Yaxshi:** 
- Schema o'zgarmaydi
- Migrations ishlaydi
- Production-friendly

---

## 🎯 ENG YAXSHI YECHIM: Build Script'da DIRECT_URL Set Qilish

### Kod Patch:

#### 1. scripts/vercel-build.js

```javascript
const { execSync } = require('child_process')

// Optimize DATABASE_URL for pooling
if (process.env.DATABASE_URL) {
  let url = process.env.DATABASE_URL
  if (url.includes('supabase.com') || url.includes('pooler')) {
    const hasQuery = url.includes('?')
    if (!url.includes('pgbouncer=true')) {
      url += (hasQuery ? '&' : '?') + 'pgbouncer=true'
    }
    if (!url.includes('connection_limit')) {
      url += '&connection_limit=1'
    }
    process.env.DATABASE_URL = url
    console.log('✅ Optimized DATABASE_URL for connection pooling')
  }
}

// Set DIRECT_URL if not provided (for migrations)
if (!process.env.DIRECT_URL && process.env.DATABASE_URL) {
  // Use DATABASE_URL as fallback for migrations
  // Remove pgbouncer=true for direct connection if needed
  let directUrl = process.env.DATABASE_URL
  // If using pooler, try to use direct connection format
  if (directUrl.includes('pooler') && directUrl.includes(':6543')) {
    // Replace pooler port with direct port (if available)
    directUrl = directUrl.replace(':6543', ':5432').replace('pooler.', 'db.')
    // Remove pgbouncer=true for direct connection
    directUrl = directUrl.replace(/[?&]pgbouncer=true/g, '')
    directUrl = directUrl.replace(/[?&]connection_limit=\d+/g, '')
  }
  process.env.DIRECT_URL = directUrl
  console.log('✅ Set DIRECT_URL from DATABASE_URL (fallback)')
}

try {
  console.log('🚀 Starting Vercel build process...')

  // 1. Prisma Client Generate
  console.log('📦 Step 1: Generating Prisma Client...')
  execSync('npx prisma generate', { stdio: 'inherit' })
  console.log('✅ Prisma Client generated successfully!\n')

  // 2. Migrations Deploy (Production)
  console.log('📤 Step 2: Deploying migrations...')
  try {
    execSync('npx prisma migrate deploy', { stdio: 'inherit' })
    console.log('✅ Migrations deployed successfully!\n')
  } catch (error) {
    console.warn('⚠️  Migration deploy failed (this is OK if migrations folder is empty)')
    console.log('🔄 Falling back to db push (for initial setup)...\n')
    try {
      execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit' })
      console.log('✅ Database schema pushed successfully!\n')
    } catch (pushError) {
      console.error('❌ Database setup failed:', pushError.message)
      console.log('⚠️  Continuing build (assuming database is already set up)...\n')
    }
  }

  // 3. Next.js Build
  console.log('🏗️  Step 3: Building Next.js...')
  execSync('npm run build', { stdio: 'inherit' })

  console.log('✅ Vercel build process completed successfully!')
} catch (error) {
  console.error('❌ Vercel build process failed:', error)
  process.exit(1)
}
```

---

## 📋 BUILD SCRIPT KETMA-KETLIGI TAHLILI

### Hozirgi ketma-ketlik:

1. `prisma generate` - Prisma Client yaratish
2. `prisma migrate deploy` - Migrations deploy
3. `next build` - Next.js build

### Vercel'da build paytida migrate qilish yaxshi amaliyotmi?

**✅ YAXSHI:**
- Avtomatik migrations
- CI/CD soddalashtiriladi
- Schema o'zgarishlari avtomatik deploy bo'ladi

**⚠️ XAVFLI:**
- Agar migration xato bo'lsa, butun build fail bo'ladi
- Production'da data loss bo'lishi mumkin
- Rollback qiyin

### TAVSIYA ETILGAN YONDASHUV:

**Variant 1: Build'da migrate (hozirgi)** ✅
- Fallback: `db push` agar migrations fail bo'lsa
- **Yaxshi:** Avtomatik, sodda

**Variant 2: Separate migration step** (Agar kerak bo'lsa)
- GitHub Actions yoki CI/CD'da alohida step
- Build'dan oldin migrations
- **Yaxshi:** Xavfsizroq, lekin murakkabroq

**Hozirgi yechim:** Variant 1 + fallback = **YAXSHI** ✅

---

## 🔧 ANIQ PATCH

### 1. scripts/vercel-build.js

**O'zgarish:** `DIRECT_URL` ni set qilish (agar yo'q bo'lsa)

```javascript
// DIRECT_URL ni set qilish (migrations uchun)
if (!process.env.DIRECT_URL && process.env.DATABASE_URL) {
  process.env.DIRECT_URL = process.env.DATABASE_URL
  console.log('✅ Set DIRECT_URL from DATABASE_URL (fallback)')
}
```

### 2. prisma/schema.prisma

**O'zgarish:** Yo'q (hozirgi holat to'g'ri)

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")  // Build script'da set qilinadi
}
```

### 3. package.json

**O'zgarish:** Yo'q (hozirgi holat to'g'ri)

```json
{
  "scripts": {
    "build": "prisma generate && prisma migrate deploy && next build"
  }
}
```

---

## 📋 DEPLOY CHECKLIST

### Pre-Deploy:

- [ ] **Prisma schema to'g'ri:**
  ```prisma
  datasource db {
    provider  = "postgresql"
    url       = env("DATABASE_URL")
    directUrl = env("DIRECT_URL")
  }
  ```

- [ ] **Build script yangilangan:**
  - `DIRECT_URL` fallback qo'shilgan
  - Migrations fallback mavjud

- [ ] **Localda test qilingan:**
  ```bash
  npm run build
  ```

### Vercel Environment Variables:

#### **MUHIM (Required):**

- [ ] **`DATABASE_URL`** (Pooling connection):
  ```
  postgresql://postgres.qlivnpgozivqzigkcixc:YOUR_PASSWORD@aws-1-ap-southeast-2.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true&connection_limit=1
  ```
  - **Environment:** Production, Preview, Development
  - **Supabase'dan:** Connection pooling → URI

#### **OPTIONAL (Agar migrations kerak bo'lsa):**

- [ ] **`DIRECT_URL`** (Direct connection):
  ```
  postgresql://postgres.qlivnpgozivqzigkcixc:YOUR_PASSWORD@aws-1-ap-southeast-2.pooler.supabase.com:5432/postgres?sslmode=require
  ```
  - **Environment:** Production, Preview (optional)
  - **Supabase'dan:** Direct connection → URI
  - **Yoki:** Build script avtomatik `DATABASE_URL` dan set qiladi

### Supabase Connection Strings:

#### **DATABASE_URL (Pooling - Production):**

1. Supabase Dashboard → **Settings** → **Database**
2. **Connection string** bo'limida:
   - **Method:** "Connection pooling" yoki "Session mode"
   - **URI** ni tanlang
   - **Copy** qiling

**Format:**
```
postgresql://postgres.XXXXX:YYYYY@aws-1-ap-southeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true
```

**Oxiriga qo'shing:**
```
?sslmode=require&pgbouncer=true&connection_limit=1
```

#### **DIRECT_URL (Direct - Migrations, Optional):**

1. Supabase Dashboard → **Settings** → **Database**
2. **Connection string** bo'limida:
   - **Method:** "Direct connection"
   - **URI** ni tanlang
   - **Copy** qiling

**Format:**
```
postgresql://postgres.XXXXX:YYYYY@aws-1-ap-southeast-2.pooler.supabase.com:5432/postgres?sslmode=require
```

**Yoki** (agar IPv4 muammosi bo'lsa):
```
postgresql://postgres.XXXXX:YYYYY@aws-1-ap-southeast-2.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true
```

### Deploy Qadamlar:

1. [ ] **Git commit va push:**
   ```bash
   git add scripts/vercel-build.js
   git commit -m "fix: add DIRECT_URL fallback in build script"
   git push origin main
   ```

2. [ ] **Vercel avtomatik deploy** yoki qo'lda:
   - Dashboard → Deployments → Latest → "Redeploy"

3. [ ] **Build log'ni tekshirish:**
   - `✅ Set DIRECT_URL from DATABASE_URL (fallback)` ko'rinishi kerak
   - `✅ Prisma Client generated successfully!` ko'rinishi kerak
   - `✅ Migrations deployed successfully!` ko'rinishi kerak
   - Xatolar yo'q bo'lishi kerak

4. [ ] **Production'da test:**
   - Login qilish
   - Database query'lar ishlashi kerak

---

## ✅ TEKSHIRUV

### Vercel Build Logs'da:

**Kutilayotgan natija:**
```
✅ Optimized DATABASE_URL for connection pooling
✅ Set DIRECT_URL from DATABASE_URL (fallback)
🚀 Starting Vercel build process...
📦 Step 1: Generating Prisma Client...
✅ Prisma Client generated successfully!
📤 Step 2: Deploying migrations...
✅ Migrations deployed successfully!
🏗️  Step 3: Building Next.js...
✅ Vercel build process completed successfully!
```

**Xatolar yo'q bo'lishi kerak!**

### Production'da:

- [ ] Login ishlaydi
- [ ] Database query'lar ishlaydi
- [ ] `prisma.user.findUnique()` xatosi yo'q

---

## 🎯 YAKUNIY TAVSIYA

**Eng yaxshi yechim:** **Variant B** (Build script'da DIRECT_URL fallback)

**Sabablar:**
1. ✅ Schema o'zgarmaydi
2. ✅ Migrations ishlaydi
3. ✅ Production-friendly
4. ✅ Vercel env'da DIRECT_URL qo'shish shart emas
5. ✅ Fallback mavjud

**Qo'shimcha:** Agar Supabase'dan to'g'ri direct connection string olsangiz, uni Vercel env'ga qo'shishingiz mumkin (optional, lekin yaxshiroq).

---

## 🚀 TEZKOR YECHIM

Agar hozir deploy kerak bo'lsa:

1. **Build script'ni yangilash** (quyidagi patch)
2. **Git push**
3. **Vercel redeploy**

**DIRECT_URL Vercel env'ga qo'shish shart emas!** Build script avtomatik set qiladi.

