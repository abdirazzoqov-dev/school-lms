# 📋 Loyihani Duplicate Qilish Qo'llanmasi

Bu qo'llanma sizga mavjud LMS loyihasini yangi joyga ko'chirish yoki duplicate qilish uchun barcha qadamlarni ko'rsatadi.

---

## 🎯 Loyiha Tahlili

### Texnologiyalar:
- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Database:** PostgreSQL 16 (Docker container)
- **ORM:** Prisma 5.22.0
- **Authentication:** NextAuth.js 4.24.5
- **UI:** Tailwind CSS + shadcn/ui
- **State Management:** Zustand
- **Forms:** React Hook Form + Zod

### Asosiy Xususiyatlar:
- ✅ Multi-tenant architecture (bir nechta maktablar)
- ✅ Subscription management va blocking mexanizmi
- ✅ Role-based access control (6 ta rol)
- ✅ O'quvchilar, o'qituvchilar, sinflar boshqaruvi
- ✅ Davomat va baholar tizimi
- ✅ Dars jadvali
- ✅ To'lovlar boshqaruvi
- ✅ Xarajatlar va oshxona boshqaruvi
- ✅ Yotoqxona boshqaruvi
- ✅ Xabarlar va e'lonlar tizimi
- ✅ O'quvchilar uchun sinov muddati tizimi
- ✅ Qarindoshlar (ota-ona) boshqaruvi

---

## 📦 1. Loyihani Nusxalash

### Variant A: Git Repository'dan Clone Qilish

```bash
# Yangi papka yarating
mkdir lms-duplicate
cd lms-duplicate

# Git repository'ni clone qiling (agar mavjud bo'lsa)
git clone <repository-url> .

# Yoki mavjud loyihani nusxalang
cp -r /path/to/original/lms .  # Linux/Mac
xcopy /E /I C:\lms C:\lms-duplicate  # Windows
```

### Variant B: Mavjud Loyihani Nusxalash

```powershell
# Windows PowerShell
Copy-Item -Path "C:\lms" -Destination "C:\lms-duplicate" -Recurse
cd C:\lms-duplicate
```

---

## 🐳 2. Docker Container'ni Sozlash

### Docker Compose Faylini Tekshirish

Loyihada `docker-compose.yml` fayli mavjud. U quyidagilarni o'z ichiga oladi:

```yaml
version: '3.8'
services:
  postgres:
    image: postgres:16-alpine
    container_name: school_lms_db
    restart: always
    environment:
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: school_lms
      POSTGRES_HOST_AUTH_METHOD: trust
    ports:
      - "5433:5432"  # Port 5433'da ishlaydi (5432 band bo'lsa)
    volumes:
      - postgres_data:/var/lib/postgresql/data
```

### Docker Container'ni Ishga Tushirish

```bash
# Docker container'ni ishga tushiring
docker-compose up -d

# Container holatini tekshiring
docker ps

# Loglarni ko'ring
docker-compose logs -f postgres
```

**MUHIM:** Agar sizda allaqachon Docker container ishlayotgan bo'lsa, portni o'zgartiring:

```yaml
ports:
  - "5434:5432"  # Yangi port
```

---

## 🔧 3. Environment Variables Sozlash

### `.env` Fayl Yaratish

```powershell
# Windows PowerShell
Copy-Item .env.example .env
# Yoki
New-Item .env -ItemType File
```

### `.env` Faylini To'ldirish

```env
# ============================================
# DATABASE CONNECTION
# ============================================
# Docker container uchun (localhost:5433)
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/school_lms?schema=public"

# Yoki agar boshqa PostgreSQL ishlatayotgan bo'lsangiz:
# DATABASE_URL="postgresql://username:password@localhost:5432/school_lms?schema=public"

# ============================================
# NEXTAUTH CONFIGURATION
# ============================================
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-super-secret-key-here-minimum-32-characters"

# NEXTAUTH_SECRET yaratish (PowerShell):
# -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object {[char]$_})

# ============================================
# SUPER ADMIN CREDENTIALS
# ============================================
SUPER_ADMIN_EMAIL="admin@schoollms.uz"
SUPER_ADMIN_PASSWORD="SuperAdmin123!"

# ============================================
# OPTIONAL: File Upload (agar kerak bo'lsa)
# ============================================
# UPLOAD_DIR="./public/uploads"
# MAX_FILE_SIZE=10485760  # 10MB
```

**NEXTAUTH_SECRET yaratish:**

```powershell
# Windows PowerShell
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object {[char]$_})
```

---

## 📦 4. Dependencies O'rnatish

