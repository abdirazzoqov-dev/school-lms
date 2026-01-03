# 🖥️ LOCAL DEVELOPMENT - Professional Setup

Lokal kompyuterda Docker PostgreSQL va Supabase bilan ishlash uchun to'liq qo'llanma.

---

## 📊 IKKI XIL ENVIRONMENT

### 1. **Local Development** (Docker PostgreSQL)
- ✅ Tezkor development
- ✅ Offline ishlash
- ✅ Ma'lumotlar lokal saqlanadi

### 2. **Production** (Supabase)
- ✅ Cloud database
- ✅ Vercel deploy uchun
- ✅ Real ma'lumotlar

---

# 🚀 LOCAL DEVELOPMENT SETUP (Docker PostgreSQL)

## BOSQICH 1: Docker Container Ishga Tushirish (1 daqiqa)

### 1.1 - Docker Container Status

```powershell
docker ps -a
```

Agar container ishlayapti bo'lsa, keyingi bosqichga o'ting.

Agar container yo'q bo'lsa yoki to'xtatilgan bo'lsa:

```powershell
docker-compose up -d
```

**Kutilayotgan natija:**
```
Creating lms-postgres ... done
Starting lms-postgres ... done
```

### 1.2 - Container Status Tekshirish

```powershell
docker ps
```

**Kutilayotgan natija:**
```
CONTAINER ID   IMAGE         STATUS         PORTS                    NAMES
xxxxx          postgres:16   Up 2 minutes   0.0.0.0:5432->5432/tcp  lms-postgres
```

✅ Container ishlayapti!

---

## BOSQICH 2: .env Fayl Sozlash (2 daqiqa)

### 2.1 - .env Fayl Yaratish

`.env` fayl mavjud bo'lsa, oching. Yo'q bo'lsa, `.env.example` dan nusxalang:

```powershell
Copy-Item .env.example .env
```

### 2.2 - Local Development Configuration

`.env` fayl quyidagicha bo'lishi kerak:

```env
# ============================================
# DATABASE CONFIGURATION (LOCAL)
# ============================================
# MUHIM: docker-compose.yml da port 5433:5432, shuning uchun localhost:5433
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/school_lms?schema=public"

# ============================================
# AUTHENTICATION
# ============================================
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="kn8s9d7f6g5h4j3k2l1m0n9b8v7c6x5z4y3x2w1v0u9t8s7r6q5p4o3n2m110"

# ============================================
# SUPER ADMIN
# ============================================
SUPER_ADMIN_EMAIL="admin@schoollms.uz"
SUPER_ADMIN_PASSWORD="SuperAdmin123!"

# ============================================
# ENVIRONMENT
# ============================================
NODE_ENV="development"
```

**MUHIM:**
- `postgres:postgres` → Docker container default credentials
- `localhost:5433` → Docker container port (docker-compose.yml da 5433:5432)
- `school_lms` → Database nomi

---

## BOSQICH 3: Prisma Schema Sozlash (1 daqiqa)

### 3.1 - prisma/schema.prisma

