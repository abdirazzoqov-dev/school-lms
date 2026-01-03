# 🐳 Ikkita Alohida PostgreSQL Container Qo'llanmasi

Bu qo'llanma sizga ikkita bir-biriga bog'liq bo'lmagan PostgreSQL container'ni qanday ishlatishni ko'rsatadi.

---

## 📋 Container'lar Ma'lumotlari

### Birinchi Container (postgres)
- **Container nomi:** `school_lms_db`
- **Port:** `5433:5432`
- **Database nomi:** `school_lms`
- **Parol:** `postgres`
- **Volume:** `postgres_data`
- **Network:** `lms_network`

### Ikkinchi Container (postgres2)
- **Container nomi:** `school_lms_db2`
- **Port:** `5434:5432`
- **Database nomi:** `school_lms2`
- **Parol:** `postgres2`
- **Volume:** `postgres_data2`
- **Network:** `lms_network2`

**MUHIM:** Ikkala container bir-biriga bog'liq emas va alohida ishlaydi!

---

## 🚀 Container'larni Ishga Tushirish

### Barcha Container'larni Birga Ishga Tushirish

```bash
# Ikkala container'ni birga ishga tushirish
docker-compose up -d

# Holatni tekshirish
docker ps
```

### Faqat Birinchi Container'ni Ishga Tushirish

```bash
# Faqat birinchi container'ni ishga tushirish
docker-compose up -d postgres

# Holatni tekshirish
docker ps | grep school_lms_db
```

### Faqat Ikkinchi Container'ni Ishga Tushirish

```bash
# Faqat ikkinchi container'ni ishga tushirish
docker-compose up -d postgres2

# Holatni tekshirish
docker ps | grep school_lms_db2
```

---

## 🔧 Environment Variables Sozlash

### Birinchi Container Uchun (.env)

`.env` fayl yarating yoki yangilang:

```env
# ============================================
# BIRINCHI CONTAINER (Port 5433)
# ============================================
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/school_lms?schema=public"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# Super Admin
SUPER_ADMIN_EMAIL="admin@schoollms.uz"
SUPER_ADMIN_PASSWORD="SuperAdmin123!"
```

### Ikkinchi Container Uchun (.env2)

Ikkinchi loyiha uchun `.env2` fayl yarating:

```env
# ============================================
# IKKINCHI CONTAINER (Port 5434)
# ============================================
DATABASE_URL="postgresql://postgres:postgres2@localhost:5434/school_lms2?schema=public"

# NextAuth
NEXTAUTH_URL="http://localhost:3001"
NEXTAUTH_SECRET="your-secret-key-here-2"

# Super Admin
SUPER_ADMIN_EMAIL="admin2@schoollms.uz"
SUPER_ADMIN_PASSWORD="SuperAdmin123!"
```

---

## 📦 Loyihani Duplicate Qilish

### Variant 1: Ikki Alohida Papka

```powershell
# Windows PowerShell

# Birinchi loyiha (mavjud)
cd C:\lms
# .env faylida: DATABASE_URL="postgresql://postgres:postgres@localhost:5433/school_lms"

# Ikkinchi loyiha (yangi)
cd C:\lms2
# .env faylida: DATABASE_URL="postgresql://postgres:postgres2@localhost:5434/school_lms2"
```

### Variant 2: Bir Papkada, Ikki Alohida .env Fayl

```powershell
# Bir papkada ikkita .env fayl
C:\lms\.env      # Birinchi container uchun
C:\lms\.env2     # Ikkinchi container uchun

# Ishlatishda:
# Birinchi loyiha: .env faylini ishlatadi
# Ikkinchi loyiha: .env2 faylini .env ga nusxalash kerak
```

---

## 🗄️ Database Schema O'rnatish

### Birinchi Container'ga Schema Push Qilish

```bash
# Birinchi loyihada
cd C:\lms
# .env faylida DATABASE_URL birinchi container'ga ishora qiladi
npm run db:push
```

### Ikkinchi Container'ga Schema Push Qilish

```bash
# Ikkinchi loyihada
cd C:\lms2
# .env faylida DATABASE_URL ikkinchi container'ga ishora qiladi
npm run db:push
```

---

## 🔍 Container'larni Tekshirish

### Container Holatini Ko'rish

```bash
# Barcha container'larni ko'rish
docker ps

# Faqat LMS container'larini ko'rish
docker ps | grep school_lms
```

**Kutilayotgan natija:**
```
CONTAINER ID   IMAGE                PORTS                    NAMES
abc123def456   postgres:16-alpine   0.0.0.0:5433->5432/tcp   school_lms_db
xyz789uvw012   postgres:16-alpine   0.0.0.0:5434->5432/tcp   school_lms_db2
```

### Container Loglarini Ko'rish

```bash
# Birinchi container loglari
docker-compose logs -f postgres

# Ikkinchi container loglari
docker-compose logs -f postgres2

# Ikkala container loglari
docker-compose logs -f
```

### Database Connection Tekshirish

```bash
# Birinchi container'ga ulanish
docker exec -it school_lms_db psql -U postgres -d school_lms

# Ikkinchi container'ga ulanish
docker exec -it school_lms_db2 psql -U postgres -d school_lms2
```

---

## 🛠️ Container'larni Boshqarish

### To'xtatish

```bash
# Ikkala container'ni to'xtatish
docker-compose stop

# Faqat birinchi container'ni to'xtatish
docker-compose stop postgres

# Faqat ikkinchi container'ni to'xtatish
docker-compose stop postgres2
```

### Qayta Ishga Tushirish