```bash
# Node.js versiyasini tekshiring (18+ kerak)
node --version

# Dependencies o'rnatish
npm install

# Bu 2-3 daqiqa davom etishi mumkin
```

---

## 🗄️ 5. Database Schema O'rnatish

### Prisma Client Generate Qilish

```bash
# Prisma Client'ni generate qiling
npm run db:generate
```

### Database Schema'ni Push Qilish

```bash
# Schema'ni database'ga yuklang
npm run db:push
```

**Kutilayotgan natija:**
```
✔ Generated Prisma Client
✔ Schema is in sync with the database
```

### Database Indexlarni Tekshirish

Barcha indexlar avtomatik yaratiladi. Quyidagi indexlar mavjud:

- **Tenant:** slug, status, subscriptionPlan, subscriptionEnd, trialEndsAt, createdAt
- **User:** email, tenantId, role, isActive, createdAt
- **Student:** tenantId, studentCode, classId, status, enrollmentDate, trialEnabled (yangi)
- **Parent:** tenantId, userId, guardianType
- **Payment:** tenantId, studentId, status, dueDate, invoiceNumber
- **Attendance:** tenantId, studentId, classId, date, status
- **Grade:** tenantId, studentId, subjectId, academicYear, quarter
- Va boshqalar...

**Trial Period Indexlari:**
- `Student.trialEnabled` - sinov rejimida bo'lgan o'quvchilarni tez qidirish uchun
- `Student.trialEndDate` - tugash sanasiga ko'ra filtrlash uchun

---

## 🌱 6. Seed Data (Demo Ma'lumotlar)

### Seed Script'ni Ishlatish

```bash
# Demo ma'lumotlar kiriting
npm run db:seed
```

**Natija:**
```
🌱 Starting seed...
✅ Super Admin created
✅ Demo Tenant created
🎉 Seed completed!
```

### Manual Seed (Agar kerak bo'lsa)

Agar seed script ishlamasa, quyidagilarni qo'lda kiriting:

1. **Super Admin yaratish:**
   - Email: `admin@schoollms.uz`
   - Password: `SuperAdmin123!`
   - Role: `SUPER_ADMIN`

2. **Demo Tenant yaratish:**
   - Super Admin panelidan yangi maktab qo'shing

---

## 🚀 7. Development Server'ni Ishga Tushirish

```bash
# Development server'ni ishga tushiring
npm run dev
```

