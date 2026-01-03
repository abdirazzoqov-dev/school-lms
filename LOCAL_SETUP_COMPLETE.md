# 🖥️ LOKAL KOMPYUTERDA TO'LIQ ISHGA TUSHIRISH

Lokal kompyuterda Docker PostgreSQL bilan to'liq ishlaydigan holatga keltirish.

---

## 🎯 MAQSAD

1. ✅ Lokal Docker PostgreSQL bilan ishlash
2. ✅ Avvalgi o'zgarishlar saqlanadi
3. ✅ To'liq ishlaydigan holat
4. ✅ Deploy qilish keyinroq

---

# 🚀 QADAM-BA-QADAM YECHIM

## BOSQICH 1: DOCKER CONTAINER ISHGA TUSHIRISH (1 daqiqa)

### 1.1 - Container Status Tekshirish

```powershell
docker ps -a
```

### 1.2 - Container Ishga Tushirish

Agar container to'xtatilgan bo'lsa:

```powershell
docker-compose up -d
```

**Kutilayotgan natija:**
```
Creating school_lms_db ... done
Starting school_lms_db ... done
```

### 1.3 - Container Status

```powershell
docker ps
```

✅ Container `school_lms_db` ishlayapti bo'lishi kerak.

---

## BOSQICH 2: .ENV FAYLNI LOKAL GA SOZLASH (2 daqiqa)

### 2.1 - .env Fayl Yaratish/Ochish

`.env` fayl yarating yoki oching.

### 2.2 - Lokal Configuration

`.env` fayl quyidagicha bo'lishi kerak:

```env
# ============================================
# DATABASE CONFIGURATION (LOCAL DOCKER)
# ============================================
# MUHIM: docker-compose.yml da port 5433:5432
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
- Port `5433` (docker-compose.yml da 5433:5432)
- `postgres:postgres` → Docker default credentials
- Supabase connection string **OLIB TASHLANG** yoki comment qiling

---

## BOSQICH 3: PRISMA CLIENT GENERATE (30 soniya)

```powershell
npm run db:generate
```

**Kutilayotgan natija:**
```
✔ Generated Prisma Client (v5.22.0)
```

---

## BOSQICH 4: DATABASE SCHEMA PUSH (1 daqiqa)

```powershell
npx prisma db push
```

**Kutilayotgan natija:**
```
✔ The database is now in sync with your schema.
```

✅ Schema yuklandi!

---

## BOSQICH 5: MA'LUMOTLARNI YUKLASH (2 variant)

### Variant A: backup.sql Import (Agar backup.sql bor bo'lsa)

#### 5.1 - backup.sql Tekshirish

```powershell
Test-Path backup.sql
```

Agar `backup.sql` bor bo'lsa:

#### 5.2 - SQL Import

```powershell
# PowerShell
Get-Content backup.sql | docker exec -i school_lms_db psql -U postgres -d school_lms
```

**Yoki:**

1. Supabase SQL Editor dan `backup.sql` content ni copy qiling
2. Terminal da:
```powershell
docker exec -i school_lms_db psql -U postgres -d school_lms < backup.sql
```

---

### Variant B: Demo Ma'lumotlar (Seed)

Agar `backup.sql` yo'q bo'lsa yoki yangi boshlashni xohlasangiz:

```powershell
npm run db:seed
```

**Kutilayotgan natija:**
```
🌱 Starting seed...
✅ Super Admin created
✅ Demo Tenant created
✅ Demo Admin created
✅ Demo Teacher created
✅ Demo Parent created
🎉 Seed completed!
```

---

## BOSQICH 6: VERIFICATION (1 daqiqa)

### 6.1 - Prisma Studio

```powershell
npm run db:studio
```

Brauzerda: http://localhost:5555

- **Tenant** jadvalini oching
- Ma'lumotlar borligini tekshiring

### 6.2 - Development Server

```powershell
npm run dev
```

Brauzerda: http://localhost:3000

- Login qiling
- Dashboard ochilishini tekshiring

✅ **Tayyor!** Lokal development to'liq ishlayapti!

---

# 🔄 AVVALGI O'ZGARISHLARNI SAQLASH

## 1. Supabase Ma'lumotlarini Backup Qilish

Agar Supabase da ma'lumotlar bo'lsa va ularni saqlab qolmoqchi bo'lsangiz:

### Supabase Dashboard:
1. **SQL Editor** → **New query**
2. Quyidagi SQL ni run qiling:

```sql
-- Barcha jadvallarni export qilish
COPY (SELECT * FROM "Tenant") TO STDOUT WITH CSV HEADER;
COPY (SELECT * FROM "User") TO STDOUT WITH CSV HEADER;
-- ... va hokazo
```

Yoki Supabase Dashboard → **Database** → **Backups** dan backup oling.

---

## 2. Lokal Database Backup

Lokal ma'lumotlarni backup qilish:

```powershell
docker exec school_lms_db pg_dump -U postgres school_lms > backup-local-$(Get-Date -Format "yyyy-MM-dd").sql
```

---

## 3. .env Fayl Backup

```powershell
Copy-Item .env .env.backup
```

---

# 🛠️ MUAMMOLARNI HAL QILISH

## 1. Container Ishlamayapti

```powershell
# Container status
docker ps -a

# Container ishga tushirish
docker-compose up -d

# Loglarni ko'rish
docker-compose logs -f
```

---

## 2. Port 5433 Band

Agar port 5433 band bo'lsa:

1. `docker-compose.yml` da port ni o'zgartiring:
```yaml
ports:
  - "5434:5432"  # 5433 o'rniga 5434
```

2. `.env` da ham port ni yangilang:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5434/school_lms?schema=public"
```

3. Container ni qayta ishga tushiring:
```powershell
docker-compose down
docker-compose up -d
```

---

## 3. Database Connection Error

```powershell
# Container ishlayaptimi?
docker ps

# Container loglarni ko'rish
docker-compose logs postgres

# Container qayta ishga tushirish
docker-compose restart postgres
```

---

## 4. Prisma Client Error

```powershell
# Prisma Client cache ni tozalash
Remove-Item -Recurse -Force node_modules\.prisma

# Prisma Client generate
npm run db:generate
```

---

# ✅ FINAL CHECKLIST

## Setup:
- [ ] Docker container ishlayapti
- [ ] .env fayl to'g'ri sozlangan (local, port 5433)
- [ ] Prisma Client generate qilindi
- [ ] Schema push qilindi

## Data:
- [ ] backup.sql import qilindi (yoki)
- [ ] Demo ma'lumotlar seed qilindi

## Verification:
- [ ] Prisma Studio da ma'lumotlar ko'rinayapti
- [ ] Dev server ishlayapti
- [ ] Login ishlayapti
- [ ] Dashboard ochilayapti

---

# 🎯 SUMMARY

## Nima qildik:

1. ✅ Docker container ishga tushirdik
2. ✅ .env faylni lokal Docker PostgreSQL ga sozladik
3. ✅ Schema push qildik
4. ✅ Ma'lumotlarni yukladik (backup yoki seed)
5. ✅ Verification qildik

---

## Keyingi Qadamlar:

1. **Lokal development** - Hozir to'liq ishlayapti! ✅
2. **Production deploy** - Keyinroq, Supabase ga o'tganda

---

**Endi lokal kompyuterda to'liq ishlayapti! Avvalgi o'zgarishlar saqlanadi!** 🎉

