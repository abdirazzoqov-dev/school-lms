# 🚀 Ikkita Duplicate Loyihani Ishga Tushirish

Bu qo'llanma sizga ikkita alohida loyihani va ikkita PostgreSQL container'ni qanday ishga tushirishni ko'rsatadi.

---

## 📋 Qadam 1: Container'larni Ishga Tushirish

### PowerShell Script Orqali (Tavsiya Etiladi)

```powershell
# Container'larni ishga tushirish
.\start-containers.ps1
```

### Yoki To'g'ridan-to'g'ri

```powershell
docker-compose up -d
```

### Tekshirish

```powershell
# Container holatini ko'rish
.\check-containers.ps1

# Yoki
docker ps | Select-String "school_lms"
```

**Kutilayotgan natija:**
```
CONTAINER ID   IMAGE                PORTS                    NAMES
abc123...      postgres:16-alpine   0.0.0.0:5433->5432/tcp   school_lms_db
xyz789...      postgres:16-alpine   0.0.0.0:5434->5432/tcp   school_lms_db2
```

---

## 📁 Qadam 2: Ikkinchi Loyiha Papkasini Yaratish

### Variant A: Mavjud Loyihani Nusxalash

```powershell
# Birinchi loyiha (mavjud)
# C:\lms - bu yerda allaqachon bor

# Ikkinchi loyiha papkasini yaratish
Copy-Item -Path "C:\lms" -Destination "C:\lms2" -Recurse -Exclude "node_modules",".next"

# Ikkinchi loyihaga o'tish
cd C:\lms2
```

### Variant B: Git Repository'dan Clone

```powershell
# Birinchi loyiha
cd C:\lms

# Ikkinchi loyiha
cd C:\
git clone <repository-url> lms2
cd C:\lms2
```

---

## 🔧 Qadam 3: Environment Variables Sozlash

### Birinchi Loyiha (C:\lms\.env)

```powershell
cd C:\lms
```

`.env` faylini yarating yoki yangilang:

```env
# ============================================
# BIRINCHI LOYIHA - Container 1 (Port 5433)
# ============================================
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/school_lms?schema=public"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here-minimum-32-characters"

# Super Admin
SUPER_ADMIN_EMAIL="admin@schoollms.uz"
SUPER_ADMIN_PASSWORD="SuperAdmin123!"
```

**NEXTAUTH_SECRET yaratish:**
```powershell
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object {[char]$_})
```

### Ikkinchi Loyiha (C:\lms2\.env)

```powershell
cd C:\lms2
```

`.env` faylini yarating:

```env
# ============================================
# IKKINCHI LOYIHA - Container 2 (Port 5434)
# ============================================
DATABASE_URL="postgresql://postgres:postgres2@localhost:5434/school_lms2?schema=public"

# NextAuth
NEXTAUTH_URL="http://localhost:3001"
NEXTAUTH_SECRET="your-secret-key-here-2-minimum-32-characters"

# Super Admin
SUPER_ADMIN_EMAIL="admin2@schoollms.uz"
SUPER_ADMIN_PASSWORD="SuperAdmin123!"
```

**MUHIM:** Ikkinchi loyiha uchun yangi `NEXTAUTH_SECRET` yarating!

---

## 📦 Qadam 4: Dependencies O'rnatish

### Birinchi Loyiha

```powershell
cd C:\lms

# Dependencies o'rnatish (agar kerak bo'lsa)
npm install
```

### Ikkinchi Loyiha

```powershell
cd C:\lms2

# Dependencies o'rnatish
npm install
```

---

## 🗄️ Qadam 5: Database Schema Push Qilish

### Birinchi Loyiha

```powershell
cd C:\lms

# Prisma Client generate
npm run db:generate

# Schema'ni birinchi container'ga push qilish
npm run db:push
```

**Kutilayotgan natija:**
```
✔ Generated Prisma Client
✔ Schema is in sync with the database
```

### Ikkinchi Loyiha

```powershell
cd C:\lms2

# Prisma Client generate
npm run db:generate

# Schema'ni ikkinchi container'ga push qilish
npm run db:push
```

**Kutilayotgan natija:**
```
✔ Generated Prisma Client
✔ Schema is in sync with the database
```

---