**Server:** [http://localhost:3000](http://localhost:3000)

### Port O'zgartirish (Agar 3000 band bo'lsa)

```bash
# .env faylida:
NEXTAUTH_URL="http://localhost:3001"

# Terminalda:
PORT=3001 npm run dev
```

---

## ✅ 8. Tekshirish

### 1. Database Connection

```bash
# Prisma Studio orqali tekshiring
npm run db:studio
```

Bu `http://localhost:5555` da ochiladi va database'dagi barcha jadvallarni ko'rsatadi.

### 2. Login Qilish

1. [http://localhost:3000/login](http://localhost:3000/login) ga kiring
2. **Super Admin** sifatida kirish:
   - Email: `admin@schoollms.uz`
   - Password: `SuperAdmin123!`

### 3. Asosiy Funksiyalarni Tekshirish

- ✅ Dashboard ochiladimi?
- ✅ Maktablar ro'yxati ko'rinadimi?
- ✅ O'quvchilar qo'shish mumkinmi?
- ✅ Database connection ishlayaptimi?

---

## 🔍 9. Database Indexlarni Optimizatsiya Qilish

### Mavjud Indexlar

Loyiha allaqachon keng qamrovli indexlarga ega:

**Tenant Model:**
- `@@index([slug])` - Subdomain qidiruv uchun
- `@@index([status])` - Status filtrlash uchun
- `@@index([status, subscriptionPlan])` - Composite index

**Student Model:**
- `@@index([tenantId])` - Tenant isolation
- `@@index([studentCode])` - Tez qidiruv
- `@@index([trialEnabled])` - Sinov muddati filtrlash (yangi)
- `@@index([tenantId, status])` - Composite index

**Payment Model:**
- `@@index([tenantId, status])` - Tez filtrlash
- `@@index([dueDate])` - Muddat bo'yicha tartiblash
- `@@index([invoiceNumber])` - Unique qidiruv

### Qo'shimcha Indexlar (Agar Kerak Bo'lsa)

Agar performance muammolari bo'lsa, quyidagi indexlarni qo'shishingiz mumkin:

```prisma
// Student model'ga qo'shish
@@index([trialEndDate])  // Sinov muddati tugash sanasiga ko'ra filtrlash

// Payment model'ga qo'shish
@@index([studentId, dueDate])  // O'quvchi va muddat bo'yicha
```

---

## 🐛 10. Muammolarni Hal Qilish

### Muammo 1: Database Connection Xatosi

**Xato:**
```
Error: Can't reach database server
```

**Yechim:**
1. Docker container ishlayaptimi tekshiring:
   ```bash
   docker ps
   ```

2. Port to'g'rimi tekshiring:
   ```bash
   # .env faylda DATABASE_URL port 5433 bo'lishi kerak
   DATABASE_URL="postgresql://postgres:postgres@localhost:5433/school_lms"
   ```

3. Container'ni qayta ishga tushiring:
   ```bash
   docker-compose restart
   ```

### Muammo 2: Prisma Client Xatosi

**Xato:**
```
PrismaClient is not generated
```

**Yechim:**
```bash
npm run db:generate
npm run dev  # Server'ni qayta ishga tushiring
```

### Muammo 3: Port 3000 Band

**Xato:**
```
Port 3000 is already in use
```

**Yechim:**
```bash
# Boshqa portda ishga tushiring
PORT=3001 npm run dev

# Yoki .env faylda:
NEXTAUTH_URL="http://localhost:3001"
```

### Muammo 4: NextAuth Session Xatosi

**Xato:**
```
[next-auth][error][JWT_SESSION_ERROR]
```

**Yechim:**
1. `.env` faylda `NEXTAUTH_SECRET` to'ldirilgan bo'lishi kerak
2. Yangi secret generate qiling (32+ belgi)
3. Server'ni qayta ishga tushiring

### Muammo 5: Schema Sync Xatosi

**Xato:**
```
Schema is out of sync with database
```

**Yechim:**
```bash
# Schema'ni qayta push qiling
npm run db:push

# Yoki migration yarating (production uchun)
npx prisma migrate dev --name init
```

---

## 📊 11. Database Backup va Restore

### Backup Olish

```bash
# Docker container'dan backup
docker exec school_lms_db pg_dump -U postgres school_lms > backup.sql

# Yoki lokal PostgreSQL'dan
pg_dump -U postgres -h localhost -p 5433 school_lms > backup.sql
```

### Restore Qilish

```bash
# Backup'ni restore qiling
docker exec -i school_lms_db psql -U postgres school_lms < backup.sql

# Yoki lokal PostgreSQL'ga
psql -U postgres -h localhost -p 5433 school_lms < backup.sql
```

---

## 🔄 12. Production Deployment

### Vercel (Frontend)

1. GitHub'ga push qiling
2. [vercel.com](https://vercel.com) da sign in
3. "Import Project" → Repository tanlang
4. Environment variables qo'shing (`.env` dan)
5. Deploy!

### Railway/Supabase (Database)

1. [railway.app](https://railway.app) yoki [supabase.com](https://supabase.com) da sign in
2. PostgreSQL instance yarating
3. Connection string oling
4. Vercel'da `DATABASE_URL` yangilang
5. Migration'ni ishga tushiring:
   ```bash
   npm run vercel-build
   ```

---

## 📝 13. Keyingi Qadamlar

### Development

1. ✅ Super Admin sifatida kirish
2. ✅ Yangi maktab qo'shish
3. ✅ Demo ma'lumotlar yaratish
4. ✅ Funksiyalarni test qilish

### Production

1. ✅ Parollarni o'zgartirish
2. ✅ `NEXTAUTH_SECRET` yangilash
3. ✅ Database backup sozlash
4. ✅ Monitoring sozlash

---

## 🎯 Xulosa

Loyiha muvaffaqiyatli duplicate qilindi! Endi siz:

- ✅ Yangi database bilan ishlay olasiz
- ✅ Barcha funksiyalar ishlaydi
- ✅ Development'da ishlay olasiz
- ✅ Production'ga deploy qila olasiz

**Muhim Eslatmalar:**

1. **Database Indexlar:** Barcha indexlar avtomatik yaratiladi, qo'shimcha optimizatsiya kerak emas
2. **Trial Period:** O'quvchilar uchun sinov muddati tizimi to'liq ishlaydi
3. **Multi-tenant:** Bir nechta maktablar bilan ishlash mumkin
4. **Security:** Barcha route'lar middleware orqali himoyalangan

---

## 🆘 Yordam

Agar muammo yuzaga kelsa:

1. **Loglarni tekshiring:**
   ```bash
   docker-compose logs -f postgres
   npm run dev  # Terminal loglarini ko'ring
   ```

2. **Database'ni tekshiring:**
   ```bash
   npm run db:studio
   ```

3. **Prisma Client'ni yangilang:**
   ```bash
   npm run db:generate
   ```

---

**Tayyor! 🎉**