```bash
# Ikkala container'ni qayta ishga tushirish
docker-compose restart

# Faqat birinchi container'ni qayta ishga tushirish
docker-compose restart postgres

# Faqat ikkinchi container'ni qayta ishga tushirish
docker-compose restart postgres2
```

### O'chirish

```bash
# Container'larni o'chirish (ma'lumotlar saqlanadi)
docker-compose down

# Container va volume'larni o'chirish (BARCHA MA'LUMOTLAR O'CHADI!)
docker-compose down -v
```

---

## 📊 Prisma Studio'dan Foydalanish

### Birinchi Container Uchun

```bash
cd C:\lms
# .env faylida birinchi container'ga ishora qiladi
npm run db:studio
# http://localhost:5555 da ochiladi
```

### Ikkinchi Container Uchun

```bash
cd C:\lms2
# .env faylida ikkinchi container'ga ishora qiladi
npm run db:studio
# http://localhost:5555 da ochiladi (birinchi to'xtatilgan bo'lishi kerak)
```

**Eslatma:** Prisma Studio bir vaqtning o'zida faqat bitta database'ga ulanishi mumkin.

---

## 🔄 Backup va Restore

### Birinchi Container Backup

```bash
# Backup olish
docker exec school_lms_db pg_dump -U postgres school_lms > backup1.sql

# Restore qilish
docker exec -i school_lms_db psql -U postgres school_lms < backup1.sql
```

### Ikkinchi Container Backup

```bash
# Backup olish
docker exec school_lms_db2 pg_dump -U postgres school_lms2 > backup2.sql

# Restore qilish
docker exec -i school_lms_db2 psql -U postgres school_lms2 < backup2.sql
```

---

## 🚀 Development Server'ni Ishga Tushirish

### Birinchi Loyiha

```bash
cd C:\lms
# .env faylida birinchi container'ga ishora qiladi
npm run dev
# http://localhost:3000 da ishlaydi
```

### Ikkinchi Loyiha

```bash
cd C:\lms2
# .env faylida ikkinchi container'ga ishora qiladi
PORT=3001 npm run dev
# http://localhost:3001 da ishlaydi
```

**MUHIM:** `.env` faylda `NEXTAUTH_URL` ham mos ravishda o'zgartirilishi kerak!

---

## 📝 Script'lar

### Windows PowerShell Script (start-containers.ps1)

```powershell
# Ikkala container'ni ishga tushirish
Write-Host "Starting PostgreSQL containers..." -ForegroundColor Green
docker-compose up -d

Write-Host "Waiting for containers to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

Write-Host "Container status:" -ForegroundColor Cyan
docker ps | Select-String "school_lms"

Write-Host "`nContainers are ready!" -ForegroundColor Green
Write-Host "Container 1: localhost:5433" -ForegroundColor Cyan
Write-Host "Container 2: localhost:5434" -ForegroundColor Cyan
```

### Windows PowerShell Script (stop-containers.ps1)

```powershell
# Ikkala container'ni to'xtatish
Write-Host "Stopping PostgreSQL containers..." -ForegroundColor Yellow
docker-compose stop

Write-Host "Containers stopped!" -ForegroundColor Green
```

---

## ✅ Tekshirish

### 1. Container'lar Ishlayaptimi?

```bash
docker ps | grep school_lms
```

**Kutilayotgan natija:**
- `school_lms_db` - Port 5433
- `school_lms_db2` - Port 5434

### 2. Database Connection

```bash
# Birinchi container
docker exec school_lms_db pg_isready -U postgres

# Ikkinchi container
docker exec school_lms_db2 pg_isready -U postgres
```

### 3. Application Connection

```bash
# Birinchi loyiha
cd C:\lms
npm run db:push  # Muvaffaqiyatli bo'lishi kerak

# Ikkinchi loyiha
cd C:\lms2
npm run db:push  # Muvaffaqiyatli bo'lishi kerak
```

---

## 🐛 Muammolarni Hal Qilish

### Muammo 1: Port Band

**Xato:**
```
Error: bind: address already in use
```

**Yechim:**
```bash
# Port'larni tekshiring
netstat -ano | findstr :5433
netstat -ano | findstr :5434

# Agar port band bo'lsa, docker-compose.yml da port'ni o'zgartiring
```

### Muammo 2: Container Ishlayaptimi?

**Xato:**
```
Error: Can't reach database server
```

**Yechim:**
```bash
# Container holatini tekshiring
docker ps -a | grep school_lms

# Container'ni qayta ishga tushiring
docker-compose restart
```

### Muammo 3: Volume Muammosi

**Xato:**
```
Error: volume already exists
```

**Yechim:**
```bash
# Eski volume'larni o'chirish (EHTIYOT!)
docker volume rm postgres_data postgres_data2

# Yoki container'larni to'liq o'chirish
docker-compose down -v
```

---

## 🎯 Xulosa

Endi sizda:

- ✅ **Ikkita alohida PostgreSQL container** ishlayapti
- ✅ **Har biri o'z portida** (5433 va 5434)
- ✅ **Har biri o'z volume'ida** (ma'lumotlar alohida saqlanadi)
- ✅ **Bir-biriga bog'liq emas** (alohida network'larda)
- ✅ **Ikki alohida loyiha** bilan ishlash mumkin

**Muhim Eslatmalar:**

1. **Port'lar:** 5433 va 5434
2. **Database nomlari:** school_lms va school_lms2
3. **Parollar:** postgres va postgres2
4. **Volume'lar:** postgres_data va postgres_data2
5. **Network'lar:** lms_network va lms_network2

---

**Tayyor! 🎉**