## 🌱 Qadam 6: Seed Data (Ixtiyoriy)

### Birinchi Loyiha

```powershell
cd C:\lms
npm run db:seed
```

### Ikkinchi Loyiha

```powershell
cd C:\lms2
npm run db:seed
```

---

## 🚀 Qadam 7: Development Server'larni Ishga Tushirish

### Birinchi Loyiha (Terminal 1)

```powershell
cd C:\lms
npm run dev
```

**Server:** [http://localhost:3000](http://localhost:3000)

### Ikkinchi Loyiha (Terminal 2 - YANGI TERMINAL)

```powershell
cd C:\lms2
PORT=3001 npm run dev
```

**Server:** [http://localhost:3001](http://localhost:3001)

**Yoki `.env` faylda:**
```env
PORT=3001
```

Keyin:
```powershell
npm run dev
```

---

## ✅ Qadam 8: Tekshirish

### 1. Container'lar Ishlayaptimi?

```powershell
.\check-containers.ps1
```

### 2. Database Connection

```powershell
# Birinchi container
docker exec school_lms_db pg_isready -U postgres

# Ikkinchi container
docker exec school_lms_db2 pg_isready -U postgres
```

### 3. Application'lar Ishlayaptimi?

- Birinchi loyiha: [http://localhost:3000](http://localhost:3000)
- Ikkinchi loyiha: [http://localhost:3001](http://localhost:3001)

### 4. Login Qilish

**Birinchi Loyiha:**
- Email: `admin@schoollms.uz`
- Password: `SuperAdmin123!`

**Ikkinchi Loyiha:**
- Email: `admin2@schoollms.uz`
- Password: `SuperAdmin123!`

---

## 📊 Prisma Studio

### Birinchi Loyiha

```powershell
cd C:\lms
npm run db:studio
```

**URL:** [http://localhost:5555](http://localhost:5555)

### Ikkinchi Loyiha

**Eslatma:** Prisma Studio bir vaqtning o'zida faqat bitta database'ga ulanishi mumkin. Birinchi loyihani to'xtatib, keyin ikkinchisini ishga tushiring:

```powershell
cd C:\lms2
npm run db:studio
```

**URL:** [http://localhost:5555](http://localhost:5555)

---

## 🛑 To'xtatish

### Container'larni To'xtatish

```powershell
.\stop-containers.ps1

# Yoki
docker-compose stop
```

### Server'larni To'xtatish

Har bir terminal'da `Ctrl+C` bosing.

---

## 🔄 Qayta Ishga Tushirish

### Container'lar

```powershell
.\start-containers.ps1
```

### Server'lar

```powershell
# Birinchi loyiha
cd C:\lms
npm run dev

# Ikkinchi loyiha (yangi terminal)
cd C:\lms2
PORT=3001 npm run dev
```

---

## 📝 Xulosa

Endi sizda:

- ✅ **Ikkita alohida PostgreSQL container** ishlayapti
- ✅ **Ikkita alohida loyiha** ishlayapti
- ✅ **Har biri o'z database'iga** ulangan
- ✅ **Har biri o'z portida** ishlayapti (3000 va 3001)

### Connection String'lar:

**Birinchi Loyiha:**
```
postgresql://postgres:postgres@localhost:5433/school_lms
http://localhost:3000
```

**Ikkinchi Loyiha:**
```
postgresql://postgres:postgres2@localhost:5434/school_lms2
http://localhost:3001
```

---

## 🆘 Muammolarni Hal Qilish

### Muammo 1: Port 3000 Band

**Yechim:**
```powershell
# Birinchi loyihada .env faylida:
PORT=3000

# Ikkinchi loyihada .env faylida:
PORT=3001
```

### Muammo 2: Container Ishlayaptimi?

```powershell
# Container'larni qayta ishga tushirish
docker-compose restart

# Yoki
.\start-containers.ps1
```

### Muammo 3: Database Connection Xatosi

```powershell
# Container holatini tekshiring
docker ps | Select-String "school_lms"

# .env faylda DATABASE_URL to'g'rimi tekshiring
# Birinchi: port 5433
# Ikkinchi: port 5434
```

---

**Tayyor! 🎉**

Endi siz ikkita alohida loyihani parallel ishlatishingiz mumkin!