Local development uchun `directUrl` kerak emas:

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")      // Local: Docker PostgreSQL
  // directUrl = env("DIRECT_URL")    // Local uchun kerak emas
}
```

✅ Hozirgi holat to'g'ri!

---

## BOSQICH 4: Database Schema Push (1 daqiqa)

### 4.1 - Prisma Client Generate

```powershell
npm run db:generate
```

**Kutilayotgan natija:**
```
✔ Generated Prisma Client (v5.22.0)
```

### 4.2 - Schema Push

```powershell
npx prisma db push
```

**Kutilayotgan natija:**
```
✔ The database is now in sync with your schema.
```

✅ Schema yuklandi!

---

## BOSQICH 5: Demo Ma'lumotlar (Optional - 1 daqiqa)

### 5.1 - Seed Database

```powershell
npm run db:seed
```

**Kutilayotgan natija:**
```
🌱 Starting seed...
✅ Super Admin created
✅ Demo Tenant created
🎉 Seed completed!
```

✅ Demo ma'lumotlar yaratildi!

---

## BOSQICH 6: Development Server Ishga Tushirish (30 soniya)

### 6.1 - Start Dev Server

```powershell
npm run dev
```

**Kutilayotgan natija:**
```
▲ Next.js 14.1.0
- Local:        http://localhost:3000
- ready started server on 0.0.0.0:3000
```

### 6.2 - Brauzerda Ochish

http://localhost:3000

✅ **Lokal development ishlayapti!**

---

# 🔄 SUPABASE GA O'TISH (Production)

Agar Supabase ga o'tmoqchi bo'lsangiz:

## BOSQICH 1: .env Faylni Yangilash

`.env` faylda `DATABASE_URL` ni Supabase connection string bilan almashtiring:

```env
# PRODUCTION (Supabase)
DATABASE_URL="postgresql://postgres.pgkzjfacqntzsgcoqvhk:Just2003@aws-0-singapore.pooler.supabase.com:6543/postgres?pgbouncer=true"
```

**MUHIM:** `Just2003` o'rniga Supabase parolingizni qo'ying!

## BOSQICH 2: Schema Push

```powershell
npx prisma db push
```

## BOSQICH 3: Ma'lumotlarni Import Qilish

Agar lokal ma'lumotlarni Supabase ga ko'chirmoqchi bo'lsangiz:

1. **Lokal backup:**
```powershell
docker exec lms-postgres pg_dump -U postgres school_lms > backup.sql
```

2. **Supabase SQL Editor:**
   - Supabase Dashboard → SQL Editor
   - `backup.sql` content ni paste qiling
   - Run tugmasini bosing

---

# 🔄 LOCAL GA QAYTISH

Agar yana lokal development ga qaytmoqchi bo'lsangiz:

## BOSQICH 1: .env Faylni Yangilash

`.env` faylda `DATABASE_URL` ni lokal connection string bilan almashtiring:

```env
# LOCAL DEVELOPMENT (Docker PostgreSQL)
# MUHIM: docker-compose.yml da port 5433:5432
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/school_lms?schema=public"
```

## BOSQICH 2: Docker Container Ishga Tushirish

```powershell
docker-compose up -d
```

## BOSQICH 3: Schema Push

```powershell
npx prisma db push
```

---

# 🛠️ PROFESSIONAL TIPS

## 1. Environment Switching Script

Professional development uchun, ikkita `.env` fayl yarating:

- `.env.local` → Local development
- `.env.production` → Supabase

**PowerShell script yaratish:**

```powershell
# switch-to-local.ps1
Copy-Item .env.local .env
Write-Host "✅ Switched to LOCAL development" -ForegroundColor Green

# switch-to-production.ps1
Copy-Item .env.production .env
Write-Host "✅ Switched to PRODUCTION (Supabase)" -ForegroundColor Green
```

**Ishlatish:**
```powershell
.\switch-to-local.ps1
.\switch-to-production.ps1
```

---

## 2. Docker Container Management

### Container to'xtatish:
```powershell
docker-compose down
```

### Container ishga tushirish:
```powershell
docker-compose up -d
```

### Container loglarni ko'rish:
```powershell
docker-compose logs -f
```

### Container ma'lumotlarini tozalash:
```powershell
docker-compose down -v
docker-compose up -d
npx prisma db push
npm run db:seed
```

---

## 3. Database Backup (Local)

### Backup yaratish:
```powershell
docker exec lms-postgres pg_dump -U postgres school_lms > backup-$(Get-Date -Format "yyyy-MM-dd").sql
```

### Backup restore qilish:
```powershell
docker exec -i lms-postgres psql -U postgres school_lms < backup-2024-01-15.sql
```

---

## 4. Prisma Studio

Database ma'lumotlarini ko'rish:

```powershell
npm run db:studio
```

Brauzerda: http://localhost:5555

---

# ✅ CHECKLIST

## Local Development:
- [ ] Docker container ishlayapti
- [ ] .env fayl to'g'ri sozlangan (local)
- [ ] Schema push qilindi
- [ ] Demo ma'lumotlar yaratildi (optional)
- [ ] Dev server ishlayapti
- [ ] Login ishlayapti

## Supabase (Production):
- [ ] .env fayl to'g'ri sozlangan (Supabase)
- [ ] Schema push qilindi
- [ ] Ma'lumotlar import qilindi (optional)
- [ ] Vercel deploy qilindi

---

# 🎯 SUMMARY

## Local Development:
1. ✅ Docker container ishga tushirish
2. ✅ .env faylni local connection string bilan sozlash
3. ✅ Schema push qilish
4. ✅ Dev server ishga tushirish

## Production (Supabase):
1. ✅ .env faylni Supabase connection string bilan sozlash
2. ✅ Schema push qilish
3. ✅ Ma'lumotlarni import qilish
4. ✅ Vercel deploy qilish

---

**Endi lokal va production ikkalasida ham ishlaydi!** 🎉

